import QuestDaily from "./QuestDaily";
import { Player } from "@prisma/client";

interface QuestContentsProps {
    contentType?: "dailyQuest" | "Missions" | "Referral";
    playerId: Player["id"];
}

export default function QuestContents({
    contentType = "dailyQuest",
    playerId,
}: QuestContentsProps) {
    if (contentType === "dailyQuest") {
        return (
            <div
                className="
                    flex justify-center items-center 
                "
            >
                <QuestDaily playerId={playerId} />
            </div>
        );
    }
}
