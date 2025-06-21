import {Suspense} from "react";

import {notFound} from "next/navigation";

import {getEventById} from "@/app/actions/events";
import EventsDetail from "@/components/events/EventsDetail";


interface EventPageProps {
    params: {
        id: string;
    };
}

// 로딩 상태 컴포넌트
function EventLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
            <p className="text-foreground/70 font-main text-sm md:text-base">
                Loading event details...
            </p>
        </div>
    );
}

// 이벤트 데이터를 가져오는 컴포넌트
async function EventContent({ id }: { id: string }) {
    try {
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
        return null;
    }
}

export default function EventPage({ params }: EventPageProps) {
    return (
        <Suspense fallback={<EventLoading />}>
            <EventContent id={params.id} />
        </Suspense>
    );
}
