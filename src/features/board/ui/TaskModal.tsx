import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../domain/schema';
import { X, Trash2 } from 'lucide-react';

interface TaskModalProps {
    task: Task;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [estimate, setEstimate] = useState(task.estimate);
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [status, setStatus] = useState<TaskStatus>(task.status);

    const handleSave = () => {
        onSave(task.id, { title, description, estimate, priority, status });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-100">Edit Task</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-2 text-zinc-200"
                            >
                                <option value="backlog">Backlog</option>
                                <option value="planned">Planned</option>
                                <option value="in-progress">In Progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-2 text-zinc-200"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Estimate</label>
                        <input
                            value={estimate}
                            onChange={(e) => setEstimate(e.target.value)}
                            placeholder="e.g. 2h"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md p-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-24 bg-zinc-800/50 border border-zinc-700 rounded-md p-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 border-t border-zinc-800 pt-4">
                    <button
                        onClick={() => { onDelete(task.id); onClose(); }}
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm px-3 py-2 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
