import { getPrivateKey } from "@/app/actions/defaultWallets";
import { auth } from "@/app/auth/authSettings";
import { prisma } from "@/lib/prisma/client";

export default async function AdminNFTs() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const wallet = await prisma.wallet.findFirst({
        where: {
            userId,
            network: "polygon",
        },
        select: {
            address: true,
        },
    });

    console.log(wallet);

    const privateKey = await getPrivateKey(wallet?.address || "");

    return (
        <div className="admin-nfts">
            <h1 className="text-2xl font-bold mb-6">NFTs Management</h1>
            {privateKey && (
                <div className="mb-4">
                    <p>Wallet Address: {wallet?.address}</p>
                    <p>Private Key: {privateKey}</p>
                </div>
            )}
        </div>
    );
}
