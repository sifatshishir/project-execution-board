import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Column } from './Column';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '@/auth/store';
import { TaskModal } from './TaskModal';
import { Task, TaskStatus, UserInfo } from '../domain/schema';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { LogOut, Search, User as UserIcon, Sun, Moon, Users, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createTask } from '../domain/schema'; // We just need a dummy task generator for the modal

// Add Member Modal Component (Inline for simplicity, but could be separate)
const AddMemberModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (u: UserInfo) => void }) => {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const { syncMembersFromDrive, isSyncing } = useProjectStore(useShallow(state => ({
        syncMembersFromDrive: state.syncMembersFromDrive,
        isSyncing: state.isSyncing
    })));

    const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-card-foreground">Add Project Member</h3>

                <button
                    onClick={async () => {
                        await syncMembersFromDrive();
                        onClose();
                    }}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {isSyncing ? 'Syncing...' : 'Sync from Google Drive'}
                </button>

                <div className="relative flex items-center gap-2 py-2">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs text-muted-foreground">OR ADD MANUALLY</span>
                    <div className="h-px bg-border flex-1"></div>
                </div>

                <input
                    className="bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    className="bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Email (e.g. user@test.com)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    <button
                        disabled={!name || !email}
                        onClick={() => { onAdd({ name, email, picture }); onClose(); }}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        Add Member
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Board: React.FC = () => {
    const { loadFromLocal, syncFromDrive, isSyncing, lastSync, updateTask, deleteTask, moveTask, updateProjectName, project, addTask, addMember } = useProjectStore(
        useShallow((state) => ({
            loadFromLocal: state.loadFromLocal,
            syncFromDrive: state.syncFromDrive,
            isSyncing: state.isSyncing,
            lastSync: state.lastSync,
            updateTask: state.updateTask,
            deleteTask: state.deleteTask,
            moveTask: state.moveTask,
            updateProjectName: state.updateProjectName,
            project: state.project,
            addTask: state.addTask,
            addMember: state.addMember
        }))
    );
    const { accessToken, logout } = useAuthStore(useShallow((state) => ({
        accessToken: state.accessToken,
        logout: state.logout
    })));
    const user = useAuthStore((state) => state.user);
    const { theme, setTheme } = useTheme();

    // Modal States
    const [editingTask, setEditingTask] = React.useState<Task | null>(null);
    const [isCreatingTask, setIsCreatingTask] = React.useState<TaskStatus | null>(null); // Track which column triggered creation
    const [showMemberModal, setShowMemberModal] = React.useState(false);

    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    React.useEffect(() => {
        loadFromLocal();
    }, [loadFromLocal]);

    React.useEffect(() => {
        if (accessToken) {
            syncFromDrive();
        }
    }, [accessToken, syncFromDrive]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const status = over.id as Task['status'];
            const validStatuses = ['backlog', 'planned', 'in-progress', 'blocked', 'done'];

            if (validStatuses.includes(status)) {
                moveTask(active.id as string, status);
            }
        }
        setActiveId(null);
    };

    const handleNameSave = () => {
        if (tempName.trim()) updateProjectName(tempName.trim());
        setIsEditingName(false);
    };

    const activeTask = activeId ? project.tasks.find((t) => t.id === activeId) : null;

    // Handle Task Creation
    const handleCreateTask = (newTask: Partial<Task>) => {
        if (newTask.title && isCreatingTask) {
            // Pass assignee if selected
            addTask(newTask.title, isCreatingTask, newTask.assignee);
        }
        setIsCreatingTask(null);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-10 shrink-0 gap-6">
                    <div className="flex items-center gap-4 min-w-[250px]">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-primary shrink-0" />
                        {isEditingName ? (
                            <input
                                autoFocus
                                className="bg-secondary border border-input rounded px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:border-primary w-full"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            />
                        ) : (
                            <h1
                                className="font-bold text-lg tracking-tight cursor-pointer hover:text-primary transition-colors border border-transparent hover:border-border rounded px-2 py-1 -ml-2 truncate text-foreground"
                                onClick={() => { setTempName(project.name); setIsEditingName(true); }}
                                title="Click to rename"
                            >
                                {project.name}
                            </h1>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl mx-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks by title, creator, or assignee..."
                                className="w-full bg-secondary/50 border border-input rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                        {isSyncing ? (
                            <span className="text-primary animate-pulse font-medium">Saving...</span>
                        ) : (
                            <span>{lastSync ? 'Saved' : 'Synced'}</span>
                        )}
                        <div className="flex items-center gap-3 pl-6 border-l border-border">

                            <button
                                onClick={() => setShowMemberModal(true)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                title="Manage Members"
                            >
                                <Users size={16} />
                            </button>

                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>

                            <div className="flex flex-col items-end">
                                <span className="text-foreground font-medium">{user?.name}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-secondary border border-border overflow-hidden">
                                {user?.picture ? (
                                    <img src={user.picture} alt="User" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <UserIcon size={16} />
                                    </div>
                                )}
                            </div>
                            <button onClick={logout} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-destructive" title="Logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Board Canvas */}
                <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-background/50">
                    <div className="flex h-full gap-6">
                        {/* We pass setIsCreatingTask instead of prompt logic */}
                        <Column status="backlog" title="Backlog" onEditTask={setEditingTask} onAddTask={() => setIsCreatingTask('backlog')} searchQuery={searchQuery} />
                        <Column status="planned" title="Planned" onEditTask={setEditingTask} onAddTask={() => setIsCreatingTask('planned')} searchQuery={searchQuery} />
                        <Column status="in-progress" title="In Progress" onEditTask={setEditingTask} onAddTask={() => setIsCreatingTask('in-progress')} searchQuery={searchQuery} />
                        <Column status="blocked" title="Blocked" onEditTask={setEditingTask} onAddTask={() => setIsCreatingTask('blocked')} searchQuery={searchQuery} />
                        <Column status="done" title="Done" onEditTask={setEditingTask} onAddTask={() => setIsCreatingTask('done')} searchQuery={searchQuery} />
                    </div>
                </main>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} /> : null}
                </DragOverlay>

                {/* Edit Existing Task */}
                {editingTask && (
                    <TaskModal
                        task={editingTask}
                        projectMembers={project.members} // Pass members for assignment
                        onClose={() => setEditingTask(null)}
                        onSave={updateTask}
                        onDelete={deleteTask}
                    />
                )}

                {/* Create New Task */}
                {isCreatingTask && (
                    <TaskModal
                        isCreating={true}
                        initialStatus={isCreatingTask}
                        projectMembers={project.members}
                        task={createTask('', user || undefined, isCreatingTask)} // Dummy empty task
                        onClose={() => setIsCreatingTask(null)}
                        onSave={(_, updates) => handleCreateTask(updates)} // We handle creation differently
                        onDelete={() => { }} // No delete in create mode
                    />
                )}

                {showMemberModal && (
                    <AddMemberModal
                        onClose={() => setShowMemberModal(false)}
                        onAdd={addMember}
                    />
                )}
            </div>
        </DndContext>
    );
};
