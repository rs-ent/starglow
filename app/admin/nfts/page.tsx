import { requireAuthUser } from "@/app/auth/authUtils";
import { prisma } from "@/lib/prisma/client";
import AdminNFTs from "@/components/admin/nfts/Admin.NFTs";

export default async function AdminNFTsPage() {
    const user = await requireAuthUser("/admin/nfts");

    const wallet = await prisma.wallet.findFirst({
        where: {
            userId: user.id,
            network: "polygon",
        },
        select: {
            address: true,
        },
    });

    return (
        <div className="admin-nfts">
            <h1 className="text-2xl font-bold mb-6">NFTs Management</h1>
            <AdminNFTs />
        </div>
    );
}
