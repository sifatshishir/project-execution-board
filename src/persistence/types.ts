import { Project } from '@/features/board/domain/schema';

export interface StorageAdapter {
    loadProject(id: string): Promise<Project | null>;
    saveProject(project: Project): Promise<void>;
}
