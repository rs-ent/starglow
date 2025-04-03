/// app\auth\authGuard.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect } from "next/navigation";

export default async function AuthGuard({
    children,
    callbackUrl = "/", // 기본값 설정
}: {
    children: React.ReactNode;
    callbackUrl?: string;
}) {
    const session = await auth();

    if (!session?.user) {
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const params = new URLSearchParams({ callbackUrl });
        redirect(`/auth/signin?${params.toString()}`);
    }

    return <>{children}</>;
}
