/// components/organisms/QuestToday.tsx

"use client";

import { useState, useEffect } from "react";
import { H2 } from "../atoms/Typography";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import MediaCarousel, { CarouselItem } from "../molecules/MediaCarousel";
import InviteFriends from "../atoms/InviteFriends";
import DailyQuests from "../molecules/DailyQuest";
import Icon from "../atoms/Icon";
import { Loader2 } from "lucide-react";
import { Quest } from "@prisma/client";
import { useQuests } from "@/app/hooks/useQuest";
import PartialLoading from "../atoms/PartialLoading";

interface QuestTodayProps {
    playerId: string;
    completedQuests: string[];
}

export default function QuestToday({
    playerId,
    completedQuests,
}: QuestTodayProps) {
    const { getDailyQuests } = useQuests();
    const { quests: dailyQuests, isLoading: isLoadingDailyQuests } =
        getDailyQuests();

    const [carouselQuests, setCarouselQuests] = useState<CarouselItem[]>([]);
    const [selectedDailyQuests, setSelectedDailyQuests] = useState<Quest[]>([]);

    useEffect(() => {
        if (!dailyQuests.length) {
            return;
        }

        const carouselItems = dailyQuests
            .filter((quest) => quest.type?.toLocaleLowerCase() === "carousel")
            .map((quest) => {
                return {
                    type: "youtube" as const,
                    videoId: extractYoutubeVideoId(quest.url) ?? "",
                    artist: quest.title.split(" - ")[0],
                    title: quest.title.split(" - ")[1],
                };
            });
        setCarouselQuests(carouselItems);

        const selectedQuests = dailyQuests.filter(
            (quest) => quest.type?.toLocaleLowerCase() !== "carousel"
        );
        setSelectedDailyQuests(selectedQuests);
    }, [dailyQuests]);

    if (isLoadingDailyQuests || !dailyQuests.length) {
        return <PartialLoading text="Loading daily quests..." />;
    }

    const questDate = new Date(dailyQuests[0].startDate ?? new Date());

    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center justify-center w-full">
                <Icon svg="/elements/el03.svg" size={45} />

                <H2
                    className={cn(
                        "text-center mb-1 break-words",
                        getResponsiveClass(40).textClass
                    )}
                >
                    {`${
                        questDate.getMonth() + 1
                    }/${questDate.getDate()} Today's Song`}
                </H2>
                <div className="flex items-center justify-center w-full h-full px-4 mb-8">
                    {carouselQuests.length ? (
                        <MediaCarousel
                            items={carouselQuests}
                            className="w-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full p-4">
                            <Loader2 className="w-12 h-12 animate-spin text-white" />
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-center w-full h-full p-4">
                    <InviteFriends />
                </div>

                <div className="flex items-center justify-center w-full h-full p-4">
                    <DailyQuests
                        playerId={playerId}
                        dailyQuests={selectedDailyQuests}
                        completedQuests={completedQuests}
                    />
                </div>
            </div>
        </div>
    );
}

function extractYoutubeVideoId(url: string | null | undefined): string | null {
    if (!url) return null;

    // 일반 유튜브 URL (https://www.youtube.com/watch?v=VIDEO_ID)
    let match = url.match(
        /(?:\?v=|&v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
    );

    if (match && match[1]) {
        return match[1];
    }

    // 쿼리 파라미터가 없는 임베드 URL (https://www.youtube.com/embed/VIDEO_ID)
    match = url.match(/\/embed\/([^/?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    // 짧은 URL (https://youtu.be/VIDEO_ID)
    match = url.match(/youtu\.be\/([^/?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    // 쇼츠 URL (https://youtube.com/shorts/VIDEO_ID)
    match = url.match(/\/shorts\/([^/?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
}
