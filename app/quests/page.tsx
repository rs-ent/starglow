/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import Quests from "@/components/quests/Quests";
import { Suspense } from "react";
import { Metadata } from "next";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "Quests",
    description:
        "Complete quests to earn rewards and boost your artist valuation",
};

// 로딩 상태 컴포넌트
function QuestsLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer
                text="Mission to complete...🎯"
                loadingSize={70}
                textSize={10}
            />
        </div>
    );
}

async function QuestsContent() {
    const session = await auth();

    return (
        <Quests user={session?.user ?? null} player={session?.player ?? null} />
    );
}

export default function QuestsEntryPage() {
    return (
        <Suspense fallback={<QuestsLoading />}>
            <QuestsContent />
        </Suspense>
    );
}
