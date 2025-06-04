/// components/user/User.MyStar.Modal.Contents.Collections.tsx

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import UserMyStarModalContentsCollectionsCard from "./User.MyStar.Modal.Contents.Collections.Card";
import { cn } from "@/lib/utils/tailwind";
import { Artist, Player, QuestLog, PollLog } from "@prisma/client";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import React, { useMemo, useRef, useState } from "react";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import ArtistSelector from "../atoms/ArtistSelector";
import ArtistMessage from "../artists/ArtistMessage";
import QuestsArtistMissions from "../quests/Quests.Contents.Private.ArtistMissions";
import PollsContentsPrivateArtistList from "../polls/Polls.Contents.Private.ArtistList";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import ArtistFeed from "../artists/Artist.Feed";
import { VerifiedSPG } from "@/app/story/interaction/actions";

interface UserMyStarModalContentsCollectionsProps {
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    artist: Artist;
    verifiedSPGs: VerifiedSPG[];
}

export default React.memo(function UserMyStarModalContentsCollections({
    artist,
    verifiedSPGs,
    player,
    questLogs,
    pollLogs,
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

    const tokenGatingResult: AdvancedTokenGateResult = useMemo(() => {
        const result: AdvancedTokenGateResult = {
            success: true,
            data: {
                hasToken: verifiedSPGs.reduce((acc, spg) => {
                    acc[spg.address] = spg.verifiedTokens.length > 0;
                    return acc;
                }, {} as Record<string, boolean>),
                tokenCount: verifiedSPGs.reduce((acc, spg) => {
                    acc[spg.address] = spg.verifiedTokens.length;
                    return acc;
                }, {} as Record<string, number>),
                ownerWallets: {},
            },
        };

        console.log("Result", result);

        return result;
    }, [verifiedSPGs]);

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
                        {verifiedSPGs.map((spg) => (
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
                    gapSize={40}
                    isSelected={true}
                    className={cn("mb-[20px]")}
                />

                <ArtistMessage
                    artistId={artist.id}
                    className={cn("mt-[10px]")}
                />

                <div
                    className={cn(
                        "w-full px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px]",
                        "mb-[30px]"
                    )}
                >
                    <div
                        className={cn(
                            "w-full rounded-[16px] gradient-border",
                            "py-[10px]",
                            "morp-glass-3",
                            "bg-gradient-to-br from-[rgba(0,0,0,0.1)] to-[rgba(0,0,0,0.2)]"
                        )}
                    >
                        <ArtistFeed artist={artist} />
                    </div>
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
                        tokenGatingResult={tokenGatingResult}
                        referralLogs={[]}
                        bgColorFrom={ArtistBG(artist, 2, 100)}
                        bgColorTo={ArtistBG(artist, 3, 100)}
                        showInviteFriends={false}
                    />
                </div>
            </div>
            <PollsContentsPrivateArtistList
                artist={artist}
                player={player}
                tokenGatingResult={tokenGatingResult}
                pollLogs={pollLogs}
                bgColorFrom={ArtistBG(artist, 0, 100)}
                bgColorTo={ArtistBG(artist, 1, 100)}
                bgColorAccentFrom={ArtistBG(artist, 2, 100)}
                bgColorAccentTo={ArtistBG(artist, 3, 100)}
                fgColorFrom={ArtistBG(artist, 2, 10)}
                fgColorTo={ArtistBG(artist, 1, 100)}
            />
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
                src={`/ui/arrow-right.svg`}
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
