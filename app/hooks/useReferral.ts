/// app/hooks/useReferral.ts

"use client";

import { useReferralLogs } from "@/app/queries/referralQueries";
import { GetReferralLogsInput } from "../actions/referral";

export interface UseReferralGetInput {
    GetReferralLogsInput: GetReferralLogsInput;
}

export function useReferralGet(input?: UseReferralGetInput) {
    const {
        data: referralLogs,
        isLoading: isLoadingReferralLogs,
        error: errorReferralLogs,
    } = useReferralLogs(input?.GetReferralLogsInput);

    const isLoading = isLoadingReferralLogs;
    const error = errorReferralLogs;

    return {
        referralLogs,
        isLoadingReferralLogs,
        errorReferralLogs,

        isLoading,
        error,
    };
}
