/// components/organisms/Polls.List.tsx

"use client";

import { useRef } from "react";
import { Artist, Player, Poll, PollLog } from "@prisma/client";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { TokenGatingResult } from "@/app/actions/polls";
import PollsCard from "@/components/molecules/Polls.Card";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useEffect, useMemo, useState } from "react";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";

interface PollsListProps {
    polls: Poll[];
    player: Player | null;
    pollLogs?: PollLog[];
    artist?: Artist | null;
    isLoading?: boolean;
    tokenGatingData?: AdvancedTokenGateResult | null;
    forceSlidesToShow?: number;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
}

export default function PollsList({
    polls,
    player,
    pollLogs,
    artist,
    isLoading,
    tokenGatingData,
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

    const sliderSettings = {
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
        },
        responsive: [
            {
                breakpoint: 860,
                settings: {
                    centerMode: true,
                },
            },
        ],
    };

    const centerIndex = useMemo(() => {
        let idx = (currentSlide + Math.floor(slidesToShow / 2)) % polls.length;
        return idx;
    }, [currentSlide, slidesToShow, polls.length]);

    useEffect(() => {
        const minSlidesToShow = Math.min(forceSlidesToShow, polls.length);
        const handleResize = () => {
            if (window.innerWidth <= 860) {
                setSlidesToShow(Math.min(1, minSlidesToShow));
            } else {
                setSlidesToShow(Math.min(3, minSlidesToShow));
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [polls.length]);

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

    if (isLoading) {
        return <PartialLoading text="Loading polls..." size="sm" />;
    }

    return (
        <div
            className="mb-[100px]"
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
        >
            <Slider ref={sliderRef} {...sliderSettings}>
                {polls.map((poll, index) => {
                    const specificTokenGatingData: TokenGatingResult =
                        !poll.needToken ||
                        !poll.needTokenAddress ||
                        !tokenGatingData?.data
                            ? {
                                  success: true,
                                  data: {
                                      hasToken: true,
                                      tokenCount: 0,
                                      ownerWallets: [],
                                  },
                              }
                            : {
                                  success: tokenGatingData.success,
                                  data: {
                                      hasToken:
                                          tokenGatingData.data.hasToken[
                                              poll.needTokenAddress
                                          ],
                                      tokenCount:
                                          tokenGatingData.data.tokenCount[
                                              poll.needTokenAddress
                                          ],
                                      ownerWallets:
                                          tokenGatingData.data.ownerWallets[
                                              poll.needTokenAddress
                                          ],
                                  },
                              };
                    return (
                        <div
                            key={poll.id}
                            className={cn("px-[8px]")}
                            onClick={() => {
                                if (
                                    centerIndex === 0 &&
                                    index === polls.length - 1
                                ) {
                                    sliderRef.current?.slickGoTo(index - 1);
                                } else if (
                                    centerIndex === polls.length - 1 &&
                                    index === 0
                                ) {
                                    sliderRef.current?.slickGoTo(
                                        polls.length - 1
                                    );
                                } else if (index > centerIndex) {
                                    sliderRef.current?.slickNext();
                                } else if (index < centerIndex) {
                                    sliderRef.current?.slickPrev();
                                }
                            }}
                        >
                            <PollsCard
                                index={index}
                                poll={poll}
                                player={player}
                                pollLogs={pollIdToLogs[poll.id] || []}
                                artist={artist}
                                tokenGatingData={specificTokenGatingData}
                                isSelected={index === centerIndex}
                                bgColorFrom={bgColorFrom}
                                bgColorTo={bgColorTo}
                                bgColorAccentFrom={bgColorAccentFrom}
                                bgColorAccentTo={bgColorAccentTo}
                                fgColorFrom={fgColorFrom}
                                fgColorTo={fgColorTo}
                            />
                        </div>
                    );
                })}
            </Slider>
        </div>
    );
}
