import { create } from 'zustand';
import { Project, Task, createInitialProject, createTask } from '../domain/schema';
import { localAdapter } from '@/persistence/local/adapter';
import { driveAdapter } from '@/persistence/drive/adapter';
import { debounce } from '@/utils/debounce';
import { useAuthStore } from '@/auth/store';

// We need to access the auth store token.
// Ideally, the store subscribes to auth changes or we pass the token.
// For simplicity, we'll assume the component triggers sync when auth changes,
// or we access the ephemeral token from the AuthStore via `useAuthStore.getState()`.

interface ProjectState {
    project: Project;
    isLoading: boolean;
    isSyncing: boolean;
    lastSync: number | null;

    // Actions
    loadFromLocal: () => Promise<void>;
    syncFromDrive: () => Promise<void>;
    saveToDrive: () => Promise<void>;

    addTask: (title: string) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (taskId: string, status: Task['status']) => void;
    updateProjectName: (name: string) => void;
}

// Debounced save to drive
const debouncedSave = debounce(async (project: Project) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
        driveAdapter.setAccessToken(token);
        await driveAdapter.saveProject(project);
        useProjectStore.setState({ isSyncing: false, lastSync: Date.now() });
    } catch (error) {
        console.error('Auto-save failed', error);
        useProjectStore.setState({ isSyncing: false });
    }
}, 1000);

export const useProjectStore = create<ProjectState>((set, get) => ({
    project: createInitialProject(),
    isLoading: true,
    isSyncing: false,
    lastSync: null,

    loadFromLocal: async () => {
        try {
            const p = await localAdapter.loadProject('default'); // Use 'default' or singleton ID? 
            // Our schemas suggest Project has an ID. But we might just store one project.
            // Let's assume we find ANY project or create new.
            // For MVP, if we find one, we use it.

            if (p) {
                set({ project: p, isLoading: false });
            } else {
                // Init new project
                const newP = createInitialProject();
                await localAdapter.saveProject(newP);
                set({ project: newP, isLoading: false });
            }
        } catch (e) {
            console.error('Local load failed', e);
            set({ isLoading: false });
        }
    },

    syncFromDrive: async () => {
        const token = useAuthStore.getState().accessToken;
        if (!token) return;

        set({ isSyncing: true });
        driveAdapter.setAccessToken(token);

        try {
            const cloudProject = await driveAdapter.loadProject('default');
            const localProject = get().project;

            if (cloudProject) {
                // Conflict Resolution: Last Write Wins (based on version or updatedAt)
                // Simple MVP: Drive wins if it exists, or max(updatedAt).

                if (cloudProject.updatedAt > localProject.updatedAt) {
                    set({ project: cloudProject });
                    await localAdapter.saveProject(cloudProject);
                } else {
                    // Local is newer, push to drive
                    debouncedSave(localProject);
                }
            } else {
                // No project in cloud, push local
                debouncedSave(localProject);
            }
        } catch (e) {
            console.error('Drive sync failed', e);
        } finally {
            set({ isSyncing: false });
        }
    },

    saveToDrive: async () => {
        set({ isSyncing: true });
        const p = get().project;
        debouncedSave(p);
    },

    addTask: (title: string) => {
        const user = useAuthStore.getState().user;
        const task = createTask(title, user ? {
            name: user.name,
            email: user.email,
            picture: user.picture
        } : undefined);

        set((state) => {
            const newProject = {
                ...state.project,
                tasks: [...state.project.tasks, task],
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
            // Trigger Drive sync
            debouncedSave(newProject);
            return { project: newProject, isSyncing: true };
        });
    },

    updateTask: (taskId, updates) => {
        set((state) => {
            const newTasks = state.project.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
            );
            const newProject = {
                ...state.project,
                tasks: newTasks,
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
            debouncedSave(newProject);
            return { project: newProject, isSyncing: true };
        });
    },

    deleteTask: (taskId) => {
        set((state) => {
            const newTasks = state.project.tasks.filter((t) => t.id !== taskId);
            const newProject = {
                ...state.project,
                tasks: newTasks,
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
            debouncedSave(newProject);
            return { project: newProject, isSyncing: true };
        });
    },

    moveTask: (taskId, status) => {
        get().updateTask(taskId, { status });
    },

    updateProjectName: (name) => {
        set((state) => {
            const newProject = {
                ...state.project,
                name: name,
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
            debouncedSave(newProject);
            return { project: newProject, isSyncing: true };
        });
    },
}));
