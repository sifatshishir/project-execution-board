import { useState, useCallback } from 'react';
import { useAuthStore } from './store';
import { fetchUserProfile } from './api';
import { CONFIG } from '@/config';
import { TokenResponse } from './types';
import { useSettingsStore } from '@/features/settings/store';

export function useGoogleAuth() {
    const { setAccessToken, setUser } = useAuthStore();
    const googleClientId = useSettingsStore((state) => state.googleClientId);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTokenResponse = useCallback(async (response: TokenResponse) => {
        if (response.error) {
            setError(response.error);
            return;
        }

        setLoading(true);
        try {
            setAccessToken(response.access_token);
            const user = await fetchUserProfile(response.access_token);
            setUser(user);
        } catch (err) {
            console.error('Login failed', err);
            setError('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    }, [setAccessToken, setUser]);

    const login = useCallback(() => {
        if (!window.google) {
            setError('Google Identity Services not loaded');
            return;
        }

        if (!googleClientId) {
            setError('Google Client ID is missing. Please configure it in settings.');
            return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: CONFIG.GOOGLE_DRIVE_SCOPE,
            callback: handleTokenResponse,
        });

        client.requestAccessToken();
    }, [handleTokenResponse, googleClientId]);

    return { login, loading, error };
}
