import { create } from 'zustand';

export const useCofheStore = create((set) => ({
    isInitialized: false,
    setIsInitialized: (isInitialized) => set({ isInitialized }),
}));
