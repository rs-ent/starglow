/// app\actions\boards\actions.ts

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";
import { validateContentBeforePost } from "../boardModeration/check-actions";

import { updatePlayerAsset } from "@/app/actions/playerAssets/actions";

import type {
    Board,
    BoardPost,
    BoardComment,
    BoardReaction,
    BoardPostReward,
    BoardAuthorType,
    BoardReactionType,
    BoardRewardReason,
    BoardRewardStatus,
    Prisma,
    Player,
    Artist,
} from "@prisma/client";

// ===== TYPES =====

export type BoardWithPosts = Board & {
    posts: BoardPost[];
    artist?: Artist | null;
    postCreationRewardAsset?: any | null;
    popularPostRewardAsset?: any | null;
    qualityContentRewardAsset?: any | null;
};

export type PlayerWithArtist = Player & {
    artist: Artist;
};

export type BoardPostWithDetails = BoardPost & {
    author: PlayerWithArtist;
    board: Board;
    comments: BoardComment[];
    reactions: BoardReaction[];
    rewards: BoardPostReward[];
    _count: {
        comments: number;
        reactions: number;
    };
};

export type BoardCommentWithDetails = BoardComment & {
    author: PlayerWithArtist;
    post: BoardPost;
    parent?: BoardComment | null;
    replies: BoardComment[];
    reactions: BoardReaction[];
};

export interface Pagination {
    currentPage: number;
    itemsPerPage: number;
}

export interface PaginationOutput {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
}

// ===== BOARD CRUD =====

export interface CreateBoardInput {
    name: string;
    description?: string;
    artistId?: string;
    isPublic?: boolean;
    iconUrl?: string;
    bannerUrl?: string;
    rules?: string;
    metadata?: any;
    order?: number;

    // Reward Configuration
    postCreationRewardEnabled?: boolean;
    postCreationRewardAmount?: number;
    postCreationRewardAssetId?: string;

    popularPostRewardEnabled?: boolean;
    popularPostThreshold?: number;
    popularPostRewardAmount?: number;
    popularPostRewardAssetId?: string;

    qualityContentRewardEnabled?: boolean;
    qualityContentRewardAmount?: number;
    qualityContentRewardAssetId?: string;

    // Permission Settings
    allowUserRewards?: boolean;
    allowArtistRewards?: boolean;
    allowTeamRewards?: boolean;
    allowAdminRewards?: boolean;

    // Limits
    dailyPostLimit?: number;
    weeklyPostLimit?: number;
    maxRewardPerPost?: number;
}

export async function createBoard(input: CreateBoardInput): Promise<Board> {
    try {
        const board = await prisma.board.create({
            data: {
                name: input.name,
                description: input.description,
                artistId: input.artistId,
                isPublic: input.isPublic ?? true,
                iconUrl: input.iconUrl,
                bannerUrl: input.bannerUrl,
                rules: input.rules,
                metadata: input.metadata,
                order: input.order ?? 0,

                // Reward Configuration - 명시적 설정만 허용
                postCreationRewardEnabled:
                    input.postCreationRewardEnabled ?? false,
                postCreationRewardAmount: input.postCreationRewardAmount,
                postCreationRewardAssetId: input.postCreationRewardAssetId,

                popularPostRewardEnabled:
                    input.popularPostRewardEnabled ?? false,
                popularPostThreshold: input.popularPostThreshold,
                popularPostRewardAmount: input.popularPostRewardAmount,
                popularPostRewardAssetId: input.popularPostRewardAssetId,

                qualityContentRewardEnabled:
                    input.qualityContentRewardEnabled ?? false,
                qualityContentRewardAmount: input.qualityContentRewardAmount,
                qualityContentRewardAssetId: input.qualityContentRewardAssetId,

                // Permission Settings - 명시적 설정만 허용
                allowUserRewards: input.allowUserRewards ?? false,
                allowArtistRewards: input.allowArtistRewards ?? false,
                allowTeamRewards: input.allowTeamRewards ?? false,
                allowAdminRewards: input.allowAdminRewards ?? false,

                // Limits
                dailyPostLimit: input.dailyPostLimit,
                weeklyPostLimit: input.weeklyPostLimit,
                maxRewardPerPost: input.maxRewardPerPost,
            },
        });

        revalidatePath("/admin/boards");
        return board;
    } catch (error) {
        console.error("Failed to create board:", error);
        throw new Error("Failed to create board");
    }
}

export interface GetBoardsInput {
    artistId?: string;
    isPublic?: boolean;
    isActive?: boolean;
}

export interface GetBoardsOutput extends PaginationOutput {
    boards: BoardWithPosts[];
}

export async function getBoards(
    input?: GetBoardsInput,
    pagination?: Pagination
): Promise<GetBoardsOutput> {
    try {
        const currentPage = pagination?.currentPage || 1;
        const itemsPerPage = pagination?.itemsPerPage || 20;

        const where: Prisma.BoardWhereInput = {};
        if (input?.artistId) where.artistId = input.artistId;
        if (input?.isPublic !== undefined) where.isPublic = input.isPublic;
        if (input?.isActive !== undefined) where.isActive = input.isActive;

        const [boards, totalItems] = await Promise.all([
            prisma.board.findMany({
                where,
                include: {
                    posts: {
                        take: 5,
                        orderBy: { createdAt: "desc" },
                    },
                    artist: true,
                    postCreationRewardAsset: true,
                    popularPostRewardAsset: true,
                    qualityContentRewardAsset: true,
                },
                skip: (currentPage - 1) * itemsPerPage,
                take: itemsPerPage,
                orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            }),
            prisma.board.count({ where }),
        ]);

        return {
            boards: boards as BoardWithPosts[],
            totalItems,
            totalPages: Math.ceil(totalItems / itemsPerPage),
            currentPage,
            itemsPerPage,
        };
    } catch (error) {
        console.error("Failed to get boards:", error);
        return {
            boards: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            itemsPerPage: 20,
        };
    }
}

export async function getBoard(
    boardId: string
): Promise<BoardWithPosts | null> {
    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: {
                posts: {
                    take: 10,
                    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
                },
                artist: true,
                postCreationRewardAsset: true,
                popularPostRewardAsset: true,
                qualityContentRewardAsset: true,
            },
        });

        return board as BoardWithPosts | null;
    } catch (error) {
        console.error("Failed to get board:", error);
        return null;
    }
}

export interface UpdateBoardInput {
    id: string;
    name?: string;
    description?: string;
    isPublic?: boolean;
    iconUrl?: string;
    bannerUrl?: string;
    rules?: string;
    metadata?: any;
    order?: number;

    // Reward Configuration
    postCreationRewardEnabled?: boolean;
    postCreationRewardAmount?: number;
    postCreationRewardAssetId?: string;

    popularPostRewardEnabled?: boolean;
    popularPostThreshold?: number;
    popularPostRewardAmount?: number;
    popularPostRewardAssetId?: string;

    qualityContentRewardEnabled?: boolean;
    qualityContentRewardAmount?: number;
    qualityContentRewardAssetId?: string;

    // Permission Settings
    allowUserRewards?: boolean;
    allowArtistRewards?: boolean;
    allowTeamRewards?: boolean;
    allowAdminRewards?: boolean;

    // Limits
    dailyPostLimit?: number;
    weeklyPostLimit?: number;
    maxRewardPerPost?: number;
}

export async function updateBoard(input: UpdateBoardInput): Promise<Board> {
    try {
        const board = await prisma.board.update({
            where: { id: input.id },
            data: {
                name: input.name,
                description: input.description,
                isPublic: input.isPublic,
                iconUrl: input.iconUrl,
                bannerUrl: input.bannerUrl,
                rules: input.rules,
                metadata: input.metadata,
                order: input.order,

                // Reward Configuration
                postCreationRewardEnabled: input.postCreationRewardEnabled,
                postCreationRewardAmount: input.postCreationRewardAmount,
                postCreationRewardAssetId: input.postCreationRewardAssetId,

                popularPostRewardEnabled: input.popularPostRewardEnabled,
                popularPostThreshold: input.popularPostThreshold,
                popularPostRewardAmount: input.popularPostRewardAmount,
                popularPostRewardAssetId: input.popularPostRewardAssetId,

                qualityContentRewardEnabled: input.qualityContentRewardEnabled,
                qualityContentRewardAmount: input.qualityContentRewardAmount,
                qualityContentRewardAssetId: input.qualityContentRewardAssetId,

                // Permission Settings
                allowUserRewards: input.allowUserRewards,
                allowArtistRewards: input.allowArtistRewards,
                allowTeamRewards: input.allowTeamRewards,
                allowAdminRewards: input.allowAdminRewards,

                // Limits
                dailyPostLimit: input.dailyPostLimit,
                weeklyPostLimit: input.weeklyPostLimit,
                maxRewardPerPost: input.maxRewardPerPost,
            },
        });
        revalidatePath("/admin/boards");
        return board;
    } catch (error) {
        console.error("Failed to update board:", error);
        throw new Error("Failed to update board");
    }
}

export async function deleteBoard(boardId: string): Promise<boolean> {
    try {
        await prisma.board.delete({
            where: { id: boardId },
        });

        return true;
    } catch (error) {
        console.error("Failed to delete board:", error);
        return false;
    }
}

// ===== BOARD POST CRUD =====

export interface CreateBoardPostInput {
    boardId: string;
    authorId: string;
    authorType: BoardAuthorType;
    title: string;
    content: string;
    imageUrls?: string[];
    videoUrls?: string[];
    attachmentUrls?: string[];
    files?: any[]; // 업로드된 파일 메타데이터 배열
    nftAddress?: string;
    nftTokenId?: string;
    tags?: string[];
    metadata?: any;
}

export async function createBoardPost(
    input: CreateBoardPostInput
): Promise<BoardPost> {
    try {
        // 통합 검증: 제목과 내용을 함께 검증
        const combinedContent = `${input.title} ${input.content}`;

        // 단일 검증으로 통합 - 보드 모더레이션이 금지어 검증도 포함
        const contentValidation = await validateContentBeforePost(
            combinedContent,
            input.authorId,
            input.boardId
        );

        if (contentValidation.blocked) {
            // 차단된 경우 상세 로그
            console.warn(`Content blocked for user: ${input.authorId}`, {
                reason: contentValidation.message,
                violations: contentValidation.violations,
                severity: contentValidation.severity,
            });

            throw new Error(
                contentValidation.message ||
                    "Content blocked due to policy violations"
            );
        }

        const post = await prisma.boardPost.create({
            data: {
                boardId: input.boardId,
                authorId: input.authorId,
                authorType: input.authorType,
                title: input.title,
                content: input.content,
                imageUrls: input.imageUrls || [],
                videoUrls: input.videoUrls || [],
                attachmentUrls: input.attachmentUrls || [],
                files: input.files || [],
                nftAddress: input.nftAddress,
                nftTokenId: input.nftTokenId,
                tags: input.tags || [],
                metadata: input.metadata,
            },
        });

        await handlePostCreationReward(post.id, input.boardId, input.authorId);

        return post;
    } catch (error) {
        console.error("Failed to create board post:", error);
        throw new Error(
            error instanceof Error
                ? error.message
                : "Failed to create board post"
        );
    }
}

export interface GetBoardPostsInput {
    boardId?: string;
    authorId?: string;
    authorType?: BoardAuthorType;
    tags?: string[];
    search?: string;
    isPinned?: boolean;
    isHidden?: boolean;
    sortBy?: "newest" | "oldest" | "popularity";
}

export interface GetBoardPostsOutput extends PaginationOutput {
    posts: BoardPostWithDetails[];
}

export async function getBoardPosts(
    input?: GetBoardPostsInput,
    pagination?: Pagination
): Promise<GetBoardPostsOutput> {
    try {
        const currentPage = pagination?.currentPage || 1;
        const itemsPerPage = pagination?.itemsPerPage || 20;

        const where: Prisma.BoardPostWhereInput = {};
        if (input?.boardId) where.boardId = input.boardId;
        if (input?.authorId) where.authorId = input.authorId;
        if (input?.authorType) where.authorType = input.authorType;
        if (input?.isPinned !== undefined) where.isPinned = input.isPinned;
        if (input?.isHidden !== undefined) where.isHidden = input.isHidden;
        if (input?.tags && input.tags.length > 0) {
            where.tags = { hasSome: input.tags };
        }
        if (input?.search) {
            where.OR = [
                { title: { contains: input.search, mode: "insensitive" } },
                { content: { contains: input.search, mode: "insensitive" } },
            ];
        }

        // 정렬 기준 설정
        const getOrderBy = (sortBy?: string) => {
            const baseOrder = [{ isPinned: "desc" as const }];

            switch (sortBy) {
                case "popularity":
                    return [
                        ...baseOrder,
                        { recommendCount: "desc" as const },
                        { likeCount: "desc" as const },
                        { commentCount: "desc" as const },
                        { createdAt: "desc" as const },
                    ];
                case "oldest":
                    return [...baseOrder, { createdAt: "asc" as const }];
                case "newest":
                default:
                    return [...baseOrder, { createdAt: "desc" as const }];
            }
        };

        const [posts, totalItems] = await Promise.all([
            prisma.boardPost.findMany({
                where,
                include: {
                    author: {
                        include: {
                            artist: true,
                        },
                    },
                    board: true,
                    comments: {
                        take: 3,
                        orderBy: { createdAt: "desc" },
                    },
                    reactions: true,
                    rewards: true,
                    _count: {
                        select: {
                            comments: true,
                            reactions: true,
                        },
                    },
                },
                skip: (currentPage - 1) * itemsPerPage,
                take: itemsPerPage,
                orderBy: getOrderBy(input?.sortBy),
            }),
            prisma.boardPost.count({ where }),
        ]);

        return {
            posts: posts as BoardPostWithDetails[],
            totalItems,
            totalPages: Math.ceil(totalItems / itemsPerPage),
            currentPage,
            itemsPerPage,
        };
    } catch (error) {
        console.error("Failed to get board posts:", error);
        return {
            posts: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            itemsPerPage: 20,
        };
    }
}

export async function getBoardPost(
    postId: string
): Promise<BoardPostWithDetails | null> {
    try {
        // 조회수 증가
        await prisma.boardPost.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } },
        });

        const post = await prisma.boardPost.findUnique({
            where: { id: postId },
            include: {
                author: {
                    include: {
                        artist: true,
                    },
                },
                board: true,
                comments: {
                    include: {
                        author: true,
                        replies: {
                            include: { author: true },
                            orderBy: { createdAt: "asc" },
                        },
                    },
                    where: { parentId: null },
                    orderBy: { createdAt: "desc" },
                },
                reactions: true,
                rewards: true,
                _count: {
                    select: {
                        comments: true,
                        reactions: true,
                    },
                },
            },
        });

        return post as BoardPostWithDetails | null;
    } catch (error) {
        console.error("Failed to get board post:", error);
        return null;
    }
}

export interface UpdateBoardPostInput {
    id: string;
    title?: string;
    content?: string;
    imageUrls?: string[];
    videoUrls?: string[];
    attachmentUrls?: string[];
    tags?: string[];
    isPinned?: boolean;
    isHidden?: boolean;
    metadata?: any;
}

export async function updateBoardPost(
    input: UpdateBoardPostInput
): Promise<BoardPost> {
    try {
        const post = await prisma.boardPost.update({
            where: { id: input.id },
            data: {
                title: input.title,
                content: input.content,
                imageUrls: input.imageUrls,
                videoUrls: input.videoUrls,
                attachmentUrls: input.attachmentUrls,
                tags: input.tags,
                isPinned: input.isPinned,
                isHidden: input.isHidden,
                metadata: input.metadata,
            },
        });
        return post;
    } catch (error) {
        console.error("Failed to update board post:", error);
        throw new Error("Failed to update board post");
    }
}

export async function deleteBoardPost(postId: string): Promise<boolean> {
    try {
        const post = await prisma.boardPost.findUnique({
            where: { id: postId },
            select: { boardId: true },
        });

        if (!post) return false;

        await prisma.boardPost.delete({
            where: { id: postId },
        });
        return true;
    } catch (error) {
        console.error("Failed to delete board post:", error);
        return false;
    }
}

// ===== BOARD COMMENT CRUD =====

export interface CreateBoardCommentInput {
    postId: string;
    authorId: string;
    authorType: BoardAuthorType;
    content: string;
    parentId?: string;
    imageUrls?: string[];
    files?: any[]; // 업로드된 파일 메타데이터 배열
    metadata?: any;
}

export async function createBoardComment(
    input: CreateBoardCommentInput
): Promise<BoardComment> {
    try {
        const post = await prisma.boardPost.findUnique({
            where: { id: input.postId },
            select: { boardId: true },
        });

        if (!post) {
            throw new Error("Post not found");
        }

        // 통합 검증 - 보드 모더레이션이 금지어 검증도 포함
        const contentValidation = await validateContentBeforePost(
            input.content,
            input.authorId,
            post.boardId
        );

        if (contentValidation.blocked) {
            // 차단된 경우 상세 로그
            console.warn(`Comment blocked for user: ${input.authorId}`, {
                reason: contentValidation.message,
                violations: contentValidation.violations,
                severity: contentValidation.severity,
            });

            throw new Error(
                contentValidation.message ||
                    "Content blocked due to policy violations"
            );
        }

        const comment = await prisma.boardComment.create({
            data: {
                postId: input.postId,
                authorId: input.authorId,
                authorType: input.authorType,
                content: input.content,
                parentId: input.parentId,
                imageUrls: input.imageUrls || [],
                files: input.files || [],
                metadata: input.metadata,
            },
        });

        await prisma.boardPost.update({
            where: { id: input.postId },
            data: { commentCount: { increment: 1 } },
        });

        if (input.parentId) {
            await prisma.boardComment.update({
                where: { id: input.parentId },
                data: { replyCount: { increment: 1 } },
            });
        }

        return comment;
    } catch (error) {
        console.error("Failed to create board comment:", error);
        throw new Error(
            error instanceof Error
                ? error.message
                : "Failed to create board comment"
        );
    }
}

export async function getBoardComments(
    postId: string
): Promise<BoardCommentWithDetails[]> {
    try {
        const comments = await prisma.boardComment.findMany({
            where: {
                postId,
                parentId: null,
            },
            include: {
                author: {
                    include: {
                        artist: true,
                    },
                },
                post: true,
                replies: {
                    include: {
                        author: {
                            include: {
                                artist: true,
                            },
                        },
                        reactions: true,
                    },
                    orderBy: { createdAt: "asc" },
                },
                reactions: true,
            },
            orderBy: { createdAt: "asc" },
        });

        return comments as BoardCommentWithDetails[];
    } catch (error) {
        console.error("Failed to get board comments:", error);
        return [];
    }
}

export async function deleteBoardComment(commentId: string): Promise<boolean> {
    try {
        const comment = await prisma.boardComment.findUnique({
            where: { id: commentId },
            select: { postId: true, parentId: true },
        });

        if (!comment) return false;

        await prisma.boardComment.delete({
            where: { id: commentId },
        });

        // 게시글 댓글 수 업데이트
        await prisma.boardPost.update({
            where: { id: comment.postId },
            data: { commentCount: { decrement: 1 } },
        });

        // 대댓글인 경우 부모 댓글의 답글 수 업데이트
        if (comment.parentId) {
            await prisma.boardComment.update({
                where: { id: comment.parentId },
                data: { replyCount: { decrement: 1 } },
            });
        }

        return true;
    } catch (error) {
        console.error("Failed to delete board comment:", error);
        return false;
    }
}

// ===== BOARD REACTION =====

export interface CreateBoardReactionInput {
    playerId: string;
    postId?: string;
    commentId?: string;
    type: BoardReactionType;
}

export async function createBoardReaction(
    input: CreateBoardReactionInput
): Promise<BoardReaction> {
    try {
        const reaction = await prisma.boardReaction.create({
            data: {
                playerId: input.playerId,
                postId: input.postId,
                commentId: input.commentId,
                type: input.type,
            },
        });

        // 카운트 업데이트
        if (input.postId) {
            const updateData: Prisma.BoardPostUpdateInput = {};
            switch (input.type) {
                case "LIKE":
                    updateData.likeCount = { increment: 1 };
                    break;
                case "DISLIKE":
                    updateData.dislikeCount = { increment: 1 };
                    break;
                case "RECOMMEND":
                    updateData.recommendCount = { increment: 1 };
                    break;
            }

            await prisma.boardPost.update({
                where: { id: input.postId },
                data: updateData,
            });

            // 추천 기반 인기 게시글 보상 (Board 설정 참조)
            if (input.type === "RECOMMEND") {
                await handlePopularPostReward(input.postId, input.playerId);
            }
        }

        if (input.commentId) {
            const updateData: Prisma.BoardCommentUpdateInput = {};
            switch (input.type) {
                case "LIKE":
                    updateData.likeCount = { increment: 1 };
                    break;
                case "DISLIKE":
                    updateData.dislikeCount = { increment: 1 };
                    break;
            }

            await prisma.boardComment.update({
                where: { id: input.commentId },
                data: updateData,
            });
        }

        return reaction;
    } catch (error) {
        console.error("Failed to create board reaction:", error);
        throw new Error("Failed to create board reaction");
    }
}

export async function deleteBoardReaction(
    playerId: string,
    postId?: string,
    commentId?: string,
    type?: BoardReactionType
): Promise<boolean> {
    try {
        const where: Prisma.BoardReactionWhereInput = {
            playerId,
            postId,
            commentId,
            type,
        };

        const reaction = await prisma.boardReaction.findFirst({ where });
        if (!reaction) return false;

        await prisma.boardReaction.delete({
            where: { id: reaction.id },
        });

        // 카운트 업데이트
        if (postId) {
            const updateData: Prisma.BoardPostUpdateInput = {};
            switch (reaction.type) {
                case "LIKE":
                    updateData.likeCount = { decrement: 1 };
                    break;
                case "DISLIKE":
                    updateData.dislikeCount = { decrement: 1 };
                    break;
                case "RECOMMEND":
                    updateData.recommendCount = { decrement: 1 };
                    break;
            }

            await prisma.boardPost.update({
                where: { id: postId },
                data: updateData,
            });
        }

        if (commentId) {
            const updateData: Prisma.BoardCommentUpdateInput = {};
            switch (reaction.type) {
                case "LIKE":
                    updateData.likeCount = { decrement: 1 };
                    break;
                case "DISLIKE":
                    updateData.dislikeCount = { decrement: 1 };
                    break;
            }

            await prisma.boardComment.update({
                where: { id: commentId },
                data: updateData,
            });
        }

        return true;
    } catch (error) {
        console.error("Failed to delete board reaction:", error);
        return false;
    }
}

// ===== BOARD POST REWARD =====

export interface CreatePostRewardInput {
    postId: string;
    playerId: string;
    grantedBy?: string;
    grantedByType?: BoardAuthorType;
    assetId?: string;
    amount: number;
    reason: BoardRewardReason;
    metadata?: any;
}

export async function createPostReward(
    input: CreatePostRewardInput
): Promise<BoardPostReward | null> {
    try {
        // amount 값 검증
        if (!input.amount || input.amount <= 0) {
            console.error("Invalid reward amount:", input.amount);
            return null;
        }

        const reward = await prisma.boardPostReward.create({
            data: {
                postId: input.postId,
                playerId: input.playerId,
                grantedBy: input.grantedBy,
                grantedByType: input.grantedByType,
                assetId: input.assetId,
                amount: input.amount,
                reason: input.reason,
                metadata: input.metadata,
                status: "PENDING",
            },
        });

        // 에셋 ID가 지정되지 않은 경우에만 기본 에셋 찾기
        const assetId = input.assetId || (await getDefaultAssetId());

        if (!assetId) {
            console.error("No asset specified and no default asset found");
            throw new Error("No asset available for reward");
        }

        const updateResult = await updatePlayerAsset({
            transaction: {
                playerId: input.playerId,
                assetId: assetId,
                amount: input.amount,
                operation: "ADD",
                reason: `Board reward: ${input.reason}`,
            },
        });

        if (updateResult.success) {
            await prisma.boardPostReward.update({
                where: { id: reward.id },
                data: {
                    assetId: assetId,
                    status: "COMPLETED",
                    processedAt: new Date(),
                },
            });
        } else {
            console.error("Failed to update player asset:", updateResult.error);
            throw new Error(
                `Failed to update player asset: ${updateResult.error}`
            );
        }

        return reward;
    } catch (error) {
        console.error("Failed to create post reward:", error);
        throw new Error("Failed to create post reward");
    }
}

// 기본 에셋 ID를 찾는 헬퍼 함수
async function getDefaultAssetId(): Promise<string | null> {
    const defaultAsset = await prisma.asset.findFirst({
        where: { isDefault: true, isActive: true },
        select: { id: true, name: true },
    });

    return defaultAsset?.id || null;
}

export interface GetPostRewardsInput {
    postId?: string;
    playerId?: string;
    reason?: BoardRewardReason;
    status?: BoardRewardStatus;
}

export async function getPostRewards(
    input?: GetPostRewardsInput
): Promise<BoardPostReward[]> {
    try {
        const where: Prisma.BoardPostRewardWhereInput = {};
        if (input?.postId) where.postId = input.postId;
        if (input?.playerId) where.playerId = input.playerId;
        if (input?.reason) where.reason = input.reason;
        if (input?.status) where.status = input.status;

        const rewards = await prisma.boardPostReward.findMany({
            where,
            include: {
                post: true,
                player: true,
                asset: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return rewards;
    } catch (error) {
        console.error("Failed to get post rewards:", error);
        return [];
    }
}

// ===== BOARD REWARD HANDLERS (Admin Configurable) =====

interface PostRewardLimitCheck {
    allowed: boolean;
    reason?: string;
    dailyRewardCount?: number;
    weeklyRewardCount?: number;
}

async function checkPostRewardLimits(
    boardId: string,
    playerId: string,
    boardSettings: any
): Promise<PostRewardLimitCheck> {
    try {
        const now = new Date();
        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const weekStart = new Date(
            now.getTime() - now.getDay() * 24 * 60 * 60 * 1000
        );

        const [dailyRewardCount, weeklyRewardCount] = await Promise.all([
            // 일일 게시글 작성 보상 수 (POST_CREATION 보상만 카운트)
            prisma.boardPostReward.count({
                where: {
                    playerId,
                    reason: "POST_CREATION",
                    status: "COMPLETED", // 실제 지급된 보상만 카운트
                    createdAt: { gte: todayStart },
                    post: {
                        boardId, // 해당 보드의 게시글에 대한 보상만
                    },
                },
            }),
            // 주간 게시글 작성 보상 수 (POST_CREATION 보상만 카운트)
            prisma.boardPostReward.count({
                where: {
                    playerId,
                    reason: "POST_CREATION",
                    status: "COMPLETED", // 실제 지급된 보상만 카운트
                    createdAt: { gte: weekStart },
                    post: {
                        boardId, // 해당 보드의 게시글에 대한 보상만
                    },
                },
            }),
        ]);

        // 일일 보상 제한 확인 (dailyPostLimit을 dailyRewardLimit으로 재해석)
        if (
            boardSettings.dailyPostLimit &&
            dailyRewardCount >= boardSettings.dailyPostLimit
        ) {
            return {
                allowed: false,
                reason: `Daily post creation reward limit exceeded (${dailyRewardCount}/${boardSettings.dailyPostLimit})`,
                dailyRewardCount,
                weeklyRewardCount,
            };
        }

        // 주간 보상 제한 확인 (weeklyPostLimit을 weeklyRewardLimit으로 재해석)
        if (
            boardSettings.weeklyPostLimit &&
            weeklyRewardCount >= boardSettings.weeklyPostLimit
        ) {
            return {
                allowed: false,
                reason: `Weekly post creation reward limit exceeded (${weeklyRewardCount}/${boardSettings.weeklyPostLimit})`,
                dailyRewardCount,
                weeklyRewardCount,
            };
        }

        return {
            allowed: true,
            dailyRewardCount,
            weeklyRewardCount,
        };
    } catch (error) {
        console.error("Failed to check post reward limits:", error);
        return { allowed: true }; // 에러 시 허용
    }
}

export async function handlePostCreationReward(
    postId: string,
    boardId: string,
    playerId: string
): Promise<void> {
    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: {
                postCreationRewardEnabled: true,
                postCreationRewardAmount: true,
                postCreationRewardAssetId: true,
                dailyPostLimit: true,
                weeklyPostLimit: true,
            },
        });

        if (!board) {
            return;
        }

        if (!board.postCreationRewardEnabled) {
            console.error("Post creation reward not enabled");
            return;
        }

        // 관리자가 보상 금액을 설정하지 않았다면 보상 없음
        if (
            !board.postCreationRewardAmount ||
            board.postCreationRewardAmount <= 0
        ) {
            console.error("Post creation reward amount not set or invalid");
            return;
        }

        // 일일/주간 게시글 보상 제한 확인 (게시글 작성 자체는 제한하지 않음)
        const rewardLimitCheck = await checkPostRewardLimits(
            boardId,
            playerId,
            board
        );
        if (!rewardLimitCheck.allowed) {
            console.info(
                `Post creation reward limit reached for player ${playerId}:`,
                rewardLimitCheck.reason
            );
            return; // 보상만 지급하지 않고, 게시글 작성은 허용
        }

        await createPostReward({
            postId,
            playerId,
            assetId: board.postCreationRewardAssetId || undefined,
            amount: board.postCreationRewardAmount,
            reason: "POST_CREATION",
            metadata: {
                boardId,
                configuredAmount: board.postCreationRewardAmount,
            },
        });
    } catch (error) {
        console.error("Failed to handle post creation reward:", error);
    }
}

export async function handlePopularPostReward(
    postId: string,
    reactorPlayerId: string
): Promise<void> {
    try {
        const post = await prisma.boardPost.findUnique({
            where: { id: postId },
            select: {
                recommendCount: true,
                authorId: true,
                boardId: true,
                board: {
                    select: {
                        popularPostRewardEnabled: true,
                        popularPostThreshold: true,
                        popularPostRewardAmount: true,
                        popularPostRewardAssetId: true,
                    },
                },
            },
        });

        if (!post) {
            console.error("Post not found");
            return;
        }

        if (!post.board.popularPostRewardEnabled) {
            console.error("Popular post reward not enabled");
            return;
        }

        // 관리자가 임계점과 보상 금액을 설정하지 않았다면 보상 없음
        if (
            !post.board.popularPostThreshold ||
            post.board.popularPostThreshold <= 0
        ) {
            console.error("Popular post threshold not set or invalid");
            return;
        }

        if (
            !post.board.popularPostRewardAmount ||
            post.board.popularPostRewardAmount <= 0
        ) {
            console.error("Popular post reward amount not set or invalid");
            return;
        }

        // 임계점 도달 확인
        if (post.recommendCount >= post.board.popularPostThreshold) {
            // 이미 보상을 받았는지 확인
            const existingReward = await prisma.boardPostReward.findFirst({
                where: {
                    postId,
                    playerId: post.authorId,
                    reason: "POPULAR_POST",
                },
            });

            if (existingReward) {
                console.error("Popular post reward already given");
                return;
            }

            await createPostReward({
                postId,
                playerId: post.authorId,
                grantedBy: reactorPlayerId,
                grantedByType: "PLAYER",
                assetId: post.board.popularPostRewardAssetId || undefined,
                amount: post.board.popularPostRewardAmount,
                reason: "POPULAR_POST",
                metadata: {
                    threshold: post.board.popularPostThreshold,
                    recommendCount: post.recommendCount,
                    triggerPlayerId: reactorPlayerId,
                },
            });
        } else {
            console.error(
                `Threshold not reached yet: ${post.recommendCount}/${post.board.popularPostThreshold}`
            );
        }
    } catch (error) {
        console.error("Failed to handle popular post reward:", error);
    }
}

export interface ManualRewardInput {
    postId: string;
    playerId: string;
    grantedBy: string;
    grantedByType: BoardAuthorType;
    assetId?: string;
    amount: number;
    reason: BoardRewardReason;
    metadata?: any;
}

export async function giveManualReward(
    input: ManualRewardInput
): Promise<BoardPostReward | null> {
    try {
        const post = await prisma.boardPost.findUnique({
            where: { id: input.postId },
            select: {
                boardId: true,
                board: {
                    select: {
                        allowUserRewards: true,
                        allowArtistRewards: true,
                        allowTeamRewards: true,
                        allowAdminRewards: true,
                        maxRewardPerPost: true,
                    },
                },
            },
        });

        if (!post) {
            throw new Error("Post not found");
        }

        // 권한 확인
        const hasPermission = checkRewardPermission(
            input.grantedByType,
            post.board
        );
        if (!hasPermission) {
            throw new Error("No permission to give rewards");
        }

        // 최대 보상 제한 확인
        if (
            post.board.maxRewardPerPost &&
            input.amount > post.board.maxRewardPerPost
        ) {
            throw new Error(
                `Reward amount exceeds maximum allowed (${post.board.maxRewardPerPost})`
            );
        }

        const reward = await createPostReward({
            postId: input.postId,
            playerId: input.playerId,
            grantedBy: input.grantedBy,
            grantedByType: input.grantedByType,
            assetId: input.assetId,
            amount: input.amount,
            reason: input.reason,
            metadata: {
                ...input.metadata,
                manual: true,
                grantedAt: new Date().toISOString(),
            },
        });

        return reward;
    } catch (error) {
        console.error("Failed to give manual reward:", error);
        throw error;
    }
}

function checkRewardPermission(
    grantedByType: BoardAuthorType,
    boardSettings: any
): boolean {
    switch (grantedByType) {
        case "PLAYER":
            return boardSettings.allowUserRewards;
        case "ARTIST":
            return boardSettings.allowArtistRewards;
        case "TEAM":
            return boardSettings.allowTeamRewards;
        case "ADMIN":
            return boardSettings.allowAdminRewards;
        default:
            return false;
    }
}
