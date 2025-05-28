/// components/quests/Quests.Contents.Public.tsx

"use client";

import { Player, Quest, ReferralLog, QuestLog } from "@prisma/client";
import { useEffect, useState, useMemo, useRef } from "react";
import QuestsMissions from "./Quests.Missions";
import { useQuestGet, useQuestSet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import InviteFriends from "../atoms/InviteFriends";

type ReferralQuestLogsDataType = {
    player: Player;
    referralQuests: Quest[];
    questLogs: QuestLog[];
    referralLogs: ReferralLog[];
} | null;

interface QuestsPublicProps {
    player: Player | null;
    questLogs: QuestLog[];
    referralLogs?: ReferralLog[];
}

export default function QuestsPublic({
    player,
    questLogs,
    referralLogs,
}: QuestsPublicProps) {
    const { quests, isLoading, error } = useQuestGet({
        getQuestsInput: {
            isPublic: true,
            isActive: true,
        },
    });

    const [selectedType, setSelectedType] = useState<string>("All");

    const types = useMemo(
        () => [
            "All",
            ...(Array.from(
                new Set(
                    quests?.items
                        .filter(
                            (quest): quest is Quest & { type: string } =>
                                quest.type !== null && quest.type !== undefined
                        )
                        .map((quest) => quest.type)
                )
            ) || []),
        ],
        [quests?.items]
    );

    const filteredQuests = useMemo(() => {
        if (selectedType === "All") {
            return quests?.items || [];
        }
        return (
            quests?.items.filter((quest) => quest.type === selectedType) || []
        );
    }, [quests?.items, selectedType]);

    const referralQuestLogsData = useMemo(() => {
        if (
            !player?.id ||
            !quests?.items ||
            questLogs.length === 0 ||
            !referralLogs
        ) {
            return null;
        }

        return {
            player,
            referralQuests:
                quests.items.filter((quest) => quest.isReferral) || [],
            questLogs: questLogs,
            referralLogs: referralLogs,
        };
    }, [player, quests?.items, questLogs, referralLogs]);

    const { setReferralQuestLogs } = useQuestSet();
    const prevDataRef = useRef<ReferralQuestLogsDataType>(null);

    useEffect(() => {
        if (
            referralQuestLogsData &&
            JSON.stringify(prevDataRef.current) !==
                JSON.stringify(referralQuestLogsData)
        ) {
            prevDataRef.current = referralQuestLogsData;
            setReferralQuestLogs(referralQuestLogsData);
        }
    }, [referralQuestLogsData, setReferralQuestLogs]);

    const handleTypeClick = (type: string) => {
        setSelectedType(type);
    };

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
                            questLogs={questLogs}
                            isLoading={isLoading}
                            error={error}
                            permission={true}
                            tokenGatingResult={null}
                            referralLogs={referralLogs || []}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
