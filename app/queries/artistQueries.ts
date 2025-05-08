/// app/queries/artistQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { artistKeys } from "../queryKeys";
import {
    getArtists,
    getArtist,
    getArtistMessages,
    tokenGating,
} from "../actions/artists";
import type {
    GetArtistsInput,
    GetArtistInput,
    GetArtistMessagesInput,
    TokenGatingInput,
} from "../actions/artists";

export function useArtists(input?: GetArtistsInput) {
    return useQuery({
        queryKey: artistKeys.list(input),
        queryFn: () => getArtists(input),
    });
}

export function useArtist(input?: GetArtistInput) {
    return useQuery({
        queryKey: artistKeys.detail(input),
        queryFn: () => getArtist(input),
        enabled: Boolean(input?.id),
    });
}

export function useArtistMessages(input?: GetArtistMessagesInput) {
    return useQuery({
        queryKey: artistKeys.messages(input),
        queryFn: () => getArtistMessages(input),
        enabled: Boolean(input?.artistId),
    });
}

export function useTokenGatingQuery(input?: TokenGatingInput) {
    return useQuery({
        queryKey: artistKeys.tokenGating(input),
        queryFn: () => tokenGating(input),
        enabled: Boolean(input?.artist && input?.userId),
        staleTime: 1000 * 60 * 60 * 1,
    });
}
