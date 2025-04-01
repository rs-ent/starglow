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
            orderBy: {
                createdAt: "desc",
            },
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
                const filePath = `banner-images/${fileName}`;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } =
                    await supabase.storage
                        .from("public")
                        .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabase.storage.from("public").getPublicUrl(filePath);

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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;

        // Get image from database
        const image = await prisma.storedImage.findUnique({
            where: { id },
        });

        if (!image) {
            return new NextResponse("Image not found", { status: 404 });
        }

        // Extract file path from URL
        const filePath = image.url.split("/").pop();
        if (!filePath) {
            return new NextResponse("Invalid file path", { status: 400 });
        }

        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from("public")
            .remove([`banner-images/${filePath}`]);

        if (storageError) {
            console.error("Error deleting from storage:", storageError);
            return new NextResponse("Error deleting file", { status: 500 });
        }

        // Delete from database
        await prisma.storedImage.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting banner image:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
