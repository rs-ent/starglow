/// components/organisms/QuestMissions.tsx

import QuestList from "../molecules/QuestList";
import InviteFriends from "../atoms/InviteFriends";
import Icon from "../atoms/Icon";
import { H2 } from "../atoms/Typography";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { Player, Quest } from "@prisma/client";
import MediaCarousel, { CarouselItem } from "../molecules/MediaCarousel";
import { Loader2 } from "lucide-react";

interface QuestMissionsProps {
    playerId: Player["id"];
    quests: Quest[];
    completedQuests: { questId: string }[];
}

export default function QuestMissions({
    playerId,
    quests = [],
    completedQuests = [],
}: QuestMissionsProps) {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center justify-center">
                <Icon svg="/elements/el03.svg" size={45} />

                <H2
                    className={cn(
                        "text-center mb-1 break-words",
                        getResponsiveClass(40).textClass
                    )}
                >
                    Missions
                </H2>

                {/*<div className="flex items-center justify-center w-full h-full max-w-[900px] px-4 mb-8">
                    {banners.length ? (
                        <MediaCarousel
                            items={banners}
                            className="w-full max-w-[90vw]"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full p-4">
                            <Loader2 className="w-12 h-12 animate-spin text-white" />
                        </div>
                    )}
                </div>*/}

                <div className="flex items-center justify-center w-full h-full p-4">
                    <QuestList
                        playerId={playerId}
                        quests={quests}
                        completedQuests={completedQuests}
                    />
                </div>
                <div className="flex items-center justify-center w-full h-full p-4">
                    <InviteFriends />
                </div>
            </div>
        </div>
    );
}
