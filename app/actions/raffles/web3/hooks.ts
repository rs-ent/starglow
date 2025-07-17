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
    useRaffleStatusQuery,
    useRaffleListQuery,
    useRaffleListStatusQuery,
    useUserParticipationQuery,
    useLotteryResultQuery,
} from "./queries";

import type {
    GetOnchainRafflesInput,
    GetRaffleFromContractInput,
    GetRaffleStatusInput,
    GetRaffleListInput,
    GetUserParticipationInput,
    GetLotteryResultInput,
} from "./actions-read";

export interface UseOnchainRafflesInput {
    getOnchainRafflesInput?: GetOnchainRafflesInput;
    getRaffleFromContractInput?: GetRaffleFromContractInput;
    getRaffleStatusInput?: GetRaffleStatusInput;
    getRaffleListInput?: GetRaffleListInput;
    getUserParticipationInput?: GetUserParticipationInput;
    getLotteryResultInput?: GetLotteryResultInput;
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
        data: raffleStatus,
        isLoading: isRaffleStatusLoading,
        isError: isRaffleStatusError,
        refetch: refetchRaffleStatus,
    } = useRaffleStatusQuery(input?.getRaffleStatusInput);

    const {
        data: raffleList,
        isLoading: isRaffleListLoading,
        isError: isRaffleListError,
        refetch: refetchRaffleList,
    } = useRaffleListQuery(input?.getRaffleListInput);

    const {
        data: raffleListStatus,
        isLoading: isRaffleListStatusLoading,
        isError: isRaffleListStatusError,
        refetch: refetchRaffleListStatus,
    } = useRaffleListStatusQuery(input?.getRaffleListInput);

    const {
        data: userParticipation,
        isLoading: isUserParticipationLoading,
        isError: isUserParticipationError,
        refetch: refetchUserParticipation,
    } = useUserParticipationQuery(input?.getUserParticipationInput);

    const {
        data: lotteryResult,
        isLoading: isLotteryResultLoading,
        isError: isLotteryResultError,
        refetch: refetchLotteryResult,
    } = useLotteryResultQuery(input?.getLotteryResultInput);

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

        raffleStatus,
        isRaffleStatusLoading,
        isRaffleStatusError,
        refetchRaffleStatus,

        raffleList,
        isRaffleListLoading,
        isRaffleListError,
        refetchRaffleList,

        raffleListStatus,
        isRaffleListStatusLoading,
        isRaffleListStatusError,
        refetchRaffleListStatus,

        userParticipation,
        isUserParticipationLoading,
        isUserParticipationError,
        refetchUserParticipation,

        lotteryResult,
        isLotteryResultLoading,
        isLotteryResultError,
        refetchLotteryResult,

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
