/// app\api\admin\quests\missions\banner-images\[id]\route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const image = await prisma.storedImage.findUnique({
            where: { id: params.id },
        });

        if (!image) {
            return new NextResponse("Image not found", { status: 404 });
        }

        await prisma.storedImage.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
