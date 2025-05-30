/// templates/Main.tsx

"use client";

import {memo, useCallback, useEffect, useState} from "react";
import MainGitbook from "@/components/main/Main.Gitbook";
import MainPartners from "@/components/main/Main.Partners";
import MainFollowUs from "@/components/main/Main.FollowUs";
import Footer from "@/components/main/Footer";
import Script from "next/script";
import {useSession} from "next-auth/react";
import {useUserSet} from "@/app/hooks/useUser";
import {useSearchParams} from "next/navigation";
import Image from "next/image";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

const telegramScriptLink = "https://telegram.org/js/telegram-web-app.js";

// 메모이제이션된 컴포넌트들
const BgImage = memo(() => (
  <Image
    src="/bg/gradient-galaxy.svg"
    alt="Background"
    priority
    fill
    className="object-cover object-top -z-10"
  />
));

const LoadingOverlay = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center w-screen h-screen z-50 bg-[rgba(0,0,0,0.6)] transition-all duration-700 backdrop-blur-3xl">
    <Image
      src="/logo/l-gradient.svg"
      alt="Starglow"
      width={96}
      height={96}
      priority
      className="animate-in fade-in-0 duration-1000"
    />
  </div>
));

export default function Main() {
  const searchParams = useSearchParams();
  const signedOut = searchParams.get("signedOut");
  const { data: session } = useSession();
  const { setUserWithTelegram } = useUserSet();

  const [isLoading, setIsLoading] = useState(true);
  const [telegram, setTelegram] = useState<any>(null);
  const [authProcessed, setAuthProcessed] = useState(false);

  // 텔레그램 인증 핸들러를 useCallback으로 메모이제이션
  const handleTelegramAuth = useCallback(async () => {
    if (!telegram || authProcessed || session?.user || signedOut) {
      setIsLoading(false);
      return;
    }

    try {
      const user = telegram.initDataUnsafe?.user;

      if (user) {
        const refParam = telegram.initDataUnsafe?.start_param;

        await setUserWithTelegram({
          user,
          referrerCode: refParam,
        });

        setAuthProcessed(true);
      }
    } catch (error) {
      console.error("Telegram Auth Error: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [telegram, authProcessed, session, signedOut, setUserWithTelegram]);

  // 스크립트 로드 핸들러
  const handleScriptLoad = useCallback(() => {
    if (window.Telegram?.WebApp) {
      setTelegram(window.Telegram.WebApp);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleTelegramAuth();
  }, [handleTelegramAuth]);

  return (
    <>
      <Script
        src={telegramScriptLink}
        strategy="beforeInteractive"
        onLoad={handleScriptLoad}
      />

      {isLoading && <LoadingOverlay />}

      <div className="relative flex flex-col w-full">
        <BgImage />

        <main className="flex flex-col flex-1">
          <MainGitbook />
          <MainPartners />
          <MainFollowUs />
        </main>
        <Footer followUsVisible={false} />
      </div>
    </>
  );
}