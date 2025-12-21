import { create } from 'zustand';
import { Project, Task, UserInfo, TaskStatus, createInitialProject, createTask } from '../domain/schema';
import { localAdapter } from '@/persistence/local/adapter';
import { driveAdapter } from '@/persistence/drive/adapter';
import { debounce } from '@/utils/debounce';
import { useAuthStore } from '@/auth/store';

interface ProjectState {
    project: Project;
    isLoading: boolean;
    isSyncing: boolean;
    lastSync: number | null;

    // Actions
    loadFromLocal: () => Promise<void>;
    syncFromDrive: () => Promise<void>;
    saveToDrive: () => Promise<void>;

    addTask: (title: string, status?: TaskStatus, assignee?: UserInfo) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (taskId: string, status: Task['status']) => void;
    updateProjectName: (name: string) => void;
    addMember: (member: UserInfo) => void;
    syncMembersFromDrive: () => Promise<void>;
    updateProjectLogo: (logo: string) => void;
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
            const p = await localAdapter.loadProject('default');
            if (p) {
                // Ensure members array exists for migration
                if (!p.members) p.members = [];
                set({ project: p, isLoading: false });
            } else {
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
                if (!cloudProject.members) cloudProject.members = [];
                if (cloudProject.updatedAt > localProject.updatedAt) {
                    set({ project: cloudProject });
                    await localAdapter.saveProject(cloudProject);
                } else {
                    debouncedSave(localProject);
                }
            } else {
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

    addTask: (title: string, status: TaskStatus = 'backlog', assignee?: UserInfo) => {
        const user = useAuthStore.getState().user;
        const task = createTask(title, user ? {
            name: user.name,
            email: user.email,
            picture: user.picture
        } : undefined, status);

        if (assignee) {
            task.assignee = assignee;
        }

        set((state) => {
            const newProject = {
                ...state.project,
                tasks: [...state.project.tasks, task],
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
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

    addMember: (member: UserInfo) => {
        set((state) => {
            // Avoid duplicates
            if (state.project.members.some(m => m.email === member.email)) return state;

            const newProject = {
                ...state.project,
                members: [...state.project.members, member],
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
            debouncedSave(newProject);
            return { project: newProject, isSyncing: true };
        });
    },

    syncMembersFromDrive: async () => {
        const token = useAuthStore.getState().accessToken;
        if (!token) return;

        set({ isSyncing: true });
        driveAdapter.setAccessToken(token);

        try {
            const driveMembers = await driveAdapter.getProjectMembers();
            if (driveMembers.length === 0) return;

            set((state) => {
                const currentMembers = state.project.members;
                const newMembers = [...currentMembers];
                let changed = false;

                driveMembers.forEach(dm => {
                    if (!currentMembers.some(cm => cm.email === dm.email)) {
                        newMembers.push(dm);
                        changed = true;
                    }
                });

                if (!changed) return { isSyncing: false };

                const newProject = {
                    ...state.project,
                    members: newMembers,
                    updatedAt: Date.now(),
                };
                localAdapter.saveProject(newProject);
                // debouncedSave(newProject); // No need to save back immediately if we just fetched from drive permissions, but good for consistency
                return { project: newProject, isSyncing: false };
            });
        } catch (e) {
            console.error('Failed to sync members from drive', e);
            set({ isSyncing: false });
        }
    },

    updateProjectLogo: (logo: string) => {
        set((state) => {
            const newProject = {
                ...state.project,
                logo: logo,
                updatedAt: Date.now(),
            };
            localAdapter.saveProject(newProject);
            debouncedSave(newProject);
            return { project: newProject, isSyncing: true };
        });
    },
}));
