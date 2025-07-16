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
    useActiveQuestLogsQuery,
    useCompletedQuestLogsQuery,
    usePlayerQuestLogQuery,
    useQuestsInfiniteQuery,
    useArtistAllActiveQuestCountQuery,
} from "@/app/queries/questsQueries";

import type {
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
    GetQuestLogsInput,
    GetQuestsInput,
    GetActiveQuestLogsInput,
    GetCompletedQuestLogsInput,
    PaginationInput,
    GetPlayerQuestLogInput,
    GetArtistAllActiveQuestCountInput,
} from "../actions/quests";

export function useQuestGet({
    getQuestsInput,
    getQuestLogsInput,
    getClaimableQuestLogsInput,
    getClaimedQuestLogsInput,
    getPlayerQuestLogsInput,
    getActiveQuestLogsInput,
    getCompletedQuestLogsInput,
    getPlayerQuestLogInput,
    getArtistAllActiveQuestCountInput,
    pagination,
    useInfiniteScroll = false,
    pageSize = 10,
}: {
    getQuestsInput?: GetQuestsInput;
    getQuestLogsInput?: GetQuestLogsInput;
    getClaimableQuestLogsInput?: GetClaimableQuestLogsInput;
    getClaimedQuestLogsInput?: GetClaimedQuestLogsInput;
    getPlayerQuestLogsInput?: GetPlayerQuestLogsInput;
    getActiveQuestLogsInput?: GetActiveQuestLogsInput;
    getCompletedQuestLogsInput?: GetCompletedQuestLogsInput;
    getPlayerQuestLogInput?: GetPlayerQuestLogInput;
    getArtistAllActiveQuestCountInput?: GetArtistAllActiveQuestCountInput;
    pagination?: PaginationInput;
    useInfiniteScroll?: boolean;
    pageSize?: number;
}) {
    const {
        data: quests,
        isLoading: isLoadingQuests,
        error: questsError,
    } = useQuestsQuery({ input: getQuestsInput, pagination });

    const questsInfiniteQuery = useQuestsInfiniteQuery({
        input: getQuestsInput,
        pageSize,
    });

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
        refetch: refetchPlayerQuestLogs,
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
        data: playerQuestLog,
        isLoading: isLoadingPlayerQuestLog,
        error: playerQuestLogError,
        refetch: refetchPlayerQuestLog,
    } = usePlayerQuestLogQuery({ input: getPlayerQuestLogInput });

    const {
        data: artistAllActiveQuestCount,
        isLoading: isLoadingArtistAllActiveQuestCount,
        error: artistAllActiveQuestCountError,
    } = useArtistAllActiveQuestCountQuery({
        input: getArtistAllActiveQuestCountInput,
    });

    const isLoading =
        (useInfiniteScroll ? questsInfiniteQuery.isLoading : isLoadingQuests) ||
        isLoadingQuestLogs ||
        isLoadingClaimableQuestLogs ||
        isLoadingClaimedQuestLogs ||
        isLoadingPlayerQuestLogs ||
        isLoadingActiveQuestLogs ||
        isLoadingCompletedQuestLogs ||
        isLoadingPlayerQuestLog ||
        isLoadingArtistAllActiveQuestCount;

    const error =
        (useInfiniteScroll ? questsInfiniteQuery.error : questsError) ||
        questLogsError ||
        claimableQuestLogsError ||
        claimedQuestLogsError ||
        playerQuestLogsError ||
        activeQuestLogsError ||
        completedQuestLogsError ||
        playerQuestLogError ||
        artistAllActiveQuestCountError;

    return {
        quests: useInfiniteScroll ? questsInfiniteQuery.data : quests,
        isLoadingQuests: useInfiniteScroll
            ? questsInfiniteQuery.isLoading
            : isLoadingQuests,
        questsError: useInfiniteScroll
            ? questsInfiniteQuery.error
            : questsError,
        questsInfiniteQuery: useInfiniteScroll
            ? questsInfiniteQuery
            : undefined,
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
        playerQuestLog,
        isLoadingPlayerQuestLog,
        playerQuestLogError,
        artistAllActiveQuestCount,
        isLoadingArtistAllActiveQuestCount,
        artistAllActiveQuestCountError,
        refetchPlayerQuestLogs,
        refetchPlayerQuestLog,
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
