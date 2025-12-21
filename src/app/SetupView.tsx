import React, { useState } from 'react';
import { useSettingsStore } from '@/features/settings/store';
import { KeyRound, ShieldCheck, HelpCircle, BookOpen } from 'lucide-react';
import { SetupGuideModal } from './SetupGuideModal';

export const SetupView = () => {
    const [clientId, setClientId] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    const setGoogleClientId = useSettingsStore((state) => state.setGoogleClientId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId.trim()) {
            setGoogleClientId(clientId.trim());
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-200">
            {showGuide && <SetupGuideModal onClose={() => setShowGuide(false)} />}

            <div className="max-w-xl w-full p-8 flex flex-col gap-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Setup Connection</h1>
                            <p className="text-zinc-500">Connect to your Google Workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowGuide(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full hover:bg-emerald-400/20 transition-colors"
                    >
                        <BookOpen size={14} />
                        Step-by-Step Guide
                    </button>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 space-y-3">
                    <p className="flex gap-2">
                        <HelpCircle size={16} className="shrink-0 mt-0.5" />
                        <span>
                            To use this app, you need a <strong>Google Client ID</strong>.
                            This ensures the app can safely talk to your Google Drive.
                        </span>
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 marker:text-zinc-600">
                        <li>Go to Google Cloud Console.</li>
                        <li>Create a project & enable Drive API.</li>
                        <li>Create OAuth Credentials (Web App).</li>
                        <li>Paste the Client ID below.</li>
                    </ol>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">Google Client ID</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 text-zinc-600" size={18} />
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="e.g. 123456789-abc...apps.googleusercontent.com"
                                className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-700 rounded-lg text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Save & Continue
                    </button>
                </form>
            </div>
        </div>
    );
};
