/// app\queries\eventQueries.ts

import { useQuery } from "@tanstack/react-query";

import { getEvents, getEventById } from "@/app/actions/events";

import type { EventCategory, EventStatus, Events } from "@prisma/client";

type EventsResponse = {
    events: Events[];
    total: number;
    totalPages: number;
};

export function useEventsQuery({
    category,
    status,
    page = 1,
    limit = 10,
    enabled = true,
}: {
    category?: EventCategory;
    status?: EventStatus;
    page?: number;
    limit?: number;
    enabled?: boolean;
}) {
    return useQuery<EventsResponse>({
        queryKey: ["events", category, status, page, limit],
        queryFn: () => getEvents({ category, status, page, limit }),
        enabled,
    });
}

export function useEventQuery(id: string) {
    return useQuery<Events | null>({
        queryKey: ["events", id],
        queryFn: () => getEventById(id),
        enabled: !!id,
    });
}
