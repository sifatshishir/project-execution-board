import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Column } from './Column';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '@/auth/store';
import { TaskModal } from './TaskModal';
import { Task, TaskStatus, UserInfo } from '../domain/schema';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { LogOut, Search, User as UserIcon, Sun, Moon, Users, Plus, Filter, Check, HelpCircle, Zap, Calendar, CheckCircle2, Circle, Clock, MoreHorizontal, User, Paperclip, MessageSquare, Trash2, Edit2, X, Download, Upload, ExternalLink, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { createTask } from '../domain/schema'; // We just need a dummy task generator for the modal
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useDriveImage } from '@/hooks/useDriveImage';
import { ShieldAlert } from 'lucide-react';

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

// Project Selection Modal
const ProjectSelectionModal = ({ projects, onSelect, createNewProject, isFetchingNames }: { projects: { id: string; name: string; updatedAt: string }[], onSelect: (id: string) => void, createNewProject: () => void, isFetchingNames: boolean }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
                {/* Progress Bar */}
                {isFetchingNames && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/30">
                        <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                    </div>
                )}

                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-card-foreground">
                        {isFetchingNames ? 'Scanning Projects...' : 'Select a Project'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isFetchingNames
                            ? 'Fetching internal project details from your Drive...'
                            : 'Multiple project files were found in your Google Drive. Which one would you like to load?'}
                    </p>
                </div>

                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 min-h-[100px] justify-center">
                    {isFetchingNames ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Zap size={24} className="text-primary animate-pulse" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">Updating list...</span>
                        </div>
                    ) : (
                        projects.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onSelect(p.id)}
                                className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all text-left group"
                            >
                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.name || 'Untitled Board'}</span>
                                <span className="text-xs text-muted-foreground italic">Last modified: {new Date(p.updatedAt).toLocaleString()}</span>
                            </button>
                        ))
                    )}
                </div>

                {!isFetchingNames && (
                    <>
                        <div className="relative flex items-center gap-4 py-2">
                            <div className="h-px bg-border flex-1"></div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">OR</span>
                            <div className="h-px bg-border flex-1"></div>
                        </div>

                        <button
                            onClick={createNewProject}
                            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-dashed border-border hover:bg-secondary/50 hover:border-primary/50 transition-all text-sm font-medium text-muted-foreground hover:text-primary group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            Create New Project
                        </button>
                    </>
                )}

                <div className="pt-2 border-t border-border mt-2">
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
                        Tip: You can rename these files in Google Drive to distinguish them better.
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); width: 40%; }
                    100% { transform: translateX(300%); }
                }
            `}} />
        </div>
    );
};

export const Board: React.FC = () => {
    const { loadFromLocal, syncFromDrive, isSyncing, lastSync, updateTask, deleteTask, moveTask, updateProjectName, project, addTask, addMember, reorderTasks, availableProjects, selectProject, createNewProject, reset, canEdit, isLoading, isFetchingNames } = useProjectStore(
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
            addMember: state.addMember,
            reorderTasks: state.reorderTasks,
            availableProjects: state.availableProjects,
            selectProject: state.selectProject,
            createNewProject: state.createNewProject,
            reset: state.reset,
            canEdit: state.canEdit,
            isLoading: state.isLoading,
            isFetchingNames: state.isFetchingNames
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
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [selectedUserEmails, setSelectedUserEmails] = React.useState<string[]>([]);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const startTour = React.useCallback(() => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            popoverClass: 'driverjs-theme',
            steps: [
                {
                    popover: {
                        title: '🚀 Welcome to Your Board',
                        description: 'Manage your projects with ease. Let\'s show you around!',
                        side: "bottom", align: 'center'
                    }
                },
                {
                    element: '#project-name-heading',
                    popover: {
                        title: '🏗️ Project Identity',
                        description: 'This is your project workspace. Click the name to rename it or the icon to upload a brand logo.',
                        side: "bottom", align: 'start'
                    }
                },
                {
                    element: '#columns-highlight',
                    popover: {
                        title: '📋 Core Workflow',
                        description: 'Focus on your active "Planned" and "In Progress" tasks here.',
                        side: "top", align: 'center'
                    }
                },
                {
                    element: '#add-task-btn-backlog',
                    popover: {
                        title: '➕ Quick Add',
                        description: 'Ready to start something new? Click here to add a task to your backlog.',
                        side: "bottom", align: 'center'
                    }
                },
                {
                    element: '#filter-toggle-btn',
                    popover: {
                        title: '🔍 Search & Filter',
                        description: 'Click this filter button to isolate tasks for specific team members.',
                        side: "top", align: 'center'
                    }
                },
                {
                    element: '#user-menu-btn',
                    popover: {
                        title: '👤 User Menu',
                        description: 'Access your profile settings, re-run this tutorial, or sign out here.',
                        side: "bottom", align: 'end'
                    }
                },
            ]
        });
        driverObj.drive();
    }, []);

    // Auto-start tour for new users
    React.useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour_v1');
        if (!hasSeenTour) {
            setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenTour_v1', 'true');
            }, 1000);
        }
    }, [startTour]);

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

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // 1. Find the active task
        const activeTask = project.tasks.find(t => t.id === activeId);
        if (!activeTask) {
            setActiveId(null);
            return;
        }

        // 2. Determine if we are over a task or a column
        const isOverTask = project.tasks.some(t => t.id === overId);
        const overTask = isOverTask ? project.tasks.find(t => t.id === overId) : null;

        // Valid statuses for columns
        const validStatuses: TaskStatus[] = ['backlog', 'planned', 'in-progress', 'blocked', 'done'];
        const isOverColumn = validStatuses.includes(overId as TaskStatus);

        if (activeId !== overId) {
            let newTasks = [...project.tasks];
            const oldIndex = newTasks.findIndex(t => t.id === activeId);

            if (isOverTask && overTask) {
                // Moving over another task
                const newIndex = newTasks.findIndex(t => t.id === overId);

                // If moving across columns, update status too
                if (activeTask.status !== overTask.status) {
                    newTasks[oldIndex] = { ...activeTask, status: overTask.status, updatedAt: Date.now() };
                }

                newTasks = arrayMove(newTasks, oldIndex, newIndex);
                reorderTasks(newTasks);
            } else if (isOverColumn) {
                // Moving over an empty column or column header
                const newStatus = overId as TaskStatus;
                if (activeTask.status !== newStatus) {
                    newTasks[oldIndex] = { ...activeTask, status: newStatus, updatedAt: Date.now() };
                    reorderTasks(newTasks);
                }
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

    const { imageUrl: logoUrl, loading: logoLoading } = useDriveImage(
        project.logoFileId,
        project.logo // Fallback to base64 if it exists
    );

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-xl font-bold animate-pulse">Synchronizing with Google Drive...</div>
                <p className="text-sm text-muted-foreground">This ensures your data is up-to-date across all browsers.</p>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-10 shrink-0 gap-6">
                    <div className="flex items-center gap-4 min-w-[250px]">
                        <div className="relative group w-8 h-8 shrink-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Project Logo"
                                    className={clsx("w-full h-full rounded object-cover border border-border transition-opacity", logoLoading ? "opacity-30" : "opacity-100")}
                                />
                            ) : logoLoading ? (
                                <div className="w-full h-full rounded bg-secondary animate-pulse" />
                            ) : (
                                <div className="w-full h-full rounded bg-gradient-to-tr from-indigo-500 to-primary" />
                            )}
                            {/* Hidden file input for logo */}
                            {canEdit && (
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    title="Upload Project Logo"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            useProjectStore.getState().updateProjectLogo(file);
                                        }
                                    }}
                                />
                            )}
                        </div>
                        {isEditingName && canEdit ? (
                            <input
                                autoFocus
                                className="bg-secondary border border-input rounded px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:border-primary w-full"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            />
                        ) : (
                            <div className="flex flex-col">
                                <h1
                                    id="project-name-heading"
                                    className={clsx(
                                        "font-bold text-lg tracking-tight transition-colors border border-transparent rounded px-2 py-1 -ml-2 truncate text-foreground",
                                        canEdit ? "cursor-pointer hover:text-primary hover:border-border" : "cursor-default"
                                    )}
                                    onClick={() => { if (canEdit) { setTempName(project.name); setIsEditingName(true); } }}
                                    title={canEdit ? "Click to rename" : "Read-only access"}
                                >
                                    {project.name}
                                </h1>
                                {!canEdit && (
                                    <span className="text-[10px] text-zinc-500 font-medium px-2 flex items-center gap-1 -mt-1 uppercase tracking-wider">
                                        <ShieldAlert size={10} className="text-zinc-500" /> Read Only
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Bar & Filter */}
                    <div className="flex-1 max-w-xl mx-4 flex gap-2">
                        <div className="relative group flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full bg-secondary/50 border border-input rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                id="filter-toggle-btn"
                                onClick={() => setFilterOpen(!filterOpen)}
                                className={clsx(
                                    "p-2 rounded-full transition-colors border",
                                    filterOpen || selectedUserEmails.length > 0 ? "bg-primary/10 border-primary text-primary" : "bg-secondary/50 border-input text-muted-foreground hover:text-foreground"
                                )}
                                title="Filter by User"
                            >
                                <Filter size={16} />
                            </button>

                            {filterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-20 p-2 flex flex-col gap-1">
                                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Filter by Member</div>

                                        {project.members.length === 0 && <div className="text-xs text-muted-foreground px-2 italic">No members found</div>}

                                        {project.members.map(member => (
                                            <button
                                                key={member.email}
                                                onClick={() => {
                                                    setSelectedUserEmails(prev =>
                                                        prev.includes(member.email)
                                                            ? prev.filter(e => e !== member.email)
                                                            : [...prev, member.email]
                                                    );
                                                }}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary text-sm text-left w-full"
                                            >
                                                <div className={clsx(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                    selectedUserEmails.includes(member.email) ? "bg-primary border-primary" : "border-muted-foreground"
                                                )}>
                                                    {selectedUserEmails.includes(member.email) && <Check size={10} className="text-primary-foreground" />}
                                                </div>
                                                <span className="truncate flex-1">{member.name}</span>
                                            </button>
                                        ))}

                                        {(selectedUserEmails.length > 0) && (
                                            <button
                                                onClick={() => setSelectedUserEmails([])}
                                                className="mt-2 text-xs text-primary hover:underline text-center w-full py-1"
                                            >
                                                Clear Filter
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                        {isSyncing ? (
                            <span className="text-primary animate-pulse font-medium">Saving...</span>
                        ) : (
                            <span>{lastSync ? 'Saved' : 'Synced'}</span>
                        )}
                        <div className="flex items-center gap-3 pl-6 border-l border-border">
                            {canEdit && (
                                <button
                                    onClick={() => setShowMemberModal(true)}
                                    className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                    title="Manage Members"
                                >
                                    <Users size={16} />
                                </button>
                            )}

                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    id="user-menu-btn"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 hover:bg-secondary/50 p-1.5 rounded-full pl-3 transition-colors text-left"
                                    title="User Menu"
                                >
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
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden py-1">
                                            <button
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    startTour();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                                            >
                                                <HelpCircle size={14} />
                                                Show Tutorial
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={() => {
                                    reset();
                                    logout();
                                }}
                                className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-destructive"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Board Canvas */}
                <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-background/50">
                    <div className="flex h-full gap-6" id="board-columns">
                        {/* We pass setIsCreatingTask instead of prompt logic */}
                        <Column status="backlog" title="Backlog" onEditTask={setEditingTask} onAddTask={canEdit ? () => setIsCreatingTask('backlog') : undefined} searchQuery={searchQuery} filterUsers={selectedUserEmails} addBtnId="add-task-btn-backlog" />
                        <div id="columns-highlight" className="flex gap-6">
                            <Column status="planned" title="Planned" onEditTask={setEditingTask} onAddTask={canEdit ? () => setIsCreatingTask('planned') : undefined} searchQuery={searchQuery} filterUsers={selectedUserEmails} />
                            <Column status="in-progress" title="In Progress" onEditTask={setEditingTask} onAddTask={canEdit ? () => setIsCreatingTask('in-progress') : undefined} searchQuery={searchQuery} filterUsers={selectedUserEmails} />
                        </div>
                        <Column status="blocked" title="Blocked" onEditTask={setEditingTask} onAddTask={canEdit ? () => setIsCreatingTask('blocked') : undefined} searchQuery={searchQuery} filterUsers={selectedUserEmails} />
                        <Column status="done" title="Done" onEditTask={setEditingTask} onAddTask={canEdit ? () => setIsCreatingTask('done') : undefined} searchQuery={searchQuery} filterUsers={selectedUserEmails} />
                    </div>
                </main>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} /> : null}
                </DragOverlay>

                {/* Edit Existing Task */}
                {
                    editingTask && (
                        <TaskModal
                            task={editingTask}
                            projectMembers={project.members} // Pass members for assignment
                            onClose={() => setEditingTask(null)}
                            onSave={updateTask}
                            onDelete={deleteTask}
                            canEdit={canEdit}
                        />
                    )
                }

                {/* Create New Task */}
                {
                    isCreatingTask && (
                        <TaskModal
                            isCreating={true}
                            initialStatus={isCreatingTask}
                            projectMembers={project.members}
                            task={createTask('', user || undefined, isCreatingTask)} // Dummy empty task
                            onClose={() => setIsCreatingTask(null)}
                            onSave={(_, updates) => handleCreateTask(updates)} // We handle creation differently
                            onDelete={() => { }} // No delete in create mode
                            canEdit={canEdit}
                        />
                    )
                }

                {
                    showMemberModal && (
                        <AddMemberModal
                            onClose={() => setShowMemberModal(false)}
                            onAdd={addMember}
                        />
                    )
                }

                {
                    availableProjects && (
                        <ProjectSelectionModal
                            projects={availableProjects}
                            onSelect={selectProject}
                            createNewProject={createNewProject}
                            isFetchingNames={isFetchingNames}
                        />
                    )
                }
            </div >
        </DndContext >
    );
};
