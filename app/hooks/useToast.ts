/// hooks/useToast.ts
import { toast } from "sonner";
import { create } from "zustand";

interface ToastOptions {
    message: string;
    type?: "success" | "error" | "info" | "warning";
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastStore {
    showToast: (options: ToastOptions) => void;
}

export const useToastStore = create<ToastStore>(() => ({
    showToast: ({ message, type = "info", duration = 3000, action }) => {
        const icons = {
            success: "✅",
            error: "❌",
            warning: "⚠️",
            info: "ℹ️",
        };

        toast(message, {
            duration,
            icon: icons[type],
            action,
            className: `toast-${type}`,
        });
    },
}));

export const useToast = () => {
    const { showToast } = useToastStore();

    return {
        success: (message: string, duration?: number) =>
            showToast({ message, type: "success", duration }),
        error: (message: string, duration?: number) =>
            showToast({ message, type: "error", duration }),
        warning: (message: string, duration?: number) =>
            showToast({ message, type: "warning", duration }),
        info: (message: string, duration?: number) =>
            showToast({ message, type: "info", duration }),
        action: (
            message: string,
            actionLabel: string,
            onClick: () => void,
            type?: "success" | "error" | "warning" | "info",
            duration?: number
        ) =>
            showToast({
                message,
                type,
                duration,
                action: { label: actionLabel, onClick },
            }),
    };
};
