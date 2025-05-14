/// templates/Main.tsx

"use client";

import { useEffect, useState } from "react";
import HeroGitbook from "@/components/organisms/Hero.Gitbook";
import HeroFollowUs from "@/components/organisms/Hero.FollowUs";
import Footer from "@/components/organisms/Footer";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useUserSet } from "@/app/hooks/useUser";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/hooks/useToast";

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
    }
}

export default function Main() {
    const searchParams = useSearchParams();
    const signedOut = searchParams.get("signedOut");
    const toast = useToast();
    const { data: session } = useSession();
    const { setUserWithTelegram, isSetUserWithTelegramPending, error } =
        useUserSet();

    const [isLoading, setIsLoading] = useState(true);
    const [telegram, setTelegram] = useState<any>(null);
    const [authProcessed, setAuthProcessed] = useState(false);

    useEffect(() => {
        if (session?.user || authProcessed) {
            setIsLoading(false);
            return;
        }

        if (signedOut) {
            toast.success(
                `Signed out successfully. ${JSON.stringify(session)}`
            );
            setIsLoading(false);
            return;
        }

        async function handleTelegramAuth() {
            if (telegram && telegram.initDataUnsafe?.user) {
                const tgUser = telegram.initDataUnsafe?.user;
                const refParam = telegram.initDataUnsafe?.start_param;

                await setUserWithTelegram({
                    user: tgUser,
                    referrerCode: refParam,
                });

                setAuthProcessed(true);
                setIsLoading(false);
            } else if (telegram) {
                setIsLoading(false);
            }
        }

        handleTelegramAuth();
    }, [session, telegram, authProcessed]);

    return (
        <>
            <Script
                src="https://telegram.org/js/telegram-web-app.js"
                strategy="lazyOnload"
                onLoad={() => {
                    if (window.Telegram?.WebApp) {
                        setTelegram(window.Telegram.WebApp);
                    } else {
                        setIsLoading(false);
                    }
                }}
            />

            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center w-screen h-screen z-50 bg-[rgba(0,0,0,0.6)] transition-all duration-700 backdrop-blur-3xl">
                    <img
                        src="/logo/l-gradient.svg"
                        alt="Starglow"
                        className="w-24 h-24 animate-in fade-in-0 duration-1000"
                    />
                </div>
            )}

            <div className="relative flex flex-col w-full">
                <img
                    src="/bg/gradient-galaxy.svg"
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover object-top -z-10"
                />

                <main className="flex flex-col flex-1">
                    <HeroGitbook />
                    <HeroFollowUs />
                </main>
                <Footer followUsVisible={false} />
            </div>
        </>
    );
}

/*
            <Popup
                open={showWelcomePopup}
                onClose={() => setShowWelcomePopup(false)}
                className="p-8"
                fullScreen={true}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-45 blur-md"></div>
                        <img
                            src="/logo/l-gradient.svg"
                            alt="Starglow"
                            className="relative w-24 h-24 animate-pulse-slow"
                        />
                    </div>

                    <h2
                        className={cn(
                            "text-2xl font-bold mb-3",
                            getResponsiveClass(40).textClass
                        )}
                    >
                        Hi, {telegramUser?.username || telegramUser?.first_name}
                        !
                    </h2>

                    <h3
                        className={cn(
                            "text-3xl font-bold mb-3",
                            "bg-clip-text text-transparent bg-gradient-to-r from-[rgba(255,255,255,0.8)] to-[rgba(255,255,255,0.4)]",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        Welcome to Starglow{" "}
                    </h3>

                    <p
                        className={cn(
                            "mb-8",
                            "text-[rgba(255,255,255,0.65)]",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        Choose how you'd like to continue your journey in the
                        Starglow universe
                    </p>

                    <div className="flex flex-col w-full gap-4">
                        <Button
                            onClick={handleContinueWithTelegram}
                            disabled={isSetUserWithTelegramPending}
                            variant="default"
                            frameSize={20}
                            textSize={25}
                            paddingSize={25}
                            img="/icons/telegram-white.svg"
                            imgLeft={true}
                            className="w-full py-6 bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#229ED9] hover:to-[#1E94CC] transition-all duration-300"
                        >
                            {isSetUserWithTelegramPending
                                ? "Processing..."
                                : "Continue with Telegram"}
                        </Button>

                        <div className="my-2 flex flex-row items-center justify-around">
                            <div className="w-full border-t border-gray-600"></div>
                            <span className="px-1 text-sm text-gray-400">
                                or
                            </span>
                            <div className="w-full border-t border-gray-600"></div>
                        </div>

                        <Button
                            onClick={handleSignIn}
                            textSize={20}
                            variant="ghost"
                            className="w-full py-6 border-gray-600 transition-all duration-300"
                        >
                            Sign in with another account
                        </Button>
                    </div>
                </div>
            </Popup>
            */
