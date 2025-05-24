/// components/organisms/Quests.ArtistMissions.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
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
    player: Player | null;
    questLogs: QuestLog[];
    tokenGatingResult?: AdvancedTokenGateResult | null;
    referralLogs: ReferralLog[];
    bgColorFrom?: string;
    bgColorTo?: string;
    showInviteFriends?: boolean;
    bgColorFromInviteFriends?: string;
    bgColorToInviteFriends?: string;
}

export default function QuestsArtistMissions({
    artist,
    player,
    questLogs,
    tokenGatingResult,
    referralLogs,
    bgColorFrom = "rgba(18,6,53,0.85)",
    bgColorTo = "rgba(55,34,160,0.7)",
    showInviteFriends = true,
    bgColorFromInviteFriends = "#A5D7FB",
    bgColorToInviteFriends = "#8E76FA",
}: QuestsArtistMissionsProps) {
    const { quests, isLoading, error } = useQuestGet({
        getQuestsInput: {
            artistId: artist.id,
            isActive: true,
        },
    });

    const [permission, setPermission] = useState(false);

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

    const { claimedQuestLogs, isReady } = useMemo(() => {
        const logs = questLogs?.filter(
            (questLog) =>
                questLog.isClaimed &&
                quests?.items.find((quest) => quest.id === questLog.questId)
        );

        const isReady =
            (quests?.items || []).length > 0 && tokenGatingResult && !isLoading;

        return {
            claimedQuestLogs: logs,
            isReady: isReady,
        };
    }, [questLogs, quests, tokenGatingResult, isLoading]);

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
                            "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                        )}
                        style={{
                            background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
                        }}
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
                            <div>
                                <QuestsMissions
                                    player={player}
                                    quests={quests.items}
                                    questLogs={questLogs}
                                    isLoading={isLoading}
                                    error={error}
                                    permission={permission}
                                    tokenGatingResult={tokenGatingResult}
                                    referralLogs={referralLogs || []}
                                />
                            </div>
                        )}
                        {showInviteFriends && (
                            <div
                                className="
                            mt-[70px] md:mt-[80px] lg:mt-[90px]
                            mb-[100px] lg:mb-[0px]"
                            >
                                <InviteFriends
                                    player={player}
                                    bgColorFrom={bgColorFromInviteFriends}
                                    bgColorTo={bgColorToInviteFriends}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
