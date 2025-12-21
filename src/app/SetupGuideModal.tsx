import React from 'react';
import { X, ExternalLink, ShieldAlert, BadgeCheck, UploadCloud, Users } from 'lucide-react';

interface SetupGuideModalProps {
    onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <UploadCloud className="text-indigo-400" />
                            Initial Setup Guide
                        </h2>
                        <p className="text-sm text-zinc-500">Configure Google Cloud to allow this app execution.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">

                    {/* Step 1 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">1</div>
                            <h3 className="text-lg font-semibold text-zinc-200">Create Project & Enable Drive API</h3>
                        </div>
                        <div className="ml-11 text-zinc-400 text-sm space-y-2">
                            <p>Go to the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={12} /></a>.</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Create a <strong>New Project</strong> (e.g., "Execution Board").</li>
                                <li>Search for <strong>"Google Drive API"</strong> in the library and <strong>Enable</strong> it.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Step 2 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">2</div>
                            <h3 className="text-lg font-semibold text-zinc-200">Configure OAuth Screen</h3>
                        </div>
                        <div className="ml-11 text-zinc-400 text-sm space-y-2">
                            <p>Go to <strong>APIs & Services {'>'} OAuth consent screen</strong>.</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Select <strong>External</strong> (unless you have a Workspace).</li>
                                <li>Fill in required fields (App Name, Email).</li>
                                <li><strong>Important:</strong> Add your email to <strong>Test Users</strong>.</li>
                            </ul>
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3 text-yellow-500 text-xs mt-2">
                                <Users size={16} className="shrink-0" />
                                <span>If you see "Access Blocked" or "Unverified App", it means you forgot to add yourself as a Test User!</span>
                            </div>
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">3</div>
                            <h3 className="text-lg font-semibold text-zinc-200">Create Credentials</h3>
                        </div>
                        <div className="ml-11 text-zinc-400 text-sm space-y-2">
                            <p>Go to <strong>Credentials {'>'} Create Credentials {'>'} OAuth client ID</strong>.</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Application Type: <strong>Web application</strong>.</li>
                                <li>Authorized JavaScript origins:
                                    <div className="mt-1 p-2 bg-black rounded border border-zinc-800 font-mono text-xs text-indigo-300">
                                        http://localhost:3000
                                    </div>
                                </li>
                                <li>Authorized redirect URIs:
                                    <div className="mt-1 p-2 bg-black rounded border border-zinc-800 font-mono text-xs text-indigo-300">
                                        http://localhost:3000
                                    </div>
                                </li>
                                <li>Click <strong>Create</strong> and copy the <strong>Client ID</strong>.</li>
                            </ul>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-red-400 text-xs mt-2">
                                <ShieldAlert size={16} className="shrink-0" />
                                <div>
                                    <p className="font-semibold">Deployment Tip:</p>
                                    <p>If deploying to Vercel, remember to add your production URL (e.g., <code>https://your-app.vercel.app</code>) to both Origins and Redirect URIs above!</p>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <BadgeCheck size={18} />
                        I Have Configured It
                    </button>
                </div>
            </div>
        </div>
    );
};
