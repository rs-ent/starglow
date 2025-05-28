/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import Quests from "@/components/quests/Quests";

export default async function QuestPage() {
    const session = await auth();

    return (
        <Quests user={session?.user ?? null} player={session?.player ?? null} />
    );
}
