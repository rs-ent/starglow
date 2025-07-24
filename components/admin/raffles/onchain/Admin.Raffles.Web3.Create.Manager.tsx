"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/app/hooks/useToast";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";

import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import {
    createRaffleV2,
    allocatePrizeV2,
    activateRaffleV2,
} from "@/app/actions/raffles/onchain/actions-admin-v2";

import { AdminRafflesWeb3CreateBasicInfo } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.BasicInfo";
import { AdminRafflesWeb3CreateTiming } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.Timing";
import { AdminRafflesWeb3CreateSettings } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.Settings";
import { AdminRafflesWeb3CreateFee } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.Fee";
import { AdminRafflesWeb3CreatePrizes } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.Prizes";
import { AdminRafflesWeb3CreateReview } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.Review";

export interface RaffleFormData {
    contractAddress: string;
    networkId: string;
    walletAddress: string;
    basicInfo: {
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
    };
    timing: {
        startDate: number;
        endDate: number;
        instantDraw: boolean;
        drawDate: number;
    };
    settings: {
        participationLimit: number;
        participationLimitPerPlayer: number;
        allowMultipleWins: boolean;
        dynamicWeight: boolean;
    };
    fee: {
        participationFeeAsset: string;
        participationFeeAssetId: string;
        participationFeeAmount: string;
    };
    prizes: Array<{
        prizeType: 0 | 1 | 2 | 3;
        collectionAddress: string;
        order: number;
        rarity: number;
        quantity: number;
        prizeQuantity: number;
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
        assetId: string;
        tokenIds: number[];
        userValue?: number;
    }>;
}

const STEPS = [
    {
        id: "basic",
        title: "기본 정보",
        component: AdminRafflesWeb3CreateBasicInfo,
    },
    {
        id: "timing",
        title: "일정 설정",
        component: AdminRafflesWeb3CreateTiming,
    },
    {
        id: "settings",
        title: "래플 설정",
        component: AdminRafflesWeb3CreateSettings,
    },
    { id: "fee", title: "참가비", component: AdminRafflesWeb3CreateFee },
    {
        id: "prizes",
        title: "상품 설정",
        component: AdminRafflesWeb3CreatePrizes,
    },
    {
        id: "review",
        title: "최종 확인",
        component: AdminRafflesWeb3CreateReview,
    },
];

export function AdminRafflesWeb3CreateManager() {
    const { storyNetworks } = useStoryNetwork();
    const { escrowWallets } = useEscrowWallets();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<"create" | "manage">("create");

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationProgress, setCreationProgress] = useState({
        step: 0,
        total: 1,
        status: "idle" as "idle" | "creating" | "completed" | "error",
        raffleId: "",
        error: null as string | null,
    });

    const [formData, setFormData] = useState<RaffleFormData>({
        contractAddress: "",
        networkId: "",
        walletAddress: "",
        basicInfo: {
            title: "",
            description: "",
            imageUrl: "",
            iconUrl: "",
        },
        timing: {
            startDate: Math.floor(Date.now() / 1000) + 3600,
            endDate: Math.floor(Date.now() / 1000) + 86400 * 7,
            instantDraw: true,
            drawDate: Math.floor(Date.now() / 1000) + 86400 * 7 + 3600,
        },
        settings: {
            participationLimit: 1000,
            participationLimitPerPlayer: 100,
            allowMultipleWins: true,
            dynamicWeight: false,
        },
        fee: {
            participationFeeAsset: "BERA",
            participationFeeAssetId: "",
            participationFeeAmount: "0",
        },
        prizes: [],
    });

    const updateFormData = useCallback((step: string, data: any) => {
        setFormData((prev) => {
            if (
                step === "contractAddress" ||
                step === "networkId" ||
                step === "walletAddress"
            ) {
                return {
                    ...prev,
                    [step]: data,
                };
            }

            if (step === "prizes") {
                return {
                    ...prev,
                    [step]: data,
                };
            }

            return {
                ...prev,
                [step]: {
                    ...(prev[step as keyof RaffleFormData] as object),
                    ...data,
                },
            };
        });
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    }, [currentStep]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setCreationProgress({
            step: 0,
            total: 1,
            status: "creating",
            raffleId: "",
            error: null,
        });

        try {
            toast.info("래플 생성 중...");
            const createResult = await createRaffleV2({
                contractAddress: formData.contractAddress,
                basicInfo: formData.basicInfo,
                timing: formData.timing,
                settings: {
                    participationLimit: formData.settings.participationLimit,
                    participationLimitPerPlayer:
                        formData.settings.participationLimitPerPlayer,
                    allowMultipleWins: formData.settings.allowMultipleWins,
                    dynamicWeight: formData.settings.dynamicWeight,
                },
                fee: formData.fee,
                prizes: formData.prizes.map((prize) => ({
                    prizeType: prize.prizeType,
                    title: prize.title,
                    description: prize.description,
                    imageUrl: prize.imageUrl,
                    iconUrl: prize.iconUrl,
                    quantity: prize.quantity,
                    prizeQuantity: prize.prizeQuantity,
                    rarity: prize.rarity,
                    order: prize.order,
                    collectionAddress: prize.collectionAddress,
                    assetId: prize.assetId,
                    tokenIds: prize.tokenIds,
                })),
            });

            if (!createResult.success || !createResult.data) {
                throw new Error(
                    createResult.error || "래플 생성에 실패했습니다."
                );
            }

            const raffleId = createResult.data.raffleId;
            setCreationProgress((prev) => ({
                ...prev,
                step: 1,
                status: "completed",
                raffleId,
            }));

            toast.success(
                `래플이 성공적으로 생성되었습니다! (ID: ${raffleId})`
            );
            toast.info("이제 수동으로 상품을 할당해주세요.");

            setTimeout(() => {
                setCreationProgress({
                    step: 0,
                    total: 1,
                    status: "idle",
                    raffleId: "",
                    error: null,
                });
            }, 5000);
        } catch (error) {
            console.error("Error creating raffle V2:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "래플 생성 중 오류가 발생했습니다.";

            setCreationProgress((prev) => ({
                ...prev,
                status: "error",
                error: errorMessage,
            }));

            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, toast]);

    const currentStepData = STEPS[currentStep];
    const CurrentStepComponent = currentStepData.component;

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                    래플 관리 (V2)
                </h2>

                <div className="flex border-b border-gray-600 mb-6">
                    <button
                        onClick={() => setActiveTab("create")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === "create"
                                ? "text-blue-400 border-b-2 border-blue-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        새 래플 생성
                    </button>
                    <button
                        onClick={() => setActiveTab("manage")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === "manage"
                                ? "text-blue-400 border-b-2 border-blue-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Allocation 관리
                    </button>
                </div>

                {/* Creation Progress */}
                {activeTab === "create" &&
                    creationProgress.status !== "idle" && (
                        <div className="mb-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-medium text-white">
                                    생성 진행률
                                </h3>
                                <span className="text-sm text-gray-400">
                                    {creationProgress.step}/
                                    {creationProgress.total} 단계
                                </span>
                            </div>

                            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        creationProgress.status === "error"
                                            ? "bg-red-500"
                                            : creationProgress.status ===
                                              "completed"
                                            ? "bg-green-500"
                                            : "bg-blue-500"
                                    }`}
                                    style={{
                                        width: `${
                                            (creationProgress.step /
                                                creationProgress.total) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>

                            <div className="text-sm">
                                {creationProgress.status === "creating" && (
                                    <span className="text-blue-400">
                                        래플 생성 중...
                                    </span>
                                )}
                                {creationProgress.status === "completed" && (
                                    <span className="text-green-400">
                                        ✅ 래플 생성 완료! 이제 상품을
                                        할당해주세요.
                                    </span>
                                )}
                                {creationProgress.status === "error" && (
                                    <span className="text-red-400">
                                        ❌ 오류: {creationProgress.error}
                                    </span>
                                )}
                            </div>

                            {creationProgress.raffleId && (
                                <div className="mt-2 text-xs text-gray-500">
                                    래플 ID: {creationProgress.raffleId}
                                </div>
                            )}
                        </div>
                    )}

                {activeTab === "create" && (
                    <div className="flex items-center justify-between mb-6">
                        {STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-center ${
                                    index < STEPS.length - 1 ? "flex-1" : ""
                                }`}
                            >
                                <div className="flex items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                            index < currentStep
                                                ? "bg-green-600 text-white"
                                                : index === currentStep
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-600 text-gray-300"
                                        }`}
                                    >
                                        {index < currentStep ? (
                                            <FaCheck size={12} />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span
                                        className={`ml-2 text-sm ${
                                            index <= currentStep
                                                ? "text-white"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-4 ${
                                            index < currentStep
                                                ? "bg-green-600"
                                                : "bg-gray-600"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {activeTab === "create" && (
                <>
                    <div className="mb-8">
                        {currentStep === STEPS.length - 1 ? (
                            <AdminRafflesWeb3CreateReview
                                data={formData}
                                updateData={updateFormData}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                onEditStep={(step: number) =>
                                    setCurrentStep(step)
                                }
                                creationProgress={creationProgress}
                            />
                        ) : (
                            <CurrentStepComponent
                                data={formData}
                                updateData={updateFormData}
                                storyNetworks={
                                    Array.isArray(storyNetworks)
                                        ? storyNetworks
                                        : undefined
                                }
                                escrowWallets={escrowWallets}
                                {...({} as any)}
                            />
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0 || isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                            <FaArrowLeft size={14} />
                            이전
                        </button>

                        {currentStep === STEPS.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        V2 래플 생성 중...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck size={14} />
                                        V2 래플 생성
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                다음
                                <FaArrowRight size={14} />
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
