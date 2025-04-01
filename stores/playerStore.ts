/// stores/playerStore.ts

import { create } from "zustand";

interface PlayerStore {
    id: string;
    userId: string;
    telegramId?: string | null;
    name?: string | null;
    points: number | 0;
    SGP: number | 0;
    SGT: number | 0;
    recommendedCount: number | 0;
    recommenderId?: string | null;
    recommenderName?: string | null;
    recommenderMethod?: string | null;
    createdAt?: Date | undefined;
    lastConnectedAt?: Date | undefined;

    setPlayerData: (
        data:
            | Partial<PlayerStore>
            | ((state: PlayerStore) => Partial<PlayerStore>)
    ) => void;
    resetPlayerData: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
    id: "",
    userId: "",
    telegramId: null,
    name: null,
    points: 0,
    SGP: 0,
    SGT: 0,
    recommendedCount: 0,
    recommenderId: null,
    recommenderName: null,
    recommenderMethod: null,
    createdAt: undefined,
    lastConnectedAt: undefined,

    setPlayerData: (data) => set((state) => ({ ...state, ...data })),
    resetPlayerData: () =>
        set(() => ({
            id: "",
            userId: "",
            telegramId: null,
            name: null,
            points: 0,
            SGP: 0,
            SGT: 0,
            recommendedCount: 0,
            recommenderId: null,
            recommenderName: null,
            recommenderMethod: null,
            createdAt: undefined,
            lastConnectedAt: undefined,
        })),
}));
