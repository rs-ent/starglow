/// components/atoms/TelegramLoginButton.tsx

"use client";

import { useEffect, useRef } from "react";

export default function TelegramLoginButton() {
    const telegramWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!telegramWrapperRef.current || telegramWrapperRef.current.childNodes.length > 0) {
            return;
        }

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", "starglow_redslippers_bot");
        script.setAttribute("data-size", "large");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-auth-url", "/api/telegram/integrate/callback");

        telegramWrapperRef.current.appendChild(script);
    }, []);

    return <div ref={telegramWrapperRef} />;

}
