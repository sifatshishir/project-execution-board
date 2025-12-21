import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Column } from './Column';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '@/auth/store';
import { TaskModal } from './TaskModal';
import { Task } from '../domain/schema';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { LogOut } from 'lucide-react';

export const Board: React.FC = () => {
    const { loadFromLocal, syncFromDrive, isSyncing, lastSync, updateTask, deleteTask, moveTask, project } = useProjectStore(
        useShallow((state) => ({
            loadFromLocal: state.loadFromLocal,
            syncFromDrive: state.syncFromDrive,
            isSyncing: state.isSyncing,
            lastSync: state.lastSync,
            updateTask: state.updateTask,
            deleteTask: state.deleteTask,
            moveTask: state.moveTask,
            project: state.project,
        }))
    );
    const { accessToken, logout } = useAuthStore(useShallow((state) => ({
        accessToken: state.accessToken,
        logout: state.logout
    })));
    const user = useAuthStore((state) => state.user);

    const [editingTask, setEditingTask] = React.useState<Task | null>(null);
    const [activeId, setActiveId] = React.useState<string | null>(null);

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
            // over.id should be the column status OR another task id.
            // Simplified: We make Columns droppable zones with ID = status.

            // Check if dropped on a column
            const status = over.id as Task['status'];
            const validStatuses = ['backlog', 'planned', 'in-progress', 'blocked', 'done'];

            if (validStatuses.includes(status)) {
                moveTask(active.id as string, status);
            }
        }
        setActiveId(null);
    };

    const activeTask = activeId ? project.tasks.find((t) => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-purple-500" />
                        {isEditingName ? (
                            <input
                                autoFocus
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-lg font-bold text-white focus:outline-none focus:border-indigo-500 min-w-[200px]"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            />
                        ) : (
                            <h1
                                className="font-bold text-lg tracking-tight cursor-pointer hover:text-indigo-400 transition-colors border border-transparent hover:border-zinc-800 rounded px-2 py-1 -ml-2"
                                onClick={() => { setTempName(project.name); setIsEditingName(true); }}
                                title="Click to rename"
                            >
                                {project.name}
                            </h1>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        {isSyncing ? (
                            <span className="text-indigo-400 animate-pulse">Saving...</span>
                        ) : (
                            <span>{lastSync ? 'Saved just now' : 'Synced'}</span>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                                {user?.picture && <img src={user.picture} alt="User" referrerPolicy="no-referrer" />}
                            </div>
                            <button onClick={logout} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-red-400" title="Logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Board Canvas */}
                <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex h-full gap-6">
                        <Column status="backlog" title="Backlog" onEditTask={setEditingTask} />
                        <Column status="planned" title="Planned" onEditTask={setEditingTask} />
                        <Column status="in-progress" title="In Progress" onEditTask={setEditingTask} />
                        <Column status="blocked" title="Blocked" onEditTask={setEditingTask} />
                        <Column status="done" title="Done" onEditTask={setEditingTask} />
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
