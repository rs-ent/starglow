/// app\api\admin\quests\missions\banner-images\[id]\route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";
import { supabase } from "@/lib/supabase/client";

type Params = Promise<{ id: string }>;

export async function DELETE(request: Request, { params }: { params: Params }) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

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
            .from("banner-images")
            .remove([filePath]);

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
