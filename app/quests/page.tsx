/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import { notFound } from "next/navigation";
import { setPlayer } from "@/app/actions/player";
import Quests from "@/components/templates/Quests";
import AuthGuard from "@/app/auth/authGuard";

export default async function QuestPage() {
    return (
        <AuthGuard callbackUrl="/quests">
            <QuestContent />
        </AuthGuard>
    );
}

async function QuestContent() {
    const session = await auth();

    try {
        const player = await setPlayer(session?.user.id);

        return <Quests player={player} />;
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
