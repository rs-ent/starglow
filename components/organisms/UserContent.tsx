/// components\organisms\UserContent.tsx

import UserIntegration from "./UserIntegration";
interface UserContentProps {
    contentType: string;
}

export default function UserContent({ contentType }: UserContentProps) {
    return (
        <main className="flex-1 p-6">
            {contentType === "myassets" && <div>My Assets Content</div>}
            {contentType === "integration" && <UserIntegration />}
            {contentType === "nft-mint" && <div>NFT Minting Content</div>}
        </main>
    );
}