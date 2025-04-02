/// app\api\admin\quests\missions\banner-images\route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";
import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const images = await prisma.storedImage.findMany({
            where: {
                onBanner: true,
            },
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(images);
    } catch (error) {
        console.error("Error fetching banner images:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return new NextResponse("No files provided", { status: 400 });
        }

        const uploadedImages = await Promise.all(
            files.map(async (file) => {
                const fileExt = file.name.split(".").pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = fileName;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } =
                    await supabase.storage
                        .from("banner-images")
                        .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabase.storage
                    .from("banner-images")
                    .getPublicUrl(filePath);

                // Save to database
                return prisma.storedImage.create({
                    data: {
                        url: publicUrl,
                        type: "banner",
                        alt: file.name,
                        mimeType: file.type,
                        sizeBytes: file.size,
                        onBanner: true,
                    },
                });
            })
        );

        return NextResponse.json(uploadedImages);
    } catch (error) {
        console.error("Error uploading banner images:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { imageId, newOrder } = await request.json();

        if (!imageId || typeof newOrder !== "number") {
            return new NextResponse("Invalid request", { status: 400 });
        }

        const updatedImage = await prisma.storedImage.update({
            where: { id: imageId },
            data: { order: newOrder },
        });

        return NextResponse.json(updatedImage);
    } catch (error) {
        console.error("Error updating image order:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
