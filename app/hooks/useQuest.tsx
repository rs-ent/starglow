/// app/hooks/useQuest.ts

"use client";

import {
    useClaimQuestRewardMutation,
    useCompleteQuestMutation,
    useCreateQuestMutation,
    useDeleteQuestMutation,
    useUpdateQuestActiveMutation,
    useUpdateQuestMutation,
    useUpdateQuestOrderMutation,
} from "@/app/mutations/questsMutations";
import {
    useClaimableQuestLogsQuery,
    useClaimedQuestLogsQuery,
    usePlayerQuestLogsQuery,
    useQuestLogsQuery,
    useQuestsQuery,
    useTokenGatingQuestQuery,
    useActiveQuestLogsQuery,
    useCompletedQuestLogsQuery,
} from "@/app/queries/questsQueries";

import type {
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
    GetQuestLogsInput,
    GetQuestsInput,
    GetActiveQuestLogsInput,
    GetCompletedQuestLogsInput,
    TokenGatingQuestInput,
    PaginationInput,
} from "../actions/quests";

export function useQuestGet({
    getQuestsInput,
    getQuestLogsInput,
    getClaimableQuestLogsInput,
    getClaimedQuestLogsInput,
    getPlayerQuestLogsInput,
    getActiveQuestLogsInput,
    getCompletedQuestLogsInput,
    getTokenGatingQuestInput,
    pagination,
}: {
    getQuestsInput?: GetQuestsInput;
    getQuestLogsInput?: GetQuestLogsInput;
    getClaimableQuestLogsInput?: GetClaimableQuestLogsInput;
    getClaimedQuestLogsInput?: GetClaimedQuestLogsInput;
    getPlayerQuestLogsInput?: GetPlayerQuestLogsInput;
    getActiveQuestLogsInput?: GetActiveQuestLogsInput;
    getCompletedQuestLogsInput?: GetCompletedQuestLogsInput;
    getTokenGatingQuestInput?: TokenGatingQuestInput;
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

    const {
        data: playerQuestLogs,
        isLoading: isLoadingPlayerQuestLogs,
        error: playerQuestLogsError,
    } = usePlayerQuestLogsQuery({ input: getPlayerQuestLogsInput });

    const {
        data: activeQuestLogs,
        isLoading: isLoadingActiveQuestLogs,
        error: activeQuestLogsError,
    } = useActiveQuestLogsQuery({ input: getActiveQuestLogsInput });

    const {
        data: completedQuestLogs,
        isLoading: isLoadingCompletedQuestLogs,
        error: completedQuestLogsError,
    } = useCompletedQuestLogsQuery({ input: getCompletedQuestLogsInput });

    const {
        data: tokenGatingQuest,
        isLoading: isLoadingTokenGatingQuest,
        error: tokenGatingQuestError,
    } = useTokenGatingQuestQuery({ input: getTokenGatingQuestInput });

    const isLoading =
        isLoadingQuests ||
        isLoadingQuestLogs ||
        isLoadingClaimableQuestLogs ||
        isLoadingClaimedQuestLogs ||
        isLoadingPlayerQuestLogs ||
        isLoadingActiveQuestLogs ||
        isLoadingCompletedQuestLogs ||
        isLoadingTokenGatingQuest;

    const error =
        questsError ||
        questLogsError ||
        claimableQuestLogsError ||
        claimedQuestLogsError ||
        playerQuestLogsError ||
        activeQuestLogsError ||
        completedQuestLogsError ||
        tokenGatingQuestError;

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
        playerQuestLogs,
        isLoadingPlayerQuestLogs,
        playerQuestLogsError,
        activeQuestLogs,
        isLoadingActiveQuestLogs,
        activeQuestLogsError,
        completedQuestLogs,
        isLoadingCompletedQuestLogs,
        completedQuestLogsError,
        tokenGatingQuest,
        isLoadingTokenGatingQuest,
        tokenGatingQuestError,
        isLoading,
        error,
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
        mutateAsync: updateQuestActive,
        isPending: isUpdatingQuestActive,
        error: updateQuestActiveError,
    } = useUpdateQuestActiveMutation();

    const isLoading =
        isCreating ||
        isUpdating ||
        isUpdatingOrder ||
        isDeleting ||
        isCompleting ||
        isClaimingQuestReward ||
        isUpdatingQuestActive;

    const error =
        createError ||
        updateError ||
        updateOrderError ||
        deleteError ||
        completeError ||
        claimQuestRewardError ||
        updateQuestActiveError;

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

        completeQuest,
        isCompleting,
        completeError,

        claimQuestReward,
        isClaimingQuestReward,
        claimQuestRewardError,

        updateQuestActive,
        isUpdatingQuestActive,
        updateQuestActiveError,

        isLoading,
        error,
    };
}
