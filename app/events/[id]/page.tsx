import { Metadata } from "next";
import EventsDetail from "@/components/organisms/EventsDetail";
import { getEventById } from "@/app/actions/events";
import { notFound } from "next/navigation";

interface EventPageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({
    params,
}: EventPageProps): Promise<Metadata> {
    try {
        // 비동기로 params에서 id 추출
        const { id } = await params;
        const event = await getEventById(id);

        if (!event) {
            return {
                title: "Event Not Found | Starglow",
                description: "The requested event could not be found.",
            };
        }

        return {
            title: `${event.title} | Starglow Events`,
            description:
                event.description || "Join this exciting event by Starglow",
            openGraph: event.bannerImg
                ? {
                      images: [event.bannerImg],
                  }
                : undefined,
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "Event | Starglow",
            description: "View event details",
        };
    }
}

export default async function EventPage({ params }: EventPageProps) {
    try {
        // 비동기로 params에서 id 추출
        const { id } = await params;

        // 이벤트 데이터 비동기 페칭
        const event = await getEventById(id);

        // 이벤트가 없을 경우 404 페이지로
        if (!event) {
            notFound();
        }

        // 데이터가 있을 경우 컴포넌트 렌더링
        return <EventsDetail eventId={id} />;
    } catch (error) {
        // 오류 발생 시 에러 페이지 표시
        console.error("Error loading event:", error);
        notFound();
    }
}
