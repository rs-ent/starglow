/// components\organisms\UserContent.tsx

import UserIntegration from "./UserIntegration";
import UserMyAssets from "./User.MyAssets";
import { User } from "@prisma/client";
import { signOut } from "next-auth/react";
interface UserContentProps {
    contentType: string;
    user: User;
}

export default function UserContent({ contentType, user }: UserContentProps) {
    if (contentType === "signout") {
        signOut({ callbackUrl: "/?signedOut=true" });
    }

    return (
        <main className="flex-1 p-6">
            {contentType === "myassets" && <UserMyAssets user={user} />}
            {contentType === "integration" && <UserIntegration />}
            {contentType === "nft-mint" && <div>NFT Minting Content</div>}
        </main>
    );
}
