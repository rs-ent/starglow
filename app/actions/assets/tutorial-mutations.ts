/// app/actions/assets/tutorial-mutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createAssetTutorial,
    updateAssetTutorial,
    deleteAssetTutorial,
    applyCustomizationPreset,
} from "@/app/actions/assets/tutorial-actions";
import { assetKeys } from "@/app/queryKeys";

export function useCreateAssetTutorialMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAssetTutorial,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.tutorials(),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate tutorials cache:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.tutorial(variables.assetId),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate tutorial cache:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.hasTutorial(variables.assetId),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate hasTutorial cache:",
                            error
                        );
                    });
            }
        },
    });
}

export function useUpdateAssetTutorialMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateAssetTutorial,
        onSuccess: (data, _variables) => {
            if (data.success && data.data?.assetId) {
                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.tutorial(data.data.assetId),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate tutorial cache:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.tutorials(),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate tutorials cache:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.hasTutorial(data.data.assetId),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate hasTutorial cache:",
                            error
                        );
                    });
            }
        },
    });
}

export function useDeleteAssetTutorialMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAssetTutorial,
        onSuccess: (data, variables) => {
            if (data?.success && variables?.assetId) {
                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.tutorial(variables.assetId),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate tutorial cache:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.tutorials(),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate tutorials cache:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.hasTutorial(variables.assetId),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate hasTutorial cache:",
                            error
                        );
                    });
            }
        },
    });
}

export function useApplyCustomizationPresetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: applyCustomizationPreset,
        onSuccess: (data) => {
            if (data?.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: assetKeys.stepTemplates(),
                    })
                    .catch((error) => {
                        console.error(
                            "Failed to invalidate stepTemplates cache:",
                            error
                        );
                    });
            }
        },
    });
}
