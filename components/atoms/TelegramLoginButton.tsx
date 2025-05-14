/// components/atoms/TelegramLoginButton.tsx

"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import PartialLoading from "./PartialLoading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/tailwind";

interface TelegramLoginButtonProps {
    size?: "small" | "medium" | "large";
    onAuth?: (user: any) => void;
}

export default function TelegramLoginButton({
    onAuth,
    size = "medium",
}: TelegramLoginButtonProps) {
    const telegramWrapperRef = useRef<HTMLDivElement>(null);
    const [telegram, setTelegram] = useState<any>(null);
    const [telegramUser, setTelegramUser] = useState<any>(null);

    console.log("telegram", telegram);
    console.log("telegramUser", telegramUser);

    useEffect(() => {
        if (telegram && telegram.initDataUnsafe?.user) {
            const tgUser = telegram.initDataUnsafe?.user;
            setTelegramUser(tgUser);
        }
    }, [telegram]);

    useEffect(() => {
        if (
            !telegramWrapperRef.current ||
            telegramWrapperRef.current.childNodes.length > 0
        ) {
            return;
        }

        (window as any).onTelegramAuth = (user: any) => {
            onAuth?.(user);
        };

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", "starglow_redslippers_bot");
        script.setAttribute("data-size", size);
        script.setAttribute("data-userpic", "false");
        script.setAttribute("data-radius", "6");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-onauth", "onTelegramAuth(user)");

        telegramWrapperRef.current.appendChild(script);

        return () => {
            delete (window as any).onTelegramAuth;
        };
    }, [onAuth]);

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
            {telegramUser ? (
                <Button
                    variant="outline"
                    onClick={() => {
                        window.location.href = "/";
                    }}
                    className={cn(
                        "w-full items-center justify-center",
                        "bg-[rgba(84,169,235,1)] border-none"
                    )}
                >
                    <img
                        src={"/icons/telegram-white.svg"}
                        alt={`Telegram refresh icon`}
                        style={{ width: "20px", height: "auto" }}
                    />
                    <span className="ml-2">Continue With Telegram</span>
                </Button>
            ) : (
                <div ref={telegramWrapperRef} />
            )}
        </>
    );
}
