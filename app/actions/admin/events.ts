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
    url: z.string().optional(),
    status: z.nativeEnum(EventStatus),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    location: z.string().optional(),
    price: z.number().optional(),
    bannerImg: z.string().optional(),
    galleryImgs: z.array(z.string()).optional(),
    detailImg: z.record(z.string()).optional(),
    content: z.record(z.string()).optional(),
});

export async function createEvent(formData: FormData) {
    try {
        console.log("createEvent called with FormData");

        // Debug FormData entries
        console.log("FormData entries:");
        for (const [key, value] of formData.entries()) {
            console.log(
                `${key}: ${
                    typeof value === "string" ? value : "File or other type"
                }`
            );
        }

        const bannerImgFile = formData.get("bannerImg") as File;
        const galleryImgFiles = formData.getAll("galleryImgs") as File[];

        let bannerImgUrl = "";
        let galleryImgUrls: string[] = [];

        // Upload banner image if exists
        if (
            bannerImgFile &&
            bannerImgFile instanceof File &&
            bannerImgFile.size > 0
        ) {
            console.log("Processing banner image", bannerImgFile.name);
            const fileExt = bannerImgFile.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `events/${fileName}`;

            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("events")
                    .upload(filePath, bannerImgFile);

            if (uploadError) {
                console.error("Banner upload error:", uploadError);
                throw uploadError;
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("events").getPublicUrl(filePath);

            bannerImgUrl = publicUrl;
            console.log("Banner image uploaded:", bannerImgUrl);
        } else if (typeof bannerImgFile === "string" && bannerImgFile) {
            // If it's already a URL
            bannerImgUrl = bannerImgFile;
            console.log("Banner image URL found:", bannerImgUrl);
        }

        // Upload gallery images if exist
        if (galleryImgFiles.length > 0 && galleryImgFiles[0] instanceof File) {
            console.log("Processing gallery images", galleryImgFiles.length);
            galleryImgUrls = await Promise.all(
                galleryImgFiles.map(async (file) => {
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `events/${fileName}`;

                    const { data: uploadData, error: uploadError } =
                        await supabase.storage
                            .from("events")
                            .upload(filePath, file);

                    if (uploadError) {
                        console.error("Gallery upload error:", uploadError);
                        throw uploadError;
                    }

                    const {
                        data: { publicUrl },
                    } = supabase.storage.from("events").getPublicUrl(filePath);

                    return publicUrl;
                })
            );
            console.log("Gallery images uploaded:", galleryImgUrls.length);
        } else {
            // Try to parse gallery images from JSON string
            const galleryImgsJson = formData.get("galleryImgs");
            if (galleryImgsJson && typeof galleryImgsJson === "string") {
                try {
                    galleryImgUrls = JSON.parse(galleryImgsJson);
                    console.log(
                        "Gallery images parsed from JSON:",
                        galleryImgUrls.length
                    );
                } catch (e) {
                    console.error("Error parsing galleryImgs JSON:", e);
                }
            }
        }

        // Process detailImg for different languages
        const detailImg: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("detailImg_") && typeof value === "string") {
                const lang = key.replace("detailImg_", "");
                detailImg[lang] = value;
            }
        }
        console.log("Detail images found:", Object.keys(detailImg));

        // Get content from form data
        let content: Record<string, string> = {};
        const contentJson = formData.get("content");
        if (contentJson && typeof contentJson === "string") {
            try {
                content = JSON.parse(contentJson);
                console.log(
                    "Content parsed from JSON, languages:",
                    Object.keys(content)
                );
            } catch (e) {
                console.error("Error parsing content JSON:", e);
            }
        }

        // Get and coerce data values
        let category: EventCategory;
        try {
            category = formData.get("category") as EventCategory;
        } catch (e) {
            console.error("Error with category:", e);
            throw new Error("Invalid category");
        }

        let status: EventStatus;
        try {
            status = formData.get("status") as EventStatus;
        } catch (e) {
            console.error("Error with status:", e);
            throw new Error("Invalid status");
        }

        let startDate: Date;
        try {
            const startDateStr = formData.get("startDate") as string;
            console.log("Start date string:", startDateStr);
            startDate = new Date(startDateStr);
            console.log("Parsed start date:", startDate);
        } catch (e) {
            console.error("Error with startDate:", e);
            throw new Error("Invalid start date");
        }

        let endDate: Date;
        try {
            const endDateStr = formData.get("endDate") as string;
            console.log("End date string:", endDateStr);
            endDate = new Date(endDateStr);
            console.log("Parsed end date:", endDate);
        } catch (e) {
            console.error("Error with endDate:", e);
            throw new Error("Invalid end date");
        }

        let price: number | undefined = undefined;
        const priceStr = formData.get("price") as string;
        if (priceStr) {
            try {
                price = Number(priceStr);
                if (isNaN(price)) {
                    console.warn("Price is NaN, setting to undefined");
                    price = undefined;
                }
            } catch (e) {
                console.error("Error with price:", e);
            }
        }

        const data = {
            category,
            title: formData.get("title") as string,
            description: (formData.get("description") as string) || "",
            url: (formData.get("url") as string) || "",
            status,
            startDate,
            endDate,
            location: (formData.get("location") as string) || "",
            price,
            bannerImg: bannerImgUrl || undefined,
            galleryImgs: galleryImgUrls.length > 0 ? galleryImgUrls : undefined,
            detailImg:
                Object.keys(detailImg).length > 0 ? detailImg : undefined,
            content: Object.keys(content).length > 0 ? content : undefined,
        };

        console.log("Data before validation:", JSON.stringify(data, null, 2));

        try {
            const validatedData = eventSchema.parse(data);
            console.log("Validation successful");

            const event = await prisma.events.create({
                data: validatedData,
            });

            console.log("Event created successfully:", event.id);
            revalidatePath("/events");
            return { success: true, event };
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(
                    "Zod validation errors:",
                    JSON.stringify(error.errors, null, 2)
                );
                return {
                    success: false,
                    error: `Validation failed: ${error.errors[0]?.message}`,
                };
            }
            throw error;
        }
    } catch (error) {
        console.error("Error creating event:", error);
        return {
            success: false,
            error: `Failed to create event: ${
                error instanceof Error ? error.message : String(error)
            }`,
        };
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
