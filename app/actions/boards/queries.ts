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
    getArtistAllBoardPostCount,
} from "./actions";

import type {
    GetBoardsInput,
    GetBoardPostsInput,
    GetPostRewardsInput,
    GetBoardPostsOutput,
    Pagination,
    GetArtistAllBoardPostCountInput,
} from "./actions";

// 실시간 캐시 설정
const REALTIME_CACHE_CONFIG = {
    staleTime: 0, // 즉시 stale 처리
    gcTime: 1000 * 60 * 5, // 5분 후 가비지 컬렉션
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // 30초마다 백그라운드 새로고침
};

const SEMI_REALTIME_CACHE_CONFIG = {
    staleTime: 1000 * 10, // 10초
    gcTime: 1000 * 60 * 3, // 3분
    refetchOnWindowFocus: true,
    refetchOnMount: true,
};

const STATIC_CACHE_CONFIG = {
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
};

// Board Queries
export function useGetBoardsQuery(
    input?: GetBoardsInput,
    pagination?: Pagination
) {
    return useQuery({
        queryKey: boardKeys.list(input, pagination),
        queryFn: () => getBoards(input, pagination),
        ...STATIC_CACHE_CONFIG,
    });
}

export function useGetBoardQuery(boardId?: string) {
    return useQuery({
        queryKey: boardKeys.detail(boardId || ""),
        queryFn: () => getBoard(boardId!),
        enabled: Boolean(boardId),
        ...STATIC_CACHE_CONFIG,
    });
}

// Board Post Queries - 실시간 캐시 적용
export function useGetBoardPostsQuery(
    input?: GetBoardPostsInput,
    pagination?: Pagination
) {
    return useQuery({
        queryKey: boardKeys.posts.list(input, pagination),
        queryFn: () => getBoardPosts(input, pagination),
        ...SEMI_REALTIME_CACHE_CONFIG,
    });
}

// 무한 스크롤을 위한 쿼리 - 실시간 캐시 적용
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
        ...REALTIME_CACHE_CONFIG,
        refetchInterval: 60000, // 1분마다 새로고침
    });
}

export function useGetBoardPostQuery(postId?: string) {
    return useQuery({
        queryKey: boardKeys.posts.detail(postId || ""),
        queryFn: () => getBoardPost(postId!),
        enabled: Boolean(postId),
        ...SEMI_REALTIME_CACHE_CONFIG,
    });
}

// Board Comment Queries - 실시간 캐시 적용
export function useGetBoardCommentsQuery(postId?: string) {
    return useQuery({
        queryKey: boardKeys.comments.byPost(postId || ""),
        queryFn: () => getBoardComments(postId!),
        enabled: Boolean(postId),
        ...REALTIME_CACHE_CONFIG,
    });
}

// Board Post Reward Queries
export function useGetPostRewardsQuery(input?: GetPostRewardsInput) {
    return useQuery({
        queryKey: boardKeys.rewards.list(input),
        queryFn: () => getPostRewards(input),
        ...STATIC_CACHE_CONFIG,
    });
}

export function useGetArtistAllBoardPostCountQuery(
    input?: GetArtistAllBoardPostCountInput
) {
    return useQuery({
        queryKey: boardKeys.artistAllBoardPostCount(input?.artistId),
        queryFn: () => getArtistAllBoardPostCount(input),
        ...STATIC_CACHE_CONFIG,
        enabled: !!input?.artistId,
    });
}
