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
    logo?: string; // Base64 (deprecated, keep for migration)
    logoFileId?: string; // Drive File ID
    version: number;
}

export const createInitialProject = (): Project => ({
    id: uuidv4(),
    name: 'Project Execution',
    description: 'Execution Board',
    createdAt: Date.now(),
    updatedAt: 0, // Set to 0 so cloud data always overwrites initial state
    tasks: [],
    members: [],
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

