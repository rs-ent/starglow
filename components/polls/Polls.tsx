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
