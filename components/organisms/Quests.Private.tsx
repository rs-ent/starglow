/// components/organisms/Quests.Private.tsx

"use client";

import { useEffect, useState } from "react";
import { Artist, Player, ReferralLog } from "@prisma/client";
import ArtistMessage from "../molecules/ArtistMessage";
import ArtistSlideSelector from "../molecules/ArtistSlideSelector";
import QuestsArtistMissions from "./Quests.ArtistMissions";
import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";

interface QuestsPrivateProps {
    player: Player;
    privateTabClicked: boolean;
    referralLogs?: ReferralLog[];
}

export default function QuestsPrivate({
    player,
    privateTabClicked,
    referralLogs,
}: QuestsPrivateProps) {
    const { user: DBUser } = usePlayerGet({
        getDBUserFromPlayerInput: {
            playerId: player.id,
        },
    });

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
            user: DBUser || null,
        },
    });

    const { tokenGating, isTokenGating, tokenGatingError } = useArtistSet();

    useEffect(() => {
        setSelectedArtist(null);
        setSelectedArtistTokenGatingResult(null);
        setShowArtistContents(false);
    }, [privateTabClicked]);

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
                    } else if (!DBUser) {
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
                            user: DBUser,
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
                    className="mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]"
                    onSelect={(artist) => handleArtistSelect(artist)}
                />
            </div>
            {(isTokenGating || getTokenGatingLoading) && (
                <div className="w-full h-full flex items-center justify-center my-6">
                    <PartialLoading text="Authenticating..." size="sm" />
                </div>
            )}
            {selectedArtist && !isTokenGating && !getTokenGatingLoading && (
                <div className="relative w-full h-full">
                    {showArtistContents && (
                        <div className="w-full h-full z-0 relative">
                            <ArtistMessage
                                artist={selectedArtist}
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
                                    tokenGatingResult={
                                        selectedArtistTokenGatingResult || null
                                    }
                                    referralLogsCount={referralLogs?.length}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
