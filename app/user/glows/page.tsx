/// app\user\tweets\page.tsx

import { Suspense } from "react";

import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import UserTweetsUnderConstruction from "@/components/user/User.Tweets.UnderConstruction";

// 로딩 상태 컴포넌트
function UserTweetsLoading() {
    return <PartialLoadingServer text="Squeezing the tweet...🐤" />;
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserTweetsContent() {
    return <UserTweetsUnderConstruction />;
}

export default function UserTweetsEntryPage() {
    return (
        <Suspense fallback={<UserTweetsLoading />}>
            <UserTweetsContent />
        </Suspense>
    );
}
