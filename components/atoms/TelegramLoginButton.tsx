/// components/atoms/TelegramLoginButton.tsx

"use client";

import { useEffect, useRef } from "react";

interface TelegramLoginButtonProps {
    size?: "small" | "medium" | "large";
    onAuth?: (user: any) => void;
}

export default function TelegramLoginButton({
    onAuth,
    size = "medium",
}: TelegramLoginButtonProps) {
    const telegramWrapperRef = useRef<HTMLDivElement>(null);

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

    return <div ref={telegramWrapperRef} />;
}
