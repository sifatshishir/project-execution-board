import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, UserInfo } from '../domain/schema';
import { X, Trash2, User as UserIcon } from 'lucide-react';

interface TaskModalProps {
    task: Task;
    projectMembers?: UserInfo[];
    isCreating?: boolean;
    initialStatus?: TaskStatus;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    task,
    projectMembers = [],
    isCreating = false,
    initialStatus,
    onClose,
    onSave,
    onDelete
}) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [estimate, setEstimate] = useState(task.estimate);
    const [startDate, setStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : '');
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [status, setStatus] = useState<TaskStatus>(initialStatus || task.status);
    const [assigneeEmail, setAssigneeEmail] = useState<string>(task.assignee?.email || '');

    // Reset fields if switching between create/edit (though modal usually remounts)
    useEffect(() => {
        if (isCreating && initialStatus) setStatus(initialStatus);
    }, [isCreating, initialStatus]);

    const handleSave = () => {
        const selectedAssignee = projectMembers.find(m => m.email === assigneeEmail);

        onSave(task.id, {
            title,
            description,
            estimate,
            priority,
            status,
            startDate: startDate ? new Date(startDate).getTime() : undefined,
            assignee: selectedAssignee
        });
        onClose();
    };

    // Calculate End Time Logic simple parser
    const calculateEndTime = () => {
        if (!startDate || !estimate) return null;
        try {
            const start = new Date(startDate).getTime();
            const match = estimate.match(/(\d+)([hm])/);
            if (!match) return null;
            const val = parseInt(match[1]);
            const unit = match[2];
            const durationMs = unit === 'h' ? val * 60 * 60 * 1000 : val * 60 * 1000;
            return new Date(start + durationMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return null;
        }
    };

    const endTime = calculateEndTime();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-card-foreground">
                        {isCreating ? 'Create Task' : 'Edit Task'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="What needs to be done?"
                            autoFocus
                        />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="backlog">Backlog</option>
                                <option value="planned">Planned</option>
                                <option value="in-progress">In Progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {/* People: Reporter & Assignee */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Reporter (Read Only) */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Reporter</label>
                            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-transparent">
                                <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                    {task.createdBy?.picture ? (
                                        <img src={task.createdBy.picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={12} className="text-muted-foreground" />
                                    )}
                                </div>
                                <span className="text-sm text-foreground truncate">{task.createdBy?.name || 'Unknown'}</span>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Assignee</label>
                            <select
                                value={assigneeEmail}
                                onChange={(e) => setAssigneeEmail(e.target.value)}
                                className="w-full bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="">Unassigned</option>
                                {projectMembers.map(member => (
                                    <option key={member.email} value={member.email}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-secondary/50 border border-input rounded-md p-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Estimate (e.g. 2h)</label>
                            <input
                                className="w-full bg-secondary/50 border border-input rounded-md p-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={estimate}
                                onChange={(e) => setEstimate(e.target.value)}
                                placeholder="2h"
                            />
                            {endTime && <div className="text-xs text-primary mt-1">Ends at: {endTime}</div>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-24 bg-secondary/50 border border-input rounded-md p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 border-t border-border pt-4">
                    {isCreating ? (
                        <div></div> // Spacer
                    ) : (
                        <button
                            onClick={() => { onDelete(task.id); onClose(); }}
                            className="flex items-center gap-2 text-destructive hover:text-destructive/80 text-sm px-3 py-2 rounded-md hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={!title}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Create Task' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
