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
    completedQuests?: { questId: string }[];

    setPlayer: (
        data:
            | Partial<PlayerStore>
            | ((state: PlayerStore) => Partial<PlayerStore>)
    ) => void;

    incrementCurrency: (
        currency: "points" | "SGP" | "SGT",
        amount: number
    ) => void;

    addCompletedQuest: (questId: string) => void;

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
    completedQuests: [],

    setPlayer: (data) => set((state) => ({ ...state, ...data })),

    incrementCurrency: (currency: "points" | "SGP" | "SGT", amount: number) =>
        set((state) => ({
            [currency]: state[currency] + amount,
        })),

    addCompletedQuest: (questId: string) =>
        set((state) => ({
            completedQuests: [...(state.completedQuests || []), { questId }],
        })),

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
