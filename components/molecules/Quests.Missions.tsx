/// components/molecules/Missions.tsx

import { Player, Quest, QuestLog } from "@prisma/client";
import QuestsButton from "../atoms/Quests.Button";
import PartialLoading from "../atoms/PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { motion } from "framer-motion";
interface QuestsMissionsProps {
    player: Player;
    quests: Quest[];
    questLogs: QuestLog[];
    isLoading: boolean;
    error: Error | null;
    permission: boolean;
    tokenGatingResult?: AdvancedTokenGateResult | null;
}

export default function QuestsMissions({
    player,
    quests,
    questLogs,
    isLoading = true,
    error = null,
    permission = false,
    tokenGatingResult,
}: QuestsMissionsProps) {
    if (isLoading) {
        return <PartialLoading text="Quest lists are loading..." size="sm" />;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="relative transition-all duration-700">
            {!permission && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="flex flex-col items-center gap-4">
                        <img
                            src="/icons/lock.svg"
                            alt="lock"
                            className={cn(
                                getResponsiveClass(70).frameClass,
                                "aspect-square"
                            )}
                        />
                        <p
                            className={cn(
                                getResponsiveClass(20).textClass,
                                "text-center whitespace-break-spaces"
                            )}
                        >
                            NFT Holder can only access to it.
                        </p>
                    </div>
                </div>
            )}
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
                    />
                ))}
            </div>
        </div>
    );
}
