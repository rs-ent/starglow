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
    try {
        const { player, completedQuests } = await prisma.$transaction(
            async (tx) => {
                // 플레이어 조회
                let player = await tx.player.findUnique({
                    where: { userId: session!.user.id },
                });

                // 플레이어가 없으면 생성
                if (!player) {
                    player = await tx.player.create({
                        data: {
                            userId: session!.user.id,
                            name: session!.user.name || "Superb Player",
                        },
                    });
                }

                // 완료된 퀘스트 조회
                const completedQuests = await tx.questLog.findMany({
                    where: { playerId: player.id, completed: true },
                    select: { questId: true },
                });

                return { player, completedQuests };
            }
        );

        return <Quests player={player} completedQuests={completedQuests} />;
    } catch (error) {
        console.error("[QuestPage] Error fetching player:", error);
        return notFound();
    }
}
