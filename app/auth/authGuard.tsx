/// app\auth\authGuard.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect } from "next/navigation";


export default async function AuthGuard({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin");
    }

    return <>{children}</>;
}
