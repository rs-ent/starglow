/// components/quests/Quests.tsx

"use client";

import { memo } from "react";

import QuestsContents from "@/components/quests/Quests.Contents";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { Player } from "@prisma/client";
import Image from "next/image";

interface QuestsProps {
    player: Player | null;
}

function Quests({ player }: QuestsProps) {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 -z-20">
                {/* Base gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#09011b] to-[#311473]" />

                {/* CSS-based blur background effects */}
                <div className="absolute inset-0 opacity-60">
                    {/* Multiple radial gradients to create blur-like effect */}
                    <div
                        className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent blur-xl animate-pulse-slow"
                        style={{
                            background: `
                                 radial-gradient(circle at 20% 30%, rgba(197, 149, 245, 0.61) 0%, transparent 60%),
                                 radial-gradient(circle at 80% 70%, rgba(143, 140, 226, 0.5) 0%, transparent 50%),
                                 radial-gradient(circle at 60% 20%, rgba(193, 92, 243, 0.55) 0%, transparent 40%),
                                 radial-gradient(circle at 40% 80%, rgba(186, 199, 246, 0.55) 0%, transparent 45%)
                             `,
                        }}
                    />

                    {/* Animated floating orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-slow" />
                    <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-400/15 rounded-full blur-2xl animate-float-slow-reverse" />
                    <div className="absolute top-1/2 left-3/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float-medium" />

                    {/* Overlay blur effect */}
                    <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
                </div>

                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <Image
                        src="/elements/donut.svg"
                        alt="Donut"
                        width={600}
                        height={600}
                        className="scale-150 rotate-90 md:scale-125 md:rotate-0 lg:scale-100 lg:rotate-0 transition-all duration-1000"
                        priority={false}
                        unoptimized={false}
                    />
                </div>
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
                    <QuestsContents player={player} />
                </div>
            </div>
        </div>
    );
}

export default memo(Quests);
