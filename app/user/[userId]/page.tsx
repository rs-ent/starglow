/// app\user\[userId]\page.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect, notFound } from "next/navigation";
import { getUserById, getUserWallets } from "@/lib/prisma/user";
import User from "@/components/templates/User";

interface UserProfileProps {
    params: Promise<{ userId: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserProfile(props: UserProfileProps) {
    const session = await auth();
    if (!session?.user) return redirect("/auth/signin");

    const params = await props.params;
    const searchParams = await props.searchParams;
    const userId = params.userId;
    const userData = await getUserById(userId);
    const wallets = await getUserWallets(userId);
    if (!userData) return notFound();

    const owner = session.user.id === userId;

    return (
        <User
            userData={userData}
            wallets={wallets}
            owner={owner}
            searchParams={searchParams}
        />
    );
}
