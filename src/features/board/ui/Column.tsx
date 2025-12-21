import { useShallow } from 'zustand/react/shallow';
import { Task, TaskStatus } from '../domain/schema';
import { TaskCard } from './TaskCard';
import { useProjectStore } from '../store/projectStore';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';

interface ColumnProps {
    status: TaskStatus;
    title: string;
    onEditTask: (task: Task) => void;
}

export const Column: React.FC<ColumnProps> = ({ status, title, onEditTask }) => {
    const tasks = useProjectStore(
        useShallow((state) => state.project.tasks.filter((t) => t.status === status))
    );
    const addTask = useProjectStore((state) => state.addTask);

    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[320px] shrink-0 gap-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{title}</h2>
                <span className="text-xs text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>

            <div
                ref={setNodeRef}
                className={clsx(
                    "flex-1 flex flex-col gap-2 p-1 rounded-lg border transition-colors",
                    isOver ? "bg-zinc-800/30 border-indigo-500/30" : "bg-zinc-900/20 border-transparent hover:border-zinc-800/50"
                )}
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={onEditTask} />
                    ))}
                </SortableContext>

                <button
                    onClick={() => {
                        const title = prompt('Task title:');
                        if (title) addTask(title);
                    }}
                    className="flex items-center gap-2 p-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 rounded-md transition-all mt-auto"
                >
                    <Plus size={16} />
                    <span>Add Task</span>
                </button>
            </div>
        </div>
    );
};
