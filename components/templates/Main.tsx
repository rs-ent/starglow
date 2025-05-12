/// templates/Main.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroGitbook from "@/components/organisms/Hero.Gitbook";
import HeroFollowUs from "@/components/organisms/Hero.FollowUs";
import Footer from "@/components/organisms/Footer";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useUserSet } from "@/app/hooks/useUser";
import Popup from "../atoms/Popup";
import Button from "../atoms/Button";

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
    }
}

export default function Main() {
    const router = useRouter();
    const { data: session } = useSession();
    const { setUserWithTelegram, isSetUserWithTelegramPending, error } =
        useUserSet();

    const [isLoading, setIsLoading] = useState(true);
    const [telegram, setTelegram] = useState<any>(null);
    const [authProcessed, setAuthProcessed] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
    const [telegramUser, setTelegramUser] = useState<any>(null);
    const [refParam, setRefParam] = useState<any>(null);

    useEffect(() => {
        if (session?.user || authProcessed) {
            setIsLoading(false);
            return;
        }

        if (telegram && telegram.initDataUnsafe?.user) {
            const tgUser = telegram.initDataUnsafe?.user;
            const startParam = telegram.initDataUnsafe?.start_param;

            setTelegramUser(tgUser);
            setRefParam(startParam);

            setIsLoading(false);

            setShowWelcomePopup(true);
        } else if (telegram) {
            setIsLoading(false);
        }
    }, [session, telegram, authProcessed]);

    const handleContinueWithTelegram = async () => {
        try {
            setIsLoading(true);

            await setUserWithTelegram({
                user: telegramUser,
                referrerCode: refParam,
            });

            setAuthProcessed(true);
            setShowWelcomePopup(false);

            router.push("/quests");
        } catch (error) {
            console.error("Failed to set telegram user", error);
            setIsLoading(false);
        }
    };

    const handleSignIn = () => {
        setShowWelcomePopup(false);

        if (refParam && telegramUser?.id) {
            router.replace(
                `/invite?ref=${refParam}&method=telegram&tgId=${telegramUser.id}`
            );
        } else {
            router.push("/auth/signin");
        }
    };

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

            {/* 웰컴 팝업 */}
            <Popup
                open={showWelcomePopup}
                onClose={() => setShowWelcomePopup(false)}
                width="350px"
                className="p-6"
            >
                <div className="flex flex-col items-center text-center">
                    <img
                        src="/logo/l-gradient.svg"
                        alt="Starglow"
                        className="w-20 h-20 mb-4"
                    />
                    <h2 className="text-2xl font-bold mb-2">
                        Welcome{" "}
                        {telegramUser?.username || telegramUser?.first_name}!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Choose how you'd like to continue
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <Button
                            onClick={handleContinueWithTelegram}
                            disabled={isSetUserWithTelegramPending}
                            variant="default"
                            img="/icons/telegram.svg"
                            imgLeft={true}
                            className="w-full"
                        >
                            {isSetUserWithTelegramPending
                                ? "Processing..."
                                : "Continue with Telegram"}
                        </Button>

                        <Button
                            onClick={handleSignIn}
                            variant="outline"
                            className="w-full"
                        >
                            Sign in
                        </Button>
                    </div>
                </div>
            </Popup>

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
