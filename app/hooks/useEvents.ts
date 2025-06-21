/// app\hooks\useEvents.ts

import { useState } from "react";

import { Events } from "@prisma/client";

import {
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
} from "@/app/mutations/eventsMutations";
import { useEventsQuery, useEventQuery } from "@/app/queries/eventsQueries";

import { useToast } from "./useToast";

import type { EventCategory, EventStatus} from "@prisma/client";

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
    const toast = useToast();
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
    const [isDeletingEvent, setIsDeletingEvent] = useState(false);

    const {
        data: eventsData,
        isLoading: isLoadingEvents,
        error: eventsError,
    } = useEventsQuery({
        category,
        status,
        page,
        limit,
    });

    const createEventMutation = useCreateEvent();
    const updateEventMutation = useUpdateEvent();
    const deleteEventMutation = useDeleteEvent();

    const createEvent = async (formData: FormData) => {
        setIsCreatingEvent(true);
        try {
            const result = await createEventMutation.mutateAsync(formData);
            if (result.success) {
                toast.success("Event created successfully");
            } else {
                toast.error(`Failed to create event: ${result.error}`);
            }
            return result;
        } catch (error) {
            toast.error(`Failed to create event: ${error}`);
            console.error("Failed to create event:", error);
            throw error;
        } finally {
            setIsCreatingEvent(false);
        }
    };

    const updateEvent = async (id: string, formData: FormData) => {
        setIsUpdatingEvent(true);
        try {
            const result = await updateEventMutation.mutateAsync({
                id,
                formData,
            });
            if (result.success) {
                toast.success("Event updated successfully");
            } else {
                toast.error(`Failed to update event: ${result.error}`);
            }
            return result;
        } catch (error) {
            toast.error(`Failed to update event: ${error}`);
            console.error("Failed to update event:", error);
            throw error;
        } finally {
            setIsUpdatingEvent(false);
        }
    };

    const deleteEvent = async (id: string) => {
        setIsDeletingEvent(true);
        try {
            const result = await deleteEventMutation.mutateAsync(id);
            if (result.success) {
                toast.success("Event deleted successfully");
            } else {
                toast.error(`Failed to delete event: ${result.error}`);
            }
            return result;
        } catch (error) {
            toast.error(`Failed to delete event: ${error}`);
            console.error("Failed to delete event:", error);
            throw error;
        } finally {
            setIsDeletingEvent(false);
        }
    };

    return {
        events: eventsData?.events || [],
        total: eventsData?.total || 0,
        totalPages: eventsData?.totalPages || 0,
        isLoading: isLoadingEvents,
        error: eventsError,
        createEvent,
        updateEvent,
        deleteEvent,
        isCreating: isCreatingEvent,
        isUpdating: isUpdatingEvent,
        isDeleting: isDeletingEvent,
    };
}

export function useEvent(id: string) {
    const { data: event, isLoading, error } = useEventQuery(id);

    const { updateEvent, deleteEvent, isUpdating, isDeleting } = useEvents({});

    return {
        event,
        isLoading,
        error,
        updateEvent: (formData: FormData) => updateEvent(id, formData),
        deleteEvent: () => deleteEvent(id),
        isUpdating,
        isDeleting,
    };
}
