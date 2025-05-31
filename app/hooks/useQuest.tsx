/// app/hooks/useQuest.ts

"use client";

import {useCallback, useMemo} from 'react';
import {
    useClaimQuestRewardMutation,
    useCompleteQuestMutation,
    useCreateQuestMutation,
    useDeleteQuestMutation,
    useSetReferralQuestLogsMutation,
    useTokenGatingMutation,
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
    PaginationInput,
} from "../actions/quests";
import {
    useClaimableQuestLogsQuery,
    useClaimedQuestLogsQuery,
    usePlayerQuestLogsQuery,
    useQuestLogsQuery,
    useQuestsQuery,
} from "@/app/queries/questsQueries";

export function useQuestGet({
    getQuestsInput,
    getQuestLogsInput,
    getClaimableQuestLogsInput,
    getClaimedQuestLogsInput,
    getPlayerQuestLogsInput,
    pagination,
}: {
    getQuestsInput?: GetQuestsInput;
    getQuestLogsInput?: GetQuestLogsInput;
    getClaimableQuestLogsInput?: GetClaimableQuestLogsInput;
    getClaimedQuestLogsInput?: GetClaimedQuestLogsInput;
    getPlayerQuestLogsInput?: GetPlayerQuestLogsInput;
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

    const isLoading = useMemo(() => 
        isLoadingQuests ||
        isLoadingQuestLogs ||
        isLoadingClaimableQuestLogs ||
        isLoadingClaimedQuestLogs ||
        isLoadingPlayerQuestLogs,
    [
        isLoadingQuests,
        isLoadingQuestLogs,
        isLoadingClaimableQuestLogs,
        isLoadingClaimedQuestLogs,
        isLoadingPlayerQuestLogs
    ]);

    const error = useMemo(() => 
        questsError ||
        questLogsError ||
        claimableQuestLogsError ||
        claimedQuestLogsError ||
        playerQuestLogsError,
    [
        questsError,
        questLogsError,
        claimableQuestLogsError,
        claimedQuestLogsError,
        playerQuestLogsError
    ]);

    const findQuestLog = useCallback((questId) => {
        if (!questLogs?.items) return null;
        return questLogs.items.find(log => log.questId === questId);
    }, [questLogs?.items]);

    return useMemo(() => ({
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

        isLoading,
        error,
        findQuestLog,
    }), [
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
        isLoading,
        error,
        findQuestLog
    ]);
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

    const {
        mutateAsync: updateQuestActive,
        isPending: isUpdatingQuestActive,
        error: updateQuestActiveError,
    } = useUpdateQuestActiveMutation();

    const isLoading = useMemo(() => 
        isCreating ||
        isUpdating ||
        isUpdatingOrder ||
        isDeleting ||
        isTokenGating ||
        isCompleting ||
        isClaimingQuestReward ||
        isSettingReferralQuestLogs ||
        isUpdatingQuestActive,
    [
        isCreating,
        isUpdating,
        isUpdatingOrder,
        isDeleting,
        isTokenGating,
        isCompleting,
        isClaimingQuestReward,
        isSettingReferralQuestLogs,
        isUpdatingQuestActive
    ]);

    const error = useMemo(() => 
        createError ||
        updateError ||
        updateOrderError ||
        deleteError ||
        tokenGatingError ||
        completeError ||
        claimQuestRewardError ||
        setReferralQuestLogsError ||
        updateQuestActiveError,
    [
        createError,
        updateError,
        updateOrderError,
        deleteError,
        tokenGatingError,
        completeError,
        claimQuestRewardError,
        setReferralQuestLogsError,
        updateQuestActiveError
    ]);

    return useMemo(() => ({
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

        updateQuestActive,
        isUpdatingQuestActive,
        updateQuestActiveError,

        isLoading,
        error,
    }), [
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
        updateQuestActive,
        isUpdatingQuestActive,
        updateQuestActiveError,
        isLoading,
        error
    ]);
}
