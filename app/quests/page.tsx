/// app/quests/page.tsx

import { auth } from "@/app/auth/authSettings";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
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
    // AuthGuard가 이미 세션 체크를 했으므로, 여기서는 session.user가 항상 존재합니다
    try {
        const playerPromise = prisma.player.findUnique({
            where: { userId: session!.user.id },
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
                    userId: session!.user.id,
                    name: session!.user.name || "Superb Player",
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

        const bannerImagesPromise = prisma.storedImage.findMany({
            where: { onBanner: true },
            orderBy: { order: "asc" },
            select: { id: true, url: true },
        });

        const [dailyQuests, missions, completedQuests, banners] =
            await Promise.all([
                dailyQuestsPromise,
                missionsPromise,
                completedQuestsPromise,
                bannerImagesPromise,
            ]);

        return (
            <Quests
                player={player}
                dailyQuests={dailyQuests}
                missions={missions}
                completedQuests={completedQuests}
                banners={banners}
            />
        );
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
