/// components/quests/Quests.Contents.Private.ArtistMissions.tsx

"use client";

import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useQuestGet } from "@/app/hooks/useQuest";
import { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";
import Image from "next/image";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";
import { AnimatePresence, motion } from "framer-motion";
import { TokenGatingData, TokenGatingResult } from "@/app/story/nft/actions";

interface QuestsArtistMissionsProps {
    artist: Artist;
    player: Player | null;
    questLogs: QuestLog[];
    tokenGating?: TokenGatingResult | null;
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
    tokenGating,
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

    // 배경 스타일 메모이제이션
    const backgroundStyle = useMemo(
        () => ({
            background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
        }),
        [bgColorFrom, bgColorTo]
    );

    // getResponsiveClass 최적화
    const responsiveClass30 = useMemo(() => getResponsiveClass(30), []);
    const responsiveClass25 = useMemo(() => getResponsiveClass(25), []);

    const permission = useMemo(() => {
        if (!tokenGating) return false;
        return Object.values(tokenGating.data).some(
            (data: TokenGatingData) => data.hasToken
        );
    }, [tokenGating]);

    // 클레임된 퀘스트 로그 및 준비 상태 메모이제이션
    const { claimedQuestLogs, isReady } = useMemo(() => {
        const logs =
            questLogs?.filter(
                (questLog) =>
                    questLog.isClaimed &&
                    quests?.items.find((quest) => quest.id === questLog.questId)
            ) || [];

        const ready =
            quests &&
            quests.items?.length > 0 &&
            tokenGating !== undefined &&
            !isLoading;

        return {
            claimedQuestLogs: logs,
            isReady: ready,
        };
    }, [questLogs, quests, tokenGating, isLoading]);

    // 애니메이션 변수
    const containerVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
            },
        },
        exit: {
            opacity: 0,
            y: -100,
            transition: {
                duration: 0.4,
                ease: "easeIn",
            },
        },
    };

    // 상태별 렌더 함수 분리
    const renderLoading = useCallback(
        () => (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full py-8 flex justify-center"
            >
                <div className="text-white/80 text-lg">Loading quests...</div>
            </motion.div>
        ),
        []
    );

    const renderError = useCallback(
        () => (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-red-400 py-6"
            >
                Error: {error?.message || "Failed to load quests"}
            </motion.div>
        ),
        [error]
    );

    const renderNoQuests = useCallback(
        () => (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-2xl py-10 text-white/80"
            >
                No quests found for this artist
            </motion.div>
        ),
        []
    );

    const renderQuestsList = useCallback(
        () => (
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
                                            responsiveClass30.frameClass,
                                            "aspect-square"
                                        )}
                                        style={{ objectFit: "contain" }}
                                        priority={true}
                                    />
                                )}
                                <h2 className={cn(responsiveClass25.textClass)}>
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

                    {quests?.items && questLogs && tokenGating && (
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
                                tokenGating={tokenGating}
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
        ),
        [
            artist.id,
            backgroundStyle,
            claimedQuestLogs.length,
            quests?.items,
            questLogs,
            tokenGating,
            isLoading,
            error,
            permission,
            referralLogs,
            showInviteFriends,
            bgColorFromInviteFriends,
            bgColorToInviteFriends,
            responsiveClass30.frameClass,
            responsiveClass25.textClass,
        ]
    );

    // 메인 컨텐츠 렌더 함수
    const renderContent = useCallback(() => {
        if (isLoading) {
            return renderLoading();
        }
        if (error) {
            return renderError();
        }
        if (!quests?.items || quests.items.length === 0) {
            return renderNoQuests();
        }
        return renderQuestsList();
    }, [
        isReady,
        isLoading,
        error,
        quests?.items,
        renderLoading,
        renderError,
        renderNoQuests,
        renderQuestsList,
    ]);

    return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
}

export default memo(QuestsArtistMissions);
