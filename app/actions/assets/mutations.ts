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
    updateAsset,
    createAssetInstance,
} from "@/app/actions/assets/actions";

import { assetKeys } from "@/app/queryKeys";

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
    UpdateAssetInput,
    CreateAssetInstanceInput,
} from "@/app/actions/assets/actions";

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateAssetInput) => createAsset(input),
        onSuccess: () => {
            queryClient
                .invalidateQueries({ queryKey: assetKeys.all })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateAssetInput) => updateAsset(input),
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: assetKeys.all })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: DeleteAssetInput) => deleteAsset(input),
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: assetKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useActivateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: ActivateAssetInput) => activateAsset(input),
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: assetKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeactivateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: DeactivateAssetInput) => deactivateAsset(input),
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: assetKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useSetDefaultAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SetDefaultAssetInput) => setDefaultAsset(input),
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: assetKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.assetId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useAddAssetFunction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: AddAssetFunctionInput) => addAssetFunction(input),
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.assetId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useExecuteAssetFunction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ExecuteAssetFunctionInput) =>
            executeAssetFunction(input),
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.assetId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useAirdropAsset() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: AirdropAssetInput) => airdropAsset(input),
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.byId(variables.assetId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeployAssetsContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: DeployAssetsContractInput) =>
            deployAssetsContract(input),
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: assetKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });

            if (data.data?.address) {
                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.contract(data.data.address),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useCreateAssetInstance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateAssetInstanceInput) =>
            createAssetInstance(input),
        onSuccess: (data, variables) => {
            if (variables.assetId || variables.asset?.id) {
                const assetId = variables.assetId || variables.asset?.id;
                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.instances({
                            filter: {
                                assetId: assetId,
                            },
                        }),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}
