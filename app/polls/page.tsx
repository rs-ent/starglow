/// app\polls\page.tsx

import Polls from "@/components/templates/Polls";
import { notFound } from "next/navigation";
import { setPlayer } from "../actions/player";
import { requireAuthUser } from "@/app/auth/authUtils";

export default async function PollsPage() {
    const user = await requireAuthUser("/polls");

    try {
        const player = await setPlayer({
            user: user,
        });

        if (!player) {
            return notFound();
        }

        return <Polls player={player} />;
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
