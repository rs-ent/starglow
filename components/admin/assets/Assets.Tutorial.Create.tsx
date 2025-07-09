/// components/admin/assets/Assets.Tutorial.Create.tsx

"use client";

import { useReducer, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Save,
    Eye,
    Loader2,
    GraduationCap,
    Palette,
    ArrowLeft,
} from "lucide-react";

import { useAssetTutorial } from "@/app/actions/assets/tutorial-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/tailwind";
import { useToast } from "@/app/hooks/useToast";

// 분리된 컴포넌트들 import
import TutorialCustomizationPanel from "./Assets.Tutorial.Customization";
import TutorialStepEditor from "./Assets.Tutorial.StepEditor";
import TutorialStepList from "./Assets.Tutorial.StepList";
import TutorialPreview from "./Assets.Tutorial.Preview";

// 타입들 import
import type {
    TutorialEditorProps,
    TutorialEditorState,
    TutorialEditorAction,
    ExtendedTutorialStep,
    ExtendedTutorialCustomization,
} from "./Assets.Tutorial.Types";
import {
    createNewStep,
    getDefaultCustomization,
    DEFAULT_STEP_ICON,
    getDefaultResponsiveSizes,
} from "./Assets.Tutorial.Types";

import type { CustomizationPreset } from "@/app/actions/assets/tutorial-actions";

// 🧩 상태 관리 reducer
function tutorialEditorReducer(
    state: TutorialEditorState,
    action: TutorialEditorAction
): TutorialEditorState {
    switch (action.type) {
        case "SET_STEPS":
            return {
                ...state,
                steps: action.payload,
                hasUnsavedChanges: true,
            };

        case "ADD_STEP":
            return {
                ...state,
                steps: [...state.steps, action.payload],
                selectedStepIndex: state.steps.length,
                hasUnsavedChanges: true,
            };

        case "UPDATE_STEP":
            const newSteps = [...state.steps];
            newSteps[action.payload.index] = {
                ...newSteps[action.payload.index],
                ...action.payload.step,
            };
            return {
                ...state,
                steps: newSteps,
                hasUnsavedChanges: true,
            };

        case "DELETE_STEP":
            const filteredSteps = state.steps.filter(
                (_, i) => i !== action.payload
            );
            const reorderedSteps = filteredSteps.map((step, i) => ({
                ...step,
                order: i,
            }));
            return {
                ...state,
                steps: reorderedSteps,
                selectedStepIndex: Math.max(
                    0,
                    Math.min(state.selectedStepIndex, reorderedSteps.length - 1)
                ),
                hasUnsavedChanges: true,
            };

        case "MOVE_STEP":
            const { fromIndex, toIndex } = action.payload;
            if (toIndex < 0 || toIndex >= state.steps.length) return state;

            const movedSteps = [...state.steps];
            const [moved] = movedSteps.splice(fromIndex, 1);
            movedSteps.splice(toIndex, 0, moved);

            const reorderedMovedSteps = movedSteps.map((step, i) => ({
                ...step,
                order: i,
            }));

            return {
                ...state,
                steps: reorderedMovedSteps,
                selectedStepIndex: toIndex,
                hasUnsavedChanges: true,
            };

        case "SET_SELECTED_STEP":
            return {
                ...state,
                selectedStepIndex: action.payload,
            };

        case "SET_CUSTOMIZATION":
            return {
                ...state,
                customization: {
                    ...state.customization,
                    ...action.payload,
                },
                hasUnsavedChanges: true,
            };

        case "APPLY_PRESET":
            // 프리셋 적용 로직은 훅에서 처리됨
            return {
                ...state,
                hasUnsavedChanges: true,
            };

        case "SET_PREVIEW_OPEN":
            return {
                ...state,
                isPreviewOpen: action.payload,
            };

        case "SET_SAVING":
            return {
                ...state,
                isSaving: action.payload,
            };

        case "SET_UNSAVED_CHANGES":
            return {
                ...state,
                hasUnsavedChanges: action.payload,
            };

        case "TOGGLE_CUSTOMIZATION_PANEL":
            return {
                ...state,
                showCustomizationPanel: !state.showCustomizationPanel,
            };

        case "RESET_EDITOR":
            return {
                steps: [],
                selectedStepIndex: 0,
                customization: getDefaultCustomization(),
                isPreviewOpen: false,
                isSaving: false,
                hasUnsavedChanges: false,
                showCustomizationPanel: false,
            };

        default:
            return state;
    }
}

export default function AssetsTutorialCreate({
    asset,
    isOpen,
    onClose,
    editMode = false,
}: TutorialEditorProps) {
    const toast = useToast();

    // 초기 상태
    const initialState: TutorialEditorState = {
        steps: [],
        selectedStepIndex: 0,
        customization: getDefaultCustomization(),
        isPreviewOpen: false,
        isSaving: false,
        hasUnsavedChanges: false,
        showCustomizationPanel: false,
    };

    const [state, dispatch] = useReducer(tutorialEditorReducer, initialState);

    // 훅 사용
    const {
        createAssetTutorialAsync,
        updateAssetTutorialAsync,
        assetTutorial,
        applyCustomizationPresetAsync,
    } = useAssetTutorial({
        getAssetTutorialInput: editMode ? { assetId: asset.id } : undefined,
    });

    // 기존 튜토리얼 데이터 로딩
    useEffect(() => {
        if (editMode && assetTutorial?.success && assetTutorial.data) {
            try {
                const tutorialData = assetTutorial.data.steps as any;
                const existingSteps = tutorialData?.steps || [];
                const existingCustomization = tutorialData?.customization || {};

                // ✅ 기존 단계들에 누락된 필드들을 보완
                const normalizedSteps = existingSteps.map((step: any) => ({
                    ...step,
                    stepIcon: step.stepIcon || DEFAULT_STEP_ICON,
                    responsiveSizes:
                        step.responsiveSizes || getDefaultResponsiveSizes(),
                    actionType:
                        step.actionType ||
                        (step.type === "action"
                            ? "external_link"
                            : step.actionType),
                    bulletinItems: step.bulletinItems || [],
                    orderItems: step.orderItems || [],
                }));

                dispatch({
                    type: "SET_STEPS",
                    payload: normalizedSteps.sort(
                        (a: ExtendedTutorialStep, b: ExtendedTutorialStep) =>
                            a.order - b.order
                    ),
                });

                dispatch({
                    type: "SET_CUSTOMIZATION",
                    payload: {
                        ...getDefaultCustomization(),
                        ...existingCustomization,
                    },
                });

                dispatch({ type: "SET_UNSAVED_CHANGES", payload: false });
            } catch (error) {
                console.error("Failed to load existing tutorial:", error);
                toast.error("기존 튜토리얼을 불러오는데 실패했습니다.");
            }
        }
    }, [editMode, assetTutorial, toast]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    // 핸들러 함수들
    const handleAddStep = useCallback(() => {
        const newStep = createNewStep(state.steps.length);
        dispatch({ type: "ADD_STEP", payload: newStep });
    }, [state.steps.length]);

    const handleUpdateStep = useCallback(
        (index: number, updates: Partial<ExtendedTutorialStep>) => {
            dispatch({
                type: "UPDATE_STEP",
                payload: { index, step: updates },
            });
        },
        []
    );

    const handleDeleteStep = useCallback((index: number) => {
        dispatch({ type: "DELETE_STEP", payload: index });
    }, []);

    const handleMoveStep = useCallback((fromIndex: number, toIndex: number) => {
        dispatch({
            type: "MOVE_STEP",
            payload: { fromIndex, toIndex },
        });
    }, []);

    const handleSelectStep = useCallback((index: number) => {
        dispatch({ type: "SET_SELECTED_STEP", payload: index });
    }, []);

    const handleCustomizationChange = useCallback(
        (updates: Partial<ExtendedTutorialCustomization>) => {
            dispatch({
                type: "SET_CUSTOMIZATION",
                payload: updates,
            });
        },
        []
    );

    const handleApplyPreset = useCallback(
        async (preset: CustomizationPreset) => {
            try {
                const result = await applyCustomizationPresetAsync({ preset });
                if (result?.success && result.data) {
                    dispatch({
                        type: "SET_CUSTOMIZATION",
                        payload: result.data,
                    });
                    toast.success(`${preset} 프리셋이 적용되었습니다!`);
                }
            } catch (error) {
                console.error("Failed to apply preset:", error);
                toast.error("프리셋 적용에 실패했습니다.");
            }
        },
        [applyCustomizationPresetAsync, toast]
    );

    const handleSave = useCallback(async () => {
        if (state.steps.length === 0) {
            toast.error("최소 1개의 단계가 필요합니다.");
            return;
        }

        dispatch({ type: "SET_SAVING", payload: true });

        try {
            // 🔧 데이터 정리: 스키마에 맞게 필드 정리
            const cleanedSteps = state.steps.map((step, index) => {
                const cleanedStep: any = {
                    id: step.id,
                    title: step.title,
                    content: step.content,
                    type: step.type,
                    order: index,
                };

                // 선택적 필드들 포함 (기본값으로 설정)
                cleanedStep.imageUrl = step.imageUrl || null;
                cleanedStep.videoUrl = step.videoUrl || null;
                cleanedStep.actionType = step.actionType || null;
                cleanedStep.actionUrl = step.actionUrl || null;
                cleanedStep.buttonText = step.buttonText || null;
                cleanedStep.icon = step.icon || null;
                cleanedStep.bulletinItems = step.bulletinItems || [];
                cleanedStep.orderItems = step.orderItems || [];

                // 새로운 필드들 포함
                cleanedStep.stepIcon = step.stepIcon || null;
                cleanedStep.responsiveSizes = step.responsiveSizes || null;

                return cleanedStep;
            });

            const tutorialData = {
                assetId: asset.id,
                isActive: true,
                triggerCondition: "ON_FIRST_RECEIVE",
                steps: cleanedSteps,
                customization: state.customization,
            };

            if (editMode && assetTutorial?.data) {
                const result = await updateAssetTutorialAsync({
                    id: assetTutorial.data.id,
                    ...tutorialData,
                });

                if (result?.success) {
                    toast.success("튜토리얼이 수정되었습니다!");
                    dispatch({ type: "SET_UNSAVED_CHANGES", payload: false });
                } else {
                    toast.error(result?.message || "수정에 실패했습니다.");
                    console.error("Update failed:", result);
                }
            } else {
                const result = await createAssetTutorialAsync(tutorialData);

                if (result?.success) {
                    toast.success("튜토리얼이 생성되었습니다!");
                    dispatch({ type: "SET_UNSAVED_CHANGES", payload: false });
                } else {
                    toast.error(result?.message || "생성에 실패했습니다.");
                    console.error("Create failed:", result);
                }
            }
        } catch (error) {
            console.error("💥 Save failed:", error);
            toast.error(
                `저장 중 오류가 발생했습니다: ${
                    error instanceof Error ? error.message : "알 수 없는 오류"
                }`
            );
        } finally {
            dispatch({ type: "SET_SAVING", payload: false });
        }
    }, [
        state.steps,
        state.customization,
        asset.id,
        editMode,
        assetTutorial,
        updateAssetTutorialAsync,
        createAssetTutorialAsync,
        toast,
    ]);

    // 모달이 닫혀있으면 렌더링하지 않음
    if (!isOpen) return null;

    const selectedStep = state.steps[state.selectedStepIndex];

    return (
        <>
            {/* 메인 모달 */}
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
                <div className="fixed inset-0 bg-slate-900 flex flex-col">
                    {/* 상단 헤더 */}
                    <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="w-6 h-6 text-purple-400" />
                                <h1 className="text-xl font-semibold text-white">
                                    {editMode
                                        ? "튜토리얼 수정"
                                        : "튜토리얼 생성"}{" "}
                                    - {asset.name}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3">
                                {state.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="text-orange-400 border-orange-400"
                                    >
                                        저장되지 않은 변경사항
                                    </Badge>
                                )}

                                <span className="text-sm text-slate-400">
                                    {state.steps.length}개의 단계
                                </span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        dispatch({
                                            type: "TOGGLE_CUSTOMIZATION_PANEL",
                                        })
                                    }
                                    className={cn(
                                        "text-slate-400 hover:text-white hover:bg-slate-800",
                                        state.showCustomizationPanel &&
                                            "text-purple-400 bg-slate-800"
                                    )}
                                >
                                    <Palette className="w-5 h-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_PREVIEW_OPEN",
                                            payload: true,
                                        })
                                    }
                                    disabled={state.steps.length === 0}
                                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <Eye className="w-5 h-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 메인 콘텐츠 영역 */}
                    <div className="flex-1 flex min-h-0">
                        <AnimatePresence>
                            {/* 커스터마이제이션 패널 (선택적) */}
                            {state.showCustomizationPanel && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 320, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-80 border-r border-slate-700 overflow-hidden"
                                >
                                    <div className="h-full overflow-y-auto p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <Palette className="w-5 h-5 text-purple-400" />
                                                커스터마이제이션
                                            </h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    dispatch({
                                                        type: "TOGGLE_CUSTOMIZATION_PANEL",
                                                    })
                                                }
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <TutorialCustomizationPanel
                                            customization={state.customization}
                                            onChange={handleCustomizationChange}
                                            onApplyPreset={handleApplyPreset}
                                            isLoading={state.isSaving}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 단계 리스트 */}
                        <div className="w-80 border-r border-slate-700 flex flex-col">
                            <div className="flex-1 overflow-hidden p-4">
                                <TutorialStepList
                                    steps={state.steps}
                                    selectedIndex={state.selectedStepIndex}
                                    onSelectStep={handleSelectStep}
                                    onAddStep={handleAddStep}
                                    onMoveStep={handleMoveStep}
                                    onDeleteStep={handleDeleteStep}
                                />
                            </div>
                        </div>

                        {/* 단계 편집기 */}
                        <div className="flex-1 flex flex-col">
                            {selectedStep ? (
                                <div className="flex-1 overflow-y-auto p-6">
                                    <TutorialStepEditor
                                        step={selectedStep}
                                        stepIndex={state.selectedStepIndex}
                                        onChange={(updates) =>
                                            handleUpdateStep(
                                                state.selectedStepIndex,
                                                updates
                                            )
                                        }
                                        onDelete={() =>
                                            handleDeleteStep(
                                                state.selectedStepIndex
                                            )
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <GraduationCap className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                                        <h3 className="text-xl font-semibold text-slate-300 mb-2">
                                            단계를 선택하여 편집하세요
                                        </h3>
                                        <p className="text-slate-400 mb-6">
                                            왼쪽에서 단계를 추가하거나
                                            선택해주세요
                                        </p>
                                        <Button
                                            onClick={handleAddStep}
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            첫 번째 단계 추가하기
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 하단 액션 버튼 */}
                    <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                                >
                                    취소
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_PREVIEW_OPEN",
                                            payload: true,
                                        })
                                    }
                                    disabled={state.steps.length === 0}
                                    variant="outline"
                                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    미리보기
                                </Button>

                                <Button
                                    onClick={handleSave}
                                    disabled={
                                        state.isSaving ||
                                        state.steps.length === 0
                                    }
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {state.isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            저장 중...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {editMode ? "수정하기" : "생성하기"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 미리보기 모달 */}
            <TutorialPreview
                steps={state.steps}
                customization={state.customization}
                asset={asset}
                isOpen={state.isPreviewOpen}
                onClose={() =>
                    dispatch({ type: "SET_PREVIEW_OPEN", payload: false })
                }
            />
        </>
    );
}
