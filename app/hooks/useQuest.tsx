/// app/hooks/useQuest.ts

"use client";

import {
    useCreateQuestMutation,
    useUpdateQuestMutation,
    useUpdateQuestOrderMutation,
    useDeleteQuestMutation,
    useTokenGatingMutation,
    useCompleteQuestMutation,
    useClaimQuestRewardMutation,
    useSetReferralQuestLogsMutation,
} from "@/app/mutations/questsMutations";
import {
    GetQuestsInput,
    PaginationInput,
    GetQuestLogsInput,
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
} from "../actions/quests";
import {
    useQuestsQuery,
    useQuestLogsQuery,
    useClaimableQuestLogsQuery,
    useClaimedQuestLogsQuery,
} from "@/app/queries/questsQueries";

export function useQuestGet({
    getQuestsInput,
    getQuestLogsInput,
    getClaimableQuestLogsInput,
    getClaimedQuestLogsInput,
    pagination,
}: {
    getQuestsInput?: GetQuestsInput;
    getQuestLogsInput?: GetQuestLogsInput;
    getClaimableQuestLogsInput?: GetClaimableQuestLogsInput;
    getClaimedQuestLogsInput?: GetClaimedQuestLogsInput;
    pagination?: PaginationInput;
}) {
    const {
        data: quests,
        isLoading: isLoadingQuests,
        error: questsError,
    } = useQuestsQuery({ input: getQuestsInput, pagination });

    const {
        data: questLogs,
        isLoading: isLoadingQuestLogs,
        error: questLogsError,
    } = useQuestLogsQuery({ input: getQuestLogsInput, pagination });

    const {
        data: claimableQuestLogs,
        isLoading: isLoadingClaimableQuestLogs,
        error: claimableQuestLogsError,
    } = useClaimableQuestLogsQuery({ input: getClaimableQuestLogsInput });

    const {
        data: claimedQuestLogs,
        isLoading: isLoadingClaimedQuestLogs,
        error: claimedQuestLogsError,
    } = useClaimedQuestLogsQuery({ input: getClaimedQuestLogsInput });

    const isLoading =
        isLoadingQuests ||
        isLoadingQuestLogs ||
        isLoadingClaimableQuestLogs ||
        isLoadingClaimedQuestLogs;

    const error =
        questsError ||
        questLogsError ||
        claimableQuestLogsError ||
        claimedQuestLogsError;

    return {
        quests,
        isLoadingQuests,
        questsError,

        questLogs,
        isLoadingQuestLogs,
        questLogsError,

        claimableQuestLogs,
        isLoadingClaimableQuestLogs,
        claimableQuestLogsError,

        claimedQuestLogs,
        isLoadingClaimedQuestLogs,
        claimedQuestLogsError,

        isLoading,
        error,

        useQuestsQuery,
    };
}

export function useQuestSet() {
    const {
        mutateAsync: createQuest,
        isPending: isCreating,
        error: createError,
    } = useCreateQuestMutation();

    const {
        mutateAsync: updateQuest,
        isPending: isUpdating,
        error: updateError,
    } = useUpdateQuestMutation();

    const {
        mutateAsync: updateQuestOrder,
        isPending: isUpdatingOrder,
        error: updateOrderError,
    } = useUpdateQuestOrderMutation();

    const {
        mutateAsync: deleteQuest,
        isPending: isDeleting,
        error: deleteError,
    } = useDeleteQuestMutation();

    const {
        mutateAsync: tokenGating,
        isPending: isTokenGating,
        error: tokenGatingError,
    } = useTokenGatingMutation();

    const {
        mutateAsync: completeQuest,
        isPending: isCompleting,
        error: completeError,
    } = useCompleteQuestMutation();

    const {
        mutateAsync: claimQuestReward,
        isPending: isClaimingQuestReward,
        error: claimQuestRewardError,
    } = useClaimQuestRewardMutation();

    const {
        mutateAsync: setReferralQuestLogs,
        isPending: isSettingReferralQuestLogs,
        error: setReferralQuestLogsError,
    } = useSetReferralQuestLogsMutation();

    const isLoading =
        isCreating ||
        isUpdating ||
        isUpdatingOrder ||
        isDeleting ||
        isTokenGating ||
        isCompleting ||
        isClaimingQuestReward ||
        isSettingReferralQuestLogs;

    const error =
        createError ||
        updateError ||
        updateOrderError ||
        deleteError ||
        tokenGatingError ||
        completeError ||
        claimQuestRewardError ||
        setReferralQuestLogsError;

    return {
        createQuest,
        isCreating,
        createError,

        updateQuest,
        isUpdating,
        updateError,

        updateQuestOrder,
        isUpdatingOrder,
        updateOrderError,

        deleteQuest,
        isDeleting,
        deleteError,

        tokenGating,
        isTokenGating,
        tokenGatingError,

        completeQuest,
        isCompleting,
        completeError,

        claimQuestReward,
        isClaimingQuestReward,
        claimQuestRewardError,

        setReferralQuestLogs,
        isSettingReferralQuestLogs,
        setReferralQuestLogsError,

        isLoading,

        error,

        useCreateQuestMutation,
        useUpdateQuestMutation,
        useUpdateQuestOrderMutation,
        useDeleteQuestMutation,
        useTokenGatingMutation,
        useCompleteQuestMutation,
        useClaimQuestRewardMutation,
        useSetReferralQuestLogsMutation,
    };
}
