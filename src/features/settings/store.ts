import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    googleClientId: string;
    setGoogleClientId: (id: string) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            googleClientId: '',
            setGoogleClientId: (id) => set({ googleClientId: id }),
            resetSettings: () => set({ googleClientId: '' }),
        }),
        {
            name: 'execution-board-settings',
        }
    )
);
