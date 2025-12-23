import { Project, UserInfo } from '@/features/board/domain/schema';
import { StorageAdapter } from '../types';

// We need a way to pass the access token dynamically or set it.
// Since the adapter might be a singleton, we can pass context methods or set the token.

const DRIVE_FILE_NAME = 'project-execution-board.json';
const MIME_TYPE = 'application/json';

export class DriveAdapter implements StorageAdapter {
    private accessToken: string | null = null;

    setAccessToken(token: string) {
        this.accessToken = token;
    }

    reset() {
        // No-op for now as fileId is moved to store
    }

    async listProjects(): Promise<{ id: string; name: string; updatedAt: string }[]> {
        if (!this.accessToken) return [];

        try {
            // Use name-based discovery to find all potential project files regardless of sharing origin
            const q = `name contains 'project-execution-board' and trashed = false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,mimeType,trashed)&orderBy=modifiedTime desc&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('AUTH_EXPIRED');
                }
                console.error('DriveAdapter: listProjects fetched failed', res.status);
                return [];
            }

            const data = await res.json();
            console.log('DriveAdapter: Raw files discovered:', data.files?.map((f: any) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                trashed: f.trashed
            })));

            // Filter only JSON files or files ending in .json that aren't obviously non-projects
            // Also explicitly EXCLUDE shortcuts to avoid duplicates if they point to the same file
            const seenIds = new Set<string>();
            const projects = (data.files || [])
                .filter((f: any) => {
                    if (seenIds.has(f.id)) return false; // Hard de-dupe by ID

                    const isTrashed = f.trashed;
                    const isShortcut = f.mimeType === 'application/vnd.google-apps.shortcut';
                    const isJson = (f.name.toLowerCase().endsWith('.json') ||
                        f.mimeType === MIME_TYPE ||
                        f.mimeType === 'text/plain') && !isShortcut;

                    if (isJson && !isTrashed) {
                        seenIds.add(f.id);
                        return true;
                    }
                    return false;
                })
                .map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    updatedAt: f.modifiedTime
                }));

            console.log('DriveAdapter: Final unique project files:', projects.length, projects.map((p: any) => p.name));
            return projects;
        } catch (e) {
            console.error('DriveAdapter: listProjects error', e);
            return [];
        }
    }

    private async findFile(): Promise<string | null> {
        if (!this.accessToken) {
            console.warn('DriveAdapter: No access token set.');
            return null;
        }

        try {
            const q = `name = '${DRIVE_FILE_NAME}' and trashed = false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
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

    async deleteFile(fileId: string): Promise<void> {
        if (!this.accessToken) throw new Error('No access token');

        try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!res.ok && res.status !== 404) {
                const error = await res.json().catch(() => ({ message: 'Unknown error' }));
                console.error('DriveAdapter: Delete failed', error);
            }
        } catch (e) {
            console.error('DriveAdapter: deleteFile error', e);
        }
    }

    async loadProject(id: string): Promise<(Project & { canEdit?: boolean }) | null> {
        if (!this.accessToken) return null;

        try {
            const fileIdToLoad = id;
            if (!fileIdToLoad) return null;

            // Fetch metadata with capabilities to check for editor access
            const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileIdToLoad}?fields=capabilities(canEdit)`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });
            let canEdit = true;
            if (metaRes.ok) {
                const meta = await metaRes.json();
                canEdit = meta.capabilities?.canEdit ?? true;
            }

            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileIdToLoad}?alt=media`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('AUTH_EXPIRED');
                }
                return null;
            }
            const project = await res.json();
            return { ...project, canEdit };
        } catch (e) {
            console.error('Drive load error', e);
            return null;
        }
    }

    async uploadImage(blob: Blob, name: string): Promise<string> {
        if (!this.accessToken) throw new Error('No access token');

        const metadata = {
            name: name,
            mimeType: blob.type,
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.accessToken}` },
            body: form,
        });

        if (!res.ok) {
            const error = await res.json();
            if (res.status === 401 || error.error?.code === 401) {
                throw new Error('AUTH_EXPIRED');
            }
            throw new Error(`Upload failed: ${JSON.stringify(error)}`);
        }

        const data = await res.json();
        return data.id;
    }

    async saveProject(project: Project, forceFileId: string | null = null): Promise<string> {
        if (!this.accessToken) throw new Error('No access token');

        const fileContent = JSON.stringify(project, null, 2);
        const file = new Blob([fileContent], { type: MIME_TYPE });

        if (forceFileId) {
            // Update existing file
            const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${forceFileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': MIME_TYPE
                },
                body: file
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Unknown error' }));
                // Check for auth errors
                if (res.status === 401 || error.error?.code === 401) {
                    throw new Error('AUTH_EXPIRED');
                }
                throw new Error(`Update failed: ${JSON.stringify(error)}`);
            }
            return forceFileId;
        } else {
            // Create new file
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
                console.log('DriveAdapter: Successfully created new project file:', data.id);
                return data.id;
            } else {
                const error = await res.json().catch(() => ({ message: 'Unknown error' }));
                // Check for auth errors
                if (res.status === 401 || error.error?.code === 401) {
                    throw new Error('AUTH_EXPIRED');
                }
                throw new Error(`Creation failed: ${JSON.stringify(error)}`);
            }
        }
    }

    async getProjectMembers(fileId: string): Promise<UserInfo[]> {
        if (!this.accessToken || !fileId) return [];

        try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?fields=permissions(id,displayName,emailAddress,photoLink,role)`, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('AUTH_EXPIRED');
                }
                return [];
            }

            const data = await res.json();
            const permissions = data.permissions || [];

            return permissions
                .filter((p: any) => p.emailAddress && p.displayName) // Only users with email/name
                .map((p: any) => ({
                    name: p.displayName,
                    email: p.emailAddress,
                    picture: p.photoLink || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.displayName)}&background=random`
                }));
        } catch (e) {
            console.error('Failed to fetch members', e);
            return [];
        }
    }
}

export const driveAdapter = new DriveAdapter();
