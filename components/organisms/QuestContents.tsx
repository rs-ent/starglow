import QuestToday from "./QuestToday";
import QuestMissions from "./QuestMissions";
import { Player } from "@prisma/client";
import { useQuests } from "@/app/hooks/useQuest";

interface QuestContentsProps {
    contentType?: string;
    playerId: string;
}

export default function QuestContents({
    contentType = "Today",
    playerId,
}: QuestContentsProps) {
    const { getCompletedQuests } = useQuests();
    const { completedQuests } = getCompletedQuests(playerId);

    return (
        <div className="w-full max-w-[840px] min-w-[270px]">
            {contentType === "Today" && (
                <div className="flex justify-center items-center">
                    <QuestToday
                        playerId={playerId}
                        completedQuests={completedQuests}
                    />
                </div>
            )}
            {contentType === "Missions" && (
                <div>
                    <QuestMissions
                        playerId={playerId}
                        completedQuests={completedQuests}
                    />
                </div>
            )}
        </div>
    );
}
