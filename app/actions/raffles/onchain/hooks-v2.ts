/// app/actions/raffles/onchain/hooks-v2.ts

"use client";

import {
    useParticipateV2Mutation,
    useCreateRaffleV2Mutation,
    useAllocatePrizeV2Mutation,
    useActivateRaffleV2Mutation,
    useBatchDrawV2Mutation,
    useCompleteRaffleV2Mutation,
    useManageRoleV2Mutation,
    usePauseContractV2Mutation,
    useDeployRafflesV2ContractMutation,
    useDistributePrizeV2Mutation,
} from "./mutations-v2";

import {
    useRaffleCardInfoV2Query,
    useActiveRafflesV2Query,
    useAllRafflesV2Query,
    useFullRaffleInfoV2Query,
    useUserParticipationV2Query,
    useUserParticipationCountV2Query,
    useContractMetadataV2Query,
    useBatchDrawProgressV2Query,
    useParticipationCheckV2Query,
    useGasEstimateV2Query,
} from "./queries-v2";

import type {
    GetRaffleListCardInfoInput,
    GetRaffleListCardInfoBatchInput,
    GetActiveRafflesInput,
    GetAllRafflesInput,
    GetFullRaffleInfoInput,
    GetUserParticipationInput,
    GetUserParticipationCountInput,
    GetContractMetadataInput,
} from "./actions-read-v2";

import type {
    GetBatchDrawProgressV2Input,
    GetParticipationCheckV2Input,
    GetGasEstimateV2Input,
} from "./queries-v2";

export interface UseOnchainRafflesV2Input {
    getRaffleCardInfoInput?: GetRaffleListCardInfoInput;
    getRaffleCardInfoBatchInput?: GetRaffleListCardInfoBatchInput;
    getActiveRafflesInput?: GetActiveRafflesInput;
    getAllRafflesInput?: GetAllRafflesInput;
    getFullRaffleInfoInput?: GetFullRaffleInfoInput;
    getUserParticipationInput?: GetUserParticipationInput;
    getUserParticipationCountInput?: GetUserParticipationCountInput;
    getContractMetadataInput?: GetContractMetadataInput;
    getBatchDrawProgressInput?: GetBatchDrawProgressV2Input;
    getParticipationCheckInput?: GetParticipationCheckV2Input;
    getGasEstimateInput?: GetGasEstimateV2Input;
}

export function useOnchainRafflesV2(input?: UseOnchainRafflesV2Input) {
    const {
        data: raffleCardInfo,
        isLoading: isRaffleCardInfoLoading,
        isError: isRaffleCardInfoError,
        refetch: refetchRaffleCardInfo,
    } = useRaffleCardInfoV2Query(input?.getRaffleCardInfoInput);

    const {
        data: activeRaffles,
        isLoading: isActiveRafflesLoading,
        isError: isActiveRafflesError,
        refetch: refetchActiveRaffles,
    } = useActiveRafflesV2Query(input?.getActiveRafflesInput);

    const {
        data: allRaffles,
        isLoading: isAllRafflesLoading,
        isError: isAllRafflesError,
        refetch: refetchAllRaffles,
    } = useAllRafflesV2Query(input?.getAllRafflesInput);

    const {
        data: fullRaffleInfo,
        isLoading: isFullRaffleInfoLoading,
        isError: isFullRaffleInfoError,
        refetch: refetchFullRaffleInfo,
    } = useFullRaffleInfoV2Query(input?.getFullRaffleInfoInput);

    const {
        data: userParticipation,
        isLoading: isUserParticipationLoading,
        isError: isUserParticipationError,
        refetch: refetchUserParticipation,
    } = useUserParticipationV2Query(input?.getUserParticipationInput);

    const {
        data: userParticipationCount,
        isLoading: isUserParticipationCountLoading,
        isError: isUserParticipationCountError,
        refetch: refetchUserParticipationCount,
    } = useUserParticipationCountV2Query(input?.getUserParticipationCountInput);

    const {
        data: contractMetadata,
        isLoading: isContractMetadataLoading,
        isError: isContractMetadataError,
        refetch: refetchContractMetadata,
    } = useContractMetadataV2Query(input?.getContractMetadataInput);

    const {
        data: batchDrawProgress,
        isLoading: isBatchDrawProgressLoading,
        isError: isBatchDrawProgressError,
        refetch: refetchBatchDrawProgress,
    } = useBatchDrawProgressV2Query(input?.getBatchDrawProgressInput);

    const {
        data: participationCheck,
        isLoading: isParticipationCheckLoading,
        isError: isParticipationCheckError,
        refetch: refetchParticipationCheck,
    } = useParticipationCheckV2Query(input?.getParticipationCheckInput);

    const {
        data: gasEstimate,
        isLoading: isGasEstimateLoading,
        isError: isGasEstimateError,
        refetch: refetchGasEstimate,
    } = useGasEstimateV2Query(input?.getGasEstimateInput);

    const {
        mutate: participateV2,
        mutateAsync: participateV2Async,
        isPending: isParticipateV2Pending,
        isError: isParticipateV2Error,
        error: participateV2Error,
    } = useParticipateV2Mutation();

    const {
        mutate: createRaffleV2,
        mutateAsync: createRaffleV2Async,
        isPending: isCreateRaffleV2Pending,
        isError: isCreateRaffleV2Error,
        error: createRaffleV2Error,
    } = useCreateRaffleV2Mutation();

    const {
        mutate: allocatePrizeV2,
        mutateAsync: allocatePrizeV2Async,
        isPending: isAllocatePrizeV2Pending,
        isError: isAllocatePrizeV2Error,
        error: allocatePrizeV2Error,
    } = useAllocatePrizeV2Mutation();

    const {
        mutate: activateRaffleV2,
        mutateAsync: activateRaffleV2Async,
        isPending: isActivateRaffleV2Pending,
        isError: isActivateRaffleV2Error,
        error: activateRaffleV2Error,
    } = useActivateRaffleV2Mutation();

    const {
        mutate: batchDrawV2,
        mutateAsync: batchDrawV2Async,
        isPending: isBatchDrawV2Pending,
        isError: isBatchDrawV2Error,
        error: batchDrawV2Error,
    } = useBatchDrawV2Mutation();

    const {
        mutate: completeRaffleV2,
        mutateAsync: completeRaffleV2Async,
        isPending: isCompleteRaffleV2Pending,
        isError: isCompleteRaffleV2Error,
        error: completeRaffleV2Error,
    } = useCompleteRaffleV2Mutation();

    const {
        mutate: manageRoleV2,
        mutateAsync: manageRoleV2Async,
        isPending: isManageRoleV2Pending,
        isError: isManageRoleV2Error,
        error: manageRoleV2Error,
    } = useManageRoleV2Mutation();

    const {
        mutate: pauseContractV2,
        mutateAsync: pauseContractV2Async,
        isPending: isPauseContractV2Pending,
        isError: isPauseContractV2Error,
        error: pauseContractV2Error,
    } = usePauseContractV2Mutation();

    const {
        mutate: deployRafflesV2Contract,
        mutateAsync: deployRafflesV2ContractAsync,
        isPending: isDeployRafflesV2ContractPending,
        isError: isDeployRafflesV2ContractError,
        error: deployRafflesV2ContractError,
    } = useDeployRafflesV2ContractMutation();

    const {
        mutate: distributePrizeV2,
        mutateAsync: distributePrizeV2Async,
        isPending: isDistributePrizeV2Pending,
        isError: isDistributePrizeV2Error,
        error: distributePrizeV2Error,
    } = useDistributePrizeV2Mutation();

    return {
        raffleCardInfo,
        isRaffleCardInfoLoading,
        isRaffleCardInfoError,
        refetchRaffleCardInfo,

        activeRaffles,
        isActiveRafflesLoading,
        isActiveRafflesError,
        refetchActiveRaffles,

        allRaffles,
        isAllRafflesLoading,
        isAllRafflesError,
        refetchAllRaffles,

        fullRaffleInfo,
        isFullRaffleInfoLoading,
        isFullRaffleInfoError,
        refetchFullRaffleInfo,

        userParticipation,
        isUserParticipationLoading,
        isUserParticipationError,
        refetchUserParticipation,

        userParticipationCount,
        isUserParticipationCountLoading,
        isUserParticipationCountError,
        refetchUserParticipationCount,

        contractMetadata,
        isContractMetadataLoading,
        isContractMetadataError,
        refetchContractMetadata,

        batchDrawProgress,
        isBatchDrawProgressLoading,
        isBatchDrawProgressError,
        refetchBatchDrawProgress,

        participationCheck,
        isParticipationCheckLoading,
        isParticipationCheckError,
        refetchParticipationCheck,

        gasEstimate,
        isGasEstimateLoading,
        isGasEstimateError,
        refetchGasEstimate,

        participateV2,
        participateV2Async,
        isParticipateV2Pending,
        isParticipateV2Error,
        participateV2Error,

        createRaffleV2,
        createRaffleV2Async,
        isCreateRaffleV2Pending,
        isCreateRaffleV2Error,
        createRaffleV2Error,

        allocatePrizeV2,
        allocatePrizeV2Async,
        isAllocatePrizeV2Pending,
        isAllocatePrizeV2Error,
        allocatePrizeV2Error,

        activateRaffleV2,
        activateRaffleV2Async,
        isActivateRaffleV2Pending,
        isActivateRaffleV2Error,
        activateRaffleV2Error,

        batchDrawV2,
        batchDrawV2Async,
        isBatchDrawV2Pending,
        isBatchDrawV2Error,
        batchDrawV2Error,

        completeRaffleV2,
        completeRaffleV2Async,
        isCompleteRaffleV2Pending,
        isCompleteRaffleV2Error,
        completeRaffleV2Error,

        manageRoleV2,
        manageRoleV2Async,
        isManageRoleV2Pending,
        isManageRoleV2Error,
        manageRoleV2Error,

        pauseContractV2,
        pauseContractV2Async,
        isPauseContractV2Pending,
        isPauseContractV2Error,
        pauseContractV2Error,

        deployRafflesV2Contract,
        deployRafflesV2ContractAsync,
        isDeployRafflesV2ContractPending,
        isDeployRafflesV2ContractError,
        deployRafflesV2ContractError,

        distributePrizeV2,
        distributePrizeV2Async,
        isDistributePrizeV2Pending,
        isDistributePrizeV2Error,
        distributePrizeV2Error,
    };
}
