import QuestDaily from "./QuestDaily";

interface QuestContentsProps {
    contentType?: "dailyQuest" | "Missions" | "Referral";
}

export default function QuestContents({contentType = "dailyQuest"}: QuestContentsProps) {
    console.info("[QuestContents] contentType", contentType);
    if (contentType === "dailyQuest") {
        return (
            <div 
                className="
                    flex justify-center items-center 
                "
                >
                <QuestDaily />
            </div>
        );
    }
}