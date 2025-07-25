/// app/story/nft/hooks.ts

import {
    useMintMutation,
    useRegisterAsIPAssetMutation,
    useMintAndRegisterAsIPAssetMutation,
    useBatchRegisterAsIPAssetMutation,
} from "./mutations";
import {
    useNFTsQuery,
    useOwnersQuery,
    useCirculationQuery,
    useTokenGatingQuery,
} from "./queries";

import type {
    getNFTsInput,
    getOwnersInput,
    getCirculationInput,
    TokenGatingInput,
} from "./actions";

export interface useNFTInput {
    getNFTsInput?: getNFTsInput;
    getOwnersInput?: getOwnersInput;
    getCirculationInput?: getCirculationInput;
    tokenGatingInput?: TokenGatingInput;
}

export function useNFT(input?: useNFTInput) {
    const {
        data: nfts,
        isLoading: isNFTsLoading,
        isError: isNFTsError,
        error: nftsError,
        refetch: refetchNFTs,
    } = useNFTsQuery(input?.getNFTsInput);

    const {
        data: owners,
        isLoading: isOwnersLoading,
        isError: isOwnersError,
        error: ownersError,
        refetch: refetchOwners,
    } = useOwnersQuery(input?.getOwnersInput);

    const {
        data: circulation,
        isLoading: isCirculationLoading,
        isError: isCirculationError,
        error: circulationError,
        refetch: refetchCirculation,
    } = useCirculationQuery(input?.getCirculationInput);

    const {
        data: tokenGating,
        isLoading: isTokenGatingLoading,
        isError: isTokenGatingError,
        error: tokenGatingError,
        refetch: refetchTokenGating,
    } = useTokenGatingQuery(input?.tokenGatingInput);

    const {
        mutate: mint,
        mutateAsync: mintAsync,
        isPending,
        isSuccess,
        isError,
        error,
    } = useMintMutation();

    const {
        mutate: registerAsIPAsset,
        mutateAsync: registerAsIPAssetAsync,
        isPending: isRegisterAsIPAssetPending,
        isSuccess: isRegisterAsIPAssetSuccess,
        isError: isRegisterAsIPAssetError,
        error: registerAsIPAssetError,
    } = useRegisterAsIPAssetMutation();

    const {
        mutate: mintAndRegisterAsIPAsset,
        mutateAsync: mintAndRegisterAsIPAssetAsync,
        isPending: isMintAndRegisterAsIPAssetPending,
        isSuccess: isMintAndRegisterAsIPAssetSuccess,
        isError: isMintAndRegisterAsIPAssetError,
        error: mintAndRegisterAsIPAssetError,
    } = useMintAndRegisterAsIPAssetMutation();

    const {
        mutate: batchRegisterAsIPAsset,
        mutateAsync: batchRegisterAsIPAssetAsync,
        isPending: isBatchRegisterAsIPAssetPending,
        isSuccess: isBatchRegisterAsIPAssetSuccess,
        isError: isBatchRegisterAsIPAssetError,
        error: batchRegisterAsIPAssetError,
    } = useBatchRegisterAsIPAssetMutation();

    return {
        nfts,
        isNFTsLoading,
        isNFTsError,
        nftsError,
        refetchNFTs,

        owners,
        isOwnersLoading,
        isOwnersError,
        ownersError,
        refetchOwners,

        circulation,
        isCirculationLoading,
        isCirculationError,
        circulationError,
        refetchCirculation,

        mint,
        mintAsync,
        isPending,
        isSuccess,
        isError,
        error,

        registerAsIPAsset,
        registerAsIPAssetAsync,
        isRegisterAsIPAssetPending,
        isRegisterAsIPAssetSuccess,
        isRegisterAsIPAssetError,
        registerAsIPAssetError,

        mintAndRegisterAsIPAsset,
        mintAndRegisterAsIPAssetAsync,
        isMintAndRegisterAsIPAssetPending,
        isMintAndRegisterAsIPAssetSuccess,
        isMintAndRegisterAsIPAssetError,
        mintAndRegisterAsIPAssetError,

        batchRegisterAsIPAsset,
        batchRegisterAsIPAssetAsync,
        isBatchRegisterAsIPAssetPending,
        isBatchRegisterAsIPAssetSuccess,
        isBatchRegisterAsIPAssetError,
        batchRegisterAsIPAssetError,

        tokenGating,
        isTokenGatingLoading,
        isTokenGatingError,
        tokenGatingError,
        refetchTokenGating,

        useMintMutation,
        useRegisterAsIPAssetMutation,
        useMintAndRegisterAsIPAssetMutation,
        useBatchRegisterAsIPAssetMutation,
    };
}
