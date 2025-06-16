// components/atoms/TwitterIntegration.tsx

import { useState } from "react";
import { startXAuth, exchangeXToken } from "@/app/actions/x/actions";

interface TwitterIntegrationProps {
    onSuccess?: (tweetAuthorId: string, userData: any) => void;
    onError?: (error: string) => void;
    isConnected?: boolean;
}

export default function TwitterIntegration({
    onSuccess,
    onError,
    playerId,
    isConnected,
}: TwitterIntegrationProps & { playerId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleXConnect = async () => {
        setIsLoading(true);

        try {
            const authData = await startXAuth({ playerId });

            const popup = window.open(
                authData.authUrl,
                "x-auth",
                "width=500,height=600,scrollbars=yes,resizable=yes"
            );

            if (!popup || popup.closed) {
                onError?.("Popup blocked. Please allow popups.");
                setIsLoading(false);
                return;
            }

            const checkInterval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkInterval);
                    window.removeEventListener("message", messageListener);
                    setIsLoading(false);
                }
            }, 1000);

            const messageListener = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === "X_AUTH_SUCCESS") {
                    popup?.close();

                    const result = await exchangeXToken({
                        code: event.data.code,
                        state: event.data.state,
                    });

                    if (result.success) {
                        onSuccess?.(result.authorId!, result.userData);
                    } else {
                        onError?.(result.message || "Authentication failed");
                    }

                    window.removeEventListener("message", messageListener);
                } else if (event.data.type === "X_AUTH_ERROR") {
                    popup?.close();
                    onError?.(event.data.error);
                    window.removeEventListener("message", messageListener);
                }
            };

            window.addEventListener("message", messageListener);
        } catch (error) {
            console.error("X connection error:", error);
            onError?.("X account connection error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleXConnect}
            disabled={isLoading}
            className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
        >
            {isLoading ? (
                <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Connecting...
                </>
            ) : isConnected ? (
                <>
                    <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X Account Connected
                </>
            ) : (
                <>
                    <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Connect X Account
                </>
            )}
        </button>
    );
}
