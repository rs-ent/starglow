/// app/actions/x/actions.ts

"use server";

import crypto from "crypto";

import { prisma } from "@/lib/prisma/client";

import type {
    TweetAuthor,
    Tweet,
    TweetMetrics,
    TweetAuthorMetrics,
    TweetMedia,
    RewardsLog,
    Player,
} from "@prisma/client";
import { updatePlayerAsset } from "@/app/actions/playerAssets/actions";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

interface TweetMention {
    start: number;
    end: number;
    username: string;
    id?: string;
}

interface TweetEntities {
    mentions?: TweetMention[];
    hashtags?: Array<{
        start: number;
        end: number;
        tag: string;
    }>;
    urls?: Array<{
        start: number;
        end: number;
        url: string;
        expanded_url?: string;
        display_url?: string;
    }>;
}

interface UserTweetData {
    id: string;
    text: string;
    created_at?: string;
    edit_history_tweet_ids?: string[];
    entities?: TweetEntities;
    public_metrics?: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
    };
}

interface XApiUserTweetsResponse {
    data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        entities?: TweetEntities;
        public_metrics?: {
            retweet_count: number;
            reply_count: number;
            like_count: number;
            quote_count: number;
        };
    }>;
    includes?: {
        users?: Array<{
            id: string;
            username: string;
            name: string;
            profile_image_url: string | null;
            public_metrics?: {
                followers_count: number;
                following_count: number;
                tweet_count: number;
                listed_count: number;
            };
            verified?: boolean;
        }>;
    };
    meta: {
        result_count: number;
        newest_id?: string;
        oldest_id?: string;
        next_token?: string;
        previous_token?: string;
    };
}

export async function getLatestSyncData() {
    return await prisma.tweetSyncData.findFirst({
        where: {
            syncStatus: "success",
        },
        orderBy: {
            lastSyncAt: "desc",
        },
    });
}

export type TweetWithMetrics = Tweet & {
    metricsHistory: TweetMetrics[];
    media: TweetMedia[];
};

export type Author = TweetAuthor & {
    player: Player | null;
    tweets: TweetWithMetrics[];
    metrics: TweetAuthorMetrics[];
    rewardsLogs: RewardsLog[];
};

export async function getTweetAuthors(): Promise<Author[]> {
    return (await prisma.tweetAuthor.findMany({
        include: {
            player: true,
            tweets: {
                include: {
                    metricsHistory: {
                        orderBy: { recordedAt: "desc" },
                        take: 1,
                    },
                    media: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            metrics: {
                orderBy: { recordedAt: "desc" },
                take: 1,
            },
            rewardsLogs: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    })) as Author[];
}

export interface GetAuthorMetricsHistoryInput {
    authorId: string | null;
}

export async function getAuthorMetricsHistory(
    input?: GetAuthorMetricsHistoryInput
) {
    if (!input || !input.authorId) {
        return [];
    }

    return await prisma.tweetAuthorMetrics.findMany({
        where: {
            tweetAuthorId: input.authorId,
        },
        orderBy: {
            recordedAt: "asc",
        },
    });
}

export interface GetTweetMetricsHistoryInput {
    tweetId: string | null;
}

export async function getTweetMetricsHistory(
    input?: GetTweetMetricsHistoryInput
) {
    if (!input || !input.tweetId) {
        return [];
    }

    return await prisma.tweetMetrics.findMany({
        where: {
            tweetId: input.tweetId,
        },
        orderBy: {
            recordedAt: "asc",
        },
    });
}

export async function getTweets() {
    return await prisma.tweet.findMany();
}

export interface FetchAuthorMetricsFromXInput {
    authorId: string | null;
}

export async function fetchAuthorMetricsFromX(
    input?: FetchAuthorMetricsFromXInput
) {
    if (!input?.authorId) {
        throw new Error("Author ID is required");
    }

    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
    if (!BEARER_TOKEN) {
        throw new Error("TWITTER_BEARER_TOKEN is not set");
    }

    try {
        const response = await fetch(
            `https://api.twitter.com/2/users/${input.authorId}?user.fields=username,name,profile_image_url,public_metrics,verified`,
            {
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                `Twitter API Error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        const userData = data.data;

        if (!userData) {
            throw new Error("No user data returned from Twitter API");
        }

        const currentAuthor = (await prisma.tweetAuthor.findUnique({
            where: { authorId: input.authorId },
            include: {
                metrics: {
                    orderBy: { recordedAt: "desc" },
                    take: 1,
                },
            },
        })) as Author | null;

        const hasChanged =
            !currentAuthor?.metrics[0] ||
            currentAuthor.metrics[0].followersCount !==
                userData.public_metrics.followers_count ||
            currentAuthor.metrics[0].followingCount !==
                userData.public_metrics.following_count ||
            currentAuthor.metrics[0].tweetCount !==
                userData.public_metrics.tweet_count ||
            currentAuthor.metrics[0].listedCount !==
                userData.public_metrics.listed_count ||
            currentAuthor.metrics[0].verified !== (userData.verified || false);

        await prisma.$transaction(async (tx) => {
            await tx.tweetAuthor.upsert({
                where: { authorId: input.authorId! },
                create: {
                    authorId: input.authorId!,
                    name: userData.name,
                    username: userData.username,
                    profileImageUrl: userData.profile_image_url || null,
                },
                update: {
                    name: userData.name,
                    username: userData.username,
                    profileImageUrl: userData.profile_image_url || null,
                },
            });

            if (hasChanged) {
                await tx.tweetAuthorMetrics.create({
                    data: {
                        tweetAuthorId: input.authorId!,
                        followersCount: userData.public_metrics.followers_count,
                        followingCount: userData.public_metrics.following_count,
                        tweetCount: userData.public_metrics.tweet_count,
                        listedCount: userData.public_metrics.listed_count,
                        verified: userData.verified || false,
                        recordedAt: new Date(),
                    },
                });
            }
        });

        return {
            success: true,
            authorId: input.authorId,
            metricsUpdated: hasChanged,
            data: {
                name: userData.name,
                username: userData.username,
                metrics: userData.public_metrics,
                verified: userData.verified,
            },
        };
    } catch (error) {
        console.error("Error fetching author metrics:", error);
        throw error;
    }
}

export interface GetAuthorByPlayerIdInput {
    playerId: string;
}

export async function getAuthorByPlayerId(
    input?: GetAuthorByPlayerIdInput
): Promise<TweetAuthor | null> {
    try {
        if (!input || !input.playerId) {
            return null;
        }

        const player = await prisma.player.findUnique({
            where: {
                id: input.playerId,
            },
            include: {
                tweetAuthor: {
                    include: {
                        rewardsLogs: true,
                        tweets: true,
                        metrics: true,
                    },
                },
            },
        });

        if (!player || !player.tweetAuthor) {
            return null;
        }

        return player.tweetAuthor;
    } catch (error) {
        console.error("Error getting author by player ID:", error);
        return null;
    }
}

export interface ValidateRegisterXAuthorInput {
    playerId: string;
    tweetAuthorId: string;
}

export interface ValidateRegisterXAuthorOutput {
    isValid: boolean;
    message?: string;
}

export async function validateRegisterXAuthor(
    input: ValidateRegisterXAuthorInput
): Promise<ValidateRegisterXAuthorOutput> {
    try {
        if (!input.playerId || !input.tweetAuthorId) {
            return {
                isValid: false,
                message:
                    "Invalid input. Please try again. If the problem persists, please contact support.",
            };
        }

        const player = await prisma.player.findUnique({
            where: {
                id: input.playerId,
            },
            select: {
                tweetAuthorId: true,
            },
        });

        if (!player) {
            return {
                isValid: false,
                message:
                    "Player not found. Please try again. If the problem persists, please contact support.",
            };
        }

        const existingAuthor = await prisma.tweetAuthor.findUnique({
            where: {
                authorId: input.tweetAuthorId,
            },
            select: {
                player: true,
            },
        });

        if (
            existingAuthor?.player &&
            existingAuthor.player.id !== input.playerId
        ) {
            return {
                isValid: false,
                message:
                    "X Account already registered by other player. Please try with other X Account.",
            };
        }

        return {
            isValid: true,
        };
    } catch (error) {
        console.error("Error occurred while validating X author:", error);
        return {
            isValid: false,
            message:
                "Error occurred while validating X author. Please try again. If the problem persists, please contact support.",
        };
    }
}

export interface CheckIsActiveXAuthorInput {
    tweetAuthorId: string;
}

export interface CheckIsActiveXAuthorOutput {
    isActive: boolean;
    message?: string;
}

export async function checkIsActiveXAuthor(
    input: CheckIsActiveXAuthorInput
): Promise<CheckIsActiveXAuthorOutput> {
    try {
        if (!input.tweetAuthorId) {
            return {
                isActive: false,
                message:
                    "Invalid input. Please try again. If the problem persists, please contact support.",
            };
        }

        const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

        if (!BEARER_TOKEN) {
            return {
                isActive: false,
                message: "TWITTER_BEARER_TOKEN is not set",
            };
        }

        const response = await fetch(
            `https://api.twitter.com/2/users/${input.tweetAuthorId}/tweets?` +
                new URLSearchParams({
                    max_results: "5",
                    "tweet.fields": "entities",
                    expansions: "author_id",
                }),
            {
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            return {
                isActive: false,
                message: `Twitter API Error: ${response.status} ${response.statusText}`,
            };
        }

        const data: XApiUserTweetsResponse = await response.json();
        const tweets = data.data || [];

        const hasMentioned = tweets.some((tweet: UserTweetData) =>
            tweet.entities?.mentions?.some(
                (mention: TweetMention) =>
                    mention.username.toLowerCase() === "starglow_world"
            )
        );

        if (hasMentioned) {
            await prisma.tweetAuthor.update({
                where: { authorId: input.tweetAuthorId },
                data: {
                    validated: true,
                    validatedAt: new Date(),
                },
            });
        }

        return {
            isActive: hasMentioned,
            message: hasMentioned
                ? "Found mention of @Starglow_world in recent tweets"
                : "No mentions of @Starglow_world in recent tweets",
        };
    } catch (error) {
        console.error(
            "Error occurred while checking X Account Activity:",
            error
        );
        return {
            isActive: false,
            message:
                "Error occurred while checking X Account Activity. Please try again. If the problem persists, please contact support.",
        };
    }
}

export interface ConfirmRegisterXAuthorInput {
    playerId: string;
    tweetAuthorId: string;
}

export interface ConfirmRegisterXAuthorOutput {
    success: boolean;
    message?: string;
}

export async function confirmRegisterXAuthor(
    input: ConfirmRegisterXAuthorInput
): Promise<ConfirmRegisterXAuthorOutput> {
    try {
        if (!input.playerId || !input.tweetAuthorId) {
            return {
                success: false,
                message:
                    "Invalid input. Please try again. If the problem persists, please contact support.",
            };
        }

        const tweetAuthor = await prisma.tweetAuthor.findUnique({
            where: { authorId: input.tweetAuthorId },
            select: {
                validated: true,
                validatedAt: true,
                registered: true,
                registeredAt: true,
            },
        });

        if (!tweetAuthor) {
            return {
                success: false,
                message: "X Account not found.",
            };
        }

        if (!tweetAuthor.validated) {
            return {
                success: false,
                message: "X Account is not validated. Please try again.",
            };
        }

        await prisma.tweetAuthor.update({
            where: { authorId: input.tweetAuthorId },
            data: {
                registered: true,
                registeredAt: new Date(),
            },
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error occurred while registering X author:", error);
        return {
            success: false,
            message:
                "Error occurred while registering X author. Please try again. If the problem persists, please contact support.",
        };
    }
}

export interface StartXAuthInput {
    playerId: string;
}

export interface StartXAuthOutput {
    authUrl: string;
    state: string;
    codeVerifier: string;
}

export async function startXAuth(
    input: StartXAuthInput
): Promise<StartXAuthOutput> {
    try {
        if (!CLIENT_ID) {
            throw new Error("TWITTER_CLIENT_ID is not configured");
        }

        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = crypto.randomUUID();

        await prisma.xAuthSession.create({
            data: {
                state,
                codeVerifier,
                playerId: input.playerId,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
        });

        const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", CLIENT_ID);

        const redirectUri = `${process.env.NEXTAUTH_URL}/api/integration/x/callback`;

        authUrl.searchParams.set("redirect_uri", redirectUri);

        authUrl.searchParams.set(
            "scope",
            "tweet.read users.read offline.access"
        );

        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge", codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");

        return {
            authUrl: authUrl.toString(),
            state,
            codeVerifier,
        };
    } catch (error) {
        console.error("Error starting X auth:", error);
        throw new Error("Failed to start X authentication");
    }
}

export interface ExchangeXTokenInput {
    code: string;
    state: string;
}

export interface ExchangeXTokenOutput {
    success: boolean;
    authorId?: string;
    userData?: any;
    message?: string;
}

export async function exchangeXToken(
    input: ExchangeXTokenInput
): Promise<ExchangeXTokenOutput> {
    try {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error("Twitter credentials not configured");
        }

        const authSession = await prisma.xAuthSession.findUnique({
            where: { state: input.state },
        });

        if (!authSession || authSession.expiresAt < new Date()) {
            return {
                success: false,
                message: "Invalid or expired authentication session",
            };
        }

        const tokenResponse = await fetch(
            "https://api.twitter.com/2/oauth2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${Buffer.from(
                        `${CLIENT_ID}:${CLIENT_SECRET}`
                    ).toString("base64")}`,
                },
                body: new URLSearchParams({
                    code: input.code,
                    grant_type: "authorization_code",
                    client_id: CLIENT_ID,
                    redirect_uri: `${process.env.NEXTAUTH_URL}/api/integration/x/callback`,
                    code_verifier: authSession.codeVerifier,
                }),
            }
        );

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("Token exchange failed:", error);
            return {
                success: false,
                message: "Failed to exchange authorization code",
            };
        }

        const tokens = await tokenResponse.json();

        const userResponse = await fetch(
            "https://api.twitter.com/2/users/me?user.fields=username,name,profile_image_url,public_metrics,verified",
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            }
        );

        if (!userResponse.ok) {
            return {
                success: false,
                message: "Failed to fetch user data",
            };
        }

        const userData = await userResponse.json();

        await prisma.xAuthSession.delete({
            where: { state: input.state },
        });

        await prisma.$transaction(async (tx) => {
            // Player를 통해 User 찾기
            const player = await tx.player.findUnique({
                where: { id: authSession.playerId },
                include: { user: true },
            });

            if (!player || !player.userId || !player.user) {
                throw new Error("Player or associated user not found");
            }

            const alreadyConnectedPlayer = await tx.player.findUnique({
                where: { tweetAuthorId: userData.data.id },
            });

            if (
                alreadyConnectedPlayer &&
                alreadyConnectedPlayer?.id !== player.id
            ) {
                throw new Error(
                    "This Twitter account is already linked to another user"
                );
            }

            // TweetAuthor 생성/업데이트
            const tweetAuthor = await tx.tweetAuthor.upsert({
                where: { authorId: userData.data.id },
                create: {
                    authorId: userData.data.id,
                    name: userData.data.name,
                    username: userData.data.username,
                    profileImageUrl: userData.data.profile_image_url || null,
                },
                update: {
                    name: userData.data.name,
                    username: userData.data.username,
                    profileImageUrl: userData.data.profile_image_url || null,
                },
            });

            // TweetAuthorMetrics 생성
            if (userData.data.public_metrics) {
                await tx.tweetAuthorMetrics.create({
                    data: {
                        tweetAuthorId: userData.data.id,
                        followersCount:
                            userData.data.public_metrics.followers_count,
                        followingCount:
                            userData.data.public_metrics.following_count,
                        tweetCount: userData.data.public_metrics.tweet_count,
                        listedCount: userData.data.public_metrics.listed_count,
                        verified: userData.data.verified || false,
                        recordedAt: new Date(),
                    },
                });
            }

            // Player의 tweetAuthorId 업데이트
            await tx.player.update({
                where: { id: authSession.playerId },
                data: {
                    tweetAuthorId: tweetAuthor.authorId,
                },
            });

            const existingAccount = await tx.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: "twitter",
                        providerAccountId: userData.data.id,
                    },
                },
            });

            if (!existingAccount) {
                await tx.account.create({
                    data: {
                        userId: player.userId,
                        type: "oauth",
                        provider: "twitter",
                        providerAccountId: userData.data.id,
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token || null,
                        expires_at: tokens.expires_in
                            ? Math.floor(Date.now() / 1000) + tokens.expires_in
                            : null,
                        token_type: tokens.token_type || null,
                        scope: tokens.scope || null,
                    },
                });
            } else {
                // 같은 유저의 기존 연동 정보 업데이트
                await tx.account.update({
                    where: {
                        provider_providerAccountId: {
                            provider: "twitter",
                            providerAccountId: userData.data.id,
                        },
                    },
                    data: {
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token || null,
                        expires_at: tokens.expires_in
                            ? Math.floor(Date.now() / 1000) + tokens.expires_in
                            : null,
                    },
                });
            }

            // User의 lastLoginAt 업데이트 (선택사항)
            await tx.user.update({
                where: { id: player.userId },
                data: {
                    lastLoginAt: new Date(),
                },
            });
        });

        return {
            success: true,
            authorId: userData.data.id,
            userData: userData.data,
        };
    } catch (error) {
        console.error("Error exchanging X token:", error);
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to complete authentication",
        };
    }
}

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString("base64url");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash("sha256");
    hash.update(verifier);
    return hash.digest("base64url");
}

export async function cleanupExpiredXAuthSessions() {
    try {
        await prisma.xAuthSession.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    } catch (error) {
        console.error("Failed to cleanup expired sessions:", error);
    }
}

export interface DisconnectXAccountInput {
    playerId: string;
}

export async function disconnectXAccount(
    input: DisconnectXAccountInput
): Promise<{ success: boolean; message?: string }> {
    try {
        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || !player.userId || !player.tweetAuthorId) {
            return {
                success: false,
                message: "No X account connected",
            };
        }

        await prisma.$transaction(async (tx) => {
            await tx.tweetAuthor.update({
                where: { authorId: player.tweetAuthorId! },
                data: {
                    registered: false,
                    registeredAt: null,
                    validated: false,
                    validatedAt: null,
                },
            });

            await tx.player.update({
                where: { id: input.playerId },
                data: {
                    tweetAuthorId: null,
                },
            });
        });

        return { success: true };
    } catch (error) {
        console.error("Error disconnecting X account:", error);
        return {
            success: false,
            message: "Failed to disconnect X account",
        };
    }
}

export interface GetGlowingRewardsLogsInput {
    tweetAuthorId: string;
}

export async function getGlowingRewardsLogs(
    input?: GetGlowingRewardsLogsInput
) {
    if (!input || !input.tweetAuthorId) {
        return [];
    }

    return await prisma.rewardsLog.findMany({
        where: {
            tweetAuthorId: input.tweetAuthorId,
            reason: "GLOWING Rewards",
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export interface GiveGlowingRewardInput {
    playerId: string;
    assetId: string;
    amount: number;
    tweetAuthorId: string;
    tweetIds: string[];
    reason?: string;
}

export async function giveGlowingReward(input: GiveGlowingRewardInput) {
    try {
        const updateResult = await updatePlayerAsset({
            transaction: {
                playerId: input.playerId,
                assetId: input.assetId,
                amount: input.amount,
                operation: "ADD",
                reason: input.reason || "GLOWING Rewards",
                tweetAuthorId: input.tweetAuthorId,
                tweetIds: input.tweetIds,
            },
        });
        if (!updateResult.success) {
            return {
                success: false,
                error: `Failed to give participation reward: ${updateResult.error}`,
            };
        }
    } catch (error) {
        console.error("Error giving reward:", error);
    }
}
