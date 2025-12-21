import React from 'react';
import { Task } from '../domain/schema';
import { Clock, AlignLeft } from 'lucide-react';
import clsx from 'clsx';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
    task: Task;
    onEdit?: (task: Task) => void;
}

const priorityColors = {
    low: 'border-l-blue-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={clsx(
                    "opacity-50 flex flex-col gap-2 rounded-md bg-zinc-800 p-3 shadow-none border border-zinc-700/50 h-[80px]", // Placeholder look
                    "border-l-4", priorityColors[task.priority]
                )}
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={clsx(
                'group relative flex flex-col gap-2 rounded-md bg-zinc-800/50 p-3 shadow-sm border border-zinc-700/50 cursor-grab active:cursor-grabbing backdrop-blur-sm touch-none',
                'hover:bg-zinc-800 hover:border-zinc-600 transition-colors',
                'border-l-4',
                priorityColors[task.priority]
            )}
            onClick={() => onEdit?.(task)}
        >
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {task.title}
                </h3>
            </div>

            {(task.description || task.estimate) && (
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    {task.estimate && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {task.estimate}
                        </span>
                    )}
                    {task.description && <AlignLeft size={12} />}
                </div>
            )}
        </div>
    );
};
