/// app\polls\page.tsx

import { auth } from "@/app/auth/authSettings";
import Polls from "@/components/polls/Polls";
import { Suspense } from "react";
import { Metadata } from "next";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "Polls",
    description: "Vote on your favorite artists and earn rewards on Starglow",
};

// 로딩 상태 컴포넌트
function PollsLoading() {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09011b] to-[#311473] -z-20" />
            <div className="flex justify-center items-center h-screen">
                <div className="animate-pulse text-center">
                    <h2 className="text-4xl mb-4">Polls</h2>
                    <p className="text-muted-foreground">Loading polls...</p>
                </div>
            </div>
        </div>
    );
}

// 사용자 데이터를 가져오는 컴포넌트
async function PollsContent() {
    const session = await auth();

    return (
        <Polls user={session?.user ?? null} player={session?.player ?? null} />
    );
}

export default function PollsEntryPage() {
    return (
        <Suspense fallback={<PollsLoading />}>
            <PollsContent />
        </Suspense>
    );
}
