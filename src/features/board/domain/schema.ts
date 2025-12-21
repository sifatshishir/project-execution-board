import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'backlog' | 'planned' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    estimate: string; // e.g., "2h", "1d" - kept as string for freeform simple logging or parsed later
    startDate?: number; // timestamp
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
    tasks: Task[];
    version: number;
}

export const createInitialProject = (): Project => ({
    id: uuidv4(),
    name: 'My Project',
    description: 'Execution Board',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tasks: [],
    version: 1,
});

export const createTask = (title: string): Task => ({
    id: uuidv4(),
    title,
    description: '',
    status: 'backlog',
    priority: 'medium',
    estimate: '',
    startDate: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
});
