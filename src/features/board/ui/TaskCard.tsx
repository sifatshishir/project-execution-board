import React from 'react';
import { Task } from '../domain/schema';
import { Clock, AlignLeft, User as UserIcon, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getTaskTimeStatus } from '@/utils/date';

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

// Priority style map
const priorityStyles = {
    'low': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'medium': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'high': 'bg-red-500/10 text-red-600 border-red-500/20',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const timeStatus = getTaskTimeStatus(task);
    const isDone = task.status === 'done';
    const showOverdue = timeStatus.isOverdue && !isDone;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={clsx(
                    "opacity-40 flex flex-col gap-2 rounded-md bg-secondary/50 p-3 border-2 border-dashed border-primary/30 h-[100px]",
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
            <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className={clsx(
                        "text-sm font-semibold transition-colors leading-tight",
                        isDone ? "text-muted-foreground line-through decoration-muted-foreground/50 opacity-70" : "text-card-foreground group-hover:text-foreground"
                    )}>
                        {task.title}
                    </h3>

                    {/* Priority Badge */}
                    <span className={clsx(
                        "shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border leading-none self-start",
                        priorityStyles[task.priority] || 'bg-secondary text-secondary-foreground'
                    )}>
                        {task.priority}
                    </span>
                </div>
            </div>

            {(task.description || task.estimate || task.assignee || task.createdBy) && (
                <div className={clsx("flex items-center justify-between mt-1 min-h-[20px]", isDone && "opacity-50 grayscale transition-all")}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {task.estimate ? (
                            <div className={clsx(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                                showOverdue ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-secondary/50"
                            )}>
                                {showOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                                <span className={clsx("text-[10px]", showOverdue && "font-semibold")}>
                                    {showOverdue ? "Overdue" : task.estimate}
                                </span>
                            </div>
                        ) : task.description ? (
                            <AlignLeft size={12} className="opacity-50" />
                        ) : null}
                    </div>

                    <div className="flex items-center -space-x-2">
                        {task.assignee ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-card bg-muted ring-1 ring-border z-10 shadow-sm" title={`Assigned to ${task.assignee.name}`}>
                                {task.assignee.picture ? (
                                    <img src={task.assignee.picture} alt={task.assignee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary text-[10px] font-bold">
                                        {task.assignee.name[0]}
                                    </div>
                                )}
                            </div>
                        ) : task.createdBy ? (
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-border bg-muted opacity-70 shadow-sm" title={`Created by ${task.createdBy.name}`}>
                                <img src={task.createdBy.picture} alt={task.createdBy.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {showOverdue && (
                <div className="text-[10px] text-red-500 font-medium mt-0.5 italic">
                    Due: {timeStatus.text}
                </div>
            )}
        </div>
    );
};
