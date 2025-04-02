import QuestToday from "./QuestToday";
import QuestMissions from "./QuestMissions";
import { Player, Quest, StoredImage } from "@prisma/client";

interface QuestContentsProps {
    contentType?: string;
    playerId: Player["id"];
    dailyQuests?: Quest[];
    missions?: Quest[];
    completedQuests?: { questId: string }[];
    banners: Pick<StoredImage, "id" | "url">[];
}

export default function QuestContents({
    contentType = "Today",
    playerId,
    dailyQuests = [],
    missions = [],
    completedQuests = [],
    banners = [],
}: QuestContentsProps) {
    if (contentType === "Today") {
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
    } else if (contentType === "Missions") {
        return (
            <div>
                <QuestMissions
                    playerId={playerId}
                    quests={missions}
                    completedQuests={completedQuests}
                    banners={banners}
                />
            </div>
        );
    }
}
