import { create } from 'zustand';

interface LecturerState {
  selectedLecturerId: string;
  setSelectedLecturerId: (selectedLecturerId: string) => void;
}

export const useLecturerStore = create<LecturerState>()((set) => ({
  selectedLecturerId: '',
  setSelectedLecturerId: (selectedLecturerId) => set({ selectedLecturerId }),
}));
