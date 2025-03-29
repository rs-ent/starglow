/// app/api/quests/daily/latest/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

// GET /api/quests/daily/latest
export async function GET() {
    try {
        const latestQuest = await prisma.daily_Quests.findFirst({
            orderBy: { Date: 'desc' },
            select: { Date: true },
        });

        if (!latestQuest) {
            console.info('[Daily Quests][Latest] No daily quests found');
            return NextResponse.json({ error: 'No daily quests found' }, { status: 404 });
        }

        const latestDailyQuests = await prisma.daily_Quests.findMany({
            where: { Date: latestQuest.Date },
        });

        console.info('[Daily Quests][Latest] Latest daily quests found:', latestDailyQuests);
        return NextResponse.json(latestDailyQuests, { status: 200 });
    } catch (error) {
        console.error('[Daily Quests][Latest] Error fetching latest daily quests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}