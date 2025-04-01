/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Quests from "@/components/templates/Quests";

export default async function QuestPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/auth/signin");
    }

    try {
        const playerPromise = prisma.player.findUnique({
            where: { userId: session.user.id },
        });

        const latestQuestPromise = prisma.quest.findFirst({
            where: { startDate: { not: null } },
            orderBy: { startDate: "desc" },
            select: { startDate: true },
        });

        const [playerResult, latestQuest] = await Promise.all([
            playerPromise,
            latestQuestPromise,
        ]);

        const player =
            playerResult ||
            (await prisma.player.create({
                data: {
                    userId: session.user.id,
                    name: session.user.name || "Superb Player",
                },
            }));

        if (!latestQuest) {
            return notFound();
        }

        const dailyQuestsPromise = prisma.quest.findMany({
            where: { startDate: latestQuest.startDate },
            orderBy: { primary: "asc" },
        });

        const missionsPromise = prisma.quest.findMany({
            where: { permanent: true, visible: true },
            orderBy: { primary: "asc" },
        });

        const completedQuestsPromise = prisma.questLog.findMany({
            where: { playerId: player.id, completed: true },
            select: { questId: true },
        });

        const [dailyQuests, missions, completedQuests] = await Promise.all([
            dailyQuestsPromise,
            missionsPromise,
            completedQuestsPromise,
        ]);

        return (
            <Quests
                player={player}
                dailyQuests={dailyQuests}
                missions={missions}
                completedQuests={completedQuests}
            />
        );
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
