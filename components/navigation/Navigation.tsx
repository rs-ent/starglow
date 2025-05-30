/// components/templates/Navigation.tsx

import {auth} from "@/app/auth/authSettings";
import NavigationBar from "@/components/navigation/Navigation.Bar";

// 서버 컴포넌트에서 동적 데이터를 가져오기 위한 설정
export const dynamic = "force-dynamic";

/**
 * 네비게이션 컴포넌트 - 서버 컴포넌트로 인증 정보를 가져와 NavigationBar에 전달
 */
export default async function Navigation() {
    // 인증 세션 가져오기
    const session = await auth();

    return (
        <NavigationBar
            user={session?.user ?? null}
            player={session?.player ?? null}
        />
    );
}