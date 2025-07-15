/// app/queries/artistQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getArtist,
    getArtistForMetadata,
    getArtistMessages,
    getArtists,
    getArtistsForStarList,
    getPlayers,
} from "../actions/artists";
import { artistKeys } from "../queryKeys";

import type {
    GetArtistInput,
    GetArtistMessagesInput,
    GetArtistsInput,
    GetPlayersInput,
} from "../actions/artists";

export function useArtists(input?: GetArtistsInput) {
    return useQuery({
        queryKey: artistKeys.list(input),
        queryFn: () => getArtists(input),
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 12,
    });
}

export function useArtist(input?: GetArtistInput) {
    return useQuery({
        queryKey: artistKeys.detail(input),
        queryFn: () => getArtist(input),
        enabled: Boolean(input?.id),
        staleTime: 1000 * 60 * 60 * 6,
        gcTime: 1000 * 60 * 60 * 12,
    });
}

export function useArtistForMetadata(input?: GetArtistInput) {
    return useQuery({
        queryKey: artistKeys.metadata(input),
        queryFn: () => getArtistForMetadata(input),
        enabled: Boolean(input?.id || input?.code || input?.name),
        staleTime: 1000 * 60 * 60 * 12, // 메타데이터는 더 길게 캐시
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetArtistsForStarListQuery() {
    return useQuery({
        queryKey: artistKeys.star(),
        queryFn: () => getArtistsForStarList(),
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 3,
    });
}

export function useArtistMessages(input?: GetArtistMessagesInput) {
    return useQuery({
        queryKey: artistKeys.messages(input),
        queryFn: () => getArtistMessages(input),
        enabled: Boolean(input?.artistId),
        staleTime: 1000 * 60 * 60 * 12,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function usePlayers(input?: GetPlayersInput) {
    return useQuery({
        queryKey: artistKeys.players(input),
        queryFn: () => getPlayers(input),
        staleTime: 1000 * 60 * 60 * 24 * 30, // 30일 캐시
        gcTime: 1000 * 60 * 60 * 24 * 30, // 30일 가비지 컬렉션
    });
}
