/// app\user\discord\page.tsx

import { Suspense } from "react";

import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import UserDiscord from "@/components/user/User.Discord";

// 로딩 상태 컴포넌트
function UserDiscordLoading() {
    return (
        <PartialLoadingServer text="Finding a reason for the discord... 🤔" />
    );
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserDiscordContent() {
    const { user } = await requireAuthUserAndPlayer("/user");

    return <UserDiscord user={user} />;
}

export default function UserDiscordEntryPage() {
    return (
        <Suspense fallback={<UserDiscordLoading />}>
            <UserDiscordContent />
        </Suspense>
    );
}
