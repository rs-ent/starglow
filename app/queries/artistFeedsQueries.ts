/// app/queries/artistFeedsQueries.ts

import {
    useInfiniteQuery,
    useQuery
} from "@tanstack/react-query";

import { getArtistFeeds, getArtistFeedReactions } from "../actions/artistFeeds";
import { artistFeedKeys } from "../queryKeys";

import type {
    GetArtistFeedsInput,
    GetArtistFeedReactionsInput,
    ArtistFeedWithReactions,
} from "../actions/artistFeeds";
import type {
    UseInfiniteQueryResult,
    InfiniteData} from "@tanstack/react-query";

export function useArtistFeedsQuery(input?: GetArtistFeedsInput) {
    return useQuery({
        queryKey: artistFeedKeys.list({ artistId: input?.artistId ?? "" }),
        queryFn: () => getArtistFeeds({ input }),
        enabled: Boolean(input?.artistId),
    });
}

export function useArtistFeedReactionsQuery(
    input?: GetArtistFeedReactionsInput
) {
    return useQuery({
        queryKey: artistFeedKeys.reactions({
            artistFeedId: input?.artistFeedId ?? "",
            playerId: input?.playerId ?? "",
        }),
        queryFn: () => getArtistFeedReactions({ input }),
        enabled: Boolean(input?.artistFeedId || input?.playerId),
    });
}

export function useArtistFeedsInfiniteQuery(
    input?: GetArtistFeedsInput
): UseInfiniteQueryResult<
    InfiniteData<{
        feeds: ArtistFeedWithReactions[];
        nextCursor: { createdAt: string; id: string } | null;
    }>,
    Error
> {
    return useInfiniteQuery<
        {
            feeds: ArtistFeedWithReactions[];
            nextCursor: { createdAt: string; id: string } | null;
        },
        Error
    >({
        queryKey: artistFeedKeys.infiniteList({
            artistId: input?.artistId ?? "",
            limit: input?.pagination?.limit,
        }),
        queryFn: async ({ pageParam }) => {
            return getArtistFeeds({
                input: {
                    artistId: input?.artistId ?? "",
                    pagination: {
                        cursor: pageParam as
                            | { createdAt: string; id: string }
                            | undefined,
                        limit: input?.pagination?.limit ?? 15,
                    },
                },
            });
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: Boolean(input?.artistId),
        initialPageParam: undefined,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}
