/// templates/Main.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroGitbook from "@/components/organisms/Hero.Gitbook";
import HeroFollowUs from "@/components/organisms/Hero.FollowUs";
import Footer from "@/components/organisms/Footer";
import Script from "next/script";

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
    }
}

export default function Main() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [telegram, setTelegram] = useState<any>(null);

    useEffect(() => {
        console.log("Window Telegram", window.Telegram);
        if (
            telegram &&
            telegram.initDataUnsafe?.user &&
            telegram.initDataUnsafe?.start_param
        ) {
            const telegramUser = telegram.initDataUnsafe?.user;
            const refParam = telegram.initDataUnsafe?.start_param;
            if (refParam && telegramUser?.id) {
                const tgId = telegramUser.id.toString();
                router.replace(
                    `/invite?ref=${refParam}&method=telegram&tgId=${tgId}`
                );
                return;
            }
        }
        setIsLoading(false);
    }, [telegram]);

    return (
        <>
            <Script
                src="https://telegram.org/js/telegram-web-app.js"
                strategy="lazyOnload"
                onLoad={() => {
                    if (window.Telegram?.WebApp) {
                        setTelegram(window.Telegram.WebApp);
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
