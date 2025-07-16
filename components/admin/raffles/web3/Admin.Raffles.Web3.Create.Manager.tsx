"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/app/hooks/useToast";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";

import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { createRaffle } from "@/app/actions/raffles/web3/actions-admin";

import { AdminRafflesWeb3CreateBasicInfo } from "@/components/admin/raffles/web3/Admin.Raffles.Web3.Create.BasicInfo";
import { AdminRafflesWeb3CreateTiming } from "@/components/admin/raffles/web3/Admin.Raffles.Web3.Create.Timing";
import { AdminRafflesWeb3CreateSettings } from "@/components/admin/raffles/web3/Admin.Raffles.Web3.Create.Settings";
import { AdminRafflesWeb3CreateFee } from "@/components/admin/raffles/web3/Admin.Raffles.Web3.Create.Fee";
import { AdminRafflesWeb3CreatePrizes } from "@/components/admin/raffles/web3/Admin.Raffles.Web3.Create.Prizes";
import { AdminRafflesWeb3CreateReview } from "@/components/admin/raffles/web3/Admin.Raffles.Web3.Create.Review";

export interface RaffleFormData {
    contractId: string;
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
        dynamicWeight: boolean;
        participationLimit: number;
        participationLimitPerPlayer: number;
    };
    fee: {
        participationFeeAsset: string;
        participationFeeAssetId: string;
        participationFeeAmount: string;
    };
    prizes: Array<{
        prizeType: 0 | 1 | 2;
        collectionAddress: string;
        registeredTicketQuantity: number;
        order: number;
        rarity: number;
        prizeQuantity: number;
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
        assetId: string;
        tokenIds: number[];
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

interface Props {
    onBack?: () => void;
}

export function AdminRafflesWeb3CreateManager({ onBack }: Props = {}) {
    const { storyNetworks } = useStoryNetwork();
    const { escrowWallets } = useEscrowWallets();
    const toast = useToast();

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<RaffleFormData>({
        contractId: "",
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
            instantDraw: false,
            drawDate: Math.floor(Date.now() / 1000) + 86400 * 7 + 3600,
        },
        settings: {
            dynamicWeight: false,
            participationLimit: 1000,
            participationLimitPerPlayer: 10,
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
            // 루트 레벨 string 필드들은 직접 업데이트
            if (
                step === "contractId" ||
                step === "networkId" ||
                step === "walletAddress"
            ) {
                return {
                    ...prev,
                    [step]: data,
                };
            }

            // 배열 필드들은 직접 교체
            if (step === "prizes") {
                return {
                    ...prev,
                    [step]: data,
                };
            }

            // object 필드들은 merge 처리
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
        try {
            const result = await createRaffle(formData);

            if (result.success) {
                toast.success("래플이 성공적으로 생성되었습니다!");
                setCurrentStep(0);
                setFormData({
                    contractId: "",
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
                        instantDraw: false,
                        drawDate:
                            Math.floor(Date.now() / 1000) + 86400 * 7 + 3600,
                    },
                    settings: {
                        dynamicWeight: false,
                        participationLimit: 1000,
                        participationLimitPerPlayer: 10,
                    },
                    fee: {
                        participationFeeAsset: "BERA",
                        participationFeeAssetId: "",
                        participationFeeAmount: "0",
                    },
                    prizes: [],
                });
            } else {
                toast.error(result.error || "래플 생성에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error creating raffle:", error);
            toast.error("래플 생성 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData]);

    const currentStepData = STEPS[currentStep];
    const CurrentStepComponent = currentStepData.component;

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                    새 래플 생성
                </h2>

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
            </div>

            <div className="mb-8">
                {currentStep === STEPS.length - 1 ? (
                    <AdminRafflesWeb3CreateReview
                        data={formData}
                        updateData={updateFormData}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        onEditStep={(step: number) => setCurrentStep(step)}
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
                    disabled={currentStep === 0}
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
                                생성 중...
                            </>
                        ) : (
                            <>
                                <FaCheck size={14} />
                                래플 생성
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        다음
                        <FaArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
