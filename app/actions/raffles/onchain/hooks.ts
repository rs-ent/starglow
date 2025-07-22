/// app\actions\raffles\web3\hooks.ts

"use client";

import {
    useParticipateMutation,
    useParticipateAndDrawMutation,
    useBatchDrawMutation,
} from "./mutations";

import {
    useOnchainRafflesQuery,
    useRaffleFromContractQuery,
    useRaffleCoreInfoForListCardQuery,
    useUserParticipationQuery,
    useUserParticipationSummaryQuery,
    useUserParticipationDetailsQuery,
    useLotteryResultQuery,
    useRaffleParticipantsQuery,
} from "./queries";

import type {
    GetOnchainRafflesInput,
    GetRaffleFromContractInput,
    GetRaffleCoreInfoForListCardInput,
    GetUserParticipationInput,
    GetUserParticipationSummaryInput,
    GetUserParticipationDetailsInput,
    GetLotteryResultInput,
    GetRaffleParticipantsInput,
} from "./actions-read";

export interface UseOnchainRafflesInput {
    getOnchainRafflesInput?: GetOnchainRafflesInput;
    getRaffleFromContractInput?: GetRaffleFromContractInput;
    getRaffleCoreInfoForListCardInput?: GetRaffleCoreInfoForListCardInput;
    getUserParticipationInput?: GetUserParticipationInput;
    getUserParticipationSummaryInput?: GetUserParticipationSummaryInput;
    getUserParticipationDetailsInput?: GetUserParticipationDetailsInput;
    getLotteryResultInput?: GetLotteryResultInput;
    getRaffleParticipantsInput?: GetRaffleParticipantsInput;
}

export function useOnchainRaffles(input?: UseOnchainRafflesInput) {
    const {
        data: onchainRaffles,
        isLoading: isOnchainRafflesLoading,
        isError: isOnchainRafflesError,
        refetch: refetchOnchainRaffles,
    } = useOnchainRafflesQuery(input?.getOnchainRafflesInput);

    const {
        data: raffleFromContract,
        isLoading: isRaffleFromContractLoading,
        isError: isRaffleFromContractError,
        refetch: refetchRaffleFromContract,
    } = useRaffleFromContractQuery(input?.getRaffleFromContractInput);

    const {
        data: raffleCoreInfoForListCard,
        isLoading: isRaffleCoreInfoForListCardLoading,
        isError: isRaffleCoreInfoForListCardError,
        refetch: refetchRaffleCoreInfoForListCard,
    } = useRaffleCoreInfoForListCardQuery(
        input?.getRaffleCoreInfoForListCardInput
    );

    const {
        data: userParticipation,
        isLoading: isUserParticipationLoading,
        isError: isUserParticipationError,
        refetch: refetchUserParticipation,
    } = useUserParticipationQuery(input?.getUserParticipationInput);

    const {
        data: userParticipationSummary,
        isLoading: isUserParticipationSummaryLoading,
        isError: isUserParticipationSummaryError,
        refetch: refetchUserParticipationSummary,
    } = useUserParticipationSummaryQuery(
        input?.getUserParticipationSummaryInput
    );

    const {
        data: userParticipationDetails,
        isLoading: isUserParticipationDetailsLoading,
        isError: isUserParticipationDetailsError,
        refetch: refetchUserParticipationDetails,
    } = useUserParticipationDetailsQuery(
        input?.getUserParticipationDetailsInput
    );

    const {
        data: lotteryResult,
        isLoading: isLotteryResultLoading,
        isError: isLotteryResultError,
        refetch: refetchLotteryResult,
    } = useLotteryResultQuery(input?.getLotteryResultInput);

    const {
        data: raffleParticipants,
        isLoading: isRaffleParticipantsLoading,
        isError: isRaffleParticipantsError,
        refetch: refetchRaffleParticipants,
    } = useRaffleParticipantsQuery(input?.getRaffleParticipantsInput);

    const {
        mutate: participate,
        mutateAsync: participateAsync,
        isPending: isParticipatePending,
        isError: isParticipateError,
        error: participateError,
    } = useParticipateMutation();

    const {
        mutate: participateAndDraw,
        mutateAsync: participateAndDrawAsync,
        isPending: isParticipateAndDrawPending,
        isError: isParticipateAndDrawError,
        error: participateAndDrawError,
    } = useParticipateAndDrawMutation();

    const {
        mutate: batchDraw,
        mutateAsync: batchDrawAsync,
        isPending: isBatchDrawPending,
        isError: isBatchDrawError,
        error: batchDrawError,
    } = useBatchDrawMutation();

    return {
        onchainRaffles,
        isOnchainRafflesLoading,
        isOnchainRafflesError,
        refetchOnchainRaffles,

        raffleFromContract,
        isRaffleFromContractLoading,
        isRaffleFromContractError,
        refetchRaffleFromContract,

        raffleCoreInfoForListCard,
        isRaffleCoreInfoForListCardLoading,
        isRaffleCoreInfoForListCardError,
        refetchRaffleCoreInfoForListCard,

        userParticipation,
        isUserParticipationLoading,
        isUserParticipationError,
        refetchUserParticipation,

        userParticipationSummary,
        isUserParticipationSummaryLoading,
        isUserParticipationSummaryError,
        refetchUserParticipationSummary,

        userParticipationDetails,
        isUserParticipationDetailsLoading,
        isUserParticipationDetailsError,
        refetchUserParticipationDetails,

        lotteryResult,
        isLotteryResultLoading,
        isLotteryResultError,
        refetchLotteryResult,

        raffleParticipants,
        isRaffleParticipantsLoading,
        isRaffleParticipantsError,
        refetchRaffleParticipants,

        participate,
        participateAsync,
        isParticipatePending,
        isParticipateError,
        participateError,

        participateAndDraw,
        participateAndDrawAsync,
        isParticipateAndDrawPending,
        isParticipateAndDrawError,
        participateAndDrawError,

        batchDraw,
        batchDrawAsync,
        isBatchDrawPending,
        isBatchDrawError,
        batchDrawError,
    };
}
