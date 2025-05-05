/// components/organisms/Quests.Private.tsx

"use client";

import { useEffect, useState } from "react";
import { Artist, Player } from "@prisma/client";
import ArtistMessage from "../molecules/ArtistMessage";
import ArtistSlideSelector from "../molecules/ArtistSlideSelector";
import QuestsArtistMissions from "./Quests.ArtistMissions";
import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import PartialLoading from "../atoms/PartialLoading";

interface QuestsPrivateProps {
    player: Player;
    privateTabClicked: boolean;
}

export default function QuestsPrivate({
    player,
    privateTabClicked,
}: QuestsPrivateProps) {
    const { user: DBUser } = usePlayerGet({
        getDBUserFromPlayerInput: {
            playerId: player.id,
        },
    });

    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [showArtistMessage, setShowArtistMessage] = useState(false);
    const [showArtistMission, setShowArtistMission] = useState(false);
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
        setShowArtistMessage(false);
        setShowArtistMission(false);
    }, [privateTabClicked]);

    const handleArtistSelect = (artist: Artist | null) => {
        setSelectedArtist(artist);
        setSelectedArtistTokenGatingResult(null);
        setShowArtistMessage(false);
        setShowArtistMission(false);
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
                setShowArtistMessage(true);
                setShowArtistMission(true);
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
                <div className="relative w-full">
                    {showArtistMessage && (
                        <div className="w-full z-0 relative">
                            <ArtistMessage
                                artist={selectedArtist}
                                className="mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]"
                            />
                        </div>
                    )}
                    {showArtistMission && (
                        <QuestsArtistMissions
                            artist={selectedArtist}
                            player={player}
                            tokenGatingResult={
                                selectedArtistTokenGatingResult || null
                            }
                        />
                    )}
                </div>
            )}
        </div>
    );
}
