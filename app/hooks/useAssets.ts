/// app\hooks\useAssets.ts

"use client";

import type {
    GetAssetInput,
    GetAssetsInput,
    GetAssetsContractInput,
    GetAssetsContractsInput,
} from "@/app/actions/assets";
import {
    useAsset,
    useAssets,
    useAssetsContract,
    useAssetsContracts,
} from "../queries/assetsQueries";
import {
    useActivateAsset,
    useCreateAsset,
    useDeleteAsset,
    useDeactivateAsset,
    useAddAssetFunction,
    useExecuteAssetFunction,
    useAirdropAsset,
    useDeployAssetsContract,
    useSetDefaultAsset,
} from "../mutations/assetsMutations";

export interface UseAssetsGetInput {
    getAssetInput?: GetAssetInput;
    getAssetsInput?: GetAssetsInput;
    getAssetsContractInput?: GetAssetsContractInput;
    getAssetsContractsInput?: GetAssetsContractsInput;
}

export function useAssetsGet(input?: UseAssetsGetInput) {
    const {
        data: asset,
        isLoading: isAssetLoading,
        error: assetError,
    } = useAsset(input?.getAssetInput);

    const {
        data: assets,
        isLoading: isAssetsLoading,
        error: assetsError,
    } = useAssets(input?.getAssetsInput);

    const {
        data: assetsContract,
        isLoading: isAssetsContractLoading,
        error: assetsContractError,
    } = useAssetsContract(input?.getAssetsContractInput);

    const {
        data: assetsContracts,
        isLoading: isAssetsContractsLoading,
        error: assetsContractsError,
    } = useAssetsContracts(input?.getAssetsContractsInput);

    return {
        asset,
        isAssetLoading,
        assetError,

        assets,
        isAssetsLoading,
        assetsError,

        assetsContract,
        isAssetsContractLoading,
        assetsContractError,

        assetsContracts,
        isAssetsContractsLoading,
        assetsContractsError,

        isLoading:
            isAssetLoading ||
            isAssetsLoading ||
            isAssetsContractLoading ||
            isAssetsContractsLoading,
        error:
            assetError ||
            assetsError ||
            assetsContractError ||
            assetsContractsError,
    };
}

export function useAssetsSet() {
    const { mutateAsync: createAsset, isPending: isCreateAssetPending } =
        useCreateAsset();
    const {
        mutateAsync: addAssetFunction,
        isPending: isAddAssetFunctionPending,
    } = useAddAssetFunction();
    const {
        mutateAsync: executeAssetFunction,
        isPending: isExecuteAssetFunctionPending,
    } = useExecuteAssetFunction();
    const { mutateAsync: airdropAsset, isPending: isAirdropAssetPending } =
        useAirdropAsset();
    const { mutateAsync: deleteAsset, isPending: isDeleteAssetPending } =
        useDeleteAsset();
    const { mutateAsync: activateAsset, isPending: isActivateAssetPending } =
        useActivateAsset();
    const {
        mutateAsync: deactivateAsset,
        isPending: isDeactivateAssetPending,
    } = useDeactivateAsset();
    const {
        mutateAsync: deployAssetsContract,
        isPending: isDeployAssetsContractPending,
    } = useDeployAssetsContract();

    const {
        mutateAsync: setDefaultAsset,
        isPending: isSetDefaultAssetPending,
    } = useSetDefaultAsset();

    return {
        createAsset,
        addAssetFunction,
        executeAssetFunction,
        airdropAsset,
        deleteAsset,
        activateAsset,
        deactivateAsset,
        deployAssetsContract,
        setDefaultAsset,

        isCreateAssetPending,
        isAddAssetFunctionPending,
        isExecuteAssetFunctionPending,
        isAirdropAssetPending,
        isDeleteAssetPending,
        isActivateAssetPending,
        isDeactivateAssetPending,
        isDeployAssetsContractPending,
        isSetDefaultAssetPending,

        isPending:
            isCreateAssetPending ||
            isAddAssetFunctionPending ||
            isExecuteAssetFunctionPending ||
            isAirdropAssetPending ||
            isDeleteAssetPending ||
            isActivateAssetPending ||
            isDeactivateAssetPending ||
            isDeployAssetsContractPending ||
            isSetDefaultAssetPending,

        useCreateAsset,
        useAddAssetFunction,
        useExecuteAssetFunction,
        useAirdropAsset,
        useDeleteAsset,
        useActivateAsset,
        useDeactivateAsset,
        useDeployAssetsContract,
        useSetDefaultAsset,
    };
}
