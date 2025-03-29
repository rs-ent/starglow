/// hooks\useLoading.tsx

import { create } from "zustand";

interface LoadingState {
    isLoading: boolean;
    progress: number;
    startLoading: () => void;
    setProgress: (progress: number) => void;
    endLoading: () => void;
}

export const useLoading = create<LoadingState>((set) => ({
    isLoading: false,
    progress: 0,

    startLoading: () => set({ isLoading: true, progress: 0 }),

    setProgress: (progress: number) => set({ progress }),

    endLoading: () => set({ isLoading: false, progress: 100 }),
}));