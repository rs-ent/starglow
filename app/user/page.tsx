/// app\user\page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import User from "@/components/user/User";
import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import { getUserVerifiedSPGs } from "@/app/story/interaction/actions";

export const dynamic = "force-dynamic";

// 로딩 상태 컴포넌트
function UserLoading() {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09011b] to-[#311473] -z-20" />
            <div className="flex justify-center items-center h-screen">
                <div className="animate-pulse text-center">
                    <h2 className="text-4xl mb-4">User</h2>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        </div>
    );
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserContent() {
    try {
        const { user, player } = await requireAuthUserAndPlayer("/user");
        const userVerifiedSPGs = await getUserVerifiedSPGs({
            userId: user.id,
        });
        return (
            <User
                user={user}
                player={player}
                userVerifiedSPGs={userVerifiedSPGs}
            />
        );
    } catch (error) {
        console.error("Error loading user:", error);
        notFound();
    }
}

export default function UserEntryPage() {
    return (
        <Suspense fallback={<UserLoading />}>
            <UserContent />
        </Suspense>
    );
}
