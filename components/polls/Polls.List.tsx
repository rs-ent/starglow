/// components/polls/Polls.List.tsx

"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";
import Slider from "react-slick";

import type {
    TokenGatingResult,
    TokenGatingData,
} from "@/app/story/nft/actions";

import PollsListCard from "@/components/polls/Polls.List.Card";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "../atoms/PartialLoading";

import type { Artist, Player, PollLog } from "@prisma/client";
import type { PollsWithArtist } from "@/app/actions/polls";

interface PollsListProps {
    polls: PollsWithArtist[];
    player: Player | null;
    pollLogs?: PollLog[];
    artist?: Artist | null;
    isLoading?: boolean;
    tokenGating?: TokenGatingResult | null;
    forceSlidesToShow?: number;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
    needMarginBottom?: boolean;
}

function PollsList({
    polls,
    player,
    pollLogs,
    artist,
    isLoading,
    tokenGating,
    forceSlidesToShow = 3,
    fgColorFrom,
    fgColorTo,
    bgColorFrom,
    bgColorTo,
    bgColorAccentFrom,
    bgColorAccentTo,
    needMarginBottom = true,
}: PollsListProps) {
    const sliderRef = useRef<Slider>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slidesToShow, setSlidesToShow] = useState(
        forceSlidesToShow
            ? Math.min(forceSlidesToShow, polls.length)
            : polls.length
    );
    const [isHovering, setIsHovering] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // 슬라이더 설정 메모이제이션
    const sliderSettings = useMemo(
        () => ({
            dots: false,
            arrows: false,
            infinite: true,
            speed: 450,
            slidesToShow: slidesToShow,
            slidesToScroll: 1,
            swipe: true,
            swipeToSlide: true,
            draggable: true,
            accessibility: true,
            beforeChange: (current: number, next: number) => {
                setCurrentSlide(next);
                setIsAnimating(true);
            },
            afterChange: () => {
                setIsAnimating(false);
            },
            responsive: [
                {
                    breakpoint: 860,
                    settings: {
                        centerMode: false,
                    },
                },
            ],
        }),
        [slidesToShow]
    );

    // 중앙 인덱스 계산 메모이제이션
    const centerIndex = useMemo(() => {
        const idx =
            (currentSlide + Math.floor(slidesToShow / 2)) % polls.length;
        return idx;
    }, [currentSlide, slidesToShow, polls.length]);

    // 반응형 슬라이더 설정 (모바일 최적화)
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width <= 640) {
                // 모바일 (sm)
                setSlidesToShow(1);
            } else if (width <= 860) {
                // 태블릿 (md)
                setSlidesToShow(Math.min(forceSlidesToShow, polls.length, 1));
            } else if (width <= 1024) {
                // 작은 데스크탑 (lg)
                setSlidesToShow(Math.min(forceSlidesToShow, polls.length, 2));
            } else {
                // 큰 데스크탑 (xl)
                setSlidesToShow(Math.min(forceSlidesToShow, polls.length, 3));
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [polls.length, forceSlidesToShow]);

    // 폴 로그 맵 메모이제이션
    const pollIdToLogs = useMemo(() => {
        const pollMap: { [pollId: string]: PollLog[] } = {};

        if (pollLogs && polls) {
            pollLogs.forEach((log) => {
                pollMap[log.pollId] = pollMap[log.pollId] || [];
                pollMap[log.pollId].push(log);
            });
        }

        return pollMap;
    }, [pollLogs, polls]);

    // 슬라이더 네비게이션 핸들러
    const handlePrev = useCallback(() => {
        if (!isAnimating) {
            sliderRef.current?.slickPrev();
        }
    }, [isAnimating]);

    const handleNext = useCallback(() => {
        if (!isAnimating) {
            sliderRef.current?.slickNext();
        }
    }, [isAnimating]);

    // 카드 클릭 핸들러
    const handleCardClick = useCallback(
        (index: number) => {
            if (isAnimating) return;

            if (centerIndex === 0 && index === polls.length - 1) {
                sliderRef.current?.slickGoTo(index - 1);
            } else if (centerIndex === polls.length - 1 && index === 0) {
                sliderRef.current?.slickGoTo(polls.length - 1);
            } else if (index > centerIndex) {
                sliderRef.current?.slickNext();
            } else if (index < centerIndex) {
                sliderRef.current?.slickPrev();
            }
        },
        [centerIndex, polls.length, isAnimating]
    );

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isHovering) {
                if (e.key === "ArrowLeft") {
                    handlePrev();
                } else if (e.key === "ArrowRight") {
                    handleNext();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handlePrev, handleNext, isHovering]);

    // 로딩 상태 처리
    if (isLoading) {
        return <PartialLoading text="Loading..." />;
    }

    // 폴이 없는 경우 처리
    if (!polls || polls.length === 0) {
        return (
            <div className="text-center py-10 text-white/80 text-xl">
                No polls available
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative",
                needMarginBottom && "mb-[100px] md:mb-[50px]"
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 슬라이더 */}
            <Slider ref={sliderRef} {...sliderSettings}>
                {polls.map((poll, index) => {
                    const specificTokenGatingData: TokenGatingData =
                        !poll.needToken ||
                        !poll.needTokenAddress ||
                        !tokenGating?.data
                            ? {
                                  hasToken: true,
                                  detail: [],
                              }
                            : tokenGating.data[poll.needTokenAddress];

                    const isCenter = index === centerIndex;
                    const scale = isCenter ? 1.0 : 0.95; // 측면 카드 차이 최소화

                    return (
                        <motion.div
                            key={poll.id}
                            className={cn("px-[2px]")}
                            onClick={() => handleCardClick(index)}
                            initial={{ scale: 0.95, opacity: 0.9 }}
                            animate={{
                                scale,
                                opacity: 1,
                                transition: {
                                    duration: 0.3,
                                    ease: "easeOut", // 더 부드러운 애니메이션
                                },
                            }}
                            whileHover={{
                                scale: isCenter ? 1.0 : 0.97,
                                opacity: 1, // hover 시 모든 카드 완전 불투명
                                transition: {
                                    duration: 0.15,
                                    ease: "easeInOut", // 더 자연스러운 hover 효과
                                },
                            }}
                            style={{
                                cursor: "pointer",
                                willChange: "transform, opacity", // GPU 가속 최적화
                            }}
                        >
                            <PollsListCard
                                index={index}
                                poll={poll}
                                player={player}
                                pollLogs={pollIdToLogs[poll.id] || []}
                                artist={artist}
                                tokenGating={specificTokenGatingData}
                                isSelected={isCenter}
                                bgColorFrom={bgColorFrom}
                                bgColorTo={bgColorTo}
                                bgColorAccentFrom={bgColorAccentFrom}
                                bgColorAccentTo={bgColorAccentTo}
                                fgColorFrom={fgColorFrom}
                                fgColorTo={fgColorTo}
                            />
                        </motion.div>
                    );
                })}
            </Slider>

            {/* 인디케이터 (모바일에서만 표시) */}
            <div className="flex justify-center mt-1 pb-[10px] gap-1">
                {polls.map((_, index) => (
                    <button
                        key={index}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            index === centerIndex
                                ? "bg-white scale-110"
                                : "bg-white/40 scale-90"
                        )}
                        onClick={() => sliderRef.current?.slickGoTo(index)}
                        aria-label={`Go to poll ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsList);
