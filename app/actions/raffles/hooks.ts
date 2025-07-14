/// app/actions/raffles/hooks.ts

"use client";

import {
    useCreateRaffleMutation,
    useUpdateRaffleMutation,
    useParticipateRaffleMutation,
    useRevealRaffleResultMutation,
    useRevealAllRaffleResultsMutation,
    useDrawAllWinnersMutation,
    useDistributePrizesMutation,
    useBulkRevealResultsMutation,
} from "./mutations";

import {
    useGetRafflesQuery,
    useGetRaffleDetailsQuery,
    useGetPlayerParticipationsQuery,
    useGetPlayerParticipationsInfiniteQuery,
    useGetUnrevealedCountQuery,
    useGetRaffleParticipantsQuery,
    useCheckUserParticipationQuery,
    useProbabilityAnalyticsQuery,
    useRevenueAnalyticsQuery,
    useParticipantAnalyticsQuery,
} from "./queries";

import type {
    GetRafflesInput,
    GetPlayerParticipationsInput,
    GetPlayerParticipationsInfiniteInput,
    GetUnrevealedCountInput,
    GetRaffleParticipantsInput,
} from "./actions";

export interface useRafflesInput {
    // Raffle queries
    getRafflesInput?: GetRafflesInput;
    getRaffleId?: string;
    // 다중 참여 지원 쿼리
    getPlayerParticipationsInput?: GetPlayerParticipationsInput;
    getPlayerParticipationsInfiniteInput?: GetPlayerParticipationsInfiniteInput;
    getUnrevealedCountInput?: GetUnrevealedCountInput;
    // New optimized queries
    getRaffleParticipantsInput?: GetRaffleParticipantsInput;
    checkUserParticipationRaffleId?: string;
    checkUserParticipationPlayerId?: string;
    // Analytics queries
    probabilityAnalyticsRaffleIds?: string[];
    revenueAnalyticsRaffleIds?: string[];
    participantAnalyticsPlayerIds?: string[];
}

export function useRaffles(input?: useRafflesInput) {
    // Raffle Queries
    const {
        data: rafflesData,
        isLoading: isRafflesLoading,
        isError: isRafflesError,
        error: rafflesError,
        refetch: refetchRaffles,
    } = useGetRafflesQuery(input?.getRafflesInput);

    const {
        data: raffleData,
        isLoading: isRaffleLoading,
        isError: isRaffleError,
        error: raffleError,
        refetch: refetchRaffle,
    } = useGetRaffleDetailsQuery(input?.getRaffleId);

    // 다중 참여 지원 쿼리들
    const {
        data: playerParticipationsData,
        isLoading: isPlayerParticipationsLoading,
        isError: isPlayerParticipationsError,
        error: playerParticipationsError,
        refetch: refetchPlayerParticipations,
    } = useGetPlayerParticipationsQuery(input?.getPlayerParticipationsInput);

    const {
        data: playerParticipationsInfiniteData,
        isLoading: isPlayerParticipationsInfiniteLoading,
        isError: isPlayerParticipationsInfiniteError,
        error: playerParticipationsInfiniteError,
        refetch: refetchPlayerParticipationsInfinite,
        fetchNextPage: playerParticipationsInfiniteFetchNextPage,
        hasNextPage: playerParticipationsInfiniteHasNextPage,
        isFetchingNextPage: playerParticipationsInfiniteIsFetchingNextPage,
        isFetching: playerParticipationsInfiniteIsFetching,
    } = useGetPlayerParticipationsInfiniteQuery(
        input?.getPlayerParticipationsInfiniteInput
    );

    const {
        data: unrevealedCountData,
        isLoading: isUnrevealedCountLoading,
        isError: isUnrevealedCountError,
        error: unrevealedCountError,
        refetch: refetchUnrevealedCount,
    } = useGetUnrevealedCountQuery(input?.getUnrevealedCountInput);

    // New optimized queries
    const {
        data: raffleParticipantsData,
        isLoading: isRaffleParticipantsLoading,
        isError: isRaffleParticipantsError,
        error: raffleParticipantsError,
        refetch: refetchRaffleParticipants,
    } = useGetRaffleParticipantsQuery(input?.getRaffleParticipantsInput);

    const {
        data: userParticipationData,
        isLoading: isUserParticipationLoading,
        isError: isUserParticipationError,
        error: userParticipationError,
        refetch: refetchUserParticipation,
    } = useCheckUserParticipationQuery(
        input?.checkUserParticipationRaffleId,
        input?.checkUserParticipationPlayerId
    );

    // 🎯 Analytics Queries
    const {
        data: probabilityAnalyticsData,
        isLoading: isProbabilityAnalyticsLoading,
        isError: isProbabilityAnalyticsError,
        error: probabilityAnalyticsError,
        refetch: refetchProbabilityAnalytics,
    } = useProbabilityAnalyticsQuery(input?.probabilityAnalyticsRaffleIds);

    const {
        data: revenueAnalyticsData,
        isLoading: isRevenueAnalyticsLoading,
        isError: isRevenueAnalyticsError,
        error: revenueAnalyticsError,
        refetch: refetchRevenueAnalytics,
    } = useRevenueAnalyticsQuery(input?.revenueAnalyticsRaffleIds);

    const {
        data: participantAnalyticsData,
        isLoading: isParticipantAnalyticsLoading,
        isError: isParticipantAnalyticsError,
        error: participantAnalyticsError,
        refetch: refetchParticipantAnalytics,
    } = useParticipantAnalyticsQuery(input?.participantAnalyticsPlayerIds);

    // Raffle Mutations
    const {
        mutate: createRaffle,
        mutateAsync: createRaffleAsync,
        isPending: isCreateRafflePending,
        isError: isCreateRaffleError,
        error: createRaffleError,
    } = useCreateRaffleMutation();

    const {
        mutate: updateRaffle,
        mutateAsync: updateRaffleAsync,
        isPending: isUpdateRafflePending,
        isError: isUpdateRaffleError,
        error: updateRaffleError,
    } = useUpdateRaffleMutation();

    const {
        mutate: participateInRaffle,
        mutateAsync: participateInRaffleAsync,
        isPending: isParticipateInRafflePending,
        isError: isParticipateInRaffleError,
        error: participateInRaffleError,
    } = useParticipateRaffleMutation();

    const {
        mutate: revealRaffleResult,
        mutateAsync: revealRaffleResultAsync,
        isPending: isRevealRaffleResultPending,
        isError: isRevealRaffleResultError,
        error: revealRaffleResultError,
    } = useRevealRaffleResultMutation();

    const {
        mutate: revealAllRaffleResults,
        mutateAsync: revealAllRaffleResultsAsync,
        isPending: isRevealAllRaffleResultsPending,
        isError: isRevealAllRaffleResultsError,
        error: revealAllRaffleResultsError,
    } = useRevealAllRaffleResultsMutation();

    const {
        mutate: bulkRevealResults,
        mutateAsync: bulkRevealResultsAsync,
        isPending: isBulkRevealResultsPending,
        isError: isBulkRevealResultsError,
        error: bulkRevealResultsError,
    } = useBulkRevealResultsMutation();

    const {
        mutate: drawAllWinners,
        mutateAsync: drawAllWinnersAsync,
        isPending: isDrawAllWinnersPending,
        isError: isDrawAllWinnersError,
        error: drawAllWinnersError,
    } = useDrawAllWinnersMutation();

    const {
        mutate: distributePrizes,
        mutateAsync: distributePrizesAsync,
        isPending: isDistributePrizesPending,
        isError: isDistributePrizesError,
        error: distributePrizesError,
    } = useDistributePrizesMutation();

    return {
        // Raffle data and actions
        rafflesData,
        isRafflesLoading,
        isRafflesError,
        rafflesError,
        refetchRaffles,

        raffleData,
        isRaffleLoading,
        isRaffleError,
        raffleError,
        refetchRaffle,

        // Multiple participation data
        playerParticipationsData,
        isPlayerParticipationsLoading,
        isPlayerParticipationsError,
        playerParticipationsError,
        refetchPlayerParticipations,

        playerParticipationsInfiniteData,
        isPlayerParticipationsInfiniteLoading,
        isPlayerParticipationsInfiniteError,
        playerParticipationsInfiniteError,
        refetchPlayerParticipationsInfinite,
        playerParticipationsInfiniteFetchNextPage,
        playerParticipationsInfiniteHasNextPage,
        playerParticipationsInfiniteIsFetchingNextPage,
        playerParticipationsInfiniteIsFetching,

        unrevealedCountData,
        isUnrevealedCountLoading,
        isUnrevealedCountError,
        unrevealedCountError,
        refetchUnrevealedCount,

        // New optimized data
        raffleParticipantsData,
        isRaffleParticipantsLoading,
        isRaffleParticipantsError,
        raffleParticipantsError,
        refetchRaffleParticipants,

        userParticipationData,
        isUserParticipationLoading,
        isUserParticipationError,
        userParticipationError,
        refetchUserParticipation,

        // 🎯 Analytics data
        probabilityAnalyticsData,
        isProbabilityAnalyticsLoading,
        isProbabilityAnalyticsError,
        probabilityAnalyticsError,
        refetchProbabilityAnalytics,

        revenueAnalyticsData,
        isRevenueAnalyticsLoading,
        isRevenueAnalyticsError,
        revenueAnalyticsError,
        refetchRevenueAnalytics,

        participantAnalyticsData,
        isParticipantAnalyticsLoading,
        isParticipantAnalyticsError,
        participantAnalyticsError,
        refetchParticipantAnalytics,

        // Raffle management actions
        createRaffle,
        createRaffleAsync,
        isCreateRafflePending,
        isCreateRaffleError,
        createRaffleError,

        updateRaffle,
        updateRaffleAsync,
        isUpdateRafflePending,
        isUpdateRaffleError,
        updateRaffleError,

        // Raffle participation actions
        participateInRaffle,
        participateInRaffleAsync,
        isParticipateInRafflePending,
        isParticipateInRaffleError,
        participateInRaffleError,

        // Raffle result actions
        revealRaffleResult,
        revealRaffleResultAsync,
        isRevealRaffleResultPending,
        isRevealRaffleResultError,
        revealRaffleResultError,

        // Multiple participation result actions
        revealAllRaffleResults,
        revealAllRaffleResultsAsync,
        isRevealAllRaffleResultsPending,
        isRevealAllRaffleResultsError,
        revealAllRaffleResultsError,

        bulkRevealResults,
        bulkRevealResultsAsync,
        isBulkRevealResultsPending,
        isBulkRevealResultsError,
        bulkRevealResultsError,

        // Raffle drawing actions
        drawAllWinners,
        drawAllWinnersAsync,
        isDrawAllWinnersPending,
        isDrawAllWinnersError,
        drawAllWinnersError,

        // Prize distribution actions
        distributePrizes,
        distributePrizesAsync,
        isDistributePrizesPending,
        isDistributePrizesError,
        distributePrizesError,
    };
}
