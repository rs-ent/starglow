/// components\organisms\NavBar.tsx
"use client";

import LinkButton from "../atoms/LinkButton";
import AuthButton from "../atoms/AuthButton";
import { useSession } from "next-auth/react";
import VerticalButton from "../atoms/VerticalButton";
import { useState, useEffect } from "react";
import RewardPanel from "../molecules/RewardPanel";
import { usePlayerSet } from "@/app/hooks/usePlayer";
import { cn } from "@/lib/utils/tailwind";

const defaultMenuItems = [
    { name: "Quests", href: "/quests", icon: "/ui/ribbon-badge.svg" },
    { name: "Polls", href: "/polls", icon: "/ui/vote.svg" },
    { name: "NFTs", href: "/nfts", icon: "/ui/assets.svg" },
];

const myPage = (userId: string) => [
    {
        name: "My Page",
        href: `/user/${userId}`,
        icon: "/ui/integration.svg",
    },
];

export default function NavBar() {
    const { data: session } = useSession();
    const [active, setActive] = useState<string>("");
    const [menu, setMenu] = useState(defaultMenuItems);
    const [playerId, setPlayerId] = useState<string | null>(null);

    const user = session?.user;
    const { setPlayer, isSetPlayerPending } = usePlayerSet({});

    useEffect(() => {
        async function ensurePlayer() {
            if (session?.user) {
                if (!menu.find((item) => item.name === "My Page")) {
                    setMenu([...menu, ...myPage(session.user.id)]);
                }

                const player = await setPlayer({
                    user: session.user,
                });
                setPlayerId(player?.id ?? null);
            } else {
                setPlayerId(null);
            }
        }
        ensurePlayer();
    }, [session, setPlayer]);

    const handleActiveChange = (name: string) => {
        setActive(name);
    };

    return (
        <>
            <nav
                className="
                hidden lg:flex
                sticky top-0 z-10 backdrop-blur-xs
                w-full items-center justify-between bg-gradient-to-br from-[rgba(5,1,10,0.3)] to-[rgba(1,1,2,0.7)]
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
                        showUserCard={false}
                    />
                    {playerId && (
                        <RewardPanel playerId={playerId} assetNames={["SGP"]} />
                    )}
                </div>

                {/* Mobile Hamburger Icon
            <Hamburger
                isOpen={isOpen}
                toggle={toggle}
                className="lg:hidden z-50"
            />*/}
                {/* Mobile Menu
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-0 left-0 w-full h-screen bg-[rgba(0,0,0,0.85)] backdrop-blur-sm flex flex-col items-center justify-center space-y-12 z-40"
                    >
                        <AuthButton
                            frameSize={50}
                            paddingSize={70}
                            gapSize={50}
                            textSize={35}
                            className="font-main"
                        />
                        {menuItems.map(({ name, href }) => (
                            <LinkButton
                                key={name}
                                href={href}
                                onClick={close}
                                textSize={35}
                                paddingSize={0}
                                className="font-main"
                            >
                                {name}
                            </LinkButton>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>*/}
            </nav>

            {/* Mobile Menu */}
            <div className="lg:hidden">
                <div
                    className={cn(
                        "fixed top-0 left-0 right-0 inset-x-0 z-40",
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
                    {playerId && (
                        <RewardPanel playerId={playerId} assetNames={["SGP"]} />
                    )}
                </div>
                <nav
                    className="
                    fixed bottom-0 left-0 right-0 inset-x-0 z-40
                    bg-background/30 backdrop-blur-sm border-t border-muted
                    px-[5px] py-[7px]
                    sm:px-[30px] sm:py-[9px]
                    md:px-[60px] md:py-[10px]
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
                            onClick={() => handleActiveChange(name)}
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
