import { Quest } from "@prisma/client";
import QuestButton from "../atoms/QuestButton";
import { Player } from "@prisma/client";

interface DailyQuestsProps {
    dailyQuests: Quest[];
    completedQuests: { questId: string }[];
    playerId: Player["id"];
}

export default function DailyQuests({
    playerId,
    dailyQuests,
    completedQuests,
}: DailyQuestsProps) {
    return (
        <div className="relative flex w-full items-center justify-center px-3">
            <div className="relative w-full max-w-[820px] min-w-[270px]">
                <h3 className="text-start p-4 text-lg font-bold">
                    Daily Missions
                </h3>
                {dailyQuests.map((quest) => (
                    <div
                        key={quest.id}
                        className="flex items-center justify-between mb-3"
                    >
                        <QuestButton
                            quest={quest}
                            playerId={playerId}
                            alreadyCompleted={completedQuests.some(
                                (completedQuest) =>
                                    completedQuest.questId === quest.id
                            )}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
