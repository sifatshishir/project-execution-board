import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

interface AuthState {
    user: UserProfile | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setUser: (user: UserProfile) => void;
    setAccessToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setAccessToken: (token) => set({ accessToken: token }),
    logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
