/// app\user\page.tsx

import { Suspense } from "react";
import User from "@/components/user/User";
import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import { getUserVerifiedSPGs } from "@/app/story/interaction/actions";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

// 로딩 상태 컴포넌트
function UserLoading() {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <PartialLoadingServer
                text="Building a private space...🏠"
                loadingSize={70}
                textSize={10}
            />
        </div>
    );
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserContent() {
    const { user, player } = await requireAuthUserAndPlayer("/user");
    const userVerifiedSPGs = await getUserVerifiedSPGs({
        userId: user.id,
    });
    return (
        <User user={user} player={player} userVerifiedSPGs={userVerifiedSPGs} />
    );
}

export default function UserEntryPage() {
    return (
        <Suspense fallback={<UserLoading />}>
            <UserContent />
        </Suspense>
    );
}
