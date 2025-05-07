/// app/queries/referralQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getReferralLogs, GetReferralLogsInput } from "../actions/referral";
import { playerKeys } from "../queryKeys";

export const useReferralLogs = (input?: GetReferralLogsInput) => {
    return useQuery({
        queryKey: playerKeys.referralLogs(input),
        queryFn: () => getReferralLogs(input),
        enabled: !!input?.playerId,
    });
};
