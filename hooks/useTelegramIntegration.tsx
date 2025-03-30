/// hooks/useTelegramIntegration.tsx

import { create } from "zustand";
import { useEffect } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";

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
  const { startLoading, endLoading } = useLoading();
  const toast = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      startLoading();
      try {
        const response = await fetch("/api/telegram/integrate");
        if (!response.ok) throw new Error("API response error");

        const data = await response.json();
        setTelegramUser(data.user);

        if (data.user) {
          toast.success("Telegram account integrated successfully!");
        } else {
          toast.info("Telegram account not integrated yet.");
        }
      } catch (error) {
        console.error("[Telegram Integration] Fetch user error:", error);
        setTelegramUser(null);
        toast.error("Failed to fetch Telegram integration status.");
      } finally {
        endLoading();
      }
    };
    fetchUser();
  }, []);

  const unlinkTelegram = async () => {
    try {
      const response = await fetch("/api/telegram/integrate", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unlink Telegram account");
      }

      setTelegramUser(null);
      toast.success("Telegram account unlinked successfully!");
    } catch (error) {
      toast.error("Failed to unlink Telegram account. Please try again.");
    }
  };

  return { telegramUser, unlinkTelegram };
};
