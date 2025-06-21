/// app\user\tweets\page.tsx

import { Suspense } from "react";

import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import UserSettings from "@/components/user/User.Settings";

// 로딩 상태 컴포넌트
function UserSettingsLoading() {
    return <PartialLoadingServer text="Greasing the screw...🔧" />;
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserSettingsContent() {
    const { user, player } = await requireAuthUserAndPlayer("/user");

    return <UserSettings user={user} player={player} />;
}

export default function UserSettingsEntryPage() {
    return (
        <Suspense fallback={<UserSettingsLoading />}>
            <UserSettingsContent />
        </Suspense>
    );
}
