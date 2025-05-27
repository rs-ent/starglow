/// components\organisms\NavBar.tsx
"use client";

import LinkButton from "../atoms/LinkButton";
import AuthButton from "../atoms/AuthButton";
import { User } from "next-auth";
import VerticalButton from "../atoms/VerticalButton";
import { useState, useMemo } from "react";
import RewardPanel from "../molecules/RewardPanel";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import { usePathname } from "next/navigation";
import UserSettings from "../user/User.Settings";

const defaultMenuItems = [
    { name: "Quest", href: "/quests", icon: "/ui/navigation/nav-quest.svg" },
    { name: "NFT", href: "/nfts", icon: "/ui/navigation/nav-nft.svg" },
    { name: "Poll", href: "/polls", icon: "/ui/navigation/nav-poll.svg" },
];

const myPage = (userId: string) => [
    {
        name: "My",
        href: `/user`,
        icon: "/ui/navigation/nav-my.svg",
    },
];

interface NavigationBarProps {
    user: User | null;
    player: Player | null;
}

export default function NavigationBar({ user, player }: NavigationBarProps) {
    const pathname = usePathname();
    const [active, setActive] = useState<string>("");
    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
    const menu = useMemo(() => {
        if (user && user.id) {
            return [...defaultMenuItems, ...myPage(user.id)];
        }
        return defaultMenuItems;
    }, [user]);

    return (
        <>
            {showUserSettings && user && player && (
                <UserSettings user={user} player={player} />
            )}
            <nav
                className="
                hidden lg:flex
                sticky top-0 z-10 backdrop-blur-xs
                w-full items-center justify-between bg-gradient-to-br from-[rgba(5,1,10,0.4)] to-[rgba(1,1,2,0.7)]
                py-3 px-5
                sm:py-4 sm:px-6
                md:py-6 md:px-8
                lg:py-8 lg:px-10
                xl:py-8 xl:px-12
            "
            >
                {/* Logo */}
                <LinkButton
                    href="/"
                    className="flex justify-start w-[150px] md:w-[200px] lg:w-[220px] xl:w-[300px]"
                    paddingSize={0}
                    gapSize={0}
                >
                    <img
                        src="/logo/lt-row.svg"
                        alt="Starglow"
                        className="w-[250px] h-auto"
                    />
                </LinkButton>
                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center justify-end space-x-2 md:space-x-4 lg:space-x-9 xl:space-x-16">
                    {menu.map(({ name, href }) => (
                        <LinkButton
                            key={name}
                            href={href}
                            textSize={15}
                            paddingSize={0}
                        >
                            {name}
                        </LinkButton>
                    ))}
                    <AuthButton
                        frameSize={15}
                        textSize={15}
                        paddingSize={10}
                        gapSize={10}
                    />
                    {player && (
                        <RewardPanel
                            playerId={player.id}
                            assetNames={["SGP"]}
                        />
                    )}
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className="lg:hidden">
                <div
                    className={cn(
                        "fixed top-0 left-0 right-0 inset-x-0 z-20",
                        "flex justify-between items-center",
                        "px-[10px] py-[10px]",
                        "sm:px-[16px] sm:py-[14px]",
                        "md:px-[20px] md:py-[17px]"
                    )}
                >
                    <LinkButton
                        href="/"
                        className="flex justify-start w-[25px] sm:w-[35px]"
                        paddingSize={0}
                        gapSize={0}
                    >
                        <img src="/logo/l-white.svg" alt="Starglow" />
                    </LinkButton>
                    {player ? (
                        pathname !== "/user" ? (
                            <RewardPanel
                                playerId={player.id}
                                assetNames={["SGP"]}
                            />
                        ) : (
                            <img
                                src="/ui/settings.svg"
                                alt="Settings"
                                className="w-[20px] h-[20px] opacity-80 hover:opacity-100 transition-opacity duration-300"
                                onClick={() => setShowUserSettings(true)}
                            />
                        )
                    ) : (
                        <AuthButton
                            frameSize={10}
                            textSize={10}
                            paddingSize={20}
                            gapSize={20}
                        />
                    )}
                </div>
                <nav
                    className="
                    fixed bottom-0 left-0 right-0 inset-x-0 z-40
                    bg-gradient-to-br from-[rgba(5,1,10,0.6)] to-[rgba(1,1,2,0.9)]
                    backdrop-blur-sm border-t border-muted rounded-t-[20px]
                    px-[5px] py-[10px]
                    sm:px-[30px] sm:py-[11px]
                    md:px-[60px] md:py-[12px]
                    flex justify-around items-center
                "
                >
                    {menu.map(({ name, href, icon }) => (
                        <VerticalButton
                            key={name}
                            img={icon}
                            label={name}
                            isActive={active === name}
                            textSize={10}
                            paddingSize={0}
                            frameSize={20}
                            gapSize={5}
                            onClick={() => setActive(name)}
                            href={href}
                            className={
                                active === name
                                    ? "hover:bg-[rgba(0,0,0,0)]"
                                    : "hover:bg-[rgba(0,0,0,0)] hover:opacity-100"
                            }
                        />
                    ))}
                </nav>
            </div>
        </>
    );
}
