/// templates/Quests.tsx

"use client";

import { useState } from "react";
import { Player } from "@prisma/client";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import PartialLoading from "@/components/atoms/PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import QuestsContents from "@/components/organisms/Quests.Contents";

interface QuestsProps {
    player: Player;
}

export default function Quests({ player }: QuestsProps) {
    const [contentType, setContentType] = useState<string>("Missions");
    const {
        player: playerData,
        isPlayerLoading,
        playerError,
    } = usePlayerGet({
        getPlayerInput: {
            playerId: player.id,
        },
    });

    return (
        <div className="relative flex flex-col w-full h-screen">
            <>
                <div className="absolute inset-0 bg-gradient-to-b from-[#09011b] to-[#311473] -z-20" />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                    <img
                        src="/elements/donut.svg"
                        alt="Donut"
                        style={{ width: "600px", height: "auto" }}
                        className={`
                            scale-150 rotate-90 md:scale-125 md:rotate-0 lg:scale-100 lg:rotate-0
                            transition-all duration-1000
                            loading-lazy
                        `}
                    />
                </div>

                <div className="fixed inset-0 -z-20">
                    <img
                        src="/elements/bg-quest-blur.svg"
                        alt="Logo"
                        className={`
                            w-full h-full object-cover 
                            scale-125 lg:scale-100 
                            bg-blend-overlay 
                            transition-all duration-1000
                            loading-lazy
                        `}
                    />
                </div>
            </>

            <h2
                className={cn(
                    "text-center text-4xl",
                    "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                    getResponsiveClass(45).textClass
                )}
            >
                Quest
            </h2>

            <div
                className={cn(
                    "flex justify-center items-center",
                    "mt-[30px] mb-[30px] lg:mt-[40px] lg:mb-[40px]"
                )}
            >
                {isPlayerLoading ? (
                    <PartialLoading text="Loading player data..." />
                ) : (
                    <QuestsContents />
                )}
            </div>
        </div>
    );
}
