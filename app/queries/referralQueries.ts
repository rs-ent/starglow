/// app/queries/referralQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { getReferralLogs } from "../actions/referral";
import { playerKeys } from "../queryKeys";

import type { GetReferralLogsInput } from "../actions/referral";

export const useReferralLogs = (input?: GetReferralLogsInput) => {
    return useQuery({
        queryKey: playerKeys.referralLogs(input),
        queryFn: () => getReferralLogs(input),
        enabled: !!input?.playerId,
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 1,
    });
};
