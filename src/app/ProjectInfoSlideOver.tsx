import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Lock, Zap, Users, Github } from 'lucide-react';

interface ProjectInfoSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProjectInfoSlideOver: React.FC<ProjectInfoSlideOverProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border z-50 shadow-2xl flex flex-col h-screen"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-primary" />
                                Why This App?
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {/* Section: Security */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-primary">
                                    <div className="p-2 bg-primary/10 rounded-lg"><Lock size={20} /></div>
                                    <h3 className="font-bold text-lg">100% Private & Secured</h3>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Unlike traditional SaaS, this board has <strong>zero backend</strong>. Your data is stored directly in your private
                                    <strong> Google Drive App Data</strong> folder. Even the developers can't see your project details.
                                </p>
                                <ul className="grid grid-cols-1 gap-2 text-xs text-muted-foreground/80">
                                    <li className="flex gap-2">✅ No third-party servers.</li>
                                    <li className="flex gap-2">✅ End-to-end data ownership.</li>
                                    <li className="flex gap-2">✅ Uses official Google OAuth 2.0.</li>
                                </ul>
                            </section>

                            {/* Section: Comparison */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-indigo-400">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg"><Zap size={20} /></div>
                                    <h3 className="font-bold text-lg">Better Than Jira Free?</h3>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Jira's free tier has limits on users, features, and complex setups. We offer a <strong>distraction-free </strong>
                                        experience built specifically for high-velocity teams and solo developers.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                                            <h4 className="text-xs font-bold text-emerald-500 uppercase">This App</h4>
                                            <ul className="text-[10px] space-y-1 text-muted-foreground">
                                                <li>• Free forever (no limits)</li>
                                                <li>• Unlimited team members (as per google console project specifics)</li>
                                                <li>• Instant setup & speed</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2">
                                            <h4 className="text-xs font-bold text-red-400 uppercase">Jira / Others</h4>
                                            <ul className="text-[10px] space-y-1 text-muted-foreground">
                                                <li>• Limited project count</li>
                                                <li>• Pay for premium features</li>
                                                <li>• Learning curve & bloat</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Benefits */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 text-amber-500">
                                    <div className="p-2 bg-amber-500/10 rounded-lg"><Users size={20} /></div>
                                    <h3 className="font-bold text-lg">Helpful for Developers</h3>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Built by developers, for developers. We focused on the things that matter:
                                </p>
                                <div className="space-y-3">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">Offline-First Speed</p>
                                            <p className="text-xs text-muted-foreground">Syncs with IndexedDB. Works flawlessly even when your internet doesn't.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">Team Permission Sync</p>
                                            <p className="text-xs text-muted-foreground">Automatically pulls collaborators from your Google Drive file permissions.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
