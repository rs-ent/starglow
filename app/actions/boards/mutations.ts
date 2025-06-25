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
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.all(),
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
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.posts.byAuthor(variables.authorId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.detail(data.boardId),
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
        onSuccess: (data, variables) => {
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
            queryClient
                .invalidateQueries({
                    queryKey: boardKeys.comments.byAuthor(variables.authorId),
                })
                .catch((error) => {
                    console.error(error);
                });
            // 게시글 목록도 무효화해서 댓글 수 업데이트
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
        onSuccess: (_data, variables) => {
            if (variables.postId) {
                // 게시글 반응 관련 쿼리들 무효화
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
                // 게시글 목록도 무효화하여 좋아요/추천 수가 실시간 업데이트되도록
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.posts.all(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // 추천 반응시 보상 지급 가능성으로 rewards와 player assets 무효화
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
                    // 게시글 작성자의 자산도 무효화 (보상 지급 가능성)
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
                // 댓글 반응 관련 쿼리들 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: boardKeys.reactions.byComment(
                            variables.commentId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // 댓글 목록도 무효화하여 좋아요 수가 실시간 업데이트되도록
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
        onSuccess: (_data, variables) => {
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
                // 게시글 목록도 무효화하여 좋아요/추천 수가 실시간 업데이트되도록
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
                // 댓글 목록도 무효화하여 좋아요 수가 실시간 업데이트되도록
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
