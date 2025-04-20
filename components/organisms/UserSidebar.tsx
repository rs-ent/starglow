/// components\organisms\UserSidebar.tsx

import UserSidebarMenu from "../molecules/UserSidebarMenu";
import { cn } from "@/lib/utils/tailwind";

interface UserSidebarProps {
    onSectionClick: (section: string) => void;
    buttonGap?: number;
    frameSize?: number;
    textSize?: number;
    paddingSize?: number;
    gapSize?: number;
    variant?:
        | "default"
        | "space"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
    className?: string;
}

export default function UserSidebar({
    onSectionClick,
    buttonGap = 10,
    frameSize = 20,
    textSize = 20,
    paddingSize = 20,
    gapSize = 20,
    variant = "outline",
    className = "",
}: UserSidebarProps) {
    const items = [
        { label: "My Assets", key: "myassets", svg: "/ui/assets.svg" },
        {
            label: "Integration",
            key: "integration",
            svg: "/ui/integration.svg",
        },
        { label: "NFT Minting", key: "nft-mint", svg: "/ui/mint.svg" },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:block items-center justify-center",
                    className
                )}
            >
                <UserSidebarMenu
                    items={items}
                    onSelect={onSectionClick}
                    buttonGap={buttonGap}
                    variant={variant}
                    frameSize={frameSize}
                    textSize={textSize}
                    paddingSize={paddingSize}
                    gapSize={gapSize}
                    isMobile={false}
                />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "flex items-center justify-center lg:hidden",
                    className
                )}
            >
                <UserSidebarMenu
                    items={items}
                    onSelect={onSectionClick}
                    buttonGap={buttonGap}
                    variant={variant}
                    frameSize={frameSize}
                    textSize={textSize}
                    paddingSize={paddingSize}
                    gapSize={gapSize}
                    isMobile={true}
                />
            </aside>
        </>
    );
}
