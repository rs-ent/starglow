/// app/quests/page.tsx

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { setPlayer } from "@/app/actions/player";
import Quests from "@/components/templates/Quests";
import { requireAuthUser } from "../actions/auth";

export default async function QuestPage() {
    const user = await requireAuthUser("/quests");

    try {
        const player = await setPlayer({
            user: user,
        });

        if (!player) {
            return notFound();
        }

        return <Quests player={player} />;
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
