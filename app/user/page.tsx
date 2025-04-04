/// app\user\page.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect } from "next/navigation";
import AuthGuard from "@/app/auth/authGuard";

interface PageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserEntryPage() {
    return (
        <AuthGuard callbackUrl="/user">
            <UserEntryContents />
        </AuthGuard>
    );
}

async function UserEntryContents({ searchParams }: PageProps) {
    const session = await auth();

    const params = await searchParams;
    if (params) {
        const integration = params.integration as string | undefined;
        if (integration) {
            if (integration === "telegram_success") {
                return redirect(
                    `/user/${session!.user.id}?integration=telegram_success`
                );
            } else if (integration === "telegram_exists") {
                return redirect(
                    `/user/${session!.user.id}?integration=telegram_exists`
                );
            } else if (integration === "telegram_unlinked") {
                return redirect(
                    `/user/${session!.user.id}?integration=telegram_unlinked`
                );
            } else {
                return redirect(
                    `/user/${session!.user.id}?integration=unknown`
                );
            }
        }
    }

    redirect(`/user/${session!.user.id}`);
}
