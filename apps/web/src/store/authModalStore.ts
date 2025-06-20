import { create } from 'zustand';

type AuthModalMode = 'login' | 'signup';

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  openModal: (mode: AuthModalMode) => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  openModal: (mode) => set({ isOpen: true, mode }),
  closeModal: () => set({ isOpen: false }),
}));
