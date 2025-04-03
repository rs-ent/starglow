import QuestToday from "./QuestToday";
import QuestMissions from "./QuestMissions";
import { Player } from "@prisma/client";

interface QuestContentsProps {
    contentType?: string;
    playerId: Player["id"];
    completedQuests?: { questId: string }[];
}

export default function QuestContents({
    contentType = "Today",
    playerId,
    completedQuests = [],
}: QuestContentsProps) {
    return (
        <div className="w-full">
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
