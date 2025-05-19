/// components/organisms/Polls.List.tsx

"use client";

import Link from "next/link";
import { Artist, Player, Poll, PollLog } from "@prisma/client";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { TokenGatingResult } from "@/app/actions/polls";
import PollsCard from "@/components/molecules/Polls.Card";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useEffect, useMemo, useState } from "react";

interface PollsListProps {
    polls: Poll[];
    player: Player | null;
    pollLogs?: PollLog[];
    artist?: Artist | null;
    tokenGatingData?: AdvancedTokenGateResult | null;
    forceSlidesToShow?: number;
}

export default function PollsList({
    polls,
    player,
    pollLogs,
    artist,
    tokenGatingData,
    forceSlidesToShow = 3,
}: PollsListProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slidesToShow, setSlidesToShow] = useState(
        Math.min(forceSlidesToShow, polls.length)
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
        centerMode: true,
        accessibility: true,
        beforeChange: (current: number, next: number) => {
            setCurrentSlide(next);
        },
    };

    useEffect(() => {
        const minSlidesToShow = Math.min(forceSlidesToShow, polls.length);
        const handleResize = () => {
            if (window.innerWidth <= 640) {
                setSlidesToShow(Math.min(1, minSlidesToShow));
            } else if (window.innerWidth <= 1024) {
                setSlidesToShow(Math.min(2, minSlidesToShow));
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

    return (
        <div
            className="mb-[100px]"
            style={{
                position: "relative",
                WebkitMaskImage: `
    linear-gradient(to right, transparent 0%, black 15%, black 100%),
    linear-gradient(to left, transparent 0%, black 15%, black 100%)
`,
                maskImage: `
    linear-gradient(to right, transparent 0%, black 15%, black 100%),
    linear-gradient(to left, transparent 0%, black 15%, black 100%)
`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "50% 100%, 50% 100%",
                maskSize: "50% 100%, 50% 100%",
                WebkitMaskPosition: "left, right",
                maskPosition: "left, right",
            }}
        >
            <Slider {...sliderSettings}>
                {polls.map((poll, index) => {
                    let centerIndices: number[] = [];

                    if (slidesToShow === 1) {
                        centerIndices = [currentSlide];
                    } else if (slidesToShow === 2) {
                        centerIndices = [
                            currentSlide,
                            (currentSlide + 2) % polls.length,
                        ];
                    } else {
                        centerIndices = [
                            (currentSlide + Math.floor(slidesToShow / 2)) %
                                polls.length,
                        ];
                    }

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
                        <div key={poll.id} className="px-2">
                            <PollsCard
                                poll={poll}
                                player={player}
                                pollLogs={pollIdToLogs[poll.id] || []}
                                artist={artist}
                                tokenGatingData={specificTokenGatingData}
                                isSelected={centerIndices.includes(index)}
                            />
                        </div>
                    );
                })}
            </Slider>
        </div>
    );
}
