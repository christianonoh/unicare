import { create } from 'zustand';

interface AppState {
  selectedSessionId: string;
  selectedSemesterId: string;
  selectedUserId: string;
  sidebarOpen: boolean;
  setSelectedSessionId: (sessionId: string) => void;
  setSelectedSemesterId: (semesterId: string) => void;
  setSelectedUserId: (userId: string) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSessionId: 'session-2025-2026',
  selectedSemesterId: 'semester-2025-2026-1',
  selectedUserId: 'user-registry-1',
  sidebarOpen: true,
  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),
  setSelectedSemesterId: (selectedSemesterId) => set({ selectedSemesterId }),
  setSelectedUserId: (selectedUserId) => set({ selectedUserId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
