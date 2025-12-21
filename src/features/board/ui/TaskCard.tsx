import React from 'react';
import { Task } from '../domain/schema';
import { Clock, AlignLeft, User as UserIcon, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getTaskTimeStatus, stringToColor } from '@/utils/date';

interface TaskCardProps {
    task: Task;
    onEdit?: (task: Task) => void;
}

// Define status colors map
const statusColors = {
    'backlog': 'border-l-slate-500',
    'planned': 'border-l-blue-500',
    'in-progress': 'border-l-orange-500',
    'blocked': 'border-l-red-500',
    'done': 'border-l-green-500',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        // No inline border color, use tailwind classes map
    };

    const timeStatus = getTaskTimeStatus(task);
    const isDone = task.status === 'done';

    // Override overdue if done
    const showOverdue = timeStatus.isOverdue && !isDone;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={clsx(
                    "opacity-50 flex flex-col gap-2 rounded-md bg-card p-3 shadow-sm border border-border h-[80px]",
                    "border-l-4", statusColors[task.status] || 'border-l-primary'
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
                'border-l-4', statusColors[task.status] || 'border-l-primary'
            )}
            onClick={() => onEdit?.(task)}
        >
            <div className="flex items-start justify-between">
                <h3 className={clsx(
                    "text-sm font-medium transition-colors",
                    isDone ? "text-muted-foreground line-through decoration-muted-foreground/50 opacity-70" : "text-card-foreground group-hover:text-foreground"
                )}>
                    {task.title}
                </h3>
            </div>

            {(task.description || task.estimate || task.assignee || task.createdBy) && (
                <div className={clsx("flex items-center justify-between mt-2 min-h-[20px]", isDone && "opacity-50 grayscale transition-all")}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {task.estimate && (
                            <div className={clsx(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                                showOverdue ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-secondary/50"
                            )}>
                                {showOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                                <span className={clsx(showOverdue && "font-semibold")}>
                                    {showOverdue ? "Overdue" : task.estimate}
                                </span>
                            </div>
                        )}
                        {task.description && <AlignLeft size={12} />}
                    </div>

                    <div className="flex items-center -space-x-2">
                        {/* Show Assignee if exists, else Creator */}
                        {task.assignee ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-card bg-muted ring-1 ring-border z-10" title={`Assigned to ${task.assignee.name}`}>
                                {task.assignee.picture ? (
                                    <img src={task.assignee.picture} alt={task.assignee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary text-[10px] font-bold">
                                        {task.assignee.name[0]}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Show Creator lightly behind if different? Or just show one? User asked for Assignee dropdown.
                             Let's show Creator small if Assignee exists, or just Creator.
                             Actually, standard is usually Assignee. Let's prioritize Assignee.
                         */}
                        {!task.assignee && task.createdBy && (
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-border bg-muted opacity-70" title={`Created by ${task.createdBy.name}`}>
                                <img src={task.createdBy.picture} alt={task.createdBy.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Show Overdue Time specifically if needed, or just the badge above */}
            {showOverdue && (
                <div className="text-[10px] text-red-500 font-medium mt-1">
                    Due: {timeStatus.text}
                </div>
            )}
        </div>
    );
};
