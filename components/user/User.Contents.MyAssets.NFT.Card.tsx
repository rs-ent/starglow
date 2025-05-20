/// components/user/UserContents.MyAssets.NFT.Card.tsx

"use client";

import { useBlockchainGet } from "@/app/hooks/useBlockchainV2";
import { useSession } from "next-auth/react";
import {
    CollectionContract,
    Player,
    Quest,
    QuestLog,
    Poll,
    PollLog,
} from "@prisma/client";
import PartialLoading from "@/components/atoms/PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useMemo } from "react";
import { useMetadata } from "@/app/hooks/useMetadata";
import { METADATA_TYPE } from "@/app/actions/metadata";
import ImageMetadata from "@/components/atoms/ImageMetadata";
import { formatHexToRGBA } from "@/lib/utils/format";
import { TokenGateResult } from "@/app/actions/blockchain";
import { useQuestGet } from "@/app/hooks/useQuest";
import { usePollsGet } from "@/app/hooks/usePolls";
import { Collection } from "@/app/actions/factoryContracts";

interface UserContentsMyAssetsNFTCardProps {
    player: Player | null;
    collection: Collection;
    onSelect: (
        collection: Collection,
        tokenGateResult: TokenGateResult
    ) => void;
}

export default function UserContentsMyAssetsNFTCard({
    player,
    collection,
    onSelect,
}: UserContentsMyAssetsNFTCardProps) {
    const { data: session } = useSession();

    const { quests, questLogs } = useQuestGet({
        getQuestsInput: {
            artistId: collection.artistId ?? undefined,
            isActive: true,
        },
        getQuestLogsInput: {
            playerId: player?.id ?? undefined,
        },
    });

    const { pollsList, playerPollLogs } = usePollsGet({
        getPollsInput: {
            artistId: collection.artistId ?? undefined,
            isActive: true,
        },
        getPlayerPollLogsInput: {
            playerId: player?.id ?? undefined,
        },
    });

    const isWithinDateRange = (
        startDate: Date | null,
        endDate: Date | null,
        now: Date
    ) => {
        if (!startDate && !endDate) return true;
        if (!endDate || !startDate) return false;
        return endDate > now && startDate < now;
    };

    const hasNewActivities = useMemo(() => {
        const now = new Date();

        const newQuest = quests?.items?.filter((quest: Quest) => {
            const isNotCompleted = !questLogs?.items?.some(
                (log: QuestLog) => log.questId === quest.id
            );
            const isActive = quest.isActive;
            const isAvailable =
                quest.permanent ||
                isWithinDateRange(quest.startDate, quest.endDate, now);

            return isNotCompleted && isActive && isAvailable;
        });

        const newPoll = pollsList?.items?.filter((poll: Poll) => {
            const isNotVoted = !playerPollLogs?.some(
                (log: PollLog) => log.pollId === poll.id
            );
            const isActive = poll.isActive;
            const isAvailable = isWithinDateRange(
                poll.startDate,
                poll.endDate,
                now
            );

            return isNotVoted && isActive && isAvailable;
        });

        return (newQuest?.length ?? 0) > 0 || (newPoll?.length ?? 0) > 0;
    }, [quests, pollsList, questLogs, playerPollLogs]);

    const { metadata, glowStart, glowEnd, bg1, bg2, bg3 } = useMemo(() => {
        const metadata = collection.metadata?.metadata as METADATA_TYPE | null;

        const start =
            Number(
                metadata?.attributes?.find(
                    (attr) => attr.trait_type === "Glow Start"
                )?.value || new Date().getTime() / 1000
            ) * 1000;

        const end =
            Number(
                metadata?.attributes?.find(
                    (attr) => attr.trait_type === "Glow End"
                )?.value || new Date().getTime() / 1000
            ) * 1000;

        const bg = metadata?.background_color?.replace("#", "") || "000000";
        const bg1 = formatHexToRGBA(bg, 0.5);
        const bg2 = formatHexToRGBA(bg, 0.3);
        const bg3 = formatHexToRGBA(bg, 0.7);

        return {
            metadata,
            glowStart: start,
            glowEnd: end,
            bg1,
            bg2,
            bg3,
        };
    }, [collection.metadata]);

    const { tokenGateData, isTokenGateLoading, tokenGateError } =
        useBlockchainGet({
            tokenGateInput: {
                userId: session?.user?.id ?? "",
                tokenType: "Collection",
                tokenAddress: collection.address ?? "",
            },
        });

    const handleSelect = () => {
        if (collection && tokenGateData) {
            onSelect(collection, tokenGateData);
        }
    };

    return (
        <div
            className={cn(
                "max-w-[400px] min-w-[100px] w-full",
                "flex flex-col items-center justify-center",
                "rounded-[14px] overflow-hidden",
                "bg-gradient-to-br",
                "gradient-border",
                "white-glow-smooth",
                "cursor-pointer",
                "transition-all duration-500 animate-in fade-in-0",
                isTokenGateLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
                background: `linear-gradient(to bottom right, ${bg1}, ${bg2}, ${bg3})`,
            }}
            onClick={() => handleSelect()}
        >
            {isTokenGateLoading ? (
                <PartialLoading text="Loading..." size="sm" />
            ) : tokenGateError ? (
                <div className="text-center text-red-500">Error Occured</div>
            ) : (
                tokenGateData &&
                tokenGateData.data?.hasToken && (
                    <div
                        className={cn(
                            "w-full h-full",
                            "p-[10px] sm:p-[11px] md:p-[13px] lg:p-[16px]"
                        )}
                    >
                        {metadata && (
                            <ImageMetadata
                                metadata={metadata}
                                className="mb-2"
                            />
                        )}
                        <div className="flex flex-col gap-[2px] items-start">
                            <div className="w-full flex flex-row items-start">
                                <h2
                                    className={cn(
                                        "truncate",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {metadata?.name}
                                </h2>
                                {hasNewActivities && (
                                    <div
                                        className={cn(
                                            "relative flex-shrink-0",
                                            "w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] md:w-[6px] md:h-[6px]",
                                            "ml-1 mt-1"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute w-full h-full",
                                                "rounded-full",
                                                "animate-ping",
                                                "bg-red-500"
                                            )}
                                        />
                                        <div
                                            className={cn(
                                                "w-full h-full",
                                                "rounded-full",
                                                "bg-red-500"
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                            <p
                                className={cn(
                                    "text-[rgba(255,255,255,0.5)]",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {formatDate(glowStart)} ~ {formatDate(glowEnd)}
                            </p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function formatDate(date: number) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}/${month}/${day}`;
}
