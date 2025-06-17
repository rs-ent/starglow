/// components/organisms/Quests.Private.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";
import ArtistMessage from "../artists/ArtistMessage";
import ArtistSlideSelector from "../artists/ArtistSlideSelector";
import QuestsArtistMissions from "./Quests.Contents.Private.ArtistMissions";
import { cn } from "@/lib/utils/tailwind";
import { User } from "next-auth";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { AnimatePresence, motion } from "framer-motion";
import { VerifiedSPG } from "@/app/story/interaction/actions";
import { TokenGatingResult } from "@/app/story/nft/actions";

interface QuestsPrivateProps {
    user: User | null;
    player: Player | null;
    questLogs: QuestLog[];
    privateTabClicked: boolean;
    referralLogs?: ReferralLog[];
    verifiedSPGs?: VerifiedSPG[];
}

function QuestsPrivate({
    user,
    player,
    questLogs,
    referralLogs,
    verifiedSPGs,
}: QuestsPrivateProps) {
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [previousArtist, setPreviousArtist] = useState<Artist | null>(null);
    const [activeBackground, setActiveBackground] = useState<
        "default" | "artist"
    >("default");

    // 아티스트 선택 핸들러 메모이제이션
    const handleArtistSelect = useCallback(
        (artist: Artist | null) => {
            setPreviousArtist(selectedArtist);
            setSelectedArtist(artist);
            setActiveBackground(artist ? "artist" : "default");
        },
        [selectedArtist]
    );

    // 배경 스타일 useMemo 분리
    const defaultBackgroundStyle = useMemo(
        () => ({
            background: `linear-gradient(to bottom right, rgba(109,40,217,0.4), rgba(109,40,217,0.15))`,
        }),
        []
    );

    const selectedBackgroundStyle = useMemo(() => {
        if (!selectedArtist) return defaultBackgroundStyle;
        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(
                selectedArtist,
                0,
                100
            )}, ${ArtistBG(selectedArtist, 1, 100)})`,
        };
    }, [selectedArtist, defaultBackgroundStyle]);

    const previousBackgroundStyle = useMemo(() => {
        if (!previousArtist) return defaultBackgroundStyle;
        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(
                previousArtist,
                0,
                100
            )}, ${ArtistBG(previousArtist, 1, 100)})`,
        };
    }, [previousArtist, defaultBackgroundStyle]);

    const tokenGatingResult: TokenGatingResult = useMemo(() => {
        const result: TokenGatingResult = {
            success: true,
            data: {},
        };

        if (!verifiedSPGs || !selectedArtist) return result;

        verifiedSPGs
            .filter((spg) => spg.artistId === selectedArtist.id)
            .forEach((spg) => {
                result.data[spg.address] = {
                    hasToken: spg.verifiedTokens.length > 0,
                    detail: spg.verifiedTokens.map((token) => ({
                        tokenId: token.toString(),
                        owner: spg.ownerAddress,
                    })),
                };
            });

        console.log("Token Gating Result", result);

        return result;
    }, [verifiedSPGs, selectedArtist]);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-center">
                <ArtistSlideSelector
                    className="mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]"
                    onSelect={handleArtistSelect}
                    selectedArtist={selectedArtist}
                    verifiedSPGs={verifiedSPGs}
                />
            </div>

            {/* 배경 그라데이션 - AnimatePresence로 부드러운 전환 구현 */}
            <div className="fixed inset-0 w-screen h-screen -z-50">
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

            {selectedArtist && (
                <div className="relative w-full h-full" key={selectedArtist.id}>
                    <div className="w-full h-full z-0 relative">
                        <div
                            className={cn(
                                "mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]",
                                "flex items-center justify-center"
                            )}
                        >
                            <ArtistMessage
                                artistId={selectedArtist.id}
                                artist={selectedArtist}
                            />
                        </div>

                        <div
                            className={cn(
                                "w-full h-full",
                                "mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]"
                            )}
                        >
                            <QuestsArtistMissions
                                artist={selectedArtist}
                                player={player}
                                questLogs={questLogs}
                                tokenGating={tokenGatingResult || null}
                                referralLogs={referralLogs || []}
                                bgColorFrom={ArtistBG(selectedArtist, 2, 100)}
                                bgColorTo={ArtistBG(selectedArtist, 0, 100)}
                                showInviteFriends={true}
                                bgColorFromInviteFriends={ArtistBG(
                                    selectedArtist,
                                    2,
                                    100
                                )}
                                bgColorToInviteFriends={ArtistBG(
                                    selectedArtist,
                                    3,
                                    100
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(QuestsPrivate);
