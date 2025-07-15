/// app/actions/boards/hooks.ts

"use client";

import {
    useCreateBoardMutation,
    useUpdateBoardMutation,
    useDeleteBoardMutation,
    useCreateBoardPostMutation,
    useUpdateBoardPostMutation,
    useDeleteBoardPostMutation,
    useCreateBoardCommentMutation,
    useDeleteBoardCommentMutation,
    useCreateBoardReactionMutation,
    useDeleteBoardReactionMutation,
    useCreatePostRewardMutation,
    useGiveManualRewardMutation,
} from "./mutations";

import {
    useGetBoardsQuery,
    useGetBoardQuery,
    useGetBoardPostsQuery,
    useGetBoardPostQuery,
    useGetBoardCommentsQuery,
    useGetPostRewardsQuery,
    useInfiniteBoardPostsQuery,
    useGetArtistAllBoardPostCountQuery,
} from "./queries";

import type {
    GetBoardsInput,
    GetBoardPostsInput,
    GetPostRewardsInput,
    Pagination,
    GetArtistAllBoardPostCountInput,
} from "./actions";

export interface useBoardsInput {
    // Board queries
    getBoardsInput?: GetBoardsInput;
    getBoardsPagination?: Pagination;
    getBoardId?: string;

    // Board post queries
    getBoardPostsInput?: GetBoardPostsInput;
    getBoardPostsPagination?: Pagination;
    getBoardPostId?: string;

    // Board comment queries
    getBoardCommentsPostId?: string;

    // Board reward queries
    getPostRewardsInput?: GetPostRewardsInput;

    // Artist all board post count queries
    getArtistAllBoardPostCountInput?: GetArtistAllBoardPostCountInput;
}

export function useBoards(input?: useBoardsInput) {
    // Board Queries
    const {
        data: boardsData,
        isLoading: isBoardsLoading,
        isError: isBoardsError,
        error: boardsError,
        refetch: refetchBoards,
    } = useGetBoardsQuery(input?.getBoardsInput, input?.getBoardsPagination);

    const {
        data: boardData,
        isLoading: isBoardLoading,
        isError: isBoardError,
        error: boardError,
        refetch: refetchBoard,
    } = useGetBoardQuery(input?.getBoardId);

    // Board Post Queries
    const {
        data: boardPostsData,
        isLoading: isBoardPostsLoading,
        isError: isBoardPostsError,
        error: boardPostsError,
        refetch: refetchBoardPosts,
    } = useGetBoardPostsQuery(
        input?.getBoardPostsInput,
        input?.getBoardPostsPagination
    );

    const {
        data: boardPostData,
        isLoading: isBoardPostLoading,
        isError: isBoardPostError,
        error: boardPostError,
        refetch: refetchBoardPost,
    } = useGetBoardPostQuery(input?.getBoardPostId);

    // Board Comment Queries
    const {
        data: boardCommentsData,
        isLoading: isBoardCommentsLoading,
        isError: isBoardCommentsError,
        error: boardCommentsError,
        refetch: refetchBoardComments,
    } = useGetBoardCommentsQuery(input?.getBoardCommentsPostId);

    // Board Reward Queries
    const {
        data: postRewardsData,
        isLoading: isPostRewardsLoading,
        isError: isPostRewardsError,
        error: postRewardsError,
        refetch: refetchPostRewards,
    } = useGetPostRewardsQuery(input?.getPostRewardsInput);

    // Artist all board post count queries

    const {
        data: artistAllBoardPostCountData,
        isLoading: isArtistAllBoardPostCountLoading,
        isError: isArtistAllBoardPostCountError,
        error: artistAllBoardPostCountError,
    } = useGetArtistAllBoardPostCountQuery(
        input?.getArtistAllBoardPostCountInput
    );

    // Board Mutations
    const {
        mutate: createBoard,
        mutateAsync: createBoardAsync,
        isPending: isCreateBoardPending,
        isError: isCreateBoardError,
        error: createBoardError,
    } = useCreateBoardMutation();

    const {
        mutate: updateBoard,
        mutateAsync: updateBoardAsync,
        isPending: isUpdateBoardPending,
        isError: isUpdateBoardError,
        error: updateBoardError,
    } = useUpdateBoardMutation();

    const {
        mutate: deleteBoard,
        mutateAsync: deleteBoardAsync,
        isPending: isDeleteBoardPending,
        isError: isDeleteBoardError,
        error: deleteBoardError,
    } = useDeleteBoardMutation();

    // Board Post Mutations
    const {
        mutate: createBoardPost,
        mutateAsync: createBoardPostAsync,
        isPending: isCreateBoardPostPending,
        isError: isCreateBoardPostError,
        error: createBoardPostError,
    } = useCreateBoardPostMutation();

    const {
        mutate: updateBoardPost,
        mutateAsync: updateBoardPostAsync,
        isPending: isUpdateBoardPostPending,
        isError: isUpdateBoardPostError,
        error: updateBoardPostError,
    } = useUpdateBoardPostMutation();

    const {
        mutate: deleteBoardPost,
        mutateAsync: deleteBoardPostAsync,
        isPending: isDeleteBoardPostPending,
        isError: isDeleteBoardPostError,
        error: deleteBoardPostError,
    } = useDeleteBoardPostMutation();

    // Board Comment Mutations
    const {
        mutate: createBoardComment,
        mutateAsync: createBoardCommentAsync,
        isPending: isCreateBoardCommentPending,
        isError: isCreateBoardCommentError,
        error: createBoardCommentError,
    } = useCreateBoardCommentMutation();

    const {
        mutate: deleteBoardComment,
        mutateAsync: deleteBoardCommentAsync,
        isPending: isDeleteBoardCommentPending,
        isError: isDeleteBoardCommentError,
        error: deleteBoardCommentError,
    } = useDeleteBoardCommentMutation();

    // Board Reaction Mutations
    const {
        mutate: createBoardReaction,
        mutateAsync: createBoardReactionAsync,
        isPending: isCreateBoardReactionPending,
        isError: isCreateBoardReactionError,
        error: createBoardReactionError,
    } = useCreateBoardReactionMutation();

    const {
        mutate: deleteBoardReaction,
        mutateAsync: deleteBoardReactionAsync,
        isPending: isDeleteBoardReactionPending,
        isError: isDeleteBoardReactionError,
        error: deleteBoardReactionError,
    } = useDeleteBoardReactionMutation();

    // Board Reward Mutations
    const {
        mutate: createPostReward,
        mutateAsync: createPostRewardAsync,
        isPending: isCreatePostRewardPending,
        isError: isCreatePostRewardError,
        error: createPostRewardError,
    } = useCreatePostRewardMutation();

    const {
        mutate: giveManualReward,
        mutateAsync: giveManualRewardAsync,
        isPending: isGiveManualRewardPending,
        isError: isGiveManualRewardError,
        error: giveManualRewardError,
    } = useGiveManualRewardMutation();

    return {
        // Board data and actions
        boardsData,
        isBoardsLoading,
        isBoardsError,
        boardsError,
        refetchBoards,

        boardData,
        isBoardLoading,
        isBoardError,
        boardError,
        refetchBoard,

        createBoard,
        createBoardAsync,
        isCreateBoardPending,
        isCreateBoardError,
        createBoardError,

        updateBoard,
        updateBoardAsync,
        isUpdateBoardPending,
        isUpdateBoardError,
        updateBoardError,

        deleteBoard,
        deleteBoardAsync,
        isDeleteBoardPending,
        isDeleteBoardError,
        deleteBoardError,

        // Board post data and actions
        boardPostsData,
        isBoardPostsLoading,
        isBoardPostsError,
        boardPostsError,
        refetchBoardPosts,

        boardPostData,
        isBoardPostLoading,
        isBoardPostError,
        boardPostError,
        refetchBoardPost,

        createBoardPost,
        createBoardPostAsync,
        isCreateBoardPostPending,
        isCreateBoardPostError,
        createBoardPostError,

        updateBoardPost,
        updateBoardPostAsync,
        isUpdateBoardPostPending,
        isUpdateBoardPostError,
        updateBoardPostError,

        deleteBoardPost,
        deleteBoardPostAsync,
        isDeleteBoardPostPending,
        isDeleteBoardPostError,
        deleteBoardPostError,

        // Board comment data and actions
        boardCommentsData,
        isBoardCommentsLoading,
        isBoardCommentsError,
        boardCommentsError,
        refetchBoardComments,

        createBoardComment,
        createBoardCommentAsync,
        isCreateBoardCommentPending,
        isCreateBoardCommentError,
        createBoardCommentError,

        deleteBoardComment,
        deleteBoardCommentAsync,
        isDeleteBoardCommentPending,
        isDeleteBoardCommentError,
        deleteBoardCommentError,

        // Board reaction actions
        createBoardReaction,
        createBoardReactionAsync,
        isCreateBoardReactionPending,
        isCreateBoardReactionError,
        createBoardReactionError,

        deleteBoardReaction,
        deleteBoardReactionAsync,
        isDeleteBoardReactionPending,
        isDeleteBoardReactionError,
        deleteBoardReactionError,

        // Board reward data and actions
        postRewardsData,
        isPostRewardsLoading,
        isPostRewardsError,
        postRewardsError,
        refetchPostRewards,

        createPostReward,
        createPostRewardAsync,
        isCreatePostRewardPending,
        isCreatePostRewardError,
        createPostRewardError,

        giveManualReward,
        giveManualRewardAsync,
        isGiveManualRewardPending,
        isGiveManualRewardError,
        giveManualRewardError,

        artistAllBoardPostCountData,
        isArtistAllBoardPostCountLoading,
        isArtistAllBoardPostCountError,
        artistAllBoardPostCountError,
    };
}

// 무한 스크롤을 위한 별도 hook
export function useInfiniteBoardPosts(input?: GetBoardPostsInput) {
    return useInfiniteBoardPostsQuery(input);
}
