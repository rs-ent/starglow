/// components/polls/Polls.tsx

"use client";

import { memo } from "react";
import PollsContents from "@/components/polls/Polls.Contents";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { Player } from "@prisma/client";

interface PollsProps {
    player: Player | null;
}

function Polls({ player }: PollsProps) {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />

            {/* CSS-based blur background effects */}
            <div className="absolute inset-0 opacity-60">
                {/* Multiple radial gradients to create blur-like effect */}
                <div
                    className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent blur-xl animate-pulse-slow"
                    style={{
                        background: `
                                 radial-gradient(circle at 20% 30%, rgba(97, 94, 134, 0.4) 0%, transparent 60%),
                                 radial-gradient(circle at 80% 70%, rgba(177, 112, 171, 0.4) 0%, transparent 50%),
                                 radial-gradient(circle at 60% 20%, rgba(236, 72, 173, 0.3) 0%, transparent 40%),
                                 radial-gradient(circle at 40% 80%, rgba(28, 17, 70, 0.4) 0%, transparent 45%)
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

            <div className="w-full">
                <h2
                    className={cn(
                        "text-center text-4xl font-bold",
                        "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                        getResponsiveClass(45).textClass
                    )}
                >
                    Polls
                </h2>

                <div
                    className={cn(
                        "flex justify-center items-center",
                        "mt-[30px] mb-[30px] lg:mt-[40px] lg:mb-[40px]"
                    )}
                >
                    <PollsContents player={player} />
                </div>
            </div>
        </div>
    );
}

export default memo(Polls);
