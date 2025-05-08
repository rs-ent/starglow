/// components/organisms/Quests.ArtistMissions.tsx

"use client";

import { useEffect, useState } from "react";
import { useQuestGet } from "@/app/hooks/useQuest";
import { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";
import Image from "next/image";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import QuestsMissions from "../molecules/Quests.Missions";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import InviteFriends from "../atoms/InviteFriends";
import { motion, AnimatePresence } from "framer-motion";

interface QuestsArtistMissionsProps {
    artist: Artist;
    player: Player;
    tokenGatingResult?: AdvancedTokenGateResult | null;
    referralLogs: ReferralLog[];
}

export default function QuestsArtistMissions({
    artist,
    player,
    tokenGatingResult,
    referralLogs,
}: QuestsArtistMissionsProps) {
    const { quests, questLogs, isLoading, error } = useQuestGet({
        getQuestsInput: {
            artistId: artist.id,
        },
        getQuestLogsInput: {
            artistId: artist.id,
            playerId: player.id,
        },
    });

    const [permission, setPermission] = useState(false);
    const [claimedQuestLogs, setClaimedQuestLogs] = useState<QuestLog[]>([]);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (
            tokenGatingResult &&
            tokenGatingResult.success &&
            tokenGatingResult.data &&
            tokenGatingResult.data.hasToken
        ) {
            const hasAnyToken = Object.values(
                tokenGatingResult.data.hasToken
            ).some(Boolean);
            setPermission(hasAnyToken);
        } else {
            setPermission(false);
        }
    }, [tokenGatingResult]);

    useEffect(() => {
        setClaimedQuestLogs(
            questLogs?.items.filter((questLog) => questLog.isClaimed) || []
        );
    }, [questLogs]);

    useEffect(() => {
        console.log("quests", quests);
        console.log("questLogs", questLogs);
        console.log("tokenGatingResult", tokenGatingResult);
        console.log("isLoading", isLoading);

        if (quests && questLogs && tokenGatingResult && !isLoading) {
            if (quests.items.length === 0) {
                setIsReady(false);
            } else {
                setIsReady(true);
            }
        }
    }, [quests, questLogs, tokenGatingResult, isLoading]);

    return (
        <AnimatePresence>
            {isReady && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative"
                >
                    <div
                        className={cn(
                            "duration-1000 transition-all",
                            "w-full rounded-3xl",
                            "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                            "bg-gradient-to-b from-[rgba(18,6,53,0.85)] to-[rgba(55,34,160,0.7)]"
                        )}
                    >
                        <div className="w-full flex justify-between items-end">
                            <div
                                className={cn("shadow-lg rounded-full mb-2")}
                                style={{
                                    boxShadow: `
                    0 0 16px 3px rgba(255,255,255,0.15) inset
                `,
                                    background: "transparent",
                                    display: "inline-block",
                                    position: "relative",
                                }}
                            >
                                <div
                                    className={cn(
                                        "flex flex-row gap-2 items-center justify-center",
                                        "px-5 py-3"
                                    )}
                                >
                                    {artist.logoUrl && (
                                        <Image
                                            src={artist.logoUrl}
                                            alt={artist.name}
                                            width={100}
                                            height={100}
                                            className={cn(
                                                getResponsiveClass(30)
                                                    .frameClass,
                                                "aspect-square"
                                            )}
                                            style={{ objectFit: "contain" }}
                                        />
                                    )}
                                    <h2
                                        className={cn(
                                            getResponsiveClass(25).textClass
                                        )}
                                    >
                                        {artist.name}
                                    </h2>
                                </div>
                            </div>
                            {quests && questLogs && (
                                <div className="flex gap-0">
                                    <h2 className="text-center text-base">
                                        {claimedQuestLogs.length}
                                    </h2>
                                    <h2 className="text-center text-base opacity-70">
                                        /{quests.items.length}
                                    </h2>
                                </div>
                            )}
                        </div>

                        {quests && questLogs && tokenGatingResult && (
                            <div
                                className={cn(
                                    "mb-[70px] md:mb-[80px] lg:mb-[90px]"
                                )}
                            >
                                <QuestsMissions
                                    player={player}
                                    quests={quests.items}
                                    questLogs={questLogs.items}
                                    isLoading={isLoading}
                                    error={error}
                                    permission={permission}
                                    tokenGatingResult={tokenGatingResult}
                                    referralLogs={referralLogs || []}
                                />
                            </div>
                        )}

                        <div className="mb-[100px] lg:mb-[0px]">
                            <InviteFriends player={player} />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
