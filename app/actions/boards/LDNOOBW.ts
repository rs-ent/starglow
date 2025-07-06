/// app/actions/boards/LDNOOBW.ts
"use server";

import { naughty } from "naughty-words";

export interface BadWordCheckResult {
    success: boolean;
    containsBadWords: boolean;
    foundWords: string[];
    severity: number;
    reason: string;
    blocked: boolean;
}

export interface BadWordCheckOptions {
    enableEnglish: boolean;
    enableKorean: boolean;
    enableOtherLanguages: boolean;
    strictMode: boolean;
    caseSensitive: boolean;
}

const DEFAULT_OPTIONS: BadWordCheckOptions = {
    enableEnglish: true,
    enableKorean: true,
    enableOtherLanguages: true,
    strictMode: true,
    caseSensitive: false,
};

export async function checkContentForBadWords(
    content: string,
    options: Partial<BadWordCheckOptions> = {}
): Promise<BadWordCheckResult> {
    try {
        const config = { ...DEFAULT_OPTIONS, ...options };

        if (!content || content.trim().length === 0) {
            return {
                success: true,
                containsBadWords: false,
                foundWords: [],
                severity: 0,
                reason: "No content to check",
                blocked: false,
            };
        }

        const foundWords = await detectBadWords(content, config);
        const severity = await calculateBadWordSeverity(foundWords);
        const blocked = config.strictMode
            ? foundWords.length > 0
            : severity >= 3;

        return {
            success: true,
            containsBadWords: foundWords.length > 0,
            foundWords,
            severity,
            reason:
                foundWords.length > 0
                    ? `Found prohibited words: ${foundWords.join(", ")}`
                    : "Content is clean",
            blocked,
        };
    } catch (error) {
        console.error("Error checking content for bad words:", error);
        return {
            success: false,
            containsBadWords: false,
            foundWords: [],
            severity: 0,
            reason: "Bad word check failed",
            blocked: false,
        };
    }
}

async function detectBadWords(
    content: string,
    config: BadWordCheckOptions
): Promise<string[]> {
    const foundWords = new Set<string>();
    const contentToCheck = config.caseSensitive
        ? content
        : content.toLowerCase();

    if (config.enableEnglish) {
        const englishWords = await getEnglishBadWords();
        englishWords.forEach((word: string) => {
            const wordToCheck = config.caseSensitive
                ? word
                : word.toLowerCase();
            if (contentToCheck.includes(wordToCheck)) {
                foundWords.add(word);
            }
        });
    }

    if (config.enableKorean) {
        const koreanWords = await getKoreanBadWords();
        koreanWords.forEach((word: string) => {
            if (contentToCheck.includes(word)) {
                foundWords.add(word);
            }
        });
    }

    if (config.enableOtherLanguages) {
        const otherWords = await getOtherLanguageBadWords();
        otherWords.forEach((word: string) => {
            const wordToCheck = config.caseSensitive
                ? word
                : word.toLowerCase();
            if (contentToCheck.includes(wordToCheck)) {
                foundWords.add(word);
            }
        });
    }

    return Array.from(foundWords);
}

async function getEnglishBadWords(): Promise<string[]> {
    try {
        return naughty.en;
    } catch (error) {
        console.error("Failed to load English bad words:", error);
        return [];
    }
}

async function getKoreanBadWords(): Promise<string[]> {
    try {
        return naughty.ko || [];
    } catch (error) {
        console.error("Failed to load Korean bad words:", error);
        return [];
    }
}

async function getOtherLanguageBadWords(): Promise<string[]> {
    try {
        const languages = [
            "ar",
            "cs",
            "da",
            "de",
            "es",
            "fa",
            "fi",
            "fr",
            "hi",
            "it",
            "ja",
            "nl",
            "no",
            "pl",
            "pt",
            "ru",
            "sv",
            "th",
            "tr",
            "zh",
        ];
        const allWords = new Set<string>();

        languages.forEach((lang: string) => {
            const words = naughty[lang] || [];
            words.forEach((word: string) => allWords.add(word));
        });

        return Array.from(allWords);
    } catch (error) {
        console.error("Failed to load other language bad words:", error);
        return [];
    }
}

async function calculateBadWordSeverity(foundWords: string[]): Promise<number> {
    if (foundWords.length === 0) return 0;
    if (foundWords.length >= 5) return 5;
    if (foundWords.length >= 3) return 4;
    if (foundWords.length >= 2) return 3;
    return 2;
}

export async function validatePostContent(
    title: string,
    content: string,
    options: Partial<BadWordCheckOptions> = {}
): Promise<BadWordCheckResult> {
    try {
        const combinedContent = `${title} ${content}`;
        return await checkContentForBadWords(combinedContent, options);
    } catch (error) {
        console.error("Error validating post content:", error);
        return {
            success: false,
            containsBadWords: false,
            foundWords: [],
            severity: 0,
            reason: "Post validation failed",
            blocked: false,
        };
    }
}

export async function validateCommentContent(
    content: string,
    options: Partial<BadWordCheckOptions> = {}
): Promise<BadWordCheckResult> {
    try {
        return await checkContentForBadWords(content, options);
    } catch (error) {
        console.error("Error validating comment content:", error);
        return {
            success: false,
            containsBadWords: false,
            foundWords: [],
            severity: 0,
            reason: "Comment validation failed",
            blocked: false,
        };
    }
}

export async function getBadWordStats(): Promise<{
    english: number;
    korean: number;
    other: number;
    total: number;
}> {
    try {
        const english = await getEnglishBadWords();
        const korean = await getKoreanBadWords();
        const other = await getOtherLanguageBadWords();

        return {
            english: english.length,
            korean: korean.length,
            other: other.length,
            total: english.length + korean.length + other.length,
        };
    } catch (error) {
        console.error("Error getting bad word stats:", error);
        return {
            english: 0,
            korean: 0,
            other: 0,
            total: 0,
        };
    }
}

export async function checkTextArray(
    textArray: string[],
    options: Partial<BadWordCheckOptions> = {}
): Promise<BadWordCheckResult[]> {
    try {
        const results = await Promise.all(
            textArray.map((text: string) =>
                checkContentForBadWords(text, options)
            )
        );
        return results;
    } catch (error) {
        console.error("Error checking text array:", error);
        return textArray.map(() => ({
            success: false,
            containsBadWords: false,
            foundWords: [],
            severity: 0,
            reason: "Batch check failed",
            blocked: false,
        }));
    }
}
