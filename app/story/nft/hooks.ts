/// app/story/nft/hooks.ts

import {
    useMintMutation,
    useRegisterAsIPAssetMutation,
    useMintAndRegisterAsIPAssetMutation,
    useBatchRegisterAsIPAssetMutation,
} from "./mutations";
import { useNFTsQuery } from "./queries";
import { getNFTsInput } from "./actions";

export interface useNFTInput {
    getNFTsInput?: getNFTsInput;
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

        useMintMutation,
        useRegisterAsIPAssetMutation,
        useMintAndRegisterAsIPAssetMutation,
        useBatchRegisterAsIPAssetMutation,
    };
}
