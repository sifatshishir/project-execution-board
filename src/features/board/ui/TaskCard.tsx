import React from 'react';
import { Task } from '../domain/schema';
import { Clock, AlignLeft, User as UserIcon } from 'lucide-react';
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
                    "opacity-50 flex flex-col gap-2 rounded-md bg-card p-3 shadow-sm border border-border h-[80px]", // Placeholder look
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
                'group relative flex flex-col gap-2 rounded-md bg-card p-3 shadow-sm border border-border cursor-grab active:cursor-grabbing backdrop-blur-sm touch-none',
                'hover:bg-accent/50 hover:border-primary/20 transition-all',
                'border-l-4',
                priorityColors[task.priority]
            )}
            onClick={() => onEdit?.(task)}
        >
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-card-foreground group-hover:text-foreground transition-colors">
                    {task.title}
                </h3>
            </div>

            {(task.description || task.estimate || task.createdBy) && (
                <div className="flex items-center justify-between mt-2 min-h-[20px]">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {task.estimate && (
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {task.estimate}
                            </span>
                        )}
                        {task.description && <AlignLeft size={12} />}
                    </div>

                    {task.createdBy ? (
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-border bg-muted ring-1 ring-background" title={`Created by ${task.createdBy.name}`}>
                            <img src={task.createdBy.picture} alt={task.createdBy.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
