/// app\polls\page.tsx

import { auth } from "@/app/auth/authSettings";
import Polls from "@/components/polls/Polls";
import { Suspense } from "react";
import { Metadata } from "next";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "Polls",
    description: "Vote on your favorite artists and earn rewards on Starglow",
};

// 로딩 상태 컴포넌트
function PollsLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer text="Something to vote on...🗳️" />
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
