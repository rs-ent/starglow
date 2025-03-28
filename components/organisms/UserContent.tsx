/// components\organisms\UserContent.tsx

interface UserContentProps {
    contentType: string;
}

export default function UserContent({ contentType }: UserContentProps) {
    return (
        <main className="flex-1 p-6 bg-muted/20">
            {contentType === "mynfts" && <div>My NFTs Content</div>}
            {contentType === "integration" && <div>Integration Content</div>}
            {contentType === "nft-mint" && <div>NFT Minting Content</div>}
        </main>
    );
}