/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Quests from "@/templates/Quests";

export default async function QuestPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/auth/signin");
    }

    try {
        const player =
            (await prisma.player.findUnique({
                where: { userId: session.user.id },
            })) ||
            (await prisma.player.create({
                data: {
                    userId: session.user.id,
                    name: session.user.name || "Player",
                },
            }));

        const latestQuest = await prisma.quest.findFirst({
            orderBy: { startDate: "desc" },
            select: { startDate: true },
        });

        if (!latestQuest) {
            console.info("[QuestPage] No daily quests found");
            return notFound();
        }

        const dailyQuests = await prisma.quest.findMany({
            where: { startDate: latestQuest.startDate },
        });

        const completedQuests = await prisma.questLog.findMany({
            where: { playerId: player.id, completed: true },
            select: { questId: true },
        });

        return (
            <Quests
                player={player}
                dailyQuests={dailyQuests}
                completedQuests={completedQuests}
            />
        );
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
