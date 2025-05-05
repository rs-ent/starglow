/// components/organisms/Quests.Public.tsx

"use client";

import { Player, Quest } from "@prisma/client";
import { useEffect, useState } from "react";
import QuestsMissions from "@/components/molecules/Quests.Missions";
import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import InviteFriends from "../atoms/InviteFriends";

interface QuestsPublicProps {
    player: Player;
}

export default function QuestsPublic({ player }: QuestsPublicProps) {
    const { quests, questLogs, isLoading, error } = useQuestGet({
        getQuestsInput: {
            isPublic: true,
        },
        getQuestLogsInput: {
            playerId: player.id,
            isPublic: true,
        },
    });

    const [types, setTypes] = useState<string[]>(["All"]);
    const [selectedType, setSelectedType] = useState<string>("All");
    const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);

    useEffect(() => {
        setFilteredQuests(quests?.items || []);

        setTypes([
            "All",
            ...(quests?.items.map((quest) => quest.type || "") || []),
        ]);
    }, [quests]);

    const handleTypeClick = (type: string) => {
        setSelectedType(type);
        if (type === "All") {
            setFilteredQuests(quests?.items || []);
        } else {
            setFilteredQuests(
                quests?.items.filter((quest) => quest.type === type) || []
            );
        }
    };

    return (
        <div className="relative max-w-[1000px] w-screen">
            <div
                className={cn(
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                )}
            >
                <div className="my-[20px] mb-[50px] lg:my-[30px] lg:mb-[80px]">
                    <InviteFriends />
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex flex-row gap-2 overflow-x-auto whitespace-nowrap">
                        {types.map((type) => (
                            <h2
                                key={type}
                                className={cn(
                                    "text-sm transition-all duration-500 morp-glass-1 rounded-full px-4 py-2",
                                    "cursor-pointer backdrop-blur-xs",
                                    getResponsiveClass(15).textClass,
                                    selectedType === type
                                        ? "opacity-100"
                                        : "opacity-50"
                                )}
                                onClick={() => handleTypeClick(type)}
                            >
                                {type}
                            </h2>
                        ))}
                    </div>
                </div>

                {quests && questLogs && (
                    <div className={cn("mb-[100px] lg:mb-[0px]")}>
                        <QuestsMissions
                            player={player}
                            quests={filteredQuests}
                            questLogs={questLogs.items}
                            isLoading={isLoading}
                            error={error}
                            permission={true}
                            tokenGatingResult={null}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
