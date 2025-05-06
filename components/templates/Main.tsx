/// templates/Main.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroGitbook from "@/components/organisms/Hero.Gitbook";
import HeroFollowUs from "@/components/organisms/Hero.FollowUs";
import Footer from "@/components/organisms/Footer";

export default function Main() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            window.Telegram?.WebApp?.initDataUnsafe
        ) {
            const tg = window.Telegram.WebApp;
            const telegramUser = tg.initDataUnsafe?.user;
            const refParam = tg?.initDataUnsafe?.start_param;
            if (refParam && telegramUser?.id) {
                const tgId = telegramUser.id.toString();
                router.replace(
                    `/invite?ref=${refParam}&method=telegram&tgId=${tgId}`
                );
                return;
            }
        }
        setIsLoading(false);
    }, []);

    return (
        <>
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
