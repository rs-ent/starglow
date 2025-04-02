import { EventCategory, EventStatus } from "@prisma/client";
import Image from "next/image";
interface Event {
    id: string;
    category: EventCategory;
    status: EventStatus;
    title: string;
    location: string | null;
    bannerImg: string | null;
}

interface EventsProps {
    events: Event[];
}

export default function Events({ events }: EventsProps) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <Image
                                src={event.bannerImg || ""}
                                alt={event.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold mb-2">
                                {event.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {event.location}
                            </p>
                            <p className="text-sm text-gray-600">
                                {event.category}
                            </p>
                            <p className="text-sm text-gray-600">
                                {event.status}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
