/// components/organisms/QuestMissions.tsx

import QuestList from "../molecules/QuestList";
import InviteFriends from "../atoms/InviteFriends";
import Icon from "../atoms/Icon";
import { H2 } from "../atoms/Typography";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { Player, Quest, StoredImage } from "@prisma/client";
import MediaCarousel, { CarouselItem } from "../molecules/MediaCarousel";
import { Loader2 } from "lucide-react";

interface QuestMissionsProps {
    playerId: Player["id"];
    banners: Pick<StoredImage, "id" | "url">[];
    quests: Quest[];
    completedQuests: { questId: string }[];
}

export default function QuestMissions({
    playerId,
    banners = [],
    quests = [],
    completedQuests = [],
}: QuestMissionsProps) {
    const carouselItems: CarouselItem[] = banners.map((image, index) => ({
        type: "image",
        url: image.url,
        title: `Banner Image ${index + 1}`,
        img: image.url,
    }));

    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center justify-center">
                <H2
                    className={cn(
                        "text-center mb-1 break-words",
                        getResponsiveClass(40).textClass
                    )}
                >
                    Missions
                </H2>

                <div className="flex items-center justify-center w-full h-full max-w-[900px] px-4">
                    {carouselItems.length ? (
                        <MediaCarousel
                            items={carouselItems}
                            autoplay={true}
                            autoplaySpeed={5000}
                            infinite={true}
                            dots={false}
                            arrows={false}
                            centerMode={true}
                            centerPadding="0px"
                            adaptiveHeight={true}
                            showTitle={false}
                            framePadding={1}
                            className="w-full max-w-[90vw]"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full p-4">
                            <Loader2 className="w-12 h-12 animate-spin text-white" />
                        </div>
                    )}
                </div>

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
