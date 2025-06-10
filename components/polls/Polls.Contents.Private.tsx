/// components/polls/Polls.Contents.Private.tsx

"use client";

import { Artist, Player, PollLog } from "@prisma/client";
import ArtistSlideSelector from "../artists/ArtistSlideSelector";
import PollsContentsPrivateArtistList from "./Polls.Contents.Private.ArtistList";
import { memo, useCallback, useMemo, useState } from "react";
import { User } from "next-auth";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { AnimatePresence, motion } from "framer-motion";
import { VerifiedSPG } from "@/app/story/interaction/actions";
import { TokenGatingResult } from "@/app/story/nft/actions";

interface PollsContentsPrivateProps {
    user: User | null;
    player: Player | null;
    privateTabClicked: boolean;
    pollLogs?: PollLog[];
    verifiedSPGs?: VerifiedSPG[];
}

// 애니메이션 변수를 컴포넌트 외부로 이동하여 리렌더링 방지
const animations = {
    contentVariants: {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 },
        },
    },
    selectorVariants: {
        hidden: { opacity: 0, y: -10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 },
        },
    },
    backgroundVariants: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 1.5 },
        },
        exit: {
            opacity: 0,
            transition: { duration: 1.5 },
        },
    },
};

// 기본 배경 스타일을 컴포넌트 외부로 이동
const defaultBackgroundStyle = {
    background: `linear-gradient(to bottom right, rgba(109,40,217,0.4), rgba(109,40,217,0.15))`,
};

function PollsContentsPrivate({
    user,
    player,
    pollLogs,
    verifiedSPGs,
}: PollsContentsPrivateProps) {
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [previousArtist, setPreviousArtist] = useState<Artist | null>(null);
    const [activeBackground, setActiveBackground] = useState<
        "default" | "artist"
    >("default");

    // 아티스트 선택 핸들러 메모이제이션
    const handleArtistSelect = useCallback(
        (artist: Artist | null) => {
            // 이전 아티스트 저장
            setPreviousArtist(selectedArtist);
            setSelectedArtist(artist);

            // 배경 상태 업데이트
            setActiveBackground(artist ? "artist" : "default");
        },
        [selectedArtist]
    );

    const tokenGatingResult: TokenGatingResult = useMemo(() => {
        const result: TokenGatingResult = {
            success: true,
            data: {},
        };

        if (!verifiedSPGs) return result;

        verifiedSPGs.forEach((spg) => {
            result.data[spg.address] = {
                hasToken: true,
                detail: spg.verifiedTokens.map((token) => ({
                    tokenId: token.toString(),
                    owner: spg.ownerAddress,
                })),
            };
        });

        return result;
    }, [verifiedSPGs]);

    // 선택된 아티스트 배경 스타일 메모이제이션
    const selectedBackgroundStyle = useMemo(() => {
        if (!selectedArtist) return defaultBackgroundStyle;

        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(
                selectedArtist,
                0,
                100
            )}, ${ArtistBG(selectedArtist, 1, 100)})`,
        };
    }, [selectedArtist]);

    // 이전 아티스트 배경 스타일 메모이제이션
    const previousBackgroundStyle = useMemo(() => {
        if (!previousArtist) return defaultBackgroundStyle;

        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(
                previousArtist,
                0,
                100
            )}, ${ArtistBG(previousArtist, 1, 100)})`,
        };
    }, [previousArtist]);

    // 아티스트 컨텐츠 렌더링 최적화
    const renderArtistContent = useCallback(() => {
        if (!selectedArtist) return null;

        return (
            <motion.div
                className="relative w-full h-full"
                key={selectedArtist.id}
                variants={animations.contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <div className="w-screen max-w-[1400px] mx-auto z-0 relative">
                    <PollsContentsPrivateArtistList
                        artist={selectedArtist}
                        player={player}
                        tokenGating={tokenGatingResult || null}
                        pollLogs={pollLogs}
                        bgColorFrom={ArtistBG(selectedArtist, 0, 60)}
                        bgColorTo={ArtistBG(selectedArtist, 1, 30)}
                        bgColorAccentFrom={ArtistBG(selectedArtist, 2, 100)}
                        bgColorAccentTo={ArtistBG(selectedArtist, 3, 100)}
                        fgColorFrom={ArtistBG(selectedArtist, 2, 10)}
                        fgColorTo={ArtistBG(selectedArtist, 1, 100)}
                    />
                </div>
            </motion.div>
        );
    }, [selectedArtist, player, tokenGatingResult, pollLogs]);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <motion.div
                className="w-full flex items-center justify-center"
                variants={animations.selectorVariants}
                initial="hidden"
                animate="visible"
            >
                <ArtistSlideSelector
                    className="mt-[5px] sm:mt-[10px] md:mt-[15px] lg:mt-[20px] xl:mt-[25px]"
                    onSelect={handleArtistSelect}
                    selectedArtist={selectedArtist}
                    verifiedSPGs={verifiedSPGs}
                />
            </motion.div>

            {/* 배경 그라데이션 - AnimatePresence로 부드러운 전환 구현 */}
            <div className="fixed inset-0 w-screen h-screen -z-20">
                {/* 기본 배경 */}
                <AnimatePresence initial={false}>
                    {activeBackground === "default" && (
                        <motion.div
                            key="default-background"
                            className="absolute inset-0 w-full h-full"
                            style={defaultBackgroundStyle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>

                {/* 아티스트 배경 */}
                <AnimatePresence initial={false}>
                    {activeBackground === "artist" && selectedArtist && (
                        <motion.div
                            key={`artist-background-${selectedArtist.id}`}
                            className="absolute inset-0 w-full h-full"
                            style={selectedBackgroundStyle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>

                {/* 이전 아티스트 배경 (전환 중에만 표시) */}
                <AnimatePresence initial={false}>
                    {previousArtist && selectedArtist !== previousArtist && (
                        <motion.div
                            key={`previous-artist-background-${previousArtist.id}`}
                            className="absolute inset-0 w-full h-full"
                            style={previousBackgroundStyle}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 아티스트 콘텐츠 - AnimatePresence로 애니메이션 최적화 */}
            <AnimatePresence mode="wait">
                {renderArtistContent()}
            </AnimatePresence>
        </div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsContentsPrivate);
