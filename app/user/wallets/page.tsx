/// app\user\wallets\page.tsx

import { Suspense } from "react";

import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import UserWallets from "@/components/user/User.Wallets";

// 로딩 상태 컴포넌트
function UserLoading() {
    return <PartialLoadingServer text="Locking theives...💳" />;
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserContent() {
    const { user } = await requireAuthUserAndPlayer("/user");

    return <UserWallets user={user} />;
}

export default function UserEntryPage() {
    return (
        <Suspense fallback={<UserLoading />}>
            <UserContent />
        </Suspense>
    );
}
