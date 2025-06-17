/// components\organisms\NavBar.tsx
"use client";

import LinkButton from "../atoms/LinkButton";
import AuthButton from "../atoms/AuthButton";
import { User } from "next-auth";
import VerticalButton from "../atoms/VerticalButton";
import { memo, useCallback, useMemo, useState } from "react";
import RewardPanel from "../atoms/RewardPanel";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import { usePathname } from "next/navigation";

// 타입 정의
type MenuItem = {
    name: string;
    href: string;
    icon: string;
};

// 기본 메뉴 항목 - 컴포넌트 외부로 이동하여 재생성 방지
const defaultMenuItems: MenuItem[] = [
    { name: "Quest", href: "/quests", icon: "/ui/navigation/nav-quest.svg" },
    { name: "NFT", href: "/nfts", icon: "/ui/navigation/nav-nft.svg" },
    { name: "Poll", href: "/polls", icon: "/ui/navigation/nav-poll.svg" },
];

const myPageItem: MenuItem = {
    name: "My",
    href: "/user",
    icon: "/ui/navigation/nav-my.svg",
};

interface NavigationBarProps {
    user: User | null;
    player: Player | null;
}

// Logo 컴포넌트
const Logo = memo(function Logo() {
    return (
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
                fetchPriority="high"
            />
        </LinkButton>
    );
});

// DesktopMenu 컴포넌트
const DesktopMenu = memo(function DesktopMenu({
    menuItems,
    user,
    player,
    pathname,
    onShowUserNavigation,
    isActivePath,
}: {
    menuItems: MenuItem[];
    user: User | null;
    player: Player | null;
    pathname: string;
    onShowUserNavigation: () => void;
    isActivePath: (href: string) => boolean;
}) {
    return (
        <div className="hidden lg:flex items-center justify-end space-x-2 md:space-x-4 lg:space-x-9 xl:space-x-16">
            {menuItems.map(({ name, href }) => (
                <LinkButton
                    key={name}
                    href={href}
                    textSize={15}
                    paddingSize={0}
                    isActive={isActivePath(href)}
                    onClick={(e) => {
                        if (isActivePath(href)) {
                            e.preventDefault();
                        }
                    }}
                >
                    {name}
                </LinkButton>
            ))}

            {player ? (
                <RewardPanel playerId={player.id} assetNames={["SGP"]} />
            ) : (
                <AuthButton
                    frameSize={15}
                    textSize={15}
                    paddingSize={10}
                    gapSize={10}
                />
            )}
        </div>
    );
});

// MobileMenu 컴포넌트
const MobileMenu = memo(function MobileMenu({
    menuItems,
    player,
    pathname,
    onShowUserNavigation,
    isActivePath,
}: {
    menuItems: MenuItem[];
    player: Player | null;
    pathname: string;
    onShowUserNavigation: () => void;
    isActivePath: (href: string) => boolean;
}) {
    return (
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
                    <img
                        src="/logo/l-white.svg"
                        alt="Starglow"
                        fetchPriority="high"
                    />
                </LinkButton>
                {player ? (
                    <RewardPanel playerId={player.id} assetNames={["SGP"]} />
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
                {menuItems.map(({ name, href, icon }) => (
                    <VerticalButton
                        key={name}
                        img={icon}
                        label={name}
                        isActive={isActivePath(href)}
                        textSize={10}
                        paddingSize={0}
                        frameSize={20}
                        gapSize={5}
                        onClick={(e) => {
                            if (isActivePath(href)) {
                                e.preventDefault();
                            }
                        }}
                        href={href}
                        className={cn(
                            isActivePath(href)
                                ? "hover:bg-[rgba(0,0,0,0)]"
                                : "hover:bg-[rgba(0,0,0,0)] hover:opacity-100"
                        )}
                    />
                ))}
            </nav>
        </div>
    );
});

// 메인 NavigationBar 컴포넌트
function NavigationBar({ user, player }: NavigationBarProps) {
    const pathname = usePathname();
    const [showUserNavigation, setShowUserNavigation] =
        useState<boolean>(false);

    const menuItems = useMemo(() => {
        return user?.id ? [...defaultMenuItems, myPageItem] : defaultMenuItems;
    }, [user?.id]);

    // 이벤트 핸들러
    const handleShowUserNavigation = useCallback(() => {
        setShowUserNavigation(true);
    }, []);

    const handleCloseUserNavigation = useCallback(() => {
        setShowUserNavigation(false);
    }, []);

    const isActivePath = useCallback(
        (href: string) => pathname === href,
        [pathname]
    );

    return (
        <>
            <nav
                className="
                hidden lg:flex
                sticky top-0 z-20 backdrop-blur-xs
                w-full items-center justify-between bg-gradient-to-br from-[rgba(5,1,10,0.4)] to-[rgba(1,1,2,0.7)]
                py-3 px-5
                sm:py-4 sm:px-6
                md:py-6 md:px-8
                lg:py-8 lg:px-10
                xl:py-8 xl:px-12
            "
                aria-label="Main navigation"
            >
                <Logo />
                <DesktopMenu
                    menuItems={menuItems}
                    user={user}
                    player={player}
                    pathname={pathname}
                    onShowUserNavigation={handleShowUserNavigation}
                    isActivePath={isActivePath}
                />
            </nav>

            <MobileMenu
                menuItems={menuItems}
                player={player}
                pathname={pathname}
                onShowUserNavigation={handleShowUserNavigation}
                isActivePath={isActivePath}
            />
        </>
    );
}

export default memo(NavigationBar);
