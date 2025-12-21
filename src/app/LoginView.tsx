import React from 'react';
import { useGoogleAuth } from '@/auth/useGoogleAuth';
import { useSettingsStore } from '@/features/settings/store';
import { Settings } from 'lucide-react';

export const LoginView = () => {
    const { login, loading, error } = useGoogleAuth();
    const resetSettings = useSettingsStore((state) => state.resetSettings);
    const googleClientId = useSettingsStore((state) => state.googleClientId);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-200">
            <div className="max-w-md w-full p-8 flex flex-col items-center gap-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-2xl relative">
                <button
                    onClick={resetSettings}
                    className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded-full transition-colors"
                    title="Change Client ID"
                >
                    <Settings size={18} />
                </button>

                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4" />

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">Project Execution</h1>
                    <p className="text-zinc-500">Focus on the work. Own your data.</p>
                </div>

                {error && (
                    <div className="p-3 w-full bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20 text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={login}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="text-xs text-center text-zinc-600 space-y-2">
                    <p>Data is stored in your Personal Google Drive.</p>
                    <p className="text-zinc-700">Client ID: {googleClientId.slice(0, 8)}...</p>
                </div>
            </div>
        </div>
    );
};
