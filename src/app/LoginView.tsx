import React from 'react';
import { useGoogleAuth } from '@/auth/useGoogleAuth';
import { useSettingsStore } from '@/features/settings/store';
import { Settings, Zap, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginView = () => {
    const { login, loading, error } = useGoogleAuth();
    const resetSettings = useSettingsStore((state) => state.resetSettings);
    const googleClientId = useSettingsStore((state) => state.googleClientId);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-background text-foreground transition-colors duration-300 overflow-hidden relative">

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Main Login Card */}
            <div className="max-w-md w-full p-8 flex flex-col items-center gap-6 rounded-2xl bg-card border border-border shadow-2xl relative z-10 mx-4">
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={resetSettings}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
                        title="Change Client ID"
                    >
                        <Settings size={18} />
                    </button>
                </div>

                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-indigo-500 to-primary mb-4 shadow-lg shadow-primary/20" />

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-card-foreground">Project Execution</h1>
                    <p className="text-muted-foreground italic">"Focus on the work. Own your data."</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 w-full bg-destructive/10 text-destructive text-sm rounded border border-destructive/20 text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    onClick={login}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-primary/25 active:scale-[0.98]"
                >
                    {loading ? (
                        <Zap size={18} className="animate-spin" />
                    ) : (
                        <Globe size={18} />
                    )}
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="text-xs text-center text-muted-foreground space-y-3 pt-2">
                    <p className="flex items-center justify-center gap-1.5 opacity-80">
                        <Lock size={12} className="text-emerald-500" />
                        Data is stored in your Personal Google Drive.
                    </p>
                    <p className="text-muted-foreground/50 font-mono tracking-tighter bg-secondary/30 py-1 px-2 rounded">
                        Client ID: {googleClientId.slice(0, 12)}...
                    </p>
                </div>
            </div>
        </div>
    );
};
