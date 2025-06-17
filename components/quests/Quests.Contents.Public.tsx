/// components/quests/Quests.Contents.Public.tsx

"use client";

import { Player, QuestLog, ReferralLog } from "@prisma/client";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import QuestsMissions from "./Quests.Missions";
import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import InviteFriends from "../atoms/InviteFriends";

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

    console.log(
        "Quest Public",
        quests?.items?.filter((quest) => quest.isReferral)
    );

    const [selectedType, setSelectedType] = useState<string>("All");

    // 퀘스트 타입 목록 메모이제이션
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

    // 타입 클릭 핸들러 메모이제이션
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

// 타입 버튼 컴포넌트 - 메모이제이션 적용
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
        // 클릭 핸들러 메모이제이션
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

// 컴포넌트 이름 설정
TypeButton.displayName = "TypeButton";

export default memo(QuestsPublic);
