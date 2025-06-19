/// app\user\rewards\page.tsx

import { Suspense } from "react";
import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import { getPlayerAssets } from "@/app/actions/playerAssets";
import UserRewards from "@/components/user/User.Rewards";

// 로딩 상태 컴포넌트
function UserRewardsLoading() {
    return <PartialLoadingServer text="Searching your precious...💎" />;
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserRewardsContent() {
    const { user, player } = await requireAuthUserAndPlayer("/user");
    const playerAssets = await getPlayerAssets({
        filter: {
            playerId: player?.id ?? "",
        },
    });

    return <UserRewards player={player} playerAssets={playerAssets.data} />;
}

export default function UserRewardsEntryPage() {
    return (
        <Suspense fallback={<UserRewardsLoading />}>
            <UserRewardsContent />
        </Suspense>
    );
}
