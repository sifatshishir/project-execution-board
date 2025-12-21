import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'backlog' | 'planned' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    estimate: string; // e.g., "2h", "1d"
    startDate?: number; // timestamp
    createdBy?: UserInfo;
    assignee?: UserInfo;
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
    members: UserInfo[];
    logo?: string; // Base64
    version: number;
}

export const createInitialProject = (): Project => ({
    id: uuidv4(),
    name: 'Project Execution',
    description: 'Execution Board',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tasks: [],
    members: [
        { name: 'Alice', email: 'alice@example.com', picture: 'https://ui-avatars.com/api/?name=Alice&background=random' },
        { name: 'Bob', email: 'bob@example.com', picture: 'https://ui-avatars.com/api/?name=Bob&background=random' },
        { name: 'Charlie', email: 'charlie@example.com', picture: 'https://ui-avatars.com/api/?name=Charlie&background=random' }
    ],
    version: 1,
});

export const createTask = (title: string, user?: UserInfo, status: TaskStatus = 'backlog'): Task => ({
    id: uuidv4(),
    title,
    description: '',
    status,
    priority: 'medium',
    estimate: '',
    startDate: undefined,
    createdBy: user,
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

