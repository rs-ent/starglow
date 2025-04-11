/// app/quests/page.tsx

import { notFound } from "next/navigation";
import { setPlayer } from "@/app/actions/player";
import Quests from "@/components/templates/Quests";
import { requireAuthUser } from "../auth/authUtils";

export default async function QuestPage() {
    const user = await requireAuthUser("/quests");

    try {
        const player = await setPlayer(user);

        return <Quests player={player} />;
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
