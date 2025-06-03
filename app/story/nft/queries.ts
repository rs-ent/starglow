/// app/story/nft/queries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { getNFTs, getNFTsInput } from "./actions";

export function useNFTsQuery(input?: getNFTsInput) {
    return useQuery({
        queryKey: [queryKeys.nft.list, input],
        queryFn: () => getNFTs(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
