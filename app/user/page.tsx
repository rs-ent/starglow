/// app\user\page.tsx

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireAuthUser } from "../actions/auth";

interface PageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserEntryPage({ searchParams }: PageProps) {
    const user = await requireAuthUser("/user");

    const params = await searchParams;
    if (params) {
        const integration = params.integration as string | undefined;
        if (integration) {
            if (integration === "telegram_success") {
                return redirect(
                    `/user/${user.id}?integration=telegram_success`
                );
            } else if (integration === "telegram_exists") {
                return redirect(`/user/${user.id}?integration=telegram_exists`);
            } else if (integration === "telegram_unlinked") {
                return redirect(
                    `/user/${user.id}?integration=telegram_unlinked`
                );
            } else {
                return redirect(`/user/${user.id}?integration=unknown`);
            }
        }
    }

    redirect(`/user/${user.id}`);
}
