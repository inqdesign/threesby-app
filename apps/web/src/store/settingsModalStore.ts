import { create } from 'zustand';

interface SettingsModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useSettingsModalStore = create<SettingsModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
