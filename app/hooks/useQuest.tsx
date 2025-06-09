/// app/hooks/useQuest.ts

"use client";

import {
    useClaimQuestRewardMutation,
    useCompleteQuestMutation,
    useCreateQuestMutation,
    useDeleteQuestMutation,
    useSetReferralQuestLogsMutation,
    useUpdateQuestActiveMutation,
    useUpdateQuestMutation,
    useUpdateQuestOrderMutation,
} from "@/app/mutations/questsMutations";
import {
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
    GetQuestLogsInput,
    GetQuestsInput,
    TokenGatingQuestInput,
    PaginationInput,
} from "../actions/quests";
import {
    useClaimableQuestLogsQuery,
    useClaimedQuestLogsQuery,
    usePlayerQuestLogsQuery,
    useQuestLogsQuery,
    useQuestsQuery,
    useTokenGatingQuestQuery,
} from "@/app/queries/questsQueries";

export function useQuestGet({
    getQuestsInput,
    getQuestLogsInput,
    getClaimableQuestLogsInput,
    getClaimedQuestLogsInput,
    getPlayerQuestLogsInput,
    getTokenGatingQuestInput,
    pagination,
}: {
    getQuestsInput?: GetQuestsInput;
    getQuestLogsInput?: GetQuestLogsInput;
    getClaimableQuestLogsInput?: GetClaimableQuestLogsInput;
    getClaimedQuestLogsInput?: GetClaimedQuestLogsInput;
    getPlayerQuestLogsInput?: GetPlayerQuestLogsInput;
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
        isLoadingTokenGatingQuest;

    const error =
        questsError ||
        questLogsError ||
        claimableQuestLogsError ||
        claimedQuestLogsError ||
        playerQuestLogsError ||
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
        mutateAsync: setReferralQuestLogs,
        isPending: isSettingReferralQuestLogs,
        error: setReferralQuestLogsError,
    } = useSetReferralQuestLogsMutation();

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
        isSettingReferralQuestLogs ||
        isUpdatingQuestActive;

    const error =
        createError ||
        updateError ||
        updateOrderError ||
        deleteError ||
        completeError ||
        claimQuestRewardError ||
        setReferralQuestLogsError ||
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

        setReferralQuestLogs,
        isSettingReferralQuestLogs,
        setReferralQuestLogsError,

        updateQuestActive,
        isUpdatingQuestActive,
        updateQuestActiveError,

        isLoading,
        error,
    };
}
