import { useShallow } from 'zustand/react/shallow';
import { Task, TaskStatus } from '../domain/schema';
import { TaskCard } from './TaskCard';
import { useProjectStore } from '../store/projectStore';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import React from 'react';

interface ColumnProps {
    status: TaskStatus;
    title: string;
    onEditTask: (task: Task) => void;
    onAddTask: () => void;
    searchQuery: string;
}

export const Column: React.FC<ColumnProps> = ({ status, title, onEditTask, onAddTask, searchQuery }) => {
    const tasks = useProjectStore(
        useShallow((state) => {
            const allTasks = state.project.tasks.filter((t) => t.status === status);
            if (!searchQuery) return allTasks;

            const lowerQuery = searchQuery.toLowerCase();
            return allTasks.filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                t.createdBy?.name.toLowerCase().includes(lowerQuery)
            );
        })
    );
    // const addTask = useProjectStore((state) => state.addTask); // We use onAddTask prop now

    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[320px] shrink-0 gap-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>

            <div
                ref={setNodeRef}
                className={clsx(
                    "flex-1 flex flex-col gap-2 p-1 rounded-lg border transition-colors",
                    isOver ? "bg-muted/50 border-primary/30" : "bg-secondary/30 border-transparent hover:border-border"
                )}
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={onEditTask} />
                    ))}
                </SortableContext>

                <button
                    onClick={onAddTask}
                    className="flex items-center gap-2 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-all mt-auto"
                >
                    <Plus size={16} />
                    <span>Add Task</span>
                </button>
            </div>
        </div>
    );
};

