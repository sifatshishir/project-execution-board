'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/auth/store';
import { useSettingsStore } from '@/features/settings/store';
import { LoginView } from './LoginView';
import { SetupView } from './SetupView';

export default function Page() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const googleClientId = useSettingsStore((state) => state.googleClientId);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && isAuthenticated && googleClientId) {
      router.replace('/dashboard');
    }
  }, [isClient, isAuthenticated, googleClientId, router]);

  if (!isClient) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-muted-foreground">
        Initialising...
      </div>
    );
  }

  // If we have auth and config, we are redirecting. Don't render anything else.
  if (isAuthenticated && googleClientId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-muted-foreground animate-pulse">
        Redirecting to Dashboard...
      </div>
    );
  }

  if (!googleClientId) {
    return <SetupView />;
  }

  return <LoginView />;
}
