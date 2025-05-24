///components/organisms/Polls.Private.tsx

"use client";

import { Artist, Player, PollLog } from "@prisma/client";
import PartialLoading from "../atoms/PartialLoading";
import ArtistSlideSelector from "../molecules/ArtistSlideSelector";
import PollsArtistList from "./Polls.ArtistList";
import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { useState, useEffect } from "react";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { User } from "next-auth";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import { cn } from "@/lib/utils/tailwind";
interface PollsPrivateProps {
    user: User | null;
    player: Player | null;
    privateTabClicked: boolean;
    pollLogs?: PollLog[];
}

export default function PollsPrivate({
    user,
    player,
    privateTabClicked,
    pollLogs,
}: PollsPrivateProps) {
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
        console.log("Artist selected", artist);
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
            <div className="w-full flex items-center justify-center">
                <ArtistSlideSelector
                    className="mt-[5px] sm:mt-[10px] md:mt-[15px] lg:mt-[20px] xl:mt-[25px]"
                    onSelect={(artist) => handleArtistSelect(artist)}
                />
            </div>
            {(isTokenGating || getTokenGatingLoading) && (
                <div className="w-full h-full flex items-center justify-center my-6">
                    <PartialLoading text="Authenticating..." size="sm" />
                </div>
            )}
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
                        <div className="w-screen max-w-[1400px] mx-auto z-0 relative">
                            <PollsArtistList
                                artist={selectedArtist}
                                player={player}
                                tokenGatingResult={
                                    selectedArtistTokenGatingResult || null
                                }
                                pollLogs={pollLogs}
                                bgColorFrom={ArtistBG(selectedArtist, 0, 60)}
                                bgColorTo={ArtistBG(selectedArtist, 1, 30)}
                                bgColorAccentFrom={ArtistBG(
                                    selectedArtist,
                                    2,
                                    100
                                )}
                                bgColorAccentTo={ArtistBG(
                                    selectedArtist,
                                    3,
                                    100
                                )}
                                fgColorFrom={ArtistBG(selectedArtist, 2, 10)}
                                fgColorTo={ArtistBG(selectedArtist, 1, 100)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
