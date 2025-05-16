/// app\user\page.tsx

import { redirect } from "next/navigation";
import { requireAuthUser } from "@/app/auth/authUtils";

export default async function UserEntryPage() {
    const user = await requireAuthUser("/user");

    redirect(`/user/${user.id}`);
}
