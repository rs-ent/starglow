/// app\mutations\assetsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createAsset,
    deleteAsset,
    activateAsset,
    deactivateAsset,
    addAssetFunction,
    executeAssetFunction,
    deployAssetsContract,
    airdropAsset,
    setDefaultAsset,
} from "@/app/actions/assets";
import type {
    CreateAssetInput,
    DeleteAssetInput,
    ActivateAssetInput,
    DeactivateAssetInput,
    AddAssetFunctionInput,
    ExecuteAssetFunctionInput,
    AirdropAssetInput,
    DeployAssetsContractInput,
    SetDefaultAssetInput,
} from "@/app/actions/assets";
import { assetKeys } from "../queryKeys";

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateAssetInput) => createAsset(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: DeleteAssetInput) => deleteAsset(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.id),
            });
        },
    });
}

export function useActivateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: ActivateAssetInput) => activateAsset(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.id),
            });
        },
    });
}

export function useDeactivateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: DeactivateAssetInput) => deactivateAsset(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.id),
            });
        },
    });
}

export function useSetDefaultAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SetDefaultAssetInput) => setDefaultAsset(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.assetId),
            });
        },
    });
}

export function useAddAssetFunction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: AddAssetFunctionInput) => addAssetFunction(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.assetId),
            });
        },
    });
}

export function useExecuteAssetFunction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ExecuteAssetFunctionInput) =>
            executeAssetFunction(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.assetId),
            });
        },
    });
}

export function useAirdropAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: AirdropAssetInput) => airdropAsset(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.byId(variables.assetId),
            });
        },
    });
}

export function useDeployAssetsContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: DeployAssetsContractInput) =>
            deployAssetsContract(input),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: assetKeys.all });
            queryClient.invalidateQueries({
                queryKey: assetKeys.contract(data.data?.address || ""),
            });
        },
    });
}
