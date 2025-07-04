/// app/story/interaction/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import { getUserVerifiedSPGs } from "./actions";

import type { GetUserVerifiedSPGsInput } from "./actions";

export function useGetUserVerifiedSPGsQuery(input?: GetUserVerifiedSPGsInput) {
    return useQuery({
        queryKey: queryKeys.tokenGating.verifiedSPGs(input?.userId ?? ""),
        queryFn: () => getUserVerifiedSPGs(input),
        enabled: Boolean(input?.userId),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
