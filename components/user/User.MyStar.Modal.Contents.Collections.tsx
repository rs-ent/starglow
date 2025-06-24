/// components/user/User.MyStar.Modal.Contents.Collections.tsx

"use client";

import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import UserMyStarModalContentsCollectionsCard from "./User.MyStar.Modal.Contents.Collections.Card";
import ArtistFeed from "../artists/Artist.Feed";
import ArtistMessage from "../artists/ArtistMessage";
import ArtistSelector from "../atoms/ArtistSelector";
import PollsContentsPrivateArtistList from "../polls/Polls.Contents.Private.ArtistList";
import QuestsArtistMissions from "../quests/Quests.Contents.Private.ArtistMissions";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { TokenGatingResult } from "@/app/story/nft/actions";
import type { Artist, Player, QuestLog, PollLog } from "@prisma/client";

import React, { useMemo, useRef } from "react";

interface UserMyStarModalContentsCollectionsProps {
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    artist: Artist;
    verifiedSPGs: VerifiedSPG[];
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
    onInteractFeedbackStateChange?: (isOpen: boolean) => void;
}

export default React.memo(function UserMyStarModalContentsCollections({
    artist,
    verifiedSPGs,
    player,
    questLogs,
    pollLogs,
    onSelectFeed,
    onInteractFeedbackStateChange,
}: UserMyStarModalContentsCollectionsProps) {
    const sliderRef = useRef<Slider | null>(null);

    const settings = {
        dots: false,
        arrows: false,
        infinite: verifiedSPGs.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };

    const handleSlide = (direction: "next" | "prev") => {
        if (!sliderRef.current) return;
        if (direction === "next") {
            sliderRef.current.slickNext();
        } else {
            sliderRef.current.slickPrev();
        }
    };

    const tokenGatingResult: TokenGatingResult = useMemo(() => {
        const result: TokenGatingResult = {
            success: true,
            data: {},
        };

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

    const backgroundStyle = useMemo(
        () => ({
            background: `linear-gradient(to bottom right, ${ArtistBG(
                artist,
                2,
                100
            )}, ${ArtistBG(artist, 3, 100)})`,
        }),
        [artist]
    );

    return (
        <div className={cn("w-full flex flex-col items-center justify-center")}>
            <div
                className={cn(
                    "w-full",
                    "flex flex-col items-stretch justify-center"
                )}
            >
                <div
                    className={cn(
                        "w-full relative mx-auto",
                        "mt-[50px] mb-[20px] sm:mb-[50px] lg:mb-[100px]"
                    )}
                >
                    <Arrow
                        role="next"
                        className="absolute top-1/2 right-1 -translate-y-1/2 z-10"
                        style={{
                            opacity: verifiedSPGs.length > 1 ? 1 : 0,
                        }}
                        size={30}
                        color={ArtistFG(artist, 0, 1)}
                        onClick={() => handleSlide("next")}
                    />
                    <Arrow
                        role="prev"
                        className="absolute top-1/2 left-1 -translate-y-1/2 z-10"
                        style={{
                            opacity: verifiedSPGs.length > 1 ? 1 : 0,
                        }}
                        size={30}
                        color={ArtistFG(artist, 0, 1)}
                        onClick={() => handleSlide("prev")}
                    />
                    <Slider ref={sliderRef} {...settings}>
                        {verifiedSPGs
                            .sort(
                                (a, b) =>
                                    b.verifiedTokens.length -
                                    a.verifiedTokens.length
                            )
                            .map((spg) => (
                                <div
                                    className="w-full h-full px-[20px] md:px-[30px]"
                                    key={spg.id}
                                >
                                    <UserMyStarModalContentsCollectionsCard
                                        artist={artist}
                                        verifiedSPG={spg}
                                    />
                                </div>
                            ))}
                    </Slider>
                </div>
                <ArtistSelector
                    artist={artist}
                    frameSize={55}
                    textSize={30}
                    isSelected={true}
                    className={cn("mb-[20px]")}
                />

                <ArtistMessage
                    artistId={artist.id}
                    className={cn("mt-[10px]")}
                    artist={artist}
                />

                <div
                    className={cn(
                        "w-full px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px]",
                        "mb-[30px]"
                    )}
                >
                    <ArtistFeed artist={artist} onSelectFeed={onSelectFeed} />
                </div>

                <div
                    className={cn(
                        "px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px]"
                    )}
                >
                    <QuestsArtistMissions
                        artist={artist}
                        player={player}
                        questLogs={questLogs}
                        tokenGating={tokenGatingResult}
                        referralLogs={[]}
                        bgColorFrom={ArtistBG(artist, 2, 100)}
                        bgColorTo={ArtistBG(artist, 3, 100)}
                        showInviteFriends={false}
                        onInteractFeedbackStateChange={
                            onInteractFeedbackStateChange
                        }
                    />
                </div>
            </div>
            <div className="w-full h-full px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px]">
                <div
                    className={cn(
                        "duration-1000 transition-all",
                        "w-full rounded-3xl"
                    )}
                    style={backgroundStyle}
                >
                    <PollsContentsPrivateArtistList
                        artist={artist}
                        player={player}
                        tokenGating={tokenGatingResult}
                        pollLogs={pollLogs}
                        forceSlidesToShow={1}
                        bgColorFrom={ArtistBG(artist, 0, 100)}
                        bgColorTo={ArtistBG(artist, 1, 100)}
                        bgColorAccentFrom={ArtistBG(artist, 2, 100)}
                        bgColorAccentTo={ArtistBG(artist, 3, 100)}
                        fgColorFrom={ArtistBG(artist, 2, 10)}
                        fgColorTo={ArtistBG(artist, 1, 100)}
                        className="px-[1px]"
                    />
                </div>
            </div>
        </div>
    );
});

function Arrow(props: any) {
    const { className, style, onClick, role, size, color } = props;
    return (
        <div
            className={cn(getResponsiveClass(size).frameClass, className)}
            style={style}
            onClick={onClick}
        >
            <img
                src="/ui/arrow-right.svg"
                alt={`Arrow ${role}`}
                className={cn("w-full h-full")}
                style={{
                    transform: `rotate(${role === "next" ? 0 : 180}deg)`,
                    color: color,
                }}
            />
        </div>
    );
}
