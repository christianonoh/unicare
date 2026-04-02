import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (sidebarOpen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'unicare-app-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);
