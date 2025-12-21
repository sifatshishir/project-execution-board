import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Column } from './Column';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '@/auth/store';
import { TaskModal } from './TaskModal';
import { Task } from '../domain/schema';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { LogOut, Search, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export const Board: React.FC = () => {
    const { loadFromLocal, syncFromDrive, isSyncing, lastSync, updateTask, deleteTask, moveTask, updateProjectName, project } = useProjectStore(
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
        }))
    );
    const { accessToken, logout } = useAuthStore(useShallow((state) => ({
        accessToken: state.accessToken,
        logout: state.logout
    })));
    const user = useAuthStore((state) => state.user);
    const { theme, setTheme } = useTheme();

    const [editingTask, setEditingTask] = React.useState<Task | null>(null);
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
                                placeholder="Search tasks..."
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
                        <Column status="backlog" title="Backlog" onEditTask={setEditingTask} searchQuery={searchQuery} />
                        <Column status="planned" title="Planned" onEditTask={setEditingTask} searchQuery={searchQuery} />
                        <Column status="in-progress" title="In Progress" onEditTask={setEditingTask} searchQuery={searchQuery} />
                        <Column status="blocked" title="Blocked" onEditTask={setEditingTask} searchQuery={searchQuery} />
                        <Column status="done" title="Done" onEditTask={setEditingTask} searchQuery={searchQuery} />
                    </div>
                </main>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} /> : null}
                </DragOverlay>

                {editingTask && (
                    <TaskModal
                        task={editingTask}
                        onClose={() => setEditingTask(null)}
                        onSave={updateTask}
                        onDelete={deleteTask}
                    />
                )}
            </div>
        </DndContext>
    );
};
