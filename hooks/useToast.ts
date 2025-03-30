/// hooks/useToast.ts

import { useToastStore } from '@/stores/toastStore';

export const useToast = () => {
    const { showToast } = useToastStore();

    return {
        success: (message: string, duration?: number) =>
            showToast({ message, type: 'success', duration }),
        error: (message: string, duration?: number) =>
            showToast({ message, type: 'error', duration }),
        warning: (message: string, duration?: number) =>
            showToast({ message, type: 'warning', duration }),
        info: (message: string, duration?: number) =>
            showToast({ message, type: 'info', duration }),
        action: (
            message: string,
            actionLabel: string,
            onClick: () => void,
            type?: 'success' | 'error' | 'warning' | 'info',
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