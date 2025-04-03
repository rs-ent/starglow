"use client";

import { EventCategory, EventStatus, Events } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createEvent,
    getEvents,
    getEventById,
} from "@/app/actions/admin/events";

type CreateEventResult = {
    success: boolean;
    event?: Events;
    error?: string;
};

// Define return type for getEvents function
type EventsResult = {
    events: Events[];
    total: number;
    totalPages: number;
};

export function useEvents({
    category,
    status,
    page = 1,
    limit = 10,
}: {
    category?: EventCategory;
    status?: EventStatus;
    page?: number;
    limit?: number;
}) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<EventsResult>({
        queryKey: ["events", { category, status, page, limit }],
        queryFn: () => getEvents({ category, status, page, limit }),
    });

    const createEventMutation = useMutation<CreateEventResult, Error, FormData>(
        {
            mutationFn: createEvent,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["events"] });
            },
        }
    );

    return {
        events: data?.events || [],
        total: data?.total || 0,
        totalPages: data?.totalPages || 0,
        isLoading,
        error,
        createEvent: createEventMutation.mutate,
        isCreating: createEventMutation.isPending,
    };
}

export function useEvent(id: string) {
    const { data, isLoading, error } = useQuery<Events | null>({
        queryKey: ["event", id],
        queryFn: () => getEventById(id),
    });

    return {
        event: data,
        isLoading,
        error,
    };
}
