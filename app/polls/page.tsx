/// app\polls\page.tsx

import { auth } from "@/app/auth/authSettings";
import Polls from "@/components/templates/Polls";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
    const session = await auth();

    return (
        <Polls user={session?.user ?? null} player={session?.player ?? null} />
    );
}
