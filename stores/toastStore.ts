import { create } from 'zustand';
import { toast } from 'sonner';

interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
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
    showToast: ({ message, type = 'info', duration = 3000, action }) => {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
        };

        toast(message, {
            duration,
            icon: icons[type],
            action,
            className: `toast-${type}`,
        });
    },
}));