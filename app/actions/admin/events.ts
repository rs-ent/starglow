/// app\actions\admin\events.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { EventCategory, EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

const eventSchema = z.object({
    category: z.nativeEnum(EventCategory),
    title: z.string().min(1),
    description: z.string().optional(),
    url: z.string().url().optional(),
    status: z.nativeEnum(EventStatus),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    location: z.string().optional(),
    price: z.number().optional(),
    bannerImg: z.string().optional(),
    galleryImgs: z.array(z.string()).optional(),
});

export async function createEvent(formData: FormData) {
    try {
        const bannerImgFile = formData.get("bannerImg") as File;
        const galleryImgFiles = formData.getAll("galleryImgs") as File[];

        let bannerImgUrl = "";
        let galleryImgUrls: string[] = [];

        // Upload banner image if exists
        if (bannerImgFile) {
            const fileExt = bannerImgFile.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `events/${fileName}`;

            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("events")
                    .upload(filePath, bannerImgFile);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("events").getPublicUrl(filePath);

            bannerImgUrl = publicUrl;
        }

        // Upload gallery images if exist
        if (galleryImgFiles.length > 0) {
            galleryImgUrls = await Promise.all(
                galleryImgFiles.map(async (file) => {
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `events/${fileName}`;

                    const { data: uploadData, error: uploadError } =
                        await supabase.storage
                            .from("events")
                            .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const {
                        data: { publicUrl },
                    } = supabase.storage.from("events").getPublicUrl(filePath);

                    return publicUrl;
                })
            );
        }

        const data = {
            category: formData.get("category") as EventCategory,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            url: formData.get("url") as string,
            status: formData.get("status") as EventStatus,
            startDate: new Date(formData.get("startDate") as string),
            endDate: new Date(formData.get("endDate") as string),
            location: formData.get("location") as string,
            price: formData.get("price")
                ? Number(formData.get("price"))
                : undefined,
            bannerImg: bannerImgUrl,
            galleryImgs: galleryImgUrls,
        };

        const validatedData = eventSchema.parse(data);

        const event = await prisma.events.create({
            data: validatedData,
        });

        revalidatePath("/events");
        return { success: true, event };
    } catch (error) {
        console.error("Error creating event:", error);
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
                orderBy: { startDate: "asc" },
                skip,
                take: limit,
            }),
            prisma.events.count({ where }),
        ]);

        return {
            events,
            total,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching events:", error);
        return { events: [], total: 0, totalPages: 0 };
    }
}

export async function getEventById(id: string) {
    try {
        const event = await prisma.events.findUnique({
            where: { id },
        });
        return event;
    } catch (error) {
        console.error("Error fetching event:", error);
        return null;
    }
}
