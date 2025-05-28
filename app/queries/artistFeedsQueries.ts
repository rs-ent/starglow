/// app/queries/artistFeedsQueries.ts

import { useQuery } from "@tanstack/react-query";
import { artistFeedKeys } from "../queryKeys";
import { getArtistFeeds, getArtistFeedReactions } from "../actions/artistFeeds";
import type {
    GetArtistFeedsInput,
    GetArtistFeedReactionsInput,
} from "../actions/artistFeeds";

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
