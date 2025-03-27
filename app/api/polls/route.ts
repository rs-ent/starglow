/// app\app\api\polls\route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; 
import { prisma } from "@/lib/prisma/client";
import { Polls } from "@prisma/client";

// GET - Poll by ID
export async function GET(): Promise<NextResponse<apiResponse<Polls[]>>> {
    try {
        const polls = await prisma.polls.findMany();
        return NextResponse.json({
            success: true,
            data: polls,
            message: "Polls fetched successfully",
            status: 200
        }, { status: 200 });
    } catch (error) {
        console.error("[Polls][GET] Error: ", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch polls",
            status: 500
        }, { status: 500 });
    }
}

// POST - Create Poll
export async function POST(request: Request): Promise<NextResponse<apiResponse<Polls>>> {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized",
            status: 401
        }, { status: 401 });
    }

    try {
        const data = await request.json();
        const newPoll = await prisma.polls.create({ data });

        return NextResponse.json({
            success: true,
            data: newPoll,
            message: "Poll created successfully",
            status: 201
        }, { status: 201 });
    } catch (error) {
        console.error("[Polls][POST] Error: ", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create poll",
            status: 500
        }, { status: 500 });
    }
}