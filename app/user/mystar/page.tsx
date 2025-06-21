/// app\user\mystar\page.tsx

import { Suspense } from "react";

import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import { getUserVerifiedSPGs } from "@/app/story/interaction/actions";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import UserMyStar from "@/components/user/User.MyStar";

// 로딩 상태 컴포넌트
function UserLoading() {
    return <PartialLoadingServer text="Building a private space...🏠" />;
}

// 사용자 데이터를 가져오는 컴포넌트
async function UserContent() {
    const { user, player } = await requireAuthUserAndPlayer("/user");
    const userVerifiedSPGs = await getUserVerifiedSPGs({
        userId: user.id,
    });

    return <UserMyStar player={player} userVerifiedSPGs={userVerifiedSPGs} />;
}

export default function UserEntryPage() {
    return (
        <Suspense fallback={<UserLoading />}>
            <UserContent />
        </Suspense>
    );
}
