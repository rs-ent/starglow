import { useState, useRef, useCallback } from "react";
import { useToast } from "./useToast";
import { useLoading } from "./useLoading";

interface WalletConnectionState {
    isConnecting: boolean;
    currentStep: string;
    progress: number;
    canCancel: boolean;
}

export function useWalletConnection() {
    const toast = useToast();
    const { startLoading, setProgress, endLoading, isLoading } = useLoading();
    const [connectionState, setConnectionState] =
        useState<WalletConnectionState>({
            isConnecting: false,
            currentStep: "",
            progress: 0,
            canCancel: false,
        });

    const abortController = useRef<AbortController | null>(null);

    const startConnection = useCallback(
        (step: string = "Initializing connection...") => {
            abortController.current = new AbortController();
            setConnectionState({
                isConnecting: true,
                currentStep: step,
                progress: 10,
                canCancel: true,
            });
            startLoading();
            setProgress(10);
            toast.info(step);
        },
        [startLoading, setProgress, toast]
    );

    const updateConnectionStep = useCallback(
        (step: string, progress: number) => {
            if (abortController.current?.signal.aborted) return;

            setConnectionState((prev) => ({
                ...prev,
                currentStep: step,
                progress,
            }));
            setProgress(progress);
            toast.info(step);
        },
        [setProgress, toast]
    );

    const completeConnection = useCallback(
        (successMessage: string = "Connection completed successfully!") => {
            setConnectionState({
                isConnecting: false,
                currentStep: "",
                progress: 100,
                canCancel: false,
            });
            setProgress(100);
            toast.success(successMessage);
            endLoading();
            abortController.current = null;
        },
        [setProgress, toast, endLoading]
    );

    const failConnection = useCallback(
        (errorMessage: string) => {
            setConnectionState({
                isConnecting: false,
                currentStep: "",
                progress: 0,
                canCancel: false,
            });
            toast.error(errorMessage);
            endLoading();
            abortController.current = null;
        },
        [toast, endLoading]
    );

    const cancelConnection = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
            setConnectionState({
                isConnecting: false,
                currentStep: "",
                progress: 0,
                canCancel: false,
            });
            toast.info("Connection cancelled by user");
            endLoading();
            abortController.current = null;
        }
    }, [toast, endLoading]);

    const checkAborted = useCallback(() => {
        return abortController.current?.signal.aborted || false;
    }, []);

    return {
        connectionState,
        isConnecting: connectionState.isConnecting,
        currentStep: connectionState.currentStep,
        progress: connectionState.progress,
        canCancel: connectionState.canCancel,

        startConnection,
        updateConnectionStep,
        completeConnection,
        failConnection,
        cancelConnection,
        checkAborted,

        isGlobalLoading: isLoading,
    };
}
