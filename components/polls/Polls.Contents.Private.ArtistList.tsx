/// components/polls/Polls.Contents.Private.ArtistList.tsx

"use client";

import { TokenGatingResult } from "@/app/story/nft/actions";
import { usePollsGet } from "@/app/hooks/usePolls";
import { Artist, Player, PollLog } from "@prisma/client";
import PollsList from "./Polls.List";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface PollsContentsPrivateArtistListProps {
    artist: Artist;
    player: Player | null;
    pollLogs?: PollLog[];
    tokenGating?: TokenGatingResult | null;
    className?: string;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
    forceSlidesToShow?: number;
}

function PollsContentsPrivateArtistList({
    artist,
    player,
    pollLogs,
    tokenGating,
    className,
    fgColorFrom,
    fgColorTo,
    bgColorFrom,
    bgColorTo,
    bgColorAccentFrom,
    bgColorAccentTo,
    forceSlidesToShow,
}: PollsContentsPrivateArtistListProps) {
    const [isReady, setIsReady] = useState(false);
    const [hasPolls, setHasPolls] = useState(false);

    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            artistId: artist.id,
            isActive: true,
        },
    });

    // 필터링된 폴 로그 메모이제이션
    const filteredPollLogs = useMemo(() => {
        if (!pollLogs || !pollsList?.items) return [];

        return pollLogs.filter((log) =>
            pollsList.items.some((poll) => poll.id === log.pollId)
        );
    }, [pollLogs, pollsList?.items]);

    // 컨텐츠 준비 상태 업데이트
    useEffect(() => {
        if (!isLoading) {
            if (pollsList?.items && pollsList.items.length > 0) {
                setHasPolls(true);
                // 토큰 게이팅 결과가 있으면 바로 준비 완료
                if (tokenGating) {
                    setIsReady(true);
                }
            } else {
                setHasPolls(false);
                setIsReady(true); // 폴이 없어도 준비 완료로 설정하여 "No polls found" 메시지 표시
            }
        }
    }, [pollsList, tokenGating, isLoading]);

    // 토큰 게이팅 결과가 변경될 때 준비 상태 업데이트
    useEffect(() => {
        if (tokenGating && hasPolls) {
            setIsReady(true);
        }
    }, [tokenGating, hasPolls]);

    // 애니메이션 변수
    const animations = useMemo(
        () => ({
            container: {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { duration: 0.4 },
                },
                exit: {
                    opacity: 0,
                    transition: { duration: 0.3 },
                },
            },
            content: {
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5 },
                },
            },
        }),
        []
    );

    // 로딩 상태 렌더링 최적화
    const renderLoading = useCallback(
        () => (
            <motion.div
                variants={animations.content}
                initial="hidden"
                animate="visible"
                className="w-full py-8 flex justify-center"
            >
                <PartialLoading text="Loading polls..." size="sm" />
            </motion.div>
        ),
        [animations.content]
    );

    // 에러 상태 렌더링 최적화
    const renderError = useCallback(
        () => (
            <motion.div
                variants={animations.content}
                initial="hidden"
                animate="visible"
                className="text-center text-red-400 py-6"
            >
                Error: error?.message || "Failed to load polls"
            </motion.div>
        ),
        [animations.content, error]
    );

    // 폴 없음 상태 렌더링 최적화
    const renderNoPolls = useCallback(
        () => (
            <motion.div
                variants={animations.content}
                initial="hidden"
                animate="visible"
                className="text-center text-2xl py-10 text-white/80"
            >
                No polls found for this artist
            </motion.div>
        ),
        [animations.content]
    );

    // 폴 목록 렌더링 최적화
    const renderPollsList = useCallback(() => {
        if (!pollsList?.items || !isReady) return null;

        return (
            <motion.div
                variants={animations.content}
                initial="hidden"
                animate="visible"
            >
                <PollsList
                    polls={pollsList.items}
                    artist={artist}
                    player={player}
                    tokenGating={tokenGating}
                    pollLogs={filteredPollLogs}
                    fgColorFrom={fgColorFrom}
                    fgColorTo={fgColorTo}
                    bgColorFrom={bgColorFrom}
                    bgColorTo={bgColorTo}
                    bgColorAccentFrom={bgColorAccentFrom}
                    bgColorAccentTo={bgColorAccentTo}
                    forceSlidesToShow={forceSlidesToShow}
                />
            </motion.div>
        );
    }, [
        pollsList?.items,
        isReady,
        artist,
        player,
        tokenGating,
        filteredPollLogs,
        fgColorFrom,
        fgColorTo,
        bgColorFrom,
        bgColorTo,
        bgColorAccentFrom,
        bgColorAccentTo,
        forceSlidesToShow,
        animations.content,
    ]);

    // 컨텐츠 렌더링 결정
    const renderContent = useCallback(() => {
        if (!isReady || isLoading) {
            return renderLoading();
        }

        if (error) {
            return renderError();
        }

        if (!pollsList?.items || pollsList.items.length === 0) {
            return renderNoPolls();
        }

        return renderPollsList();
    }, [
        isReady,
        isLoading,
        error,
        pollsList?.items,
        renderLoading,
        renderError,
        renderNoPolls,
        renderPollsList,
    ]);

    return (
        <motion.div
            className={cn(
                "w-full",
                "px-[10px] sm:px-[10px] md:px-[20px] lg:px-[20px]",
                "mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]",
                className
            )}
            variants={animations.container}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <AnimatePresence mode="wait">
                <div key={`artist-polls-${artist.id}`} className="relative">
                    {renderContent()}
                </div>
            </AnimatePresence>
        </motion.div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsContentsPrivateArtistList);
