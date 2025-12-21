import React from 'react';
import { useGoogleAuth } from '@/auth/useGoogleAuth';
import { useSettingsStore } from '@/features/settings/store';
import { Settings } from 'lucide-react';

export const LoginView = () => {
    const { login, loading, error } = useGoogleAuth();
    const resetSettings = useSettingsStore((state) => state.resetSettings);
    const googleClientId = useSettingsStore((state) => state.googleClientId);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-background text-foreground transition-colors duration-300">
            <div className="max-w-md w-full p-8 flex flex-col items-center gap-6 rounded-2xl bg-card border border-border shadow-2xl relative">
                <button
                    onClick={resetSettings}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                    title="Change Client ID"
                >
                    <Settings size={18} />
                </button>

                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-indigo-500 to-primary mb-4" />

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-card-foreground">Project Execution</h1>
                    <p className="text-muted-foreground">Focus on the work. Own your data.</p>
                </div>

                {error && (
                    <div className="p-3 w-full bg-destructive/10 text-destructive text-sm rounded border border-destructive/20 text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={login}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="text-xs text-center text-muted-foreground space-y-2">
                    <p>Data is stored in your Personal Google Drive.</p>
                    <p className="text-muted-foreground/70 font-mono">Client ID: {googleClientId.slice(0, 8)}...</p>
                </div>
            </div>
        </div>
    );
};
