/// app/actions/boardModeration/report-actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import {
    BoardModerationReportType,
    BoardModerationReportStatus,
} from "@prisma/client";

export async function createUserReport(data: {
    boardId: string;
    postId?: string;
    commentId?: string;
    reporterId: string;
    offenderId: string;
    reason: string;
    type?: BoardModerationReportType;
}) {
    try {
        const existingReport = await prisma.boardModerationReport.findFirst({
            where: {
                reporterId: data.reporterId,
                boardId: data.boardId,
                postId: data.postId || null,
                commentId: data.commentId || null,
            },
        });

        if (existingReport) {
            return { success: false, error: "Report already exists" };
        }

        const report = await prisma.boardModerationReport.create({
            data: {
                boardId: data.boardId,
                postId: data.postId || null,
                commentId: data.commentId || null,
                reporterId: data.reporterId,
                offenderId: data.offenderId,
                reason: data.reason,
                type: data.type || BoardModerationReportType.USER_REPORT,
                status: BoardModerationReportStatus.PENDING,
            },
            include: {
                reporter: { select: { name: true, nickname: true } },
                offender: { select: { name: true, nickname: true } },
                post: { select: { title: true, content: true } },
                comment: { select: { content: true } },
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: report };
    } catch (error) {
        console.error("Error creating user report:", error);
        return { success: false, error: "Failed to create report" };
    }
}

export async function getModerationQueue(filters?: {
    status?: BoardModerationReportStatus;
    type?: BoardModerationReportType;
    boardId?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.type) where.type = filters.type;
        if (filters?.boardId) where.boardId = filters.boardId;

        const [reports, total] = await Promise.all([
            prisma.boardModerationReport.findMany({
                where,
                include: {
                    reporter: {
                        select: { id: true, name: true, nickname: true },
                    },
                    offender: {
                        select: { id: true, name: true, nickname: true },
                    },
                    post: { select: { id: true, title: true, content: true } },
                    comment: { select: { id: true, content: true } },
                    board: { select: { id: true, name: true } },
                    relatedRule: { select: { id: true, category: true } },
                },
                orderBy: [{ status: "asc" }, { createdAt: "desc" }],
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
            }),
            prisma.boardModerationReport.count({ where }),
        ]);

        return { success: true, data: reports, total };
    } catch (error) {
        console.error("Error fetching moderation queue:", error);
        return { success: false, error: "Failed to fetch moderation queue" };
    }
}

export async function reviewModerationReport(
    reportId: string,
    decision: {
        status: BoardModerationReportStatus;
        reviewResult: string;
        reviewBy: string;
    }
) {
    try {
        const report = await prisma.boardModerationReport.update({
            where: { id: reportId },
            data: {
                status: decision.status,
                reviewResult: decision.reviewResult,
                reviewBy: decision.reviewBy,
                reviewAt: new Date(),
            },
            include: {
                offender: { select: { id: true, name: true } },
                post: { select: { id: true } },
                comment: { select: { id: true } },
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: report };
    } catch (error) {
        console.error("Error reviewing moderation report:", error);
        return { success: false, error: "Failed to review report" };
    }
}

export async function processModerationAction(
    reportId: string,
    action: {
        type: "HIDE" | "DELETE" | "WARN" | "BAN" | "RESTORE";
        reason: string;
        duration?: number;
        reviewBy: string;
    }
) {
    try {
        const report = await prisma.boardModerationReport.findUnique({
            where: { id: reportId },
            include: {
                post: true,
                comment: true,
                offender: true,
            },
        });

        if (!report) {
            return { success: false, error: "Report not found" };
        }

        const results = [];

        switch (action.type) {
            case "HIDE":
                if (report.postId) {
                    await prisma.boardPost.update({
                        where: { id: report.postId },
                        data: { isHidden: true },
                    });
                    results.push(`Post hidden: ${report.postId}`);
                }
                if (report.commentId) {
                    await prisma.boardComment.update({
                        where: { id: report.commentId },
                        data: { isHidden: true },
                    });
                    results.push(`Comment hidden: ${report.commentId}`);
                }
                break;

            case "DELETE":
                if (report.postId) {
                    await prisma.boardPost.delete({
                        where: { id: report.postId },
                    });
                    results.push(`Post deleted: ${report.postId}`);
                }
                if (report.commentId) {
                    await prisma.boardComment.delete({
                        where: { id: report.commentId },
                    });
                    results.push(`Comment deleted: ${report.commentId}`);
                }
                break;

            case "WARN":
                if (report.offender) {
                    await prisma.player.update({
                        where: { id: report.offender.id },
                        data: {
                            boardReputationScore: { decrement: 10 },
                            boardTrustLevel: { decrement: 1 },
                        },
                    });
                    results.push(`User warned: ${report.offender.name}`);
                }
                break;

            case "BAN":
                if (report.offender) {
                    await prisma.player.update({
                        where: { id: report.offender.id },
                        data: {
                            boardReputationScore: { decrement: 50 },
                            boardTrustLevel: 0,
                        },
                    });
                    results.push(`User penalized: ${report.offender.name}`);
                }
                break;

            case "RESTORE":
                if (report.postId) {
                    await prisma.boardPost.update({
                        where: { id: report.postId },
                        data: { isHidden: false },
                    });
                    results.push(`Post restored: ${report.postId}`);
                }
                if (report.commentId) {
                    await prisma.boardComment.update({
                        where: { id: report.commentId },
                        data: { isHidden: false },
                    });
                    results.push(`Comment restored: ${report.commentId}`);
                }
                break;
        }

        await prisma.boardModerationReport.update({
            where: { id: reportId },
            data: {
                status: BoardModerationReportStatus.RESOLVED,
                reviewResult: `${action.type}: ${
                    action.reason
                }. Actions: ${results.join(", ")}`,
                reviewBy: action.reviewBy,
                reviewAt: new Date(),
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, actions: results };
    } catch (error) {
        console.error("Error processing moderation action:", error);
        return { success: false, error: "Failed to process moderation action" };
    }
}

export async function bulkProcessReports(
    reportIds: string[],
    action: {
        status: BoardModerationReportStatus;
        reviewResult: string;
        reviewBy: string;
    }
) {
    try {
        const result = await prisma.boardModerationReport.updateMany({
            where: { id: { in: reportIds } },
            data: {
                status: action.status,
                reviewResult: action.reviewResult,
                reviewBy: action.reviewBy,
                reviewAt: new Date(),
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, updated: result.count };
    } catch (error) {
        console.error("Error bulk processing reports:", error);
        return { success: false, error: "Failed to bulk process reports" };
    }
}

export async function getUserReports(
    playerId: string,
    filters?: {
        asReporter?: boolean;
        asOffender?: boolean;
        limit?: number;
    }
) {
    try {
        const where: any = {};

        if (filters?.asReporter && filters?.asOffender) {
            where.OR = [{ reporterId: playerId }, { offenderId: playerId }];
        } else if (filters?.asReporter) {
            where.reporterId = playerId;
        } else if (filters?.asOffender) {
            where.offenderId = playerId;
        } else {
            where.OR = [{ reporterId: playerId }, { offenderId: playerId }];
        }

        const reports = await prisma.boardModerationReport.findMany({
            where,
            include: {
                reporter: { select: { name: true, nickname: true } },
                offender: { select: { name: true, nickname: true } },
                board: { select: { name: true } },
                post: { select: { title: true } },
                comment: { select: { content: true } },
            },
            orderBy: { createdAt: "desc" },
            take: filters?.limit || 20,
        });

        return { success: true, data: reports };
    } catch (error) {
        console.error("Error fetching user reports:", error);
        return { success: false, error: "Failed to fetch user reports" };
    }
}

export async function getReportHistory(
    targetId: string,
    targetType: "post" | "comment" | "user"
) {
    try {
        const where: any = {};

        if (targetType === "post") {
            where.postId = targetId;
        } else if (targetType === "comment") {
            where.commentId = targetId;
        } else if (targetType === "user") {
            where.offenderId = targetId;
        }

        const reports = await prisma.boardModerationReport.findMany({
            where,
            include: {
                reporter: { select: { name: true, nickname: true } },
                offender: { select: { name: true, nickname: true } },
                board: { select: { name: true } },
                relatedRule: { select: { category: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return { success: true, data: reports };
    } catch (error) {
        console.error("Error fetching report history:", error);
        return { success: false, error: "Failed to fetch report history" };
    }
}

export async function getModerationStats(period?: { from: Date; to: Date }) {
    try {
        const where: any = {};

        if (period) {
            where.createdAt = {
                gte: period.from,
                lte: period.to,
            };
        }

        const [
            totalReports,
            pendingReports,
            resolvedReports,
            dismissedReports,
            reportsByType,
            reportsByStatus,
        ] = await Promise.all([
            prisma.boardModerationReport.count({ where }),
            prisma.boardModerationReport.count({
                where: {
                    ...where,
                    status: BoardModerationReportStatus.PENDING,
                },
            }),
            prisma.boardModerationReport.count({
                where: {
                    ...where,
                    status: BoardModerationReportStatus.RESOLVED,
                },
            }),
            prisma.boardModerationReport.count({
                where: {
                    ...where,
                    status: BoardModerationReportStatus.DISMISSED,
                },
            }),
            prisma.boardModerationReport.groupBy({
                by: ["type"],
                where,
                _count: { id: true },
            }),
            prisma.boardModerationReport.groupBy({
                by: ["status"],
                where,
                _count: { id: true },
            }),
        ]);

        return {
            success: true,
            data: {
                totalReports,
                pendingReports,
                resolvedReports,
                dismissedReports,
                reportsByType,
                reportsByStatus,
            },
        };
    } catch (error) {
        console.error("Error fetching moderation stats:", error);
        return { success: false, error: "Failed to fetch moderation stats" };
    }
}

export async function dismissReport(
    reportId: string,
    reason: string,
    reviewBy: string
) {
    try {
        const report = await prisma.boardModerationReport.update({
            where: { id: reportId },
            data: {
                status: BoardModerationReportStatus.DISMISSED,
                reviewResult: reason,
                reviewBy,
                reviewAt: new Date(),
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: report };
    } catch (error) {
        console.error("Error dismissing report:", error);
        return { success: false, error: "Failed to dismiss report" };
    }
}

export async function escalateReport(
    reportId: string,
    reason: string,
    escalatedBy: string
) {
    try {
        const report = await prisma.boardModerationReport.update({
            where: { id: reportId },
            data: {
                status: BoardModerationReportStatus.REVIEWING,
                reviewResult: `Escalated: ${reason}`,
                reviewBy: escalatedBy,
                reviewAt: new Date(),
            },
        });

        revalidatePath("/admin/moderation");
        return { success: true, data: report };
    } catch (error) {
        console.error("Error escalating report:", error);
        return { success: false, error: "Failed to escalate report" };
    }
}
