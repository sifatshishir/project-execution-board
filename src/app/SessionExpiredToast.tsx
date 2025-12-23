'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/auth/store';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SessionExpiredToast: React.FC = () => {
    const [showToast, setShowToast] = useState(false);
    const [lastAuthState, setLastAuthState] = useState(true);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        // Detect when user goes from authenticated to unauthenticated
        if (lastAuthState && !isAuthenticated) {
            setShowToast(true);
            // Auto-hide after 10 seconds
            const timer = setTimeout(() => setShowToast(false), 10000);
            return () => clearTimeout(timer);
        }
        setLastAuthState(isAuthenticated);
    }, [isAuthenticated, lastAuthState]);

    return (
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full mx-4"
                >
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-lg flex items-start gap-3">
                        <div className="shrink-0 text-amber-500 mt-0.5">
                            <AlertCircle size={20} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-amber-200">Session Expired</h3>
                            <p className="text-sm text-amber-200/80">
                                Your Google authentication has expired. Please log in again to continue saving changes.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            className="shrink-0 p-1 text-amber-200/60 hover:text-amber-200 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
