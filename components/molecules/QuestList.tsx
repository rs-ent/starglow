/// components/molecules/QuestList.tsx

"use client";

import { useState, useEffect } from "react";
import QuestButton from "../atoms/QuestButton";
import Button from "../atoms/Button";
import { Quest, Player } from "@prisma/client";
import { cn } from "@/lib/utils/tailwind";

interface QuestListProps {
    playerId: string;
    quests: Quest[];
    completedQuests: string[];
}

export default function QuestList({
    playerId,
    quests = [],
    completedQuests = [],
}: QuestListProps) {
    const types = [...new Set(quests.map((quest) => quest.type))];
    types.unshift("All");

    const [selectedType, setSelectedType] = useState<string>("All");
    const [filteredQuests, setFilteredQuests] = useState<Quest[]>(quests);

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        setFilteredQuests(
            type === "All" ? quests : quests.filter((q) => q.type === type)
        );
    };

    return (
        <div className="relative flex w-full items-center justify-center px-3">
            <div className="relative w-full max-w-[820px] min-w-[270px]">
                <div className="max-w-[90vw] overflow-x-auto scrollbar-hovering mb-3">
                    <div
                        className="
                            flex
                            space-x-2 sm:space-x-3 md:space-x-4

                        "
                    >
                        {types.map((type) => (
                            <Button
                                key={type}
                                variant="space"
                                textSize={15}
                                paddingSize={20}
                                beautify={selectedType === type}
                                onClick={() => handleTypeChange(type ?? "All")}
                                className={cn(
                                    "bg-transparent text-foreground rounded-full flex-shrink-0",
                                    selectedType === type
                                        ? "opacity-100 shadow-md"
                                        : "opacity-40 shadow-none"
                                )}
                            >
                                {type}
                            </Button>
                        ))}
                    </div>
                </div>

                {filteredQuests.map((quest) => (
                    <div
                        key={quest.id}
                        className="flex items-center justify-between mb-3"
                    >
                        <QuestButton
                            playerId={playerId}
                            quest={quest}
                            alreadyCompleted={completedQuests.includes(
                                quest.id
                            )}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
