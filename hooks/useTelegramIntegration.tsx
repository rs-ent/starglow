/// hooks/useTelegramIntegration.tsx

import { create } from "zustand";
import { useEffect } from "react";
import { useToast } from "./useToast";

interface TelegramUser {
    id: string;
    first_name: string;
    last_name: string;
    username?: string;
}

interface TelegramState {
    telegramUser: TelegramUser | null;
    setTelegramUser: (user: TelegramUser | null) => void;
}

export const useTelegramStore = create<TelegramState>((set) => ({
    telegramUser: null,
    setTelegramUser: (user) => set({ telegramUser: user }),
}));

export const useTelegramIntegration = () => {
    const { telegramUser, setTelegramUser } = useTelegramStore();
    const toast = useToast();

    useEffect(() => {
        fetch('/api/telegram/integrate')
            .then(response => response.json())
            .then(data => setTelegramUser(data.user))
            .catch(() => setTelegramUser(null));
    }, []);

    const unlinkTelegram = async () => {
        try {
            const response = await fetch('/api/telegram/integrate', { method: 'DELETE' });

            if (!response.ok) {
                throw new Error('Failed to unlink Telegram account');
            }

            setTelegramUser(null);
            toast.success('Telegram account unlinked successfully!');
        } catch (error) {
            toast.error('Failed to unlink Telegram account. Please try again.');
        }
    };

    return { telegramUser, unlinkTelegram };
}