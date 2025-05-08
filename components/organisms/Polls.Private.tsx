///components/organisms/Polls.Private.tsx

"use client";

import { Artist, Player } from "@prisma/client";
import PartialLoading from "../atoms/PartialLoading";
import ArtistSlideSelector from "../molecules/ArtistSlideSelector";
import PollsArtistList from "./Polls.ArtistList";
import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import { useState, useEffect } from "react";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";

interface PollsPrivateProps {
    player: Player;
    privateTabClicked: boolean;
}

export default function PollsPrivate({
    player,
    privateTabClicked,
}: PollsPrivateProps) {
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
            userId: DBUser?.id || null,
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
                            userId: DBUser.id,
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
            {(isTokenGating || getTokenGatingLoading) && (
                <div className="w-full h-full flex items-center justify-center my-6">
                    <PartialLoading text="Authenticating..." size="sm" />
                </div>
            )}
            {selectedArtist && !isTokenGating && !getTokenGatingLoading && (
                <div className="relative w-full h-full">
                    {showArtistContents && (
                        <div className="w-full h-full z-0 relative">
                            <PollsArtistList
                                artist={selectedArtist}
                                player={player}
                                tokenGatingResult={
                                    selectedArtistTokenGatingResult || null
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
