/// app\actions\events.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { EventCategory, Events, EventStatus } from "@prisma/client";
import { requireAuth } from "../auth/authUtils";

export type CreateEventRequest = {
    title: string;
    description: string;
    category: EventCategory;
    status: EventStatus;
    startDate: Date;
    endDate: Date;
    location?: string;
    url?: string;
    price?: number;
    bannerImg?: string;
    galleryImgs?: string[];
    detailImg?: Record<string, string>;
    content?: Record<string, string>;
};

export async function createEvent(formData: FormData) {
    await requireAuth();

    try {
        const title = formData.get("title") as string;
        const description = (formData.get("description") as string) || "";
        const category = formData.get("category") as EventCategory;
        const status = formData.get("status") as EventStatus;
        const startDate = new Date(formData.get("startDate") as string);
        const endDate = new Date(formData.get("endDate") as string);
        const location = (formData.get("location") as string) || "";
        const url = (formData.get("url") as string) || "";
        const price = formData.get("price")
            ? Number(formData.get("price"))
            : undefined;
        const bannerImg = formData.get("bannerImg") as string;
        let galleryImgs: string[] = [];
        const galleryImgsValue = formData.get("galleryImgs");
        if (galleryImgsValue) {
            try {
                galleryImgs = JSON.parse(galleryImgsValue as string);
            } catch {
                if (typeof galleryImgsValue === "string") {
                    galleryImgs = [galleryImgsValue];
                }
            }
        }
        let detailImg = {};
        const detailImgValue = formData.get("detailImg");
        if (detailImgValue) {
            try {
                detailImg = JSON.parse(detailImgValue as string);
            } catch (e) {
                console.error("[CreateEvent] Error parsing detailImg:", e);
            }
        }

        let content = {};
        const contentValue = formData.get("content");
        if (contentValue) {
            try {
                content = JSON.parse(contentValue as string);
            } catch (e) {
                console.error("[CreateEvent] Error parsing content:", e);
            }
        }

        const eventData: CreateEventRequest = {
            title,
            description,
            category,
            status,
            startDate,
            endDate,
            location,
            url,
            price,
            bannerImg,
            galleryImgs,
            detailImg,
            content,
        };

        const event = await prisma.events.create({
            data: eventData,
        });

        return { success: true, event };
    } catch (error) {
        console.error("[CreateEvent] Error creating event:", error);
        return { success: false, error: "Failed to create event" };
    }
}

export async function getEvents({
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
    try {
        const skip = (page - 1) * limit;
        const where = {
            ...(category && { category }),
            ...(status && { status }),
            isActive: true,
        };

        const [events, total] = await Promise.all([
            prisma.events.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    startDate: "desc",
                },
            }),
            prisma.events.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return { events, total, totalPages };
    } catch (error) {
        console.error("[GetEvents] Error fetching events:", error);
        return { events: [], total: 0, totalPages: 0 };
    }
}

export async function getEventById(id: string): Promise<Events | null> {
    try {
        return await prisma.events.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("[GetEventById] Error fetching event:", error);
        return null;
    }
}

export async function updateEvent(id: string, formData: FormData) {
    await requireAuth();

    try {
        const existingEvent = await prisma.events.findUnique({
            where: { id },
        });

        if (!existingEvent) {
            throw new Error("Event not found");
        }

        const updateData: Partial<CreateEventRequest> = {};

        const title = formData.get("title") as string;
        if (title) updateData.title = title;

        const description = formData.get("description") as string;
        if (description !== null) updateData.description = description;

        const category = formData.get("category") as EventCategory;
        if (category) updateData.category = category;

        const status = formData.get("status") as EventStatus;
        if (status) updateData.status = status;

        const location = formData.get("location") as string;
        if (location !== null) updateData.location = location;

        const url = formData.get("url") as string;
        if (url !== null) updateData.url = url;

        const startDateStr = formData.get("startDate") as string;
        if (startDateStr) {
            const startDate = new Date(startDateStr);
            if (!isNaN(startDate.getTime())) updateData.startDate = startDate;
        }

        const endDateStr = formData.get("endDate") as string;
        if (endDateStr) {
            const endDate = new Date(endDateStr);
            if (!isNaN(endDate.getTime())) updateData.endDate = endDate;
        }

        const priceStr = formData.get("price") as string;
        if (priceStr) {
            const parsedPrice = Number(priceStr);
            if (!isNaN(parsedPrice)) {
                updateData.price = parsedPrice;
            } else if (priceStr.trim() === "") {
                updateData.price = undefined;
            }
        }

        const bannerImg = formData.get("bannerImg") as string;
        if (bannerImg !== undefined) {
            updateData.bannerImg = bannerImg || undefined;
        }

        const galleryImgsValue = formData.get("galleryImgs");
        if (galleryImgsValue) {
            try {
                updateData.galleryImgs = JSON.parse(galleryImgsValue as string);
            } catch {
                if (typeof galleryImgsValue === "string") {
                    updateData.galleryImgs = [galleryImgsValue];
                }
            }
        }

        const detailImgValue = formData.get("detailImg");
        if (detailImgValue) {
            try {
                updateData.detailImg = JSON.parse(detailImgValue as string);
            } catch (e) {
                console.error("[UpdateEvent] Error parsing detailImg:", e);
            }
        }

        const contentValue = formData.get("content");
        if (contentValue) {
            try {
                updateData.content = JSON.parse(contentValue as string);
            } catch (e) {
                console.error("[UpdateEvent] Error parsing content:", e);
            }
        }

        const updatedEvent = await prisma.events.update({
            where: { id },
            data: updateData,
        });

        return { success: true, event: updatedEvent };
    } catch (error) {
        console.error("[UpdateEvent] Error updating event:", error);
        return { success: false, error: "Failed to update event" };
    }
}

export async function deleteEvent(id: string) {
    await requireAuth();

    try {
        await prisma.events.delete({
            where: { id },
        });

        return { success: true };
    } catch (error) {
        console.error("[DeleteEvent] Error deleting event:", error);
        return { success: false, error: "Failed to delete event" };
    }
}
