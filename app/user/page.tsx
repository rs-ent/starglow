/// app\user\page.tsx

import { auth } from "@/app/auth/settings";
import { redirect } from "next/navigation";

export default async function UserEntryPage() {
    const session = await auth();
    console.log("session", session);

    if(!session?.user) {
        redirect("/auth/signin");
    }

    redirect(`/user/${session.user.id}`);
}