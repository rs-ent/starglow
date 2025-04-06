/// app\mutations\eventsMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/events";
import { Events } from "@prisma/client";

type EventResponse = {
    success: boolean;
    event?: Events;
    error?: string;
};

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation<EventResponse, Error, FormData>({
        mutationFn: createEvent,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation<
        EventResponse,
        Error,
        { id: string; formData: FormData }
    >({
        mutationFn: ({ id, formData }) => updateEvent(id, formData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            queryClient.invalidateQueries({
                queryKey: ["events", variables.id],
            });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation<EventResponse, Error, string>({
        mutationFn: deleteEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });
}
