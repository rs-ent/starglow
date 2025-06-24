/// components/quests/Quests.tsx

"use client";

import { memo } from "react";

import { useStoryInteractions } from "@/app/story/interaction/hooks";
import QuestsContents from "@/components/quests/Quests.Contents";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "../atoms/PartialLoading";

import type { Player } from "@prisma/client";
import type { User } from "next-auth";
import Image from "next/image";

interface QuestsProps {
    user: User | null;
    player: Player | null;
}

function Quests({ user, player }: QuestsProps) {
    const { verifiedSPGs, isLoadingVerifiedSPGs } = useStoryInteractions({
        getUserVerifiedSPGsInput: {
            userId: user?.id || "",
        },
    });

    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 -z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-[#09011b] to-[#311473]" />

                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <Image
                        src="/elements/donut.svg"
                        alt="Donut"
                        width={600}
                        height={600}
                        className="scale-150 rotate-90 md:scale-125 md:rotate-0 lg:scale-100 lg:rotate-0 transition-all duration-1000"
                        loading="lazy"
                        fetchPriority="low"
                    />
                </div>

                <Image
                    src="/elements/bg-quest-blur.svg"
                    alt="Background"
                    width={1920}
                    height={1080}
                    className="opacity-90 w-full h-full object-cover scale-125 lg:scale-100 bg-blend-overlay transition-all duration-1000"
                    loading="eager"
                    fetchPriority="high"
                />
            </div>

            <div className="relative z-10">
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
                    {isLoadingVerifiedSPGs ? (
                        <PartialLoading text="Loading..." />
                    ) : (
                        <QuestsContents
                            player={player}
                            verifiedSPGs={verifiedSPGs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(Quests);
