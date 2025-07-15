/// app/actions/boards/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { boardKeys, playerAssetsKeys } from "@/app/queryKeys";

import {
    createBoard,
    updateBoard,
    deleteBoard,
    createBoardPost,
    updateBoardPost,
    deleteBoardPost,
    createBoardComment,
    deleteBoardComment,
    createBoardReaction,
    deleteBoardReaction,
    createPostReward,
    giveManualReward,
} from "./actions";

import type {
    CreateBoardPostInput,
    CreateBoardCommentInput,
    BoardPostWithDetails,
    BoardCommentWithDetails,
} from "./actions";

async function invalidateBoardQueries(
    queryClient: ReturnType<typeof useQueryClient>,
    operations: {
        lists?: boolean;
        detail?: string;
        byArtist?: string;
        posts?: {
            all?: boolean;
            byBoard?: string;
            byAuthor?: string;
            detail?: string;
            infinite?: any;
        };
        comments?: {
            all?: boolean;
            byPost?: string;
            byAuthor?: string;
        };
        reactions?: {
            byPost?: string;
            byComment?: string;
            byPlayer?: string;
        };
        rewards?: {
            byPost?: string;
            byPlayer?: string;
        };
        playerAssets?: {
            all?: boolean;
            balances?: string;
        };
    }
) {
    try {
        const invalidationPromises = [];

        if (operations.lists) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({ queryKey: boardKeys.lists() })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.detail) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.detail(operations.detail),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.byArtist) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.byArtist(operations.byArtist),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.posts?.byBoard) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.byBoard(
                            operations.posts.byBoard
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.posts?.byAuthor) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.byAuthor(
                            operations.posts.byAuthor
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.posts?.detail) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.detail(
                            operations.posts.detail
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.posts?.infinite) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.infinite(
                            operations.posts.infinite
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.comments?.byPost) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.comments.byPost(
                            operations.comments.byPost
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.comments?.byAuthor) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.comments.byAuthor(
                            operations.comments.byAuthor
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.reactions?.byPost) {
            invalidationPromises.push(
                queryClient.invalidateQueries({
                    queryKey: boardKeys.reactions.byPost(
                        operations.reactions.byPost
                    ),
                })
            );
        }

        if (operations.reactions?.byComment) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.reactions.byComment(
                            operations.reactions.byComment
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.reactions?.byPlayer) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.reactions.byPlayer(
                            operations.reactions.byPlayer
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.rewards?.byPost) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.rewards.byPost(
                            operations.rewards.byPost
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.rewards?.byPlayer) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.rewards.byPlayer(
                            operations.rewards.byPlayer
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        if (operations.playerAssets?.balances) {
            invalidationPromises.push(
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balances(
                            operations.playerAssets.balances
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }

        await Promise.all(invalidationPromises);
    } catch (error) {
        console.error("[Board Query Invalidation]", error);
    }
}

const getCurrentUserInfo = (queryClient: any, userId: string) => {
    const userProfile = queryClient.getQueryData([
        "players",
        "profile",
        userId,
    ]);
    const playerData = queryClient.getQueryData(["players", "detail", userId]);

    return {
        id: userId,
        name: userProfile?.name || playerData?.name || "You",
        image: userProfile?.image || playerData?.image || null,
        nickname: userProfile?.nickname || playerData?.nickname || null,
        artist: userProfile?.artist || playerData?.artist || null,
        artistId: userProfile?.artistId || playerData?.artistId || null,
        isArtist: userProfile?.isArtist || playerData?.isArtist || false,
    };
};

// Board Mutations
export function useCreateBoardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBoard,
        onSuccess: (data, _variables) => {
            invalidateBoardQueries(queryClient, {
                lists: true,
                detail: data.id,
                byArtist: data.artistId || undefined,
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

export function useUpdateBoardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateBoard,
        onSuccess: (data, _variables) => {
            invalidateBoardQueries(queryClient, {
                lists: true,
                detail: data.id,
                byArtist: data.artistId || undefined,
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

export function useDeleteBoardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBoard,
        onSuccess: (_data, variables) => {
            invalidateBoardQueries(queryClient, {
                lists: true,
                detail: variables,
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

// Board Post Mutations
export function useCreateBoardPostMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBoardPost,
        onMutate: async (variables: CreateBoardPostInput) => {
            await queryClient.cancelQueries({
                queryKey: boardKeys.posts.byBoard(variables.boardId),
            });

            const previousData = queryClient.getQueryData(
                boardKeys.posts.byBoard(variables.boardId)
            );

            const currentUser = getCurrentUserInfo(
                queryClient,
                variables.authorId
            );

            const tempPost: Partial<BoardPostWithDetails> = {
                id: `temp-${Date.now()}`,
                boardId: variables.boardId,
                authorId: variables.authorId,
                authorType: variables.authorType,
                title: variables.title,
                content: variables.content,
                imageUrls: variables.imageUrls || [],
                videoUrls: variables.videoUrls || [],
                files: variables.files || [],
                likeCount: 0,
                recommendCount: 0,
                commentCount: 0,
                viewCount: 0,
                isPinned: false,
                isHidden: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                reactions: [],
                comments: [],
                rewards: [],
                _count: { comments: 0, reactions: 0 },
                author: currentUser as any,
                board: {} as any,
            };

            queryClient.setQueryData(
                boardKeys.posts.infinite({ boardId: variables.boardId }),
                (old: any) => {
                    if (!old) return old;

                    const newPages = [...old.pages];
                    if (newPages.length > 0) {
                        newPages[0] = {
                            ...newPages[0],
                            posts: [tempPost, ...newPages[0].posts],
                        };
                    }

                    return {
                        ...old,
                        pages: newPages,
                    };
                }
            );

            return { previousData, tempPost };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    boardKeys.posts.byBoard(variables.boardId),
                    context.previousData
                );
            }
        },
        onSuccess: (data, variables, context) => {
            queryClient.setQueryData(
                boardKeys.posts.infinite({ boardId: variables.boardId }),
                (old: any) => {
                    if (!old) return old;

                    const newPages = [...old.pages];
                    if (newPages.length > 0) {
                        const tempId = context?.tempPost?.id;
                        const postIndex = newPages[0].posts.findIndex(
                            (post: any) => post.id === tempId
                        );

                        if (postIndex !== -1) {
                            newPages[0].posts[postIndex] = data;
                        }
                    }

                    return {
                        ...old,
                        pages: newPages,
                    };
                }
            );

            invalidateBoardQueries(queryClient, {
                posts: {
                    byBoard: data.boardId,
                    infinite: { boardId: data.boardId },
                    byAuthor: !variables.isSandbox
                        ? variables.authorId
                        : undefined,
                },
                detail: data.boardId,
                playerAssets: !variables.isSandbox
                    ? {
                          balances: variables.authorId,
                      }
                    : undefined,
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

export function useUpdateBoardPostMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateBoardPost,
        onSuccess: (data, _variables) => {
            invalidateBoardQueries(queryClient, {
                posts: {
                    detail: data.id,
                    byBoard: data.boardId,
                },
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

export function useDeleteBoardPostMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBoardPost,
        onSuccess: (_data, variables) => {
            invalidateBoardQueries(queryClient, {
                posts: {
                    all: true,
                    detail: variables,
                },
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

// Board Comment Mutations
export function useCreateBoardCommentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBoardComment,
        onMutate: async (variables: CreateBoardCommentInput) => {
            await queryClient.cancelQueries({
                queryKey: boardKeys.comments.byPost(variables.postId),
            });

            const previousComments = queryClient.getQueryData(
                boardKeys.comments.byPost(variables.postId)
            );

            const currentUser = getCurrentUserInfo(
                queryClient,
                variables.authorId
            );

            const tempComment: Partial<BoardCommentWithDetails> = {
                id: `temp-comment-${Date.now()}`,
                postId: variables.postId,
                authorId: variables.authorId,
                authorType: variables.authorType,
                content: variables.content,
                parentId: variables.parentId,
                imageUrls: variables.imageUrls || [],
                files: variables.files || [],
                likeCount: 0,
                dislikeCount: 0,
                replyCount: 0,
                isHidden: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                reactions: [],
                replies: [],
                author: currentUser as any,
                post: {} as any,
            };

            queryClient.setQueryData(
                boardKeys.comments.byPost(variables.postId),
                (old: any) => {
                    if (!old) return [tempComment];

                    if (variables.parentId) {
                        return old.map((comment: any) => {
                            if (comment.id === variables.parentId) {
                                return {
                                    ...comment,
                                    replies: [
                                        ...(comment.replies || []),
                                        tempComment,
                                    ],
                                };
                            }
                            return comment;
                        });
                    } else {
                        return [tempComment, ...old];
                    }
                }
            );

            queryClient.setQueryData(
                boardKeys.posts.detail(variables.postId),
                (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        commentCount: old.commentCount + 1,
                    };
                }
            );

            return { previousComments, tempComment };
        },
        onError: (_error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(
                    boardKeys.comments.byPost(variables.postId),
                    context.previousComments
                );
            }
        },
        onSuccess: (data, variables, context) => {
            queryClient.setQueryData(
                boardKeys.comments.byPost(variables.postId),
                (old: any) => {
                    if (!old) return old;

                    const tempId = context?.tempComment?.id;

                    if (variables.parentId) {
                        return old.map((comment: any) => {
                            if (comment.id === variables.parentId) {
                                const updatedReplies =
                                    comment.replies?.map((reply: any) =>
                                        reply.id === tempId ? data : reply
                                    ) || [];
                                return {
                                    ...comment,
                                    replies: updatedReplies,
                                };
                            }
                            return comment;
                        });
                    } else {
                        return old.map((comment: any) =>
                            comment.id === tempId ? data : comment
                        );
                    }
                }
            );

            invalidateBoardQueries(queryClient, {
                comments: {
                    byPost: variables.postId,
                    byAuthor: !variables.isSandbox
                        ? variables.authorId
                        : undefined,
                },
                posts: {
                    detail: variables.postId,
                },
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

export function useDeleteBoardCommentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBoardComment,
        onMutate: async (commentId) => {
            const commentData = queryClient.getQueryData(
                boardKeys.comments.byPost(commentId)
            );
            return { commentData };
        },
        onSuccess: (_data, _variables, _context) => {
            const allCommentQueries = queryClient.getQueryCache().findAll({
                queryKey: ["boards", "comments"],
            });

            allCommentQueries.forEach((query) => {
                queryClient
                    .invalidateQueries({ queryKey: query.queryKey })
                    .catch((error) => {
                        console.error(error);
                    });
            });
        },
    });
}

// Board Reaction Mutations
export function useCreateBoardReactionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBoardReaction,
        onMutate: async (variables) => {
            if (variables.postId) {
                await queryClient.cancelQueries({
                    queryKey: boardKeys.posts.detail(variables.postId),
                });
                await queryClient.cancelQueries({
                    queryKey: ["boards", "posts", "infinite"],
                });
            }

            if (variables.commentId) {
                await queryClient.cancelQueries({
                    queryKey: boardKeys.comments.byPost(variables.postId || ""),
                });
            }

            const previousPostData = variables.postId
                ? queryClient.getQueryData(
                      boardKeys.posts.detail(variables.postId)
                  )
                : null;

            const previousInfiniteData = queryClient.getQueryData([
                "boards",
                "posts",
                "infinite",
            ]);

            if (variables.postId) {
                queryClient.setQueryData(
                    boardKeys.posts.detail(variables.postId),
                    (old: any) => {
                        if (!old) return old;

                        const newReactions = [
                            ...(old.reactions || []),
                            {
                                id: `temp-reaction-${Date.now()}`,
                                playerId: variables.playerId,
                                postId: variables.postId,
                                type: variables.type,
                                createdAt: new Date(),
                            },
                        ];

                        const updatedPost = {
                            ...old,
                            reactions: newReactions,
                        };

                        switch (variables.type) {
                            case "LIKE":
                                updatedPost.likeCount =
                                    (old.likeCount || 0) + 1;
                                break;
                            case "RECOMMEND":
                                updatedPost.recommendCount =
                                    (old.recommendCount || 0) + 1;
                                break;
                        }

                        return updatedPost;
                    }
                );

                // 모든 무한 스크롤 쿼리 업데이트
                const allInfiniteQueries = queryClient.getQueryCache().findAll({
                    queryKey: ["boards", "posts", "infinite"],
                });

                allInfiniteQueries.forEach((query) => {
                    queryClient.setQueryData(query.queryKey, (old: any) => {
                        if (!old?.pages) return old;

                        const newPages = old.pages.map((page: any) => ({
                            ...page,
                            posts: page.posts.map((post: any) => {
                                if (post.id === variables.postId) {
                                    const newReactions = [
                                        ...(post.reactions || []),
                                        {
                                            id: `temp-reaction-${Date.now()}`,
                                            playerId: variables.playerId,
                                            postId: variables.postId,
                                            type: variables.type,
                                            createdAt: new Date(),
                                        },
                                    ];

                                    const updatedPost = {
                                        ...post,
                                        reactions: newReactions,
                                    };

                                    // 카운트 업데이트
                                    switch (variables.type) {
                                        case "LIKE":
                                            updatedPost.likeCount =
                                                (post.likeCount || 0) + 1;
                                            break;
                                        case "RECOMMEND":
                                            updatedPost.recommendCount =
                                                (post.recommendCount || 0) + 1;
                                            break;
                                    }

                                    return updatedPost;
                                }
                                return post;
                            }),
                        }));

                        return {
                            ...old,
                            pages: newPages,
                        };
                    });
                });
            }

            // 댓글 반응 optimistic update (기존 로직 유지)
            if (variables.commentId) {
                const allCommentQueries = queryClient.getQueryCache().findAll({
                    queryKey: ["boards", "comments"],
                });

                allCommentQueries.forEach((query) => {
                    if (query.state.data) {
                        queryClient.setQueryData(query.queryKey, (old: any) => {
                            if (!Array.isArray(old)) return old;

                            return old.map((comment: any) => {
                                if (comment.id === variables.commentId) {
                                    const newReactions = [
                                        ...(comment.reactions || []),
                                        {
                                            id: `temp-reaction-${Date.now()}`,
                                            playerId: variables.playerId,
                                            commentId: variables.commentId,
                                            type: variables.type,
                                            createdAt: new Date(),
                                        },
                                    ];

                                    const updatedComment = {
                                        ...comment,
                                        reactions: newReactions,
                                    };

                                    if (variables.type === "LIKE") {
                                        updatedComment.likeCount =
                                            (comment.likeCount || 0) + 1;
                                    }

                                    return updatedComment;
                                }

                                // 대댓글 확인
                                if (comment.replies) {
                                    const updatedReplies = comment.replies.map(
                                        (reply: any) => {
                                            if (
                                                reply.id === variables.commentId
                                            ) {
                                                const newReactions = [
                                                    ...(reply.reactions || []),
                                                    {
                                                        id: `temp-reaction-${Date.now()}`,
                                                        playerId:
                                                            variables.playerId,
                                                        commentId:
                                                            variables.commentId,
                                                        type: variables.type,
                                                        createdAt: new Date(),
                                                    },
                                                ];

                                                const updatedReply = {
                                                    ...reply,
                                                    reactions: newReactions,
                                                };

                                                if (variables.type === "LIKE") {
                                                    updatedReply.likeCount =
                                                        (reply.likeCount || 0) +
                                                        1;
                                                }

                                                return updatedReply;
                                            }
                                            return reply;
                                        }
                                    );

                                    return {
                                        ...comment,
                                        replies: updatedReplies,
                                    };
                                }

                                return comment;
                            });
                        });
                    }
                });
            }

            return { previousPostData, previousInfiniteData };
        },
        onError: (_error, variables, context) => {
            // 에러 시 롤백
            if (variables.postId && context?.previousPostData) {
                queryClient.setQueryData(
                    boardKeys.posts.detail(variables.postId),
                    context.previousPostData
                );
            }

            if (context?.previousInfiniteData) {
                queryClient.setQueryData(
                    ["boards", "posts", "infinite"],
                    context.previousInfiniteData
                );
            }
        },
        onSuccess: (_data, variables) => {
            if (variables.postId && variables.type === "RECOMMEND") {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.rewards.byPost(variables.postId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balances(variables.playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useDeleteBoardReactionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            playerId,
            postId,
            commentId,
            type,
        }: {
            playerId: string;
            postId?: string;
            commentId?: string;
            type?: any;
        }) => deleteBoardReaction(playerId, postId, commentId, type),
        onMutate: async (variables) => {
            // 관련 쿼리 취소
            if (variables.postId) {
                await queryClient.cancelQueries({
                    queryKey: boardKeys.posts.detail(variables.postId),
                });
                await queryClient.cancelQueries({
                    queryKey: ["boards", "posts", "infinite"],
                });
            }

            // 이전 데이터 백업
            const previousPostData = variables.postId
                ? queryClient.getQueryData(
                      boardKeys.posts.detail(variables.postId)
                  )
                : null;

            const previousInfiniteData = queryClient.getQueryData([
                "boards",
                "posts",
                "infinite",
            ]);

            // 게시물 반응 삭제 optimistic update
            if (variables.postId) {
                // 상세 게시물 데이터 업데이트
                queryClient.setQueryData(
                    boardKeys.posts.detail(variables.postId),
                    (old: any) => {
                        if (!old) return old;

                        const newReactions = (old.reactions || []).filter(
                            (reaction: any) =>
                                !(
                                    reaction.playerId === variables.playerId &&
                                    reaction.type === variables.type
                                )
                        );

                        const updatedPost = {
                            ...old,
                            reactions: newReactions,
                        };

                        // 카운트 업데이트
                        switch (variables.type) {
                            case "LIKE":
                                updatedPost.likeCount = Math.max(
                                    0,
                                    (old.likeCount || 0) - 1
                                );
                                break;
                            case "RECOMMEND":
                                updatedPost.recommendCount = Math.max(
                                    0,
                                    (old.recommendCount || 0) - 1
                                );
                                break;
                        }

                        return updatedPost;
                    }
                );

                // 모든 무한 스크롤 쿼리 업데이트
                const allInfiniteQueries = queryClient.getQueryCache().findAll({
                    queryKey: ["boards", "posts", "infinite"],
                });

                allInfiniteQueries.forEach((query) => {
                    queryClient.setQueryData(query.queryKey, (old: any) => {
                        if (!old?.pages) return old;

                        const newPages = old.pages.map((page: any) => ({
                            ...page,
                            posts: page.posts.map((post: any) => {
                                if (post.id === variables.postId) {
                                    const newReactions = (
                                        post.reactions || []
                                    ).filter(
                                        (reaction: any) =>
                                            !(
                                                reaction.playerId ===
                                                    variables.playerId &&
                                                reaction.type === variables.type
                                            )
                                    );

                                    const updatedPost = {
                                        ...post,
                                        reactions: newReactions,
                                    };

                                    // 카운트 업데이트
                                    switch (variables.type) {
                                        case "LIKE":
                                            updatedPost.likeCount = Math.max(
                                                0,
                                                (post.likeCount || 0) - 1
                                            );
                                            break;
                                        case "RECOMMEND":
                                            updatedPost.recommendCount =
                                                Math.max(
                                                    0,
                                                    (post.recommendCount || 0) -
                                                        1
                                                );
                                            break;
                                    }

                                    return updatedPost;
                                }
                                return post;
                            }),
                        }));

                        return {
                            ...old,
                            pages: newPages,
                        };
                    });
                });
            }

            // 댓글 반응 삭제 optimistic update (기존 로직 유지)
            if (variables.commentId) {
                const allCommentQueries = queryClient.getQueryCache().findAll({
                    queryKey: ["boards", "comments"],
                });

                allCommentQueries.forEach((query) => {
                    if (query.state.data) {
                        queryClient.setQueryData(query.queryKey, (old: any) => {
                            if (!Array.isArray(old)) return old;

                            return old.map((comment: any) => {
                                if (comment.id === variables.commentId) {
                                    const newReactions = (
                                        comment.reactions || []
                                    ).filter(
                                        (reaction: any) =>
                                            !(
                                                reaction.playerId ===
                                                    variables.playerId &&
                                                reaction.type === variables.type
                                            )
                                    );

                                    const updatedComment = {
                                        ...comment,
                                        reactions: newReactions,
                                    };

                                    if (variables.type === "LIKE") {
                                        updatedComment.likeCount = Math.max(
                                            0,
                                            (comment.likeCount || 0) - 1
                                        );
                                    }

                                    return updatedComment;
                                }

                                // 대댓글 확인
                                if (comment.replies) {
                                    const updatedReplies = comment.replies.map(
                                        (reply: any) => {
                                            if (
                                                reply.id === variables.commentId
                                            ) {
                                                const newReactions = (
                                                    reply.reactions || []
                                                ).filter(
                                                    (reaction: any) =>
                                                        !(
                                                            reaction.playerId ===
                                                                variables.playerId &&
                                                            reaction.type ===
                                                                variables.type
                                                        )
                                                );

                                                const updatedReply = {
                                                    ...reply,
                                                    reactions: newReactions,
                                                };

                                                if (variables.type === "LIKE") {
                                                    updatedReply.likeCount =
                                                        Math.max(
                                                            0,
                                                            (reply.likeCount ||
                                                                0) - 1
                                                        );
                                                }

                                                return updatedReply;
                                            }
                                            return reply;
                                        }
                                    );

                                    return {
                                        ...comment,
                                        replies: updatedReplies,
                                    };
                                }

                                return comment;
                            });
                        });
                    }
                });
            }

            return { previousPostData, previousInfiniteData };
        },
        onError: (_error, variables, context) => {
            // 에러 시 롤백
            if (variables.postId && context?.previousPostData) {
                queryClient.setQueryData(
                    boardKeys.posts.detail(variables.postId),
                    context.previousPostData
                );
            }

            if (context?.previousInfiniteData) {
                queryClient.setQueryData(
                    ["boards", "posts", "infinite"],
                    context.previousInfiniteData
                );
            }
        },
        onSuccess: (_data, variables) => {
            // 성공 시 기존 invalidation 로직 유지
            if (variables.postId) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.reactions.byPost(variables.postId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.detail(variables.postId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.all(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            if (variables.commentId) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.reactions.byComment(
                            variables.commentId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.comments.all(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.reactions.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

// Board Post Reward Mutations
export function useCreatePostRewardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPostReward,
        onSuccess: (data, variables) => {
            invalidateBoardQueries(queryClient, {
                rewards: {
                    byPost: variables.postId,
                    byPlayer: variables.playerId,
                },
                playerAssets: {
                    balances: variables.playerId,
                },
            }).catch((error) => {
                console.error(error);
            });
        },
    });
}

export function useGiveManualRewardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: giveManualReward,
        onSuccess: (data, variables) => {
            if (data) {
                invalidateBoardQueries(queryClient, {
                    rewards: {
                        byPost: variables.postId,
                        byPlayer: variables.playerId,
                    },
                    playerAssets: {
                        balances: variables.playerId,
                    },
                }).catch((error) => {
                    console.error(error);
                });
            }
        },
    });
}
