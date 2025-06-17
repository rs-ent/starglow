/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import Quests from "@/components/quests/Quests";
import { Suspense } from "react";
import { Metadata } from "next";
import { setReferralQuestLogs } from "@/app/actions/referral";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "Quests",
    description:
        "Complete quests to earn rewards and boost your artist valuation",
};

// 로딩 상태 컴포넌트
function QuestsLoading() {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09011b] to-[#311473] -z-20" />
            <div className="flex justify-center items-center h-screen">
                <div className="animate-pulse text-center">
                    <h2 className="text-4xl mb-4">Quest</h2>
                    <p className="text-muted-foreground">Loading quests...</p>
                </div>
            </div>
        </div>
    );
}

export default async function QuestPage() {
    const session = await auth();

    return (
        <Suspense fallback={<QuestsLoading />}>
            <Quests
                user={session?.user ?? null}
                player={session?.player ?? null}
            />
        </Suspense>
    );
}
