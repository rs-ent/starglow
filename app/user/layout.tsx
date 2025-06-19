/// app/user/layout.tsx

import UserProfile from "@/components/user/User.Profile";
import UserMenu from "@/components/user/User.Menu";
import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";

export const dynamic = "force-dynamic";

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, player } = await requireAuthUserAndPlayer("/user");

    return (
        <div className="flex flex-col items-center justify-center w-screen max-w-[1000px] mx-auto py-[100px]">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <UserProfile user={user} player={player} />
            <UserMenu />
            <main className="flex-1">{children}</main>
        </div>
    );
}
