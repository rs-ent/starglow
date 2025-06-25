/// app/actions/boards/queries.ts

"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import { boardKeys } from "@/app/queryKeys";

import {
    getBoards,
    getBoard,
    getBoardPosts,
    getBoardPost,
    getBoardComments,
    getPostRewards,
} from "./actions";

import type {
    GetBoardsInput,
    GetBoardPostsInput,
    GetPostRewardsInput,
    GetBoardPostsOutput,
    Pagination,
} from "./actions";

// Board Queries
export function useGetBoardsQuery(
    input?: GetBoardsInput,
    pagination?: Pagination
) {
    return useQuery({
        queryKey: boardKeys.list(input, pagination),
        queryFn: () => getBoards(input, pagination),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

export function useGetBoardQuery(boardId?: string) {
    return useQuery({
        queryKey: boardKeys.detail(boardId || ""),
        queryFn: () => getBoard(boardId!),
        enabled: Boolean(boardId),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

// Board Post Queries
export function useGetBoardPostsQuery(
    input?: GetBoardPostsInput,
    pagination?: Pagination
) {
    return useQuery({
        queryKey: boardKeys.posts.list(input, pagination),
        queryFn: () => getBoardPosts(input, pagination),
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

// 무한 스크롤을 위한 쿼리 추가
export function useInfiniteBoardPostsQuery(input?: GetBoardPostsInput) {
    return useInfiniteQuery<
        GetBoardPostsOutput,
        Error,
        GetBoardPostsOutput,
        readonly ["boards", "posts", "infinite", any],
        number
    >({
        queryKey: boardKeys.posts.infinite(input),
        queryFn: ({ pageParam }: { pageParam: number }) =>
            getBoardPosts(input, {
                currentPage: pageParam,
                itemsPerPage: 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: GetBoardPostsOutput) => {
            if (lastPage.currentPage < lastPage.totalPages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        getPreviousPageParam: (firstPage: GetBoardPostsOutput) => {
            if (firstPage.currentPage > 1) {
                return firstPage.currentPage - 1;
            }
            return undefined;
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

export function useGetBoardPostQuery(postId?: string) {
    return useQuery({
        queryKey: boardKeys.posts.detail(postId || ""),
        queryFn: () => getBoardPost(postId!),
        enabled: Boolean(postId),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

// Board Comment Queries
export function useGetBoardCommentsQuery(postId?: string) {
    return useQuery({
        queryKey: boardKeys.comments.byPost(postId || ""),
        queryFn: () => getBoardComments(postId!),
        enabled: Boolean(postId),
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

// Board Post Reward Queries
export function useGetPostRewardsQuery(input?: GetPostRewardsInput) {
    return useQuery({
        queryKey: boardKeys.rewards.list(input),
        queryFn: () => getPostRewards(input),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}
