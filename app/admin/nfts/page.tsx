import { getPrivateKey } from "@/app/actions/defaultWallets";
import { auth } from "@/app/auth/authSettings";
import { prisma } from "@/lib/prisma/client";
import AdminNFT from "@/components/admin/nfts/Admin.NFT";

export default async function AdminNFTs() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            role: true,
        },
    });

    if (user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const wallet = await prisma.wallet.findFirst({
        where: {
            userId,
            network: "polygon",
        },
        select: {
            address: true,
        },
    });

    const privateKey = await getPrivateKey(wallet?.address || "");
    const collectionAddress = process.env.COLLECTION_ADDRESS;

    return (
        <div className="admin-nfts">
            <h1 className="text-2xl font-bold mb-6">NFTs Management</h1>
            <AdminNFT
                ESCROW_ADDRESS={wallet?.address || ""}
                COLLECTION_ADDRESS={collectionAddress || ""}
            />
        </div>
    );
}
