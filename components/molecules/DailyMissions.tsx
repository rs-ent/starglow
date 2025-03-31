import { Daily_Quests } from "@prisma/client";
import MissionButton from "../atoms/MissionButton";
import { Player } from "@prisma/client";

interface DailyMissionProps {
    dailyMissions: Daily_Quests[];
    playerId: Player["id"];
}

export default function DailyMissions({
    dailyMissions,
    playerId,
}: DailyMissionProps) {
    return (
        <div className="relative flex w-full items-center justify-center px-3">
            <div className="relative w-full max-w-[820px] min-w-[270px]">
                <h3 className="text-start p-4 text-lg font-bold">
                    Daily Missions
                </h3>
                {dailyMissions.map((mission) => (
                    <div
                        key={mission.id}
                        className="flex items-center justify-between mb-3"
                    >
                        <MissionButton
                            mission={mission}
                            playerId={playerId}
                            questType="Daily"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
