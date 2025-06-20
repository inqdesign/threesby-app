import { create } from 'zustand';

// Define the type for the collection card position and dimensions
interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Define the type for the selected collection with position data
interface SelectedCollection {
  id: string;
  rect: CardRect | null;
  coverImage?: string;
  title?: string;
}

// Define the transition store state
interface TransitionState {
  selectedCollection: SelectedCollection | null;
  isTransitioning: boolean;
  setSelectedCollection: (collection: SelectedCollection | null) => void;
  startTransition: () => void;
  endTransition: () => void;
}

// Create the store
export const useTransitionStore = create<TransitionState>((set) => ({
  selectedCollection: null,
  isTransitioning: false,
  
  setSelectedCollection: (collection) => set({ 
    selectedCollection: collection 
  }),
  
  startTransition: () => set({ 
    isTransitioning: true 
  }),
  
  endTransition: () => set({ 
    isTransitioning: false,
    selectedCollection: null
  })
}));
