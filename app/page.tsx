/// app/page.tsx

"use client";

import { Suspense, useEffect, useState } from "react";

import Main from "@/components/main/Main";
import UnderConstruction from "@/components/main/UnderConstruction";

export default function Home() {
    const [isUnderConstruction, setIsUnderConstruction] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentHost = window.location.host;
        const isDevelopment =
            currentHost === "localhost:3000" ||
            currentHost === "starglow-six.vercel.app";

        if (isDevelopment) {
            setIsUnderConstruction(false);
        } else {
            const envUnderConstruction =
                process.env.NEXT_PUBLIC_UNDER_CONSTRUCTION === "true";
            setIsUnderConstruction(envUnderConstruction);
        }

        setIsLoading(false);
    }, []);

    // 로딩 중
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    // Under Construction 모드
    if (isUnderConstruction) {
        return <UnderConstruction />;
    }

    // 메인 앱
    return (
        <div>
            <main>
                <Suspense fallback={<div> </div>}>
                    <Main />
                </Suspense>
            </main>
        </div>
    );
}
