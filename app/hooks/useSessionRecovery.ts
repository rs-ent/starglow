import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "./useToast";

const isDev = process.env.NODE_ENV === "development";

declare global {
    interface Window {
        __starglow_session_debug?: {
            corruptSession: () => void;
            checkSession: () => any;
            forceRecovery: () => void;
        };
    }
}

export function useSessionRecovery() {
    const { data: session, status } = useSession();
    const toast = useToast();
    const recoveryAttempted = useRef(false);
    const lastSessionCheck = useRef<string | null>(null);
    const recoveryCount = useRef(0);
    const maxRecoveryAttempts = 3;

    useEffect(() => {
        if (isDev && typeof window !== "undefined") {
            window.__starglow_session_debug = {
                corruptSession: () => {
                    console.info("Manually corrupting session for testing");
                    if (session) {
                        Object.defineProperty(session, "user", {
                            value: { id: null },
                            writable: false,
                        });
                    }
                },
                checkSession: () => {
                    return {
                        status,
                        session,
                        isHealthy:
                            status === "authenticated" &&
                            session?.user?.id &&
                            typeof session.user.id === "string",
                        recoveryAttempts: recoveryCount.current,
                    };
                },
                forceRecovery: () => {
                    recoveryAttempted.current = false;
                    recoveryCount.current = 0;
                },
            };
        }
    }, [session, status]);

    useEffect(() => {
        const checkSessionIntegrity = async () => {
            if (status === "loading") return;

            if (status === "authenticated" && session) {
                if (!session.user?.id || typeof session.user.id !== "string") {
                    if (
                        !recoveryAttempted.current &&
                        recoveryCount.current < maxRecoveryAttempts
                    ) {
                        recoveryAttempted.current = true;
                        recoveryCount.current += 1;

                        console.warn(
                            `🔄 Corrupted session detected, attempting recovery (${recoveryCount.current}/${maxRecoveryAttempts})`,
                            {
                                sessionStatus: status,
                                sessionData: session,
                                userAgent: navigator.userAgent,
                                timestamp: new Date().toISOString(),
                            }
                        );

                        try {
                            await signOut({
                                redirect: false,
                                callbackUrl: window.location.pathname,
                            });

                            toast.info(
                                "Session has been recovered. Please sign in again."
                            );

                            setTimeout(() => {
                                if (
                                    window.location.pathname !== "/auth/signin"
                                ) {
                                    window.location.href = "/auth/signin";
                                } else {
                                    window.location.reload();
                                }
                            }, 500);
                        } catch (error) {
                            console.error("❌ Session recovery failed:", error);

                            if (recoveryCount.current >= maxRecoveryAttempts) {
                                toast.error(
                                    "Session recovery failed. Please clear browser cache and try again."
                                );

                                try {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                } catch (clearError) {
                                    console.warn(
                                        "Failed to clear storage:",
                                        clearError
                                    );
                                }
                            } else {
                                toast.error(
                                    "Session recovery failed. Please try again."
                                );
                            }
                        }
                    } else if (recoveryCount.current >= maxRecoveryAttempts) {
                        console.error(
                            "💀 Max recovery attempts reached, giving up"
                        );
                        toast.error(
                            "Session recovery failed. Please contact support."
                        );
                    }
                } else {
                    if (
                        recoveryAttempted.current ||
                        recoveryCount.current > 0
                    ) {
                        console.info("Session recovered successfully");
                    }
                    recoveryAttempted.current = false;
                    recoveryCount.current = 0;
                    lastSessionCheck.current = session.user.id;
                }
            }

            if (status === "unauthenticated") {
                recoveryAttempted.current = false;
                recoveryCount.current = 0;
                lastSessionCheck.current = null;
            }
        };

        const timeoutId = setTimeout(checkSessionIntegrity, 100);
        return () => clearTimeout(timeoutId);
    }, [session, status, toast]);

    return {
        isSessionHealthy:
            status === "authenticated" &&
            session?.user?.id &&
            typeof session.user.id === "string",
        sessionStatus: status,
        isRecovering:
            recoveryAttempted.current &&
            status === "authenticated" &&
            !session?.user?.id,
        recoveryAttempts: recoveryCount.current,
    };
}
