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
    useInfiniteQuestsQuery,
    useTokenGatingQuestQuery,
} from "@/app/queries/questsQueries";
import { useReferralLogs } from "@/app/queries/referralQueries";

import type {
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
    GetQuestLogsInput,
    GetQuestsInput,
    TokenGatingQuestInput,
    PaginationInput,
} from "../actions/quests";
import type { Player } from "@prisma/client";

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

// 무한 스크롤을 위한 훅 추가
export function useInfiniteQuest(getQuestsInput?: GetQuestsInput) {
    return useInfiniteQuestsQuery(getQuestsInput);
}

// 🚀 NEW: 퀘스트 페이지 전체 데이터를 통합 관리하는 훅
export function useQuestsPageData({
    player,
    questsInput,
}: {
    player: Player | null;
    questsInput?: GetQuestsInput;
}) {
    // 병렬로 모든 데이터 페칭
    const infiniteQuestsQuery = useInfiniteQuestsQuery(questsInput);

    const playerQuestLogsQuery = usePlayerQuestLogsQuery({
        input: { playerId: player?.id ?? "" },
    });

    const referralLogsQuery = useReferralLogs({
        playerId: player?.id ?? "",
    });

    // 통합된 로딩/에러 상태
    const isLoading =
        infiniteQuestsQuery.isLoading ||
        playerQuestLogsQuery.isLoading ||
        referralLogsQuery.isLoading;

    const error =
        infiniteQuestsQuery.error ||
        playerQuestLogsQuery.error ||
        referralLogsQuery.error;

    return {
        // 퀘스트 데이터 (무한 스크롤)
        infiniteQuests: {
            data: infiniteQuestsQuery.data,
            isLoading: infiniteQuestsQuery.isLoading,
            isFetchingNextPage: infiniteQuestsQuery.isFetchingNextPage,
            hasNextPage: infiniteQuestsQuery.hasNextPage,
            fetchNextPage: infiniteQuestsQuery.fetchNextPage,
            error: infiniteQuestsQuery.error,
        },

        // 플레이어 퀘스트 로그
        playerQuestLogs: playerQuestLogsQuery.data || [],

        // 추천 로그
        referralLogs: referralLogsQuery.data || [],

        // 통합 상태
        isLoading,
        error,

        // 개별 쿼리 상태 (필요시 사용)
        isLoadingPlayerQuestLogs: playerQuestLogsQuery.isLoading,
        isLoadingReferralLogs: referralLogsQuery.isLoading,
    };
}
