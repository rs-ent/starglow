/// components\organisms\UserSidebar.tsx

import UserSidebarMenu from "../molecules/UserSidebarMenu";

interface UserSidebarProps {
    onSectionClick: (section: string) => void;
}

export default function UserSidebar({ onSectionClick }: UserSidebarProps) {
    const items = [
        { label: "My NFTs", key: "mynfts" },
        { label: "Integration", key: "integration" },
        { label: "NFT Minting", key: "nft-mint" },
    ];

    return (
        <aside className="w-60 p-4 bg-card shadow-md">
            <UserSidebarMenu items={items} onSelect={onSectionClick} />
        </aside>
    );
}