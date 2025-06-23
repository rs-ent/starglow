/// app\user\tweets\page.tsx

import { Suspense } from "react";

import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import UserTweets from "@/components/user/User.Tweets";

// 로딩 상태 컴포넌트
function UserTweetsLoading() {
    return <PartialLoadingServer text="Squeezing the tweet...🐤" />;
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserTweetsContent() {
    const { user, player } = await requireAuthUserAndPlayer("/user");

    return <UserTweets user={user} player={player} />;
}

export default function UserTweetsEntryPage() {
    return (
        <Suspense fallback={<UserTweetsLoading />}>
            <UserTweetsContent />
        </Suspense>
    );
}
