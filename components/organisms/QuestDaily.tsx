/// components/organisms/QuestDaily.tsx

'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { H2 } from '../atoms/Typography';
import { getResponsiveClass } from '@/lib/utils/responsiveClass';
import { cn } from '@/lib/utils/tailwind';
import YoutubeCarousel, { CarouselItem } from '../molecules/YoutubeCarousel';
import { Daily_Quests } from '@prisma/client';
import { useLoading } from '@/hooks/useLoading';
import { notFound } from 'next/navigation';
import { getYoutubeVideoId } from '@/lib/utils/youtube';
import InviteFriends from '../atoms/InviteFriends';
import DailyMissions from '../molecules/DailyMissions';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

async function fetchOgImage(url: string): Promise<string> {
    try {
        const res = await fetch(`/api/get-og/image?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (res.ok && data.imageUrl) {
            return data.imageUrl;
        }
        throw new Error('No image found');
    } catch (error) {
        console.error('fetchOgImage Error:', error);
        return '/ui/default-poll-img.png';
    }
}

export default function QuestDaily() {
    const { data, error, isLoading } = useSWR<Daily_Quests[]>('/api/quests/daily/latest', fetcher);
    const { startLoading, endLoading } = useLoading();

    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
    const [dailyMissions, setDailyMissions] = useState<Daily_Quests[]>([]);

    useEffect(() => {
        if (isLoading) {
            startLoading();
            return;
        }

        if (!data) return;

        const fetchCarouselItems = async () => {
            const items = await Promise.all(
                data
                    .filter(
                        (quest) =>
                            (quest.Quest_Type === 'Youtube' || quest.Quest_Type === 'Website') &&
                            quest.URL &&
                            quest.Quest_Title
                    )
                    .map(async (quest): Promise<CarouselItem> => {
                        if (quest.Quest_Type === 'Youtube') {
                            return {
                                type: "youtube",
                                videoId: getYoutubeVideoId(quest.URL!)!,
                                artist: quest.Quest_Title!.split(' - ')[0],
                                title: quest.Quest_Title!.split(' - ')[1],
                            };
                        } else {
                            const imageUrl = await fetchOgImage(quest.URL!);

                            return {
                                type: "image",
                                url: quest.URL!,
                                title: quest.Quest_Title!,
                                img: imageUrl,
                            };
                        }
                    })
            );

            setCarouselItems(items);
            endLoading();
        };

        fetchCarouselItems();

        setDailyMissions(
            data.filter(
                (quest) =>
                    quest.Quest_Type !== 'Youtube' &&
                    quest.URL &&
                    quest.Quest_Title
            )
        );
    }, [data, isLoading, startLoading, endLoading]);

    if (error) {
        console.error("[QuestDaily] error", error);
        return notFound();
    }

    if (!data) return null;

    const questDate = new Date(data[0].Date ?? new Date());

    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center justify-center">
                <img
                    src="/elements/el03.svg"
                    alt="el03"
                    className={cn("mb-4", getResponsiveClass(40).frameClass)}
                    style={{ width: '200px', height: 'auto' }}
                />

                <H2 className={cn("text-center mb-1 break-words", getResponsiveClass(40).textClass)}>
                    {`${questDate.getMonth() + 1}/${questDate.getDate()} Today's Song`}
                </H2>
                <div className="flex items-center justify-center w-full h-full max-w-[900px] px-4 mb-8">
                    {carouselItems.length ? (
                        <YoutubeCarousel
                            items={carouselItems}
                            className="w-full max-w-[90vw]"
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
                    <DailyMissions dailyMissions={dailyMissions} />
                </div>
            </div>
        </div>
    );
}