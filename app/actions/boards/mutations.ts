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

// 현재 사용자 정보 가져오기 헬퍼 함수
const getCurrentUserInfo = (queryClient: any, userId: string) => {
    // 사용자 프로필 정보 가져오기
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
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.detail(data.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            if (data.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.byArtist(data.artistId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useUpdateBoardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateBoard,
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.detail(data.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            if (data.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.byArtist(data.artistId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useDeleteBoardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBoard,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.detail(variables),
                })
                .catch((error) => {
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
            // 관련 쿼리들을 취소하여 optimistic update와 충돌 방지
            await queryClient.cancelQueries({
                queryKey: boardKeys.posts.byBoard(variables.boardId),
            });

            // 이전 데이터 백업
            const previousData = queryClient.getQueryData(
                boardKeys.posts.byBoard(variables.boardId)
            );

            // 현재 사용자 정보 가져오기
            const currentUser = getCurrentUserInfo(
                queryClient,
                variables.authorId
            );

            // 임시 게시물 생성 (optimistic update)
            const tempPost: Partial<BoardPostWithDetails> = {
                id: `temp-${Date.now()}`, // 임시 ID
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
                // 실제 사용자 정보 사용
                author: currentUser as any,
                board: {} as any,
            };

            // 무한 스크롤 데이터 업데이트
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
            // 에러 발생 시 이전 데이터로 롤백
            if (context?.previousData) {
                queryClient.setQueryData(
                    boardKeys.posts.byBoard(variables.boardId),
                    context.previousData
                );
            }
        },
        onSuccess: (data, variables, context) => {
            // 성공 시 실제 데이터로 교체
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

            // 기존 invalidation 로직 유지
            queryClient
                .invalidateQueries({ queryKey: boardKeys.posts.all() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.byBoard(data.boardId),
                })
                .catch((error) => {
                    console.error(error);
                });

            if (!variables.isSandbox && variables.authorId) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.byAuthor(variables.authorId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balances(variables.authorId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.detail(data.boardId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onSettled: () => {
            // 완료 후 관련 쿼리 다시 가져오기
            queryClient
                .invalidateQueries({ queryKey: boardKeys.posts.all() })
                .catch((error) => {
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
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.detail(data.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.byBoard(data.boardId),
                })
                .catch((error) => {
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
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.all(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.detail(variables),
                })
                .catch((error) => {
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
            // 관련 쿼리들을 취소
            await queryClient.cancelQueries({
                queryKey: boardKeys.comments.byPost(variables.postId),
            });

            // 이전 데이터 백업
            const previousComments = queryClient.getQueryData(
                boardKeys.comments.byPost(variables.postId)
            );

            // 현재 사용자 정보 가져오기
            const currentUser = getCurrentUserInfo(
                queryClient,
                variables.authorId
            );

            // 임시 댓글 생성 (optimistic update)
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
                // 실제 사용자 정보 사용
                author: currentUser as any,
                post: {} as any,
            };

            // 댓글 데이터 업데이트
            queryClient.setQueryData(
                boardKeys.comments.byPost(variables.postId),
                (old: any) => {
                    if (!old) return [tempComment];

                    if (variables.parentId) {
                        // 대댓글인 경우
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
                        // 최상위 댓글인 경우
                        return [tempComment, ...old];
                    }
                }
            );

            // 게시물의 댓글 수 즉시 업데이트
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
        onError: (error, variables, context) => {
            // 에러 발생 시 롤백
            if (context?.previousComments) {
                queryClient.setQueryData(
                    boardKeys.comments.byPost(variables.postId),
                    context.previousComments
                );
            }
        },
        onSuccess: (data, variables, context) => {
            // 성공 시 실제 데이터로 교체
            queryClient.setQueryData(
                boardKeys.comments.byPost(variables.postId),
                (old: any) => {
                    if (!old) return old;

                    const tempId = context?.tempComment?.id;

                    if (variables.parentId) {
                        // 대댓글인 경우
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
                        // 최상위 댓글인 경우
                        return old.map((comment: any) =>
                            comment.id === tempId ? data : comment
                        );
                    }
                }
            );

            // 기존 invalidation 로직 유지
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.comments.byPost(variables.postId),
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

            if (!variables.isSandbox && variables.authorId) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.comments.byAuthor(
                            variables.authorId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
            queryClient
                .invalidateQueries({ queryKey: boardKeys.posts.all() })
                .catch((error) => {
                    console.error(error);
                });
        },
        onSettled: () => {
            // 완료 후 관련 쿼리 다시 가져오기
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.comments.all(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteBoardCommentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBoardComment,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.comments.all(),
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
        },
    });
}

// Board Reaction Mutations
export function useCreateBoardReactionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBoardReaction,
        onMutate: async (variables) => {
            // 관련 쿼리 취소
            if (variables.postId) {
                await queryClient.cancelQueries({
                    queryKey: boardKeys.posts.detail(variables.postId),
                });
                // 모든 무한 스크롤 쿼리 취소
                await queryClient.cancelQueries({
                    queryKey: ["boards", "posts", "infinite"],
                });
            }

            if (variables.commentId) {
                await queryClient.cancelQueries({
                    queryKey: boardKeys.comments.byPost(variables.postId || ""),
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

            // 게시물 반응 optimistic update
            if (variables.postId) {
                // 상세 게시물 데이터 업데이트
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

                        // 카운트 업데이트
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
        onError: (error, variables, context) => {
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
        onSuccess: (data, variables) => {
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

                if (variables.type === "RECOMMEND") {
                    queryClient
                        .invalidateQueries({
                            queryKey: boardKeys.rewards.byPost(
                                variables.postId
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                    queryClient
                        .invalidateQueries({
                            queryKey: playerAssetsKeys.all,
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
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
        onError: (error, variables, context) => {
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
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.rewards.byPost(variables.postId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.rewards.byPlayer(variables.playerId),
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
        },
    });
}

export function useGiveManualRewardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: giveManualReward,
        onSuccess: (data, variables) => {
            if (data) {
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.rewards.byPost(variables.postId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.rewards.byPlayer(
                            variables.playerId
                        ),
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
