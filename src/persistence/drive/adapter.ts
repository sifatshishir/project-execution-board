import { Project } from '@/features/board/domain/schema';
import { StorageAdapter } from '../types';

// We need a way to pass the access token dynamically or set it.
// Since the adapter might be a singleton, we can pass context methods or set the token.

const DRIVE_FILE_NAME = 'project-execution-board.json';
const MIME_TYPE = 'application/json';

export class DriveAdapter implements StorageAdapter {
    private accessToken: string | null = null;
    private fileId: string | null = null;

    setAccessToken(token: string) {
        this.accessToken = token;
    }

    private async findFile(): Promise<string | null> {
        if (!this.accessToken) {
            console.warn('DriveAdapter: No access token set.');
            return null;
        }

        try {
            const q = `name = '${DRIVE_FILE_NAME}' and trashed = false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    console.error('DriveAdapter: Unauthorized. Token might be expired.');
                    // In a real app, trigger refresh or logout.
                }
                return null;
            }

            const data = await res.json();
            if (data.files && data.files.length > 0) {
                return data.files[0].id;
            }
            return null;
        } catch (e) {
            console.error('DriveAdapter: findFile error', e);
            return null;
        }
    }

    async loadProject(id: string): Promise<Project | null> {
        // Note: We ignore the passed ID in Drive search for MVP, assuming 1 project file.
        // Ideally, we'd content-address or store multiple IDs.
        // For this MVP, we look for "project-execution-board.json".

        if (!this.accessToken) return null;

        try {
            const existingFileId = await this.findFile();
            if (!existingFileId) return null;
            this.fileId = existingFileId;

            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error('Drive load error', e);
            return null;
        }
    }

    async saveProject(project: Project): Promise<void> {
        if (!this.accessToken) throw new Error('No access token');

        const fileContent = JSON.stringify(project, null, 2);
        const file = new Blob([fileContent], { type: MIME_TYPE });

        // Check if file exists to determine update vs create
        if (!this.fileId) {
            this.fileId = await this.findFile();
        }

        if (this.fileId) {
            // Update
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': MIME_TYPE
                },
                body: file
            });
        } else {
            // Create
            // Multipart upload to set metadata (name) + content is complex.
            // Simple upload: Create metadata first, then upload content? Or multipart.
            // Easiest for text files:

            const metadata = {
                name: DRIVE_FILE_NAME,
                mimeType: MIME_TYPE,
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.accessToken}` },
                body: form,
            });

            if (res.ok) {
                const data = await res.json();
                this.fileId = data.id;
            }
        }
    }
}

export const driveAdapter = new DriveAdapter();
