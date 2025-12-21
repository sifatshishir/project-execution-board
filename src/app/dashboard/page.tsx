'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/auth/store';
import { Board } from '@/features/board/ui/Board';

export default function DashboardPage() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !isAuthenticated) {
            router.replace('/');
        }
    }, [isClient, isAuthenticated, router]);

    if (!isClient || !isAuthenticated) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500">
                Loading Board...
            </div>
        );
    }

    return <Board />;
}
