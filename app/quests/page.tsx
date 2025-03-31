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

    return <Quests player={player} />;
  } catch (error) {
    console.error("[QuestPage] Error fetching player:", error);
    return notFound();
  }
}
