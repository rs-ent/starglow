/// components/polls/Polls.List.tsx

"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Artist, Player, Poll, PollLog } from "@prisma/client";
import { TokenGatingResult, TokenGatingData } from "@/app/story/nft/actions";
import PollsListCard from "@/components/polls/Polls.List.Card";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PollsListProps {
    polls: Poll[];
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
}: PollsListProps) {
    const sliderRef = useRef<Slider>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slidesToShow, setSlidesToShow] = useState(
        forceSlidesToShow
            ? Math.min(forceSlidesToShow, polls.length)
            : polls.length
    );
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
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
                        centerMode: true,
                    },
                },
            ],
        }),
        [slidesToShow]
    );

    // 중앙 인덱스 계산 메모이제이션
    const centerIndex = useMemo(() => {
        let idx = (currentSlide + Math.floor(slidesToShow / 2)) % polls.length;
        return idx;
    }, [currentSlide, slidesToShow, polls.length]);

    // 반응형 슬라이더 설정
    useEffect(() => {
        const minSlidesToShow = Math.min(forceSlidesToShow, polls.length);

        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 860);

            if (width <= 640) {
                // 모바일 (sm)
                setSlidesToShow(Math.min(1, minSlidesToShow));
            } else if (width <= 860) {
                // 태블릿 (md)
                setSlidesToShow(Math.min(1, minSlidesToShow));
            } else if (width <= 1024) {
                // 작은 데스크탑 (lg)
                setSlidesToShow(Math.min(2, minSlidesToShow));
            } else {
                // 큰 데스크탑 (xl)
                setSlidesToShow(Math.min(3, minSlidesToShow));
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
        return <PartialLoading text="Loading polls..." size="sm" />;
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
        <motion.div
            className="mb-[100px] relative"
            style={{
                position: "relative",
                WebkitMaskImage: `
                    linear-gradient(to right, transparent 0%, black 10%, black 100%),
                    linear-gradient(to left, transparent 0%, black 10%, black 100%)
                `,
                maskImage: `
                    linear-gradient(to right, transparent 0%, black 10%, black 100%),
                    linear-gradient(to left, transparent 0%, black 10%, black 100%)
                `,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "55% 100%, 55% 100%",
                maskSize: "55% 100%, 55% 100%",
                WebkitMaskPosition: "left, right",
                maskPosition: "left, right",
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* 네비게이션 버튼 */}
            <AnimatePresence>
                {isHovering && !isMobile && (
                    <>
                        <motion.button
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 rounded-full p-2 text-white/90 transition-all"
                            onClick={handlePrev}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            aria-label="Previous poll"
                        >
                            <ChevronLeft size={24} />
                        </motion.button>
                        <motion.button
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 rounded-full p-2 text-white/90 transition-all"
                            onClick={handleNext}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            aria-label="Next poll"
                        >
                            <ChevronRight size={24} />
                        </motion.button>
                    </>
                )}
            </AnimatePresence>

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

                    // 카드 스케일 계산 (중앙에 있는 카드가 더 크게 보이도록)
                    const isCenter = index === centerIndex;
                    const scale = isCenter ? 1.05 : 0.95;
                    const opacity = isCenter ? 1 : 0.85;

                    return (
                        <motion.div
                            key={poll.id}
                            className={cn("px-[8px]")}
                            onClick={() => handleCardClick(index)}
                            initial={{ scale: 0.9, opacity: 0.7 }}
                            animate={{
                                scale,
                                opacity,
                                transition: { duration: 0.3 },
                            }}
                            whileHover={{
                                scale: isCenter ? 1.02 : scale * 1.02,
                                transition: { duration: 0.2 },
                            }}
                            style={{ cursor: "pointer" }}
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
            {isMobile && (
                <div className="flex justify-center mt-2 gap-1">
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
            )}
        </motion.div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsList);
