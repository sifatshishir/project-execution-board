import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
    availableProjects: { id: string; name: string; updatedAt: string }[] | null;
    isFetchingNames: boolean;
    hasSynced: boolean;
    canEdit: boolean;
    selectedFileId: string | null;

    // Actions
    loadFromLocal: () => Promise<void>;
    syncFromDrive: (forceFileId?: string) => Promise<void>;
    saveToDrive: () => Promise<void>;
    selectProject: (id: string) => Promise<void>;
    createNewProject: () => Promise<void>;

    addTask: (title: string, status?: TaskStatus, assignee?: UserInfo) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (taskId: string, status: Task['status']) => void;
    updateProjectName: (name: string) => void;
    addMember: (member: UserInfo) => void;
    syncMembersFromDrive: () => Promise<void>;
    updateProjectLogo: (file: File) => Promise<void>;
    reorderTasks: (newTasks: Task[]) => void;
    reset: () => void;
}

// Debounced save to drive
const debouncedSave = debounce(async (project: Project, fileId: string | null) => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !fileId) return;

    try {
        driveAdapter.setAccessToken(token);
        await driveAdapter.saveProject(project, fileId);
        useProjectStore.setState({ isSyncing: false, lastSync: Date.now() });
    } catch (error) {
        console.error('Auto-save failed', error);
        useProjectStore.setState({ isSyncing: false });
    }
}, 1000);

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            project: createInitialProject(),
            isLoading: true,
            isSyncing: false,
            lastSync: null,
            availableProjects: null,
            isFetchingNames: false,
            hasSynced: false,
            canEdit: true,
            selectedFileId: null,

            loadFromLocal: async () => {
                const hasToken = !!useAuthStore.getState().accessToken;
                try {
                    const p = await localAdapter.loadProject('default');
                    if (p) {
                        // Ensure members array exists for migration
                        if (!p.members) p.members = [];
                        // If we have a token, keep isLoading true so we can sync first
                        set({ project: p, isLoading: hasToken });
                    } else {
                        const newP = createInitialProject();
                        await localAdapter.saveProject(newP);
                        set({ project: newP, isLoading: hasToken });
                    }
                } catch (e) {
                    console.error('Local load failed', e);
                    set({ isLoading: hasToken });
                }
            },

            syncFromDrive: async (forceFileId?: string) => {
                const token = useAuthStore.getState().accessToken;
                if (!token) return;

                // Priority: forceFileId (selector choice) > selectedFileId (persisted session)
                const fileIdToSync = forceFileId || get().selectedFileId;

                set({ isSyncing: true });
                driveAdapter.setAccessToken(token);

                try {
                    // If no explicit file ID and no persisted session, we need to discover
                    if (!fileIdToSync) {
                        const files = await driveAdapter.listProjects();
                        if (files.length > 0) {
                            set({ availableProjects: files, isSyncing: false, isLoading: false, isFetchingNames: true });

                            // Fetch internal names in background
                            try {
                                await Promise.all(files.map(async (f) => {
                                    try {
                                        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        if (res.ok) {
                                            const data = await res.json();
                                            if (data && data.name) {
                                                set((state) => ({
                                                    availableProjects: state.availableProjects?.map((p) =>
                                                        p.id === f.id ? { ...p, name: data.name } : p
                                                    ) || null
                                                }));
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Background name fetch failed', e);
                                    }
                                }));
                            } finally {
                                set({ isFetchingNames: false });
                            }
                            return;
                        } else {
                            // No files found, proceed as "synced" but empty so setup view can show
                            set({ hasSynced: true, isSyncing: false, isLoading: false });
                            return;
                        }
                    }

                    // We have a file ID to sync from (either just picked or persisted)
                    const cloudProject = await driveAdapter.loadProject(fileIdToSync);
                    const localProject = get().project;

                    // Definition of "Initial Project" - brand new, no tasks created by user
                    const isLocalInitial = localProject.tasks.length === 0 && localProject.name === 'Project Execution';

                    if (cloudProject) {
                        if (!cloudProject.members) cloudProject.members = [];

                        // Identity Check: If project IDs don't match, this is a DIFFERENT project being joined
                        // We must force the cloud version because local cache belongs to a different board
                        const isIdentityMismatch = localProject.id !== cloudProject.id;

                        // If local is initial state OR cloud is newer OR we just picked this file manually OR identity mismatch
                        const shouldTakeCloud = isLocalInitial || cloudProject.updatedAt > localProject.updatedAt || !!forceFileId || isIdentityMismatch;

                        if (shouldTakeCloud) {
                            set({
                                project: cloudProject,
                                availableProjects: null,
                                hasSynced: true,
                                lastSync: Date.now(),
                                canEdit: cloudProject.canEdit ?? true,
                                selectedFileId: fileIdToSync,
                                isLoading: false
                            });
                            await localAdapter.saveProject(cloudProject);
                        } else {
                            // Local is newer, save it to drive
                            debouncedSave(localProject, fileIdToSync);
                            set({ hasSynced: true, selectedFileId: fileIdToSync, isLoading: false });
                        }
                    } else {
                        // File not found on drive or error loading
                        if (!isLocalInitial) {
                            debouncedSave(localProject, fileIdToSync);
                        }
                        set({ hasSynced: true, isLoading: false, selectedFileId: fileIdToSync });
                    }
                } catch (e) {
                    console.error('Drive sync failed', e);
                } finally {
                    set({ isSyncing: false, isLoading: false });
                }
            },

            selectProject: async (id: string) => {
                const token = useAuthStore.getState().accessToken;
                if (!token) return;

                set({ isSyncing: true, availableProjects: null, selectedFileId: id, isLoading: true });
                driveAdapter.setAccessToken(token);

                try {
                    const cloudProject = await driveAdapter.loadProject(id);
                    if (cloudProject) {
                        set({
                            project: cloudProject,
                            lastSync: Date.now(),
                            hasSynced: true,
                            canEdit: cloudProject.canEdit ?? true,
                            isLoading: false
                        });
                        await localAdapter.saveProject(cloudProject);
                    }
                } catch (e) {
                    console.error('Project selection failed', e);
                } finally {
                    set({ isSyncing: false, isLoading: false });
                }
            },

            createNewProject: async () => {
                const user = useAuthStore.getState().user;
                const newProject = createInitialProject();

                if (user) {
                    newProject.members = [{
                        name: user.name,
                        email: user.email,
                        picture: user.picture
                    }];
                }

                set({
                    project: newProject,
                    availableProjects: null,
                    hasSynced: true,
                    isLoading: false,
                    isSyncing: true,
                    selectedFileId: null
                });

                const token = useAuthStore.getState().accessToken;
                if (token) {
                    try {
                        driveAdapter.setAccessToken(token);
                        // Passing null for id triggers creation returning a new ID
                        const newId = await driveAdapter.saveProject(newProject, null);
                        console.log('projectStore: Successfully created and saved new project', newId);
                        // NOW we set the ID so targeted saves work
                        set({ isSyncing: false, lastSync: Date.now(), selectedFileId: newId });
                    } catch (error) {
                        console.error('Initial new project save failed', error);
                        set({ isSyncing: false });
                    }
                }
            },

            saveToDrive: async () => {
                const fileId = get().selectedFileId;
                if (!get().canEdit || !fileId) return;
                set({ isSyncing: true });
                const p = get().project;
                debouncedSave(p, fileId);
            },

            addTask: (title, status = 'backlog', assignee) => {
                const user = useAuthStore.getState().user;
                const task = createTask(title, user ? {
                    name: user.name,
                    email: user.email,
                    picture: user.picture
                } : undefined, status);

                if (assignee) {
                    task.assignee = assignee;
                }

                if (!get().canEdit) return;
                set((state) => {
                    const newProject = {
                        ...state.project,
                        tasks: [...state.project.tasks, task],
                        updatedAt: Date.now(),
                    };
                    localAdapter.saveProject(newProject);
                    debouncedSave(newProject, state.selectedFileId);
                    return { project: newProject, isSyncing: true };
                });
            },

            updateTask: (taskId, updates) => {
                if (!get().canEdit) return;
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
                    debouncedSave(newProject, state.selectedFileId);
                    return { project: newProject, isSyncing: true };
                });
            },

            deleteTask: (taskId) => {
                if (!get().canEdit) return;
                set((state) => {
                    const newTasks = state.project.tasks.filter((t) => t.id !== taskId);
                    const newProject = {
                        ...state.project,
                        tasks: newTasks,
                        updatedAt: Date.now(),
                    };
                    localAdapter.saveProject(newProject);
                    debouncedSave(newProject, state.selectedFileId);
                    return { project: newProject, isSyncing: true };
                });
            },

            moveTask: (taskId, status) => {
                get().updateTask(taskId, { status });
            },

            updateProjectName: (name) => {
                if (!get().canEdit) return;
                set((state) => {
                    const newProject = {
                        ...state.project,
                        name: name,
                        updatedAt: Date.now(),
                    };
                    localAdapter.saveProject(newProject);
                    debouncedSave(newProject, state.selectedFileId);
                    return { project: newProject, isSyncing: true };
                });
            },

            addMember: (member) => {
                if (!get().canEdit) return;
                set((state) => {
                    if (state.project.members.some(m => m.email === member.email)) return state;
                    const newProject = {
                        ...state.project,
                        members: [...state.project.members, member],
                        updatedAt: Date.now(),
                    };
                    localAdapter.saveProject(newProject);
                    debouncedSave(newProject, state.selectedFileId);
                    return { project: newProject, isSyncing: true };
                });
            },

            syncMembersFromDrive: async () => {
                const token = useAuthStore.getState().accessToken;
                const fileId = get().selectedFileId;
                if (!token || !fileId) return;

                set({ isSyncing: true });
                driveAdapter.setAccessToken(token);

                try {
                    const driveMembers = await driveAdapter.getProjectMembers(fileId);
                    if (driveMembers.length === 0) return;

                    if (!get().canEdit) return;
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
                        return { project: newProject, isSyncing: false };
                    });
                } catch (e) {
                    console.error('Failed to sync members from drive', e);
                    set({ isSyncing: false });
                }
            },

            updateProjectLogo: async (file) => {
                const token = useAuthStore.getState().accessToken;
                const fileId = get().selectedFileId;
                if (!token || !fileId) return;

                set({ isSyncing: true });
                driveAdapter.setAccessToken(token);

                try {
                    // 1. Delete old logo if it exists to keep Drive clean
                    const oldLogoFileId = get().project.logoFileId;
                    if (oldLogoFileId) {
                        console.log('projectStore: Deleting old logo file...', oldLogoFileId);
                        await driveAdapter.deleteFile(oldLogoFileId);
                    }

                    // 2. Upload to drive
                    const imageId = await driveAdapter.uploadImage(file, `logo-${Date.now()}-${file.name}`);

                    if (!get().canEdit) return;
                    set((state) => {
                        const newProject = {
                            ...state.project,
                            logoFileId: imageId,
                            updatedAt: Date.now(),
                        };
                        localAdapter.saveProject(newProject);
                        debouncedSave(newProject, state.selectedFileId);
                        return { project: newProject, isSyncing: false };
                    });
                } catch (e) {
                    console.error('Failed to update logo', e);
                    set({ isSyncing: false });
                }
            },
            reorderTasks: (newTasks) => {
                if (!get().canEdit) return;
                set((state) => {
                    const newProject = {
                        ...state.project,
                        tasks: newTasks,
                        updatedAt: Date.now(),
                    };
                    localAdapter.saveProject(newProject);
                    debouncedSave(newProject, state.selectedFileId);
                    return { project: newProject, isSyncing: true };
                });
            },
            reset: () => {
                set({
                    project: createInitialProject(),
                    selectedFileId: null,
                    availableProjects: null,
                    hasSynced: false,
                    isLoading: false,
                    isSyncing: false
                });
            },
        }),
        {
            name: 'project-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ selectedFileId: state.selectedFileId }),
        }
    )
);
