/// components/quests/Quests.Contents.Public.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";

import type { Player, QuestLog, ReferralLog } from "@prisma/client";

interface QuestsPublicProps {
    player: Player | null;
    questLogs: QuestLog[];
    referralLogs?: ReferralLog[];
}

const now = new Date();

function QuestsPublic({ player, questLogs, referralLogs }: QuestsPublicProps) {
    const { quests, isLoading, error } = useQuestGet({
        getQuestsInput: {
            isPublic: true,
            isActive: true,
            startDate: now,
            endDate: now,
            startDateIndicator: "after",
            endDateIndicator: "before",
        },
    });

    const [selectedType, setSelectedType] = useState<string>("All");

    const types = useMemo(() => {
        if (!quests?.items || quests.items.length === 0) {
            return ["All"];
        }

        const uniqueTypes = new Set<string>();
        quests.items.forEach((quest) => {
            if (quest.type) uniqueTypes.add(quest.type);
        });

        return ["All", ...Array.from(uniqueTypes)];
    }, [quests?.items]);

    const filteredQuests = useMemo(() => {
        if (!quests?.items) return [];

        return selectedType === "All"
            ? quests.items
            : quests.items.filter((quest) => quest.type === selectedType);
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
        isSelected,
        onClick,
    }: {
        type: string;
        isSelected: boolean;
        onClick: (type: string) => void;
    }) => {
        const handleClick = useCallback(() => {
            onClick(type);
        }, [onClick, type]);

        return (
            <div
                className={cn(
                    "text-sm transition-all duration-500 morp-glass-1 rounded-full px-4 py-2",
                    "cursor-pointer backdrop-blur-xs",
                    getResponsiveClass(15).textClass,
                    isSelected ? "opacity-100" : "opacity-50"
                )}
                onClick={handleClick}
            >
                {type}
            </div>
        );
    }
);

TypeButton.displayName = "TypeButton";

export default memo(QuestsPublic);
