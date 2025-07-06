/// app/actions/boardModeration/check-actions.ts
"use server";

import { prisma } from "@/lib/prisma/client";
import { BoardModerationReportType } from "@prisma/client";
import { checkContentForBadWords } from "../boards/LDNOOBW";

export async function autoCheckContent(
    contentType: "post" | "comment",
    content: string,
    authorId: string,
    boardId: string,
    contentId?: string
) {
    try {
        const violations = [];

        const stopWordsResult = await checkAgainstStopWords(content, boardId);
        if (stopWordsResult.violations.length > 0) {
            violations.push(...stopWordsResult.violations);
        }

        const badWordsResult = await checkContentForBadWords(content, {
            strictMode: true,
        });
        if (badWordsResult.containsBadWords) {
            violations.push({
                type: "BAD_WORDS" as const,
                severity: badWordsResult.severity,
                reason: badWordsResult.reason,
                foundWords: badWordsResult.foundWords,
                ruleId: null,
            });
        }

        const spamResult = await detectSpamPatterns(content, authorId);
        if (spamResult.isSpam) {
            violations.push({
                type: "SPAM_DETECTION" as const,
                severity: spamResult.severity,
                reason: spamResult.reason,
                ruleId: null,
            });
        }

        if (violations.length > 0) {
            const severity = calculateViolationSeverity(violations);

            if (contentId) {
                await createAutoReport({
                    boardId,
                    contentType,
                    contentId,
                    offenderId: authorId,
                    violations,
                    severity,
                });
            }

            return {
                success: false,
                blocked: severity >= 3,
                violations,
                severity,
                message: getViolationMessage(violations, severity),
            };
        }

        return {
            success: true,
            blocked: false,
            violations: [],
            severity: 0,
        };
    } catch (error) {
        console.error("Error in autoCheckContent:", error);
        return {
            success: false,
            blocked: false,
            violations: [],
            severity: 0,
            error: "Content check failed",
        };
    }
}

export async function checkAgainstStopWords(
    content: string,
    _boardId?: string
) {
    try {
        const rules = await prisma.boardModerationRule.findMany({
            where: { isActive: true },
            select: { id: true, category: true, stopWords: true },
        });

        const violations = [];
        const normalizedContent = content.toLowerCase();

        for (const rule of rules) {
            const foundWords = rule.stopWords.filter((word) =>
                normalizedContent.includes(word.toLowerCase())
            );

            if (foundWords.length > 0) {
                violations.push({
                    type: "AUTO_RULE" as const,
                    ruleId: rule.id,
                    category: rule.category,
                    foundWords,
                    severity: calculateWordSeverity(foundWords.length),
                    reason: `Found prohibited words: ${foundWords.join(", ")}`,
                });
            }
        }

        return {
            success: true,
            violations,
            totalViolations: violations.length,
        };
    } catch (error) {
        console.error("Error checking stop words:", error);
        return {
            success: false,
            violations: [],
            totalViolations: 0,
        };
    }
}

export async function detectSpamPatterns(content: string, authorId: string) {
    try {
        const spamIndicators = [];

        if (content.length < 5) {
            spamIndicators.push("Too short");
        }

        if (content.length > 2000) {
            spamIndicators.push("Too long");
        }

        const repeatedChars = /(.)\1{10,}/g;
        if (repeatedChars.test(content)) {
            spamIndicators.push("Repeated characters");
        }

        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlPattern) || [];
        if (urls.length > 3) {
            spamIndicators.push("Too many URLs");
        }

        const capsPattern = /[A-Z]/g;
        const capsCount = (content.match(capsPattern) || []).length;
        if (capsCount > content.length * 0.7) {
            spamIndicators.push("Excessive caps");
        }

        const recentPosts = await prisma.boardPost.count({
            where: {
                authorId,
                createdAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000),
                },
            },
        });

        if (recentPosts > 10) {
            spamIndicators.push("Rapid posting");
        }

        const isSpam = spamIndicators.length > 0;
        const severity = Math.min(spamIndicators.length, 5);

        return {
            success: true,
            isSpam,
            severity,
            indicators: spamIndicators,
            reason: `Spam detected: ${spamIndicators.join(", ")}`,
        };
    } catch (error) {
        console.error("Error detecting spam patterns:", error);
        return {
            success: false,
            isSpam: false,
            severity: 0,
            indicators: [],
            reason: "",
        };
    }
}

export async function createAutoReport(data: {
    boardId: string;
    contentType: "post" | "comment";
    contentId: string;
    offenderId: string;
    violations: any[];
    severity: number;
}) {
    try {
        const reportType = data.violations.some(
            (v) => v.type === "SPAM_DETECTION"
        )
            ? BoardModerationReportType.SPAM_DETECTION
            : BoardModerationReportType.AUTO_RULE;

        const relatedRuleId =
            data.violations.find((v) => v.ruleId)?.ruleId || null;

        const report = await prisma.boardModerationReport.create({
            data: {
                boardId: data.boardId,
                ...(data.contentType === "post" && { postId: data.contentId }),
                ...(data.contentType === "comment" && {
                    commentId: data.contentId,
                }),
                offenderId: data.offenderId,
                relatedRuleId,
                type: reportType,
                reason: `Auto-detected violations: ${data.violations
                    .map((v) => v.reason)
                    .join("; ")}`,
                status: data.severity >= 4 ? "REVIEWING" : "PENDING",
            },
        });

        return {
            success: true,
            data: report,
        };
    } catch (error) {
        console.error("Error creating auto report:", error);
        return {
            success: false,
            error: "Failed to create auto report",
        };
    }
}

export async function validateContentBeforePost(
    content: string,
    authorId: string,
    boardId: string
) {
    try {
        const player = await prisma.player.findUnique({
            where: { id: authorId },
            select: {
                boardTrustLevel: true,
                boardReputationScore: true,
            },
        });

        if (!player) {
            return {
                success: false,
                blocked: true,
                reason: "Player not found",
            };
        }

        const checkResult = await autoCheckContent(
            "post",
            content,
            authorId,
            boardId
        );

        if (checkResult.blocked) {
            return {
                success: false,
                blocked: true,
                violations: checkResult.violations,
                severity: checkResult.severity,
                message: checkResult.message,
            };
        }

        if (player.boardTrustLevel < 1 && checkResult.severity > 0) {
            return {
                success: false,
                blocked: true,
                reason: "Content flagged for review due to low trust level",
                violations: checkResult.violations,
            };
        }

        return {
            success: true,
            blocked: false,
            trustLevel: player.boardTrustLevel,
            reputationScore: player.boardReputationScore,
        };
    } catch (error) {
        console.error("Error validating content:", error);
        return {
            success: false,
            blocked: false,
            error: "Validation failed",
        };
    }
}

function calculateViolationSeverity(violations: any[]): number {
    let severity = 0;

    for (const violation of violations) {
        if (violation.type === "AUTO_RULE") {
            severity += violation.foundWords?.length || 1;
        } else if (violation.type === "SPAM_DETECTION") {
            severity += violation.severity || 2;
        } else if (violation.type === "BAD_WORDS") {
            severity += violation.severity || 3;
        }
    }

    return Math.min(severity, 5);
}

function calculateWordSeverity(wordCount: number): number {
    if (wordCount >= 5) return 5;
    if (wordCount >= 3) return 4;
    if (wordCount >= 2) return 3;
    return 2;
}

function getViolationMessage(violations: any[], severity: number): string {
    if (severity >= 4) {
        return "Content blocked due to severe policy violations";
    } else if (severity >= 3) {
        return "Content flagged for review";
    } else {
        return "Content contains minor violations";
    }
}
