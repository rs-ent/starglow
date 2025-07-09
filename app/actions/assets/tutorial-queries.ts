/// app/actions/assets/tutorial-queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getAssetTutorial,
    getAssetTutorials,
    checkAssetHasTutorial,
    getTutorialAnalytics,
    getTutorialCustomizationPresets,
    getStepTemplates,
} from "@/app/actions/assets/tutorial-actions";
import type {
    GetAssetTutorialInput,
    CheckAssetHasTutorialInput,
    GetTutorialAnalyticsInput,
} from "@/app/actions/assets/tutorial-actions";
import { assetKeys } from "@/app/queryKeys";

export function useGetAssetTutorialQuery(input?: GetAssetTutorialInput) {
    return useQuery({
        queryKey: assetKeys.tutorial(input?.assetId || ""),
        queryFn: () => getAssetTutorial(input),
        enabled: !!input?.assetId,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useGetAssetTutorialsQuery() {
    return useQuery({
        queryKey: assetKeys.tutorials(),
        queryFn: () => getAssetTutorials(),
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useCheckAssetHasTutorialQuery(
    input?: CheckAssetHasTutorialInput
) {
    return useQuery({
        queryKey: assetKeys.hasTutorial(input?.assetId || ""),
        queryFn: () => checkAssetHasTutorial(input),
        enabled: !!input?.assetId,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useGetTutorialAnalyticsQuery(
    input?: GetTutorialAnalyticsInput
) {
    return useQuery({
        queryKey: assetKeys.analytics(input?.assetId || "all"),
        queryFn: () => getTutorialAnalytics(input),
        staleTime: 1000 * 60 * 5, // Analytics는 좀 더 오래 캐시 (5분)
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false, // Analytics는 자동 리프레시 비활성화
    });
}

export function useGetTutorialCustomizationPresetsQuery() {
    return useQuery({
        queryKey: assetKeys.customizationPresets(),
        queryFn: () => getTutorialCustomizationPresets(),
        staleTime: 1000 * 60 * 60, // 1 hour - presets don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
}

export function useGetStepTemplatesQuery() {
    return useQuery({
        queryKey: assetKeys.stepTemplates(),
        queryFn: () => getStepTemplates(),
        staleTime: 1000 * 60 * 60, // 1 hour - templates don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
}
