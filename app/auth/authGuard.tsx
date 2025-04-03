/// app\auth\authGuard.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect } from "next/navigation";
import { cache } from "react";

const getBaseUrl = cache(
    () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
);

export default async function AuthGuard({
    children,
    callbackUrl = "/", // 기본값 설정
}: {
    children: React.ReactNode;
    callbackUrl?: string;
}) {
    const session = await auth();

    if (!session?.user) {
        const baseUrl = getBaseUrl();
        const params = new URLSearchParams({ callbackUrl });
        redirect(`${baseUrl}/auth/signin?${params.toString()}`);
    }

    return <>{children}</>;
}
