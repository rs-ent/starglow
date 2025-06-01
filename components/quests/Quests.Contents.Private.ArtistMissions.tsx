/// components/quests/Quests.Contents.Private.ArtistMissions.tsx

"use client";

import {memo, useEffect, useMemo, useState} from "react";
import {useQuestGet} from "@/app/hooks/useQuest";
import {Artist, Player, QuestLog, ReferralLog} from "@prisma/client";
import Image from "next/image";
import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";
import QuestsMissions from "./Quests.Missions";
import {AdvancedTokenGateResult} from "@/app/actions/blockchain";
import InviteFriends from "../atoms/InviteFriends";
import {AnimatePresence, motion} from "framer-motion";

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

function QuestsArtistMissions({
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

    // 배경 스타일 메모이제이션
    const backgroundStyle = useMemo(() => ({
        background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
    }), [bgColorFrom, bgColorTo]);

    // 토큰 게이팅 권한 체크
    useEffect(() => {
        if (
            tokenGatingResult?.success &&
            tokenGatingResult?.data?.hasToken
        ) {
            const hasAnyToken = Object.values(
                tokenGatingResult.data.hasToken
            ).some(Boolean);
            setPermission(hasAnyToken);
        } else {
            setPermission(false);
        }
    }, [tokenGatingResult]);

    // 클레임된 퀘스트 로그 및 준비 상태 메모이제이션
    const { claimedQuestLogs, isReady } = useMemo(() => {
        const logs = questLogs?.filter(
            (questLog) =>
                questLog.isClaimed &&
                quests?.items.find((quest) => quest.id === questLog.questId)
        ) || [];

        const ready =
            (quests && quests.items?.length > 0) &&
            tokenGatingResult !== undefined && 
            !isLoading;

        return {
            claimedQuestLogs: logs,
            isReady: ready,
        };
    }, [questLogs, quests, tokenGatingResult, isLoading]);

    // 애니메이션 변수
    const containerVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.6, 
                ease: "easeOut" 
            }
        },
        exit: { 
            opacity: 0, 
            y: -100,
            transition: { 
                duration: 0.4, 
                ease: "easeIn" 
            }
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isReady && (
                <motion.div
                    key={artist.id}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative"
                >
                    <div
                        className={cn(
                            "duration-1000 transition-all",
                            "w-full rounded-3xl",
                            "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                        )}
                        style={backgroundStyle}
                    >
                        <div className="w-full flex justify-between items-end">
                            <div
                                className={cn("shadow-lg rounded-full mb-2")}
                                style={{
                                    boxShadow: `0 0 16px 3px rgba(255,255,255,0.15) inset`,
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
                                                getResponsiveClass(30).frameClass,
                                                "aspect-square"
                                            )}
                                            style={{ objectFit: "contain" }}
                                            priority={true}
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
                            {quests?.items && questLogs && (
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

                        {quests?.items && questLogs && tokenGatingResult && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
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
                            </motion.div>
                        )}
                        
                        {showInviteFriends && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="mt-[70px] md:mt-[80px] lg:mt-[90px] mb-[100px] lg:mb-[0px]"
                            >
                                <InviteFriends
                                    player={player}
                                    bgColorFrom={bgColorFromInviteFriends}
                                    bgColorTo={bgColorToInviteFriends}
                                />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default memo(QuestsArtistMissions);
