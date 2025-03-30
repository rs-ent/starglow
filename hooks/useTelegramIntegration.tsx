/// hooks/useTelegramIntegration.tsx

import { create } from "zustand";
import { useEffect } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";

type Player = Awaited<ReturnType<typeof fetchPlayer>>;
async function fetchPlayer() {
  const response = await fetch("/api/telegram/integrate");
  if (!response.ok) throw new Error("API response error");

  const data = await response.json();
  return data.user || null;
}

interface TelegramState {
  player: Player | null;
  setPlayer: (player: Player | null) => void;
}

export const useTelegramStore = create<TelegramState>((set) => ({
  player: null,
  setPlayer: (player) => set({ player }),
}));

export const useTelegramIntegration = () => {
  const { player, setPlayer } = useTelegramStore();
  const { startLoading, endLoading } = useLoading();
  const toast = useToast();

  useEffect(() => {
    const loadPlayer = async () => {
      startLoading();
      try {
        const player = await fetchPlayer();
        setPlayer(player || null);
      } catch (error) {
        console.error("[Telegram Integration] Fetch player error:", error);
        setPlayer(null);
      } finally {
        endLoading();
      }
    };
    loadPlayer();
  }, [setPlayer, startLoading, endLoading]);

  const unlinkTelegram = async () => {
    try {
      const response = await fetch("/api/telegram/integrate", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to unlink Telegram account");

      setPlayer((prev: Player | null) =>
        prev ? { ...prev, telegramId: null } : null
      );
      toast.success("Telegram account unlinked successfully!");
    } catch (error) {
      toast.error("Failed to unlink Telegram account. Please try again.");
    }
  };

  return { player, unlinkTelegram };
};
