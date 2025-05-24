/// components/organisms/Quests.Private.tsx

"use client";

import { useEffect, useState } from "react";
import { Artist, Player, ReferralLog, QuestLog } from "@prisma/client";
import ArtistMessage from "../molecules/ArtistMessage";
import ArtistSlideSelector from "../molecules/ArtistSlideSelector";
import QuestsArtistMissions from "./Quests.ArtistMissions";
import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { User } from "next-auth";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
interface QuestsPrivateProps {
    user: User | null;
    player: Player | null;
    questLogs: QuestLog[];
    privateTabClicked: boolean;
    referralLogs?: ReferralLog[];
}

export default function QuestsPrivate({
    user,
    player,
    questLogs,
    privateTabClicked,
    referralLogs,
}: QuestsPrivateProps) {
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [showArtistContents, setShowArtistContents] = useState(false);
    const [
        selectedArtistTokenGatingResult,
        setSelectedArtistTokenGatingResult,
    ] = useState<AdvancedTokenGateResult | null>(null);

    const {
        tokenGatingResult: getTokenGatingResult,
        isTokenGatingLoading: getTokenGatingLoading,
        tokenGatingError: getTokenGatingError,
    } = useArtistsGet({
        getTokenGatingInput: {
            artist: selectedArtist,
            userId: user?.id || null,
        },
    });

    const { tokenGating, isTokenGating, tokenGatingError } = useArtistSet();

    const handleArtistSelect = (artist: Artist | null) => {
        setSelectedArtist(artist);
        setSelectedArtistTokenGatingResult(null);
        setShowArtistContents(false);
    };

    useEffect(() => {
        const fetchTokenGatingResult = async () => {
            try {
                if (!getTokenGatingLoading && selectedArtist) {
                    if (getTokenGatingResult) {
                        setSelectedArtistTokenGatingResult(
                            getTokenGatingResult
                        );
                    } else if (!user || !user.id) {
                        setSelectedArtistTokenGatingResult({
                            success: false,
                            data: {
                                hasToken: {},
                                tokenCount: {},
                                ownerWallets: {},
                            },
                        });
                    } else {
                        const result = await tokenGating({
                            artist: selectedArtist,
                            userId: user.id,
                        });
                        setSelectedArtistTokenGatingResult(result);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setShowArtistContents(true);
            }
        };
        fetchTokenGatingResult();
    }, [selectedArtist, isTokenGating, getTokenGatingLoading]);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full">
                <ArtistSlideSelector
                    className="mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]"
                    onSelect={(artist) => handleArtistSelect(artist)}
                />
            </div>
            <div
                className={cn(
                    "fixed inset-0 w-screen h-screen -z-20",
                    "transition-opacity duration-[2500ms] ease-in-out",
                    selectedArtist ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background: `linear-gradient(to bottom right, ${
                        selectedArtist
                            ? ArtistBG(selectedArtist, 0, 100)
                            : "rgba(109,40,217,0.4)"
                    }, ${
                        selectedArtist
                            ? ArtistBG(selectedArtist, 1, 100)
                            : "rgba(109,40,217,0.15)"
                    })`,
                }}
            />
            {selectedArtist && !isTokenGating && !getTokenGatingLoading && (
                <div className="relative w-full h-full">
                    {showArtistContents && (
                        <div className="w-full h-full z-0 relative">
                            <ArtistMessage
                                artistId={selectedArtist.id}
                                className="mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]"
                            />
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
                                    tokenGatingResult={
                                        selectedArtistTokenGatingResult || null
                                    }
                                    referralLogs={referralLogs || []}
                                    bgColorFrom={ArtistBG(
                                        selectedArtist,
                                        2,
                                        100
                                    )}
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
                    )}
                </div>
            )}
        </div>
    );
}
