/// components/molecules/Missions.tsx

import { Player, Quest, QuestLog, ReferralLog } from "@prisma/client";
import QuestsButton from "../atoms/Quests.Button";
import PartialLoading from "../atoms/PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { motion } from "framer-motion";
import Doorman from "../atoms/Doorman";
interface QuestsMissionsProps {
    player: Player;
    quests: Quest[];
    questLogs: QuestLog[];
    isLoading: boolean;
    error: Error | null;
    permission: boolean;
    tokenGatingResult?: AdvancedTokenGateResult | null;
    referralLogs: ReferralLog[];
}

export default function QuestsMissions({
    player,
    quests,
    questLogs,
    isLoading = true,
    error = null,
    permission = false,
    tokenGatingResult,
    referralLogs,
}: QuestsMissionsProps) {
    if (isLoading) {
        return <PartialLoading text="Quest lists are loading..." size="sm" />;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="relative transition-all duration-700">
            {!permission && <Doorman />}
            <div
                className={cn(
                    "flex flex-col gap-4 my-4",
                    !permission && "blur-sm"
                )}
            >
                {quests.map((quest, index) => (
                    <QuestsButton
                        key={quest.id}
                        player={player}
                        quest={quest}
                        questLog={questLogs.find(
                            (log) => log.questId === quest.id
                        )}
                        tokenGatingResult={tokenGatingResult}
                        permission={permission}
                        index={index}
                        referralLogs={referralLogs}
                    />
                ))}
            </div>
        </div>
    );
}
