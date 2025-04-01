import { prisma } from "@/lib/prisma/client";
import AdminQuests from "@/components/templates/Admin.Quests";

export default async function AdminPage() {
    const bannerImages = await prisma.storedImage.findMany({
        where: {
            onBanner: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return <AdminQuests bannerImages={bannerImages} />;
}
