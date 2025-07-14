/// components/quests/Quests.Contents.Total.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";
import type { QuestWithArtistAndRewardAsset } from "@/app/actions/quests";
import Image from "next/image";

import type { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";

interface QuestsTotalProps {
    player: Player | null;
    questLogs: QuestLog[];
    referralLogs?: ReferralLog[];
}

const now = new Date();

function QuestsTotal({ player, questLogs, referralLogs }: QuestsTotalProps) {
    const { quests, isLoading, error } = useQuestGet({
        getQuestsInput: {
            isActive: true,
            startDate: now,
            endDate: now,
            startDateIndicator: "after",
            endDateIndicator: "before",
            test: player?.tester ?? false,
        },
    });

    const [selectedType, setSelectedType] = useState<string>("All");

    const { types, artistsMap } = useMemo(() => {
        if (!quests?.items || quests.items.length === 0) {
            return {
                types: ["All"],
                artistsMap: new Map<string, Artist>(),
            };
        }

        const uniqueTypesSet = new Set<string>();
        const uniqueArtistsMap = new Map<string, Artist>();

        quests.items.forEach((quest: QuestWithArtistAndRewardAsset) => {
            if (quest.type) uniqueTypesSet.add(quest.type);
            if (quest.artist) {
                uniqueArtistsMap.set(quest.artist.name, quest.artist);
            }
        });

        const questTypes = Array.from(uniqueTypesSet);
        const artistNames = Array.from(uniqueArtistsMap.keys());

        return {
            types: ["All", ...questTypes, ...artistNames],
            artistsMap: uniqueArtistsMap,
        };
    }, [quests?.items]);

    const filteredQuests = useMemo(() => {
        if (!quests?.items) return [];

        return selectedType === "All"
            ? quests.items
            : quests.items.filter(
                  (quest) =>
                      quest.type === selectedType ||
                      quest.artist?.name === selectedType
              );
    }, [quests?.items, selectedType]);

    const handleTypeClick = useCallback((type: string) => {
        setSelectedType(type);
    }, []);

    return (
        <div className="relative max-w-[1000px] w-screen">
            <div
                className={cn(
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                )}
            >
                <div className="my-[20px] mb-[50px] lg:my-[30px] lg:mb-[80px]">
                    <InviteFriends player={player} />
                </div>

                <div className="flex justify-between items-end mb-6">
                    <div className="flex flex-row gap-2 overflow-x-auto whitespace-nowrap pb-2">
                        {types.map((type) => (
                            <TypeButton
                                key={type}
                                type={type}
                                isSelected={selectedType === type}
                                onClick={handleTypeClick}
                                artist={artistsMap.get(type)}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <div
                        key={selectedType}
                        className={cn("mb-[100px] lg:mb-[0px]")}
                    >
                        {quests && questLogs && (
                            <QuestsMissions
                                player={player}
                                quests={filteredQuests}
                                questLogs={questLogs}
                                isLoading={isLoading}
                                error={error}
                                permission={true}
                                tokenGating={null}
                                referralLogs={referralLogs || []}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const TypeButton = memo(
    ({
        type,
        artist,
        isSelected,
        onClick,
    }: {
        type: string;
        artist?: Artist;
        isSelected: boolean;
        onClick: (type: string) => void;
    }) => {
        const handleClick = useCallback(() => {
            onClick(type);
        }, [onClick, type]);

        return (
            <div
                className={cn(
                    "flex flex-row gap-2 items-center justify-center text-sm transition-all duration-500 morp-glass-1 rounded-full px-4 py-2",
                    "cursor-pointer backdrop-blur-xs",
                    getResponsiveClass(15).textClass,
                    isSelected ? "opacity-100" : "opacity-50"
                )}
                onClick={handleClick}
            >
                {artist && artist.logoUrl && (
                    <Image
                        src={artist.logoUrl}
                        alt={artist.name}
                        width={20}
                        height={20}
                        className={cn(
                            "object-contain",
                            getResponsiveClass(20).frameClass
                        )}
                    />
                )}
                {type}
            </div>
        );
    }
);

TypeButton.displayName = "TypeButton";

export default memo(QuestsTotal);
