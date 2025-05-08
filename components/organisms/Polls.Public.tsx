/// components/organisms/Polls.Public.tsx

"use client";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PartialLoading from "@/components/atoms/PartialLoading";
import PollsList from "./Polls.List";

interface PollsPublicProps {
    player: Player;
    className?: string;
}

export default function PollsPublic({ player, className }: PollsPublicProps) {
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            category: "PUBLIC",
        },
    });

    return (
        <div
            className={cn(
                "max-w-[1400px] w-screen",
                "px-[40px] sm:px-[40px] md:px-[40px] lg:px-[40px]",
                "mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]",
                className
            )}
        >
            <div className="relative">
                {isLoading ? (
                    <PartialLoading text="Loading..." size="sm" />
                ) : error ? (
                    <div>
                        Error:{" "}
                        {typeof error === "string" ? error : error.message}
                    </div>
                ) : pollsList?.items && pollsList.items.length > 0 ? (
                    <PollsList polls={pollsList.items} />
                ) : (
                    <div className="text-center text-2xl">No polls found</div>
                )}
            </div>
        </div>
    );
}
