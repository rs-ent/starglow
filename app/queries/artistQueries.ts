/// app/queries/artistQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getArtist,
    getArtistMessages,
    getArtists,
    tokenGating,
    getPlayers,
} from "../actions/artists";
import { artistKeys } from "../queryKeys";

import type {
    GetArtistInput,
    GetArtistMessagesInput,
    GetArtistsInput,
    TokenGatingInput,
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

export function useArtistMessages(input?: GetArtistMessagesInput) {
    return useQuery({
        queryKey: artistKeys.messages(input),
        queryFn: () => getArtistMessages(input),
        enabled: Boolean(input?.artistId),
        staleTime: 1000 * 60 * 60 * 12,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useTokenGatingQuery(input?: TokenGatingInput) {
    return useQuery({
        queryKey: artistKeys.tokenGating(input),
        queryFn: () => tokenGating(input),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
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
