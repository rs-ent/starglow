/// app/actions/boardModeration/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

export async function createModerationRule(data: {
    category: string;
    stopWords: string[];
    isActive?: boolean;
}) {
    try {
        const rule = await prisma.boardModerationRule.create({
            data: {
                category: data.category,
                stopWords: data.stopWords,
                isActive: data.isActive ?? true,
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: rule };
    } catch (error) {
        console.error("Error creating moderation rule:", error);
        return { success: false, error: "Failed to create moderation rule" };
    }
}

export async function getModerationRules(category?: string) {
    try {
        const rules = await prisma.boardModerationRule.findMany({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: category ? { category } : {},
            orderBy: { createdAt: "desc" },
        });

        return { success: true, data: rules };
    } catch (error) {
        console.error("Error fetching moderation rules:", error);
        return { success: false, error: "Failed to fetch moderation rules" };
    }
}

export async function updateModerationRule(
    ruleId: string,
    data: {
        category?: string;
        stopWords?: string[];
        isActive?: boolean;
    }
) {
    try {
        const rule = await prisma.boardModerationRule.update({
            where: { id: ruleId },
            data: {
                ...(data.category && { category: data.category }),
                ...(data.stopWords && { stopWords: data.stopWords }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: rule };
    } catch (error) {
        console.error("Error updating moderation rule:", error);
        return { success: false, error: "Failed to update moderation rule" };
    }
}

export async function deleteModerationRule(ruleId: string) {
    try {
        await prisma.boardModerationRule.delete({
            where: { id: ruleId },
        });

        revalidatePath("/admin/moderation");
        return { success: true };
    } catch (error) {
        console.error("Error deleting moderation rule:", error);
        return { success: false, error: "Failed to delete moderation rule" };
    }
}

export async function addStopWords(ruleId: string, newWords: string[]) {
    try {
        if (newWords.length === 0) {
            return { success: false, error: "No words to add" };
        }

        const rule = await prisma.boardModerationRule.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: ruleId },
            select: { stopWords: true },
        });

        if (!rule) {
            return { success: false, error: "Rule not found" };
        }

        const cleanNewWords = newWords
            .map((word) => word.trim().toLowerCase())
            .filter((word) => word.length > 0);

        const existingWordsSet = new Set(
            rule.stopWords.map((word) => word.toLowerCase())
        );
        const uniqueNewWords = cleanNewWords.filter(
            (word) => !existingWordsSet.has(word)
        );

        if (uniqueNewWords.length === 0) {
            return { success: false, error: "All words already exist" };
        }

        const updatedStopWords = [...rule.stopWords, ...uniqueNewWords];

        const updatedRule = await prisma.boardModerationRule.update({
            where: { id: ruleId },
            data: { stopWords: updatedStopWords },
        });

        revalidatePath("/admin/moderation");
        return {
            success: true,
            data: updatedRule,
            added: uniqueNewWords.length,
            duplicates: newWords.length - uniqueNewWords.length,
        };
    } catch (error) {
        console.error("Error adding stop words:", error);
        return { success: false, error: "Failed to add stop words" };
    }
}

export async function addStopWordsBulk(
    ruleId: string,
    newWords: string[],
    chunkSize: number = 500
) {
    try {
        if (newWords.length === 0) {
            return { success: false, error: "No words to add" };
        }

        const rule = await prisma.boardModerationRule.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: ruleId },
            select: { stopWords: true },
        });

        if (!rule) {
            return { success: false, error: "Rule not found" };
        }

        const cleanNewWords = newWords
            .map((word) => word.trim().toLowerCase())
            .filter((word) => word.length > 0);

        const existingWordsSet = new Set(
            rule.stopWords.map((word) => word.toLowerCase())
        );
        const uniqueNewWords = cleanNewWords.filter(
            (word) => !existingWordsSet.has(word)
        );

        if (uniqueNewWords.length === 0) {
            return { success: false, error: "All words already exist" };
        }

        let currentStopWords = [...rule.stopWords];
        let totalAdded = 0;

        for (let i = 0; i < uniqueNewWords.length; i += chunkSize) {
            const chunk = uniqueNewWords.slice(i, i + chunkSize);
            currentStopWords = [...currentStopWords, ...chunk];
            totalAdded += chunk.length;

            await prisma.boardModerationRule.update({
                where: { id: ruleId },
                data: { stopWords: currentStopWords },
            });
        }

        revalidatePath("/admin/moderation");
        return {
            success: true,
            added: totalAdded,
            duplicates: newWords.length - totalAdded,
            totalWords: currentStopWords.length,
        };
    } catch (error) {
        console.error("Error bulk adding stop words:", error);
        return { success: false, error: "Failed to bulk add stop words" };
    }
}

export async function removeStopWords(ruleId: string, wordsToRemove: string[]) {
    try {
        const rule = await prisma.boardModerationRule.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: ruleId },
            select: { stopWords: true },
        });

        if (!rule) {
            return { success: false, error: "Rule not found" };
        }

        const wordsToRemoveSet = new Set(
            wordsToRemove.map((word) => word.toLowerCase())
        );
        const updatedStopWords = rule.stopWords.filter(
            (word) => !wordsToRemoveSet.has(word.toLowerCase())
        );

        const removedCount = rule.stopWords.length - updatedStopWords.length;

        const updatedRule = await prisma.boardModerationRule.update({
            where: { id: ruleId },
            data: { stopWords: updatedStopWords },
        });

        revalidatePath("/admin/moderation");
        return {
            success: true,
            data: updatedRule,
            removed: removedCount,
        };
    } catch (error) {
        console.error("Error removing stop words:", error);
        return { success: false, error: "Failed to remove stop words" };
    }
}

export async function toggleRuleStatus(ruleId: string, isActive: boolean) {
    try {
        const rule = await prisma.boardModerationRule.update({
            where: { id: ruleId },
            data: { isActive },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: rule };
    } catch (error) {
        console.error("Error toggling rule status:", error);
        return { success: false, error: "Failed to toggle rule status" };
    }
}

export async function bulkUpdateStopWords(
    category: string,
    stopWords: string[]
) {
    try {
        const rules = await prisma.boardModerationRule.updateMany({
            where: { category },
            data: { stopWords },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: rules };
    } catch (error) {
        console.error("Error bulk updating stop words:", error);
        return { success: false, error: "Failed to bulk update stop words" };
    }
}
