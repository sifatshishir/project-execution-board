import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project } from '@/features/board/domain/schema';
import { StorageAdapter } from '../types';

interface ProjectDB extends DBSchema {
    projects: {
        key: string;
        value: Project;
    };
}

const DB_NAME = 'execution-board-db';
const STORE_NAME = 'projects';

class LocalAdapter implements StorageAdapter {
    private _dbPromise: Promise<IDBPDatabase<ProjectDB>> | null = null;

    private get dbPromise(): Promise<IDBPDatabase<ProjectDB>> {
        if (!this._dbPromise) {
            if (typeof window === 'undefined') {
                return Promise.reject(new Error('IndexedDB is not available on server'));
            }
            this._dbPromise = openDB<ProjectDB>(DB_NAME, 1, {
                upgrade(db) {
                    db.createObjectStore(STORE_NAME);
                },
            });
        }
        return this._dbPromise;
    }

    async loadProject(id: string): Promise<Project | null> {
        if (typeof window === 'undefined') return null;
        try {
            const db = await this.dbPromise;
            const project = await db.get(STORE_NAME, 'BOARD_DATA');
            console.log('LocalAdapter: Loaded project', project ? 'Found' : 'Not Found');
            return project || null;
        } catch (e) {
            console.error('LocalAdapter: Load failed', e);
            return null;
        }
    }

    async saveProject(project: Project): Promise<void> {
        if (typeof window === 'undefined') return;
        try {
            const db = await this.dbPromise;
            await db.put(STORE_NAME, project, 'BOARD_DATA');
            console.log('LocalAdapter: Saved project');
        } catch (e) {
            console.error('LocalAdapter: Save failed', e);
        }
    }
}

export const localAdapter = new LocalAdapter();
