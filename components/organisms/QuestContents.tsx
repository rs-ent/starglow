import QuestToday from "./QuestToday";
import { Player, Daily_Quests } from "@prisma/client";

interface QuestContentsProps {
    contentType?: "dailyQuest" | "Missions" | "Referral";
    playerId: Player["id"];
    dailyQuests?: Daily_Quests[];
    completedQuests?: { questId: string }[];
}

export default function QuestContents({
    contentType = "dailyQuest",
    playerId,
    dailyQuests = [],
    completedQuests = [],
}: QuestContentsProps) {
    if (contentType === "dailyQuest") {
        return (
            <div
                className="
                    flex justify-center items-center 
                "
            >
                <QuestToday
                    playerId={playerId}
                    dailyQuests={dailyQuests}
                    completedQuests={completedQuests}
                />
            </div>
        );
    }
}
