/// app\user\page.tsx

import {Suspense} from "react";
import {notFound} from "next/navigation";
import User from "@/components/user/User";
import {requireAuthUserAndPlayer} from "@/app/auth/authUtils";

export const dynamic = "force-dynamic";

// 로딩 상태 컴포넌트
function UserLoading() {
    return (
        <div className="animate-pulse p-4">
            <div className="h-24 bg-gray-200 rounded-full w-24 mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
    );
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserContent() {
    try {
        const { user, player } = await requireAuthUserAndPlayer("/user");
        return <User user={user} player={player} />;
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