/// app/actions/assets/tutorial-hooks.ts

"use client";

import { useCallback } from "react";

import {
    useGetAssetTutorialQuery,
    useGetAssetTutorialsQuery,
    useCheckAssetHasTutorialQuery,
    useGetTutorialAnalyticsQuery,
    useGetTutorialCustomizationPresetsQuery,
    useGetStepTemplatesQuery,
} from "@/app/actions/assets/tutorial-queries";

import {
    useCreateAssetTutorialMutation,
    useUpdateAssetTutorialMutation,
    useDeleteAssetTutorialMutation,
    useApplyCustomizationPresetMutation,
} from "@/app/actions/assets/tutorial-mutations";

import { validateTutorialSteps } from "@/app/actions/assets/tutorial-actions";

import type {
    GetAssetTutorialInput,
    CheckAssetHasTutorialInput,
    GetTutorialAnalyticsInput,
    ValidateTutorialStepsInput,
} from "@/app/actions/assets/tutorial-actions";

export interface UseAssetTutorialInput {
    getAssetTutorialInput?: GetAssetTutorialInput;
    checkAssetHasTutorialInput?: CheckAssetHasTutorialInput;
    getTutorialAnalyticsInput?: GetTutorialAnalyticsInput;
}

export function useAssetTutorial(input?: UseAssetTutorialInput) {
    const {
        data: assetTutorial,
        isLoading: isLoadingAssetTutorial,
        error: errorAssetTutorial,
        refetch: refetchAssetTutorial,
    } = useGetAssetTutorialQuery(input?.getAssetTutorialInput);

    const {
        data: assetTutorials,
        isLoading: isLoadingAssetTutorials,
        error: errorAssetTutorials,
        refetch: refetchAssetTutorials,
    } = useGetAssetTutorialsQuery();

    const {
        data: hasTutorial,
        isLoading: isLoadingHasTutorial,
        error: errorHasTutorial,
        refetch: refetchHasTutorial,
    } = useCheckAssetHasTutorialQuery(input?.checkAssetHasTutorialInput);

    const {
        data: tutorialAnalytics,
        isLoading: isLoadingTutorialAnalytics,
        error: errorTutorialAnalytics,
        refetch: refetchTutorialAnalytics,
    } = useGetTutorialAnalyticsQuery(input?.getTutorialAnalyticsInput);

    const {
        mutate: createAssetTutorial,
        mutateAsync: createAssetTutorialAsync,
        isPending: isPendingCreateAssetTutorial,
        isSuccess: isSuccessCreateAssetTutorial,
        isError: isErrorCreateAssetTutorial,
        error: errorCreateAssetTutorial,
    } = useCreateAssetTutorialMutation();

    const {
        mutate: updateAssetTutorial,
        mutateAsync: updateAssetTutorialAsync,
        isPending: isPendingUpdateAssetTutorial,
        isSuccess: isSuccessUpdateAssetTutorial,
        isError: isErrorUpdateAssetTutorial,
        error: errorUpdateAssetTutorial,
    } = useUpdateAssetTutorialMutation();

    const {
        mutate: deleteAssetTutorial,
        mutateAsync: deleteAssetTutorialAsync,
        isPending: isPendingDeleteAssetTutorial,
        isSuccess: isSuccessDeleteAssetTutorial,
        isError: isErrorDeleteAssetTutorial,
        error: errorDeleteAssetTutorial,
    } = useDeleteAssetTutorialMutation();

    const {
        mutate: applyCustomizationPreset,
        mutateAsync: applyCustomizationPresetAsync,
        isPending: isPendingApplyCustomizationPreset,
        isSuccess: isSuccessApplyCustomizationPreset,
        isError: isErrorApplyCustomizationPreset,
        error: errorApplyCustomizationPreset,
    } = useApplyCustomizationPresetMutation();

    const validateSteps = useCallback(
        async (input?: ValidateTutorialStepsInput) =>
            validateTutorialSteps(input),
        []
    );

    return {
        assetTutorial,
        isLoadingAssetTutorial,
        errorAssetTutorial,
        refetchAssetTutorial,

        assetTutorials,
        isLoadingAssetTutorials,
        errorAssetTutorials,
        refetchAssetTutorials,

        hasTutorial,
        isLoadingHasTutorial,
        errorHasTutorial,
        refetchHasTutorial,

        tutorialAnalytics,
        isLoadingTutorialAnalytics,
        errorTutorialAnalytics,
        refetchTutorialAnalytics,

        createAssetTutorial,
        createAssetTutorialAsync,
        isPendingCreateAssetTutorial,
        isSuccessCreateAssetTutorial,
        isErrorCreateAssetTutorial,
        errorCreateAssetTutorial,

        updateAssetTutorial,
        updateAssetTutorialAsync,
        isPendingUpdateAssetTutorial,
        isSuccessUpdateAssetTutorial,
        isErrorUpdateAssetTutorial,
        errorUpdateAssetTutorial,

        deleteAssetTutorial,
        deleteAssetTutorialAsync,
        isPendingDeleteAssetTutorial,
        isSuccessDeleteAssetTutorial,
        isErrorDeleteAssetTutorial,
        errorDeleteAssetTutorial,

        validateSteps,

        customizationPresets: useGetTutorialCustomizationPresetsQuery(),
        stepTemplates: useGetStepTemplatesQuery(),

        applyCustomizationPreset,
        applyCustomizationPresetAsync,
        isPendingApplyCustomizationPreset,
        isSuccessApplyCustomizationPreset,
        isErrorApplyCustomizationPreset,
        errorApplyCustomizationPreset,
    };
}

export const DEFAULT_STEP_TEMPLATES = {
    discordVerification: {
        id: "discord-verification",
        title: "Discord 인증",
        type: "order" as const,
        order: 0,
        content: "Discord를 통해 인증을 완료해주세요",
        orderItems: [
            {
                id: "open-discord",
                title: "Discord 채널 열기",
                description: "Discord 채널에 접속하세요",
            },
            {
                id: "find-nft-store",
                title: "NFT 스토어 찾기",
                description: "nft_store 채널을 찾아주세요",
            },
            {
                id: "verify-code",
                title: "인증 코드 확인",
                description: "제공된 코드를 입력하세요",
            },
        ],
    },
    welcomeMessage: {
        id: "welcome",
        title: "환영합니다!",
        type: "text" as const,
        order: 0,
        content: "이 튜토리얼을 통해 새로운 기능을 배워보세요",
    },
    completionMessage: {
        id: "completion",
        title: "완료!",
        type: "success" as const,
        order: 999,
        content: "축하합니다! 튜토리얼을 성공적으로 완료했습니다",
    },
} as const;
