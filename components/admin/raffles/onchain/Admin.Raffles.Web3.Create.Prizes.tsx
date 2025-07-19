"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useSPG } from "@/app/story/spg/hooks";
import { tierMap } from "@/components/raffles/raffle-tier";
import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";
import {
    FaGift,
    FaPlus,
    FaTrash,
    FaImage,
    FaCoins,
    FaGem,
    FaEye,
    FaDollarSign,
    FaChartPie,
    FaLightbulb,
    FaCopy,
    FaDice,
    FaTrophy,
    FaGripVertical,
    FaEdit,
    FaSave,
    FaExclamationTriangle,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";
import { cn } from "@/lib/utils/tailwind";

// 시뮬레이션 관련 import 추가
import { useRaffleSimulation } from "./simulation/useRaffleSimulation";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

interface Asset {
    id: string;
    name: string;
    symbol: string;
    iconUrl?: string;
    imageUrl?: string;
}

interface SPG {
    id: string;
    address: string;
    name: string;
    symbol: string;
    imageUrl?: string;
}

const PRIZE_TYPES = [
    {
        value: 0,
        label: "빈 상품",
        description: "꽝, 상품 없음",
        icon: FaTrash,
        color: "text-gray-400",
        bgColor: "bg-gray-900/30",
        borderColor: "border-gray-700",
    },
    {
        value: 1,
        label: "에셋",
        description: "SGP, 응모권 등",
        icon: FaCoins,
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/30",
        borderColor: "border-yellow-700",
    },
    {
        value: 2,
        label: "NFT",
        description: "대체불가능한 토큰",
        icon: FaGem,
        color: "text-purple-400",
        bgColor: "bg-purple-900/30",
        borderColor: "border-purple-700",
    },
    {
        value: 3,
        label: "토큰",
        description: "ERC-20 토큰",
        icon: FaDollarSign,
        color: "text-green-400",
        bgColor: "bg-green-900/30",
        borderColor: "border-green-700",
    },
] as const;

export function AdminRafflesWeb3CreatePrizes({ data, updateData }: Props) {
    const { data: session } = useSession();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 시뮬레이션 Hook 추가
    const [simulationState, simulationControls] = useRaffleSimulation();

    const assetsResult = useAssetsGet({ getAssetsInput: {} });
    const spgResult = useSPG({ getSPGsInput: {} });

    const assetsData = useMemo(
        () => (assetsResult.assets?.assets || []) as Asset[],
        [assetsResult.assets?.assets]
    );
    const spgsData = useMemo(
        () => (spgResult.getSPGsData || []) as SPG[],
        [spgResult.getSPGsData]
    );

    const addPrize = useCallback(() => {
        const prizes = Array.isArray(data.prizes) ? data.prizes : [];

        const newPrize = {
            prizeType: 0 as 0 | 1 | 2 | 3,
            collectionAddress: "",
            registeredTicketQuantity: 10,
            order: prizes.length + 1,
            rarity: 0,
            prizeQuantity: 1,
            title: "Bad Luck",
            description: "Try again next time!",
            imageUrl:
                "https://w3s.link/ipfs/bafkreifjx4hcx2dtlbpek7dnsmnus7tiqqzjmqxkrzwp6d4utdt5jhe3qm",
            iconUrl: "",
            assetId: "",
            tokenIds: [],
            userValue: 0,
        };

        updateData("prizes", [...prizes, newPrize]);
    }, [data.prizes, updateData]);

    const removePrize = useCallback(
        (index: number) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = prizes.filter((_, i) => i !== index);
            const reorderedPrizes = newPrizes.map((prize, i) => ({
                ...prize,
                order: i + 1,
            }));
            updateData("prizes", reorderedPrizes);
            setEditingIndex(null);
        },
        [data.prizes, updateData]
    );

    const updatePrize = useCallback(
        (index: number, field: string, value: any) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = [...prizes];

            newPrizes[index] = {
                ...newPrizes[index],
                [field]: value,
            };

            updateData("prizes", newPrizes);
        },
        [data.prizes, updateData]
    );

    const updateMultipleFields = useCallback(
        (index: number, updates: Record<string, any>) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = [...prizes];

            newPrizes[index] = {
                ...newPrizes[index],
                ...updates,
            };

            updateData("prizes", newPrizes);
        },
        [data.prizes, updateData]
    );

    const duplicatePrize = useCallback(
        (index: number) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const prizeToDuplicate = { ...prizes[index] };
            prizeToDuplicate.order = prizes.length + 1;
            prizeToDuplicate.title = `${prizeToDuplicate.title} (복사본)`;
            updateData("prizes", [...prizes, prizeToDuplicate]);
        },
        [data.prizes, updateData]
    );

    const handleImageUpload = useCallback(
        (index: number, files: any[]) => {
            if (files[0]?.url) {
                updatePrize(index, "imageUrl", files[0].url);
            }
        },
        [updatePrize]
    );

    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(
        (targetIndex: number) => {
            if (draggedIndex === null || draggedIndex === targetIndex) return;

            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = [...prizes];
            const draggedPrize = newPrizes[draggedIndex];
            newPrizes.splice(draggedIndex, 1);
            newPrizes.splice(targetIndex, 0, draggedPrize);

            const reorderedPrizes = newPrizes.map((prize, index) => ({
                ...prize,
                order: index + 1,
            }));

            updateData("prizes", reorderedPrizes);
            setDraggedIndex(null);
        },
        [draggedIndex, data.prizes, updateData]
    );

    const handleAssetSelection = useCallback(
        (index: number, assetId: string) => {
            const selectedAsset = assetsData?.find((a) => a.id === assetId);

            if (selectedAsset) {
                const defaultImage =
                    selectedAsset.iconUrl || selectedAsset.imageUrl || "";

                // 한 번에 assetId와 imageUrl 업데이트
                const updates = {
                    assetId: assetId,
                    imageUrl: defaultImage,
                };

                try {
                    updateMultipleFields(index, updates);
                } catch (error) {
                    console.error("❌ STEP 2: 다중 필드 업데이트 실패:", error);
                }
            } else {
                try {
                    updatePrize(index, "assetId", assetId);
                } catch (error) {
                    console.error("❌ assetId 업데이트 실패:", error);
                }
            }
        },
        [assetsData, updatePrize, updateMultipleFields]
    );

    const handleNFTSelection = useCallback(
        (index: number, collectionAddress: string) => {
            const selectedNFT = spgsData?.find(
                (s) => s.address === collectionAddress
            );

            const updates = {
                collectionAddress: collectionAddress,
                ...(selectedNFT?.imageUrl && {
                    imageUrl: selectedNFT.imageUrl,
                }),
            };

            updateMultipleFields(index, updates);
        },
        [spgsData, updateMultipleFields]
    );

    const handleAssetImageSelection = useCallback(
        (index: number, imageType: "iconUrl" | "imageUrl") => {
            const prize = data.prizes[index];
            const selectedAsset = assetsData?.find(
                (a) => a.id === prize.assetId
            );
            if (selectedAsset) {
                const imageUrl = selectedAsset[imageType] || "";
                updatePrize(index, "imageUrl", imageUrl);
            }
        },
        [data.prizes, assetsData, updatePrize]
    );

    const handlePrizeTypeChange = useCallback(
        (index: number, prizeType: 0 | 1 | 2 | 3) => {
            const entryFee = parseFloat(
                data.fee?.participationFeeAmount || "0"
            );

            const updates: Record<string, any> = {
                prizeType,
                assetId: "",
                collectionAddress: "",
                tokenIds: [],
                imageUrl:
                    prizeType === 0
                        ? "https://w3s.link/ipfs/bafkreifjx4hcx2dtlbpek7dnsmnus7tiqqzjmqxkrzwp6d4utdt5jhe3qm"
                        : "",
                userValue:
                    prizeType === 0
                        ? 0 // 빈 상품
                        : prizeType === 1
                        ? entryFee * 2 // 에셋 기본값: 참가비의 2배
                        : prizeType === 2
                        ? entryFee * 5 // NFT 기본값: 참가비의 5배
                        : prizeType === 3
                        ? entryFee * 3 // 토큰 기본값: 참가비의 3배
                        : entryFee,
                registeredTicketQuantity: prizeType === 0 ? 10 : 1, // 빈 상품은 기본적으로 많은 티켓 할당
                prizeQuantity: 1,
            };

            updateMultipleFields(index, updates);
        },
        [updateMultipleFields, data.fee?.participationFeeAmount]
    );

    const getTierInfo = useCallback((tier: number) => {
        return tierMap[tier as keyof typeof tierMap] || tierMap[0];
    }, []);

    // 실시간 분석 실행 (의존성 최적화)
    const runQuickAnalysis = useCallback(async () => {
        const prizes = Array.isArray(data.prizes) ? data.prizes : [];
        const entryFee = parseFloat(data.fee?.participationFeeAmount || "0");

        // 상품 가치가 설정된 상품만 분석 대상
        const validPrizes = prizes.filter(
            (p) => p.userValue !== undefined && p.userValue !== null
        );
        if (prizes.length === 0 || entryFee <= 0 || validPrizes.length === 0) {
            return;
        }

        const simulationData = {
            prizes: prizes.map((prize) => ({
                id:
                    prize.assetId ||
                    prize.collectionAddress ||
                    `prize-${prize.order}`,
                title: prize.title || `상품 #${prize.order}`,
                quantity: prize.registeredTicketQuantity || 1,
                userValue: parseFloat(prize.userValue?.toString() || "0"), // 실제 입력된 상품 가치 사용
                prizeType: prize.prizeType,
            })),
            entryFee: entryFee,
            totalRuns: 5000, // 빠른 분석을 위해 적은 수
            batchSize: 1000,
        };

        setIsAnalyzing(true);
        try {
            await simulationControls.runSimulation(simulationData);
        } catch (error) {
            console.error("실시간 분석 실행 실패:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [data.prizes, data.fee?.participationFeeAmount, simulationControls]);

    const userValueJson = useMemo(() => {
        return JSON.stringify(data.prizes?.map((p) => p.userValue));
    }, [data.prizes]);

    useEffect(() => {
        if (!showAnalysis || isAnalyzing) return;

        const prizes = Array.isArray(data.prizes) ? data.prizes : [];
        const entryFee = parseFloat(data.fee?.participationFeeAmount || "0");

        // 분석 실행 조건 체크
        const validPrizes = prizes.filter(
            (p) => p.userValue !== undefined && p.userValue !== null
        );
        if (prizes.length === 0 || entryFee <= 0 || validPrizes.length === 0) {
            return;
        }

        const timer = setTimeout(() => {
            runQuickAnalysis().catch((err) => {
                console.error("실시간 분석 실행 실패:", err);
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, [
        data.prizes?.length,
        data.fee?.participationFeeAmount,
        showAnalysis,
        userValueJson,
        data.prizes,
        isAnalyzing,
        runQuickAnalysis,
    ]);

    // 분석 결과 기반 경고/제안 생성
    const analysisInsights = useMemo(() => {
        if (!simulationState.result) return [];

        const insights = [];
        const stats = simulationState.result.finalStats;

        // 공정성 경고
        if (stats.fairnessIndex < 0.6) {
            insights.push({
                type: "warning",
                title: "공정성 개선 필요",
                message: `공정성 지수가 ${(stats.fairnessIndex * 100).toFixed(
                    1
                )}%로 낮습니다.`,
                suggestion: "상품 당첨 확률을 더 균등하게 분배하세요.",
            });
        }

        // ROI 경고
        if (stats.mean < -20) {
            insights.push({
                type: "error",
                title: "수익성 문제",
                message: `평균 손실이 ${Math.abs(stats.mean).toFixed(
                    2
                )}입니다.`,
                suggestion: "참가비를 높이거나 상품 가치를 조정하세요.",
            });
        }

        // 리스크 경고
        if (stats.sharpeRatio < 0.3) {
            insights.push({
                type: "warning",
                title: "높은 리스크",
                message: "샤프 비율이 낮아 리스크 대비 수익이 부족합니다.",
                suggestion: "상품 구성을 재검토하세요.",
            });
        }

        // 긍정적 피드백
        if (stats.fairnessIndex > 0.8 && stats.mean > 0) {
            insights.push({
                type: "success",
                title: "훌륭한 설계",
                message: "공정성과 수익성이 모두 우수합니다!",
                suggestion: "현재 설정을 유지하세요.",
            });
        }

        return insights;
    }, [simulationState.result]);

    const availableTiers = useMemo(() => {
        return Object.entries(tierMap).map(([key, tier]) => ({
            value: parseInt(key),
            ...tier,
        }));
    }, []);

    const prizeStats = useMemo(() => {
        const prizes = Array.isArray(data.prizes) ? data.prizes : [];
        const totalTickets = prizes.reduce(
            (sum, prize) => sum + (prize?.registeredTicketQuantity || 0),
            0
        );

        const rarityDistribution = availableTiers.map((tier) => {
            const prizesOfRarity = prizes.filter(
                (p) => p?.rarity === tier.value
            );
            const tickets = prizesOfRarity.reduce(
                (sum, p) => sum + (p?.registeredTicketQuantity || 0),
                0
            );
            return {
                ...tier,
                count: prizesOfRarity.length,
                tickets,
                percentage:
                    totalTickets > 0 ? (tickets / totalTickets) * 100 : 0,
            };
        });

        const typeDistribution = PRIZE_TYPES.map((type) => {
            const prizesOfType = prizes.filter(
                (p) => p?.prizeType === type.value
            );
            return {
                ...type,
                count: prizesOfType.length,
            };
        });

        return {
            totalTickets,
            totalPrizes: prizes.length,
            rarityDistribution,
            typeDistribution,
        };
    }, [data.prizes, availableTiers]);

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-pink-900/30 to-rose-900/30 rounded-xl p-6 border border-pink-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaGift className="mr-3 text-pink-400" size={20} />
                        상품 설정
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-300">
                            총 상품:{" "}
                            <span className="text-pink-400 font-medium">
                                {prizeStats.totalPrizes}개
                            </span>
                        </div>
                        <div className="text-sm text-gray-300">
                            총 티켓:{" "}
                            <span className="text-pink-400 font-medium">
                                {prizeStats.totalTickets}개
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                showAnalysis
                                    ? "bg-blue-600 text-white"
                                    : "bg-gradient-to-r from-red-700 via-green-700 to-blue-700 text-gray-100"
                            }`}
                        >
                            <FaChartPie className="inline mr-1" size={12} />
                            {isAnalyzing
                                ? "분석 중..."
                                : showAnalysis
                                ? "분석 닫기"
                                : "실시간 분석"}
                            {isAnalyzing && (
                                <div className="inline-block ml-1 w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                showPreview
                                    ? "bg-pink-600 text-white"
                                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                            }`}
                        >
                            <FaEye className="inline mr-1" size={12} />
                            {showPreview ? "편집 모드" : "미리보기"}
                        </button>
                        <button
                            onClick={addPrize}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <FaPlus size={14} />
                            상품 추가
                        </button>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    래플에서 제공할 상품들을 설정합니다. 드래그앤드롭으로 순서를
                    변경할 수 있습니다.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaTrophy
                                className="mr-3 text-yellow-400"
                                size={16}
                            />
                            상품 목록 (
                            {
                                (Array.isArray(data.prizes) ? data.prizes : [])
                                    .length
                            }
                            개)
                        </h4>

                        {(Array.isArray(data.prizes) ? data.prizes : [])
                            .length === 0 ? (
                            <div className="text-center py-12">
                                <FaGift
                                    className="mx-auto text-gray-400 mb-4"
                                    size={48}
                                />
                                <h5 className="text-lg font-medium text-gray-300 mb-2">
                                    상품이 없습니다
                                </h5>
                                <p className="text-gray-400 text-sm mb-6">
                                    래플에 제공할 상품을 추가해주세요.
                                </p>
                                <button
                                    onClick={addPrize}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <FaPlus size={14} />첫 번째 상품 추가
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(Array.isArray(data.prizes)
                                    ? data.prizes
                                    : []
                                ).map((prize, index) => {
                                    const prizeType = PRIZE_TYPES.find(
                                        (t) => t.value === prize.prizeType
                                    );
                                    const rarity = getTierInfo(prize.rarity);
                                    const IconComponent =
                                        prizeType?.icon || FaGift;
                                    const isEditing = editingIndex === index;

                                    const assetInfo =
                                        prize.prizeType === 1 && prize.assetId
                                            ? assetsData?.find(
                                                  (a) => a.id === prize.assetId
                                              )
                                            : null;
                                    const spgInfo =
                                        prize.prizeType === 2 &&
                                        prize.collectionAddress
                                            ? spgsData?.find(
                                                  (s) =>
                                                      s.address ===
                                                      prize.collectionAddress
                                              )
                                            : null;

                                    return (
                                        <div
                                            key={index}
                                            draggable={!isEditing}
                                            onDragStart={() =>
                                                handleDragStart(index)
                                            }
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(index)}
                                            className={cn(
                                                "border rounded-xl p-6 transition-all",
                                                `bg-gradient-to-br ${rarity.bg}`,
                                                `border-${rarity.border
                                                    .replace("[", "")
                                                    .replace("]", "")}`,
                                                rarity.glow
                                                    ? `shadow-lg shadow-${rarity.glow
                                                          .replace("[", "")
                                                          .replace("]", "")}`
                                                    : "",
                                                draggedIndex === index
                                                    ? "opacity-50 scale-95"
                                                    : "",
                                                "hover:scale-[1.02] cursor-move"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <FaGripVertical
                                                            className="text-gray-400 cursor-move"
                                                            size={14}
                                                        />
                                                        <div
                                                            className={cn(
                                                                "p-3 rounded-lg bg-gradient-to-r",
                                                                rarity.gradient
                                                            )}
                                                        >
                                                            <IconComponent
                                                                className="text-white"
                                                                size={20}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h5 className="font-bold text-white text-lg">
                                                                #{prize.order}{" "}
                                                                {prize.title ||
                                                                    "상품 이름"}
                                                            </h5>
                                                            <div
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full bg-gradient-to-r text-white font-bold text-xs",
                                                                    rarity.gradient
                                                                )}
                                                            >
                                                                {rarity.name}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-300 mt-1">
                                                            {prizeType?.label} |{" "}
                                                            {
                                                                prize.prizeQuantity
                                                            }
                                                            개 상품 |{" "}
                                                            {
                                                                prize.registeredTicketQuantity
                                                            }
                                                            개 티켓
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditingIndex(
                                                                isEditing
                                                                    ? null
                                                                    : index
                                                            )
                                                        }
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            isEditing
                                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                                        }`}
                                                        title={
                                                            isEditing
                                                                ? "저장"
                                                                : "편집"
                                                        }
                                                    >
                                                        {isEditing ? (
                                                            <FaSave size={14} />
                                                        ) : (
                                                            <FaEdit size={14} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            duplicatePrize(
                                                                index
                                                            )
                                                        }
                                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                                        title="복사"
                                                    >
                                                        <FaCopy size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            removePrize(index)
                                                        }
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                        title="삭제"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-900/50 rounded-lg p-4">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                상품 종류 *
                                                            </label>
                                                            <select
                                                                value={
                                                                    prize.prizeType
                                                                }
                                                                onChange={(e) =>
                                                                    handlePrizeTypeChange(
                                                                        index,
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) as
                                                                            | 0
                                                                            | 1
                                                                            | 2
                                                                            | 3
                                                                    )
                                                                }
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {PRIZE_TYPES.map(
                                                                    (type) => (
                                                                        <option
                                                                            key={
                                                                                type.value
                                                                            }
                                                                            value={
                                                                                type.value
                                                                            }
                                                                        >
                                                                            {
                                                                                type.label
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                type.description
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                희귀도
                                                            </label>
                                                            <select
                                                                value={
                                                                    prize.rarity
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "rarity",
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {availableTiers.map(
                                                                    (tier) => (
                                                                        <option
                                                                            key={
                                                                                tier.value
                                                                            }
                                                                            value={
                                                                                tier.value
                                                                            }
                                                                        >
                                                                            {
                                                                                tier.name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    티켓 수량 *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        prize.registeredTicketQuantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updatePrize(
                                                                            index,
                                                                            "registeredTicketQuantity",
                                                                            Math.max(
                                                                                1,
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ||
                                                                                    1
                                                                            )
                                                                        )
                                                                    }
                                                                    min="1"
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    상품 수량 *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        prize.prizeQuantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updatePrize(
                                                                            index,
                                                                            "prizeQuantity",
                                                                            Math.max(
                                                                                1,
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ||
                                                                                    1
                                                                            )
                                                                        )
                                                                    }
                                                                    min="1"
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* 상품 가치 입력 필드 추가 */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                <FaDollarSign
                                                                    className="inline mr-2 text-green-400"
                                                                    size={14}
                                                                />
                                                                상품 가치 (
                                                                {data.fee
                                                                    ?.participationFeeAsset
                                                                    ? assetsData?.find(
                                                                          (a) =>
                                                                              a.id ===
                                                                              data
                                                                                  .fee
                                                                                  .participationFeeAsset
                                                                      )
                                                                          ?.symbol ||
                                                                      "에셋"
                                                                    : "에셋"}
                                                                ) *
                                                                <span className="text-yellow-400 text-xs ml-2">
                                                                    분석
                                                                    정확도에
                                                                    중요!
                                                                </span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    prize.userValue ||
                                                                    0
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "userValue",
                                                                        Math.max(
                                                                            0,
                                                                            parseFloat(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ) ||
                                                                                0
                                                                        )
                                                                    )
                                                                }
                                                                min="0"
                                                                step="0.01"
                                                                placeholder={
                                                                    prize.prizeType ===
                                                                    0
                                                                        ? "0 (빈 상품)"
                                                                        : prize.prizeType ===
                                                                          1
                                                                        ? "에셋의 실제 가치"
                                                                        : prize.prizeType ===
                                                                          2
                                                                        ? "NFT의 예상 가치"
                                                                        : "상품의 실제 가치"
                                                                }
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                                disabled={
                                                                    prize.prizeType ===
                                                                    0
                                                                }
                                                            />
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                {prize.prizeType ===
                                                                0
                                                                    ? "빈 상품은 가치가 0입니다"
                                                                    : prize.prizeType ===
                                                                      1
                                                                    ? "에셋의 시장 가치나 내부 가치를 입력하세요"
                                                                    : prize.prizeType ===
                                                                      2
                                                                    ? "NFT의 floor price나 예상 가치를 입력하세요"
                                                                    : "참가비와 비교할 수 있는 실제 가치를 입력하세요"}
                                                            </p>
                                                        </div>

                                                        {prize.prizeType ===
                                                            1 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    에셋 선택
                                                                </label>
                                                                <select
                                                                    value={
                                                                        prize.assetId ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleAssetSelection(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                >
                                                                    <option value="">
                                                                        에셋
                                                                        선택
                                                                    </option>
                                                                    {assetsData?.map(
                                                                        (
                                                                            asset: Asset
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    asset.id
                                                                                }
                                                                                value={
                                                                                    asset.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    asset.name
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    asset.symbol
                                                                                }

                                                                                )
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            2 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    NFT 컬렉션
                                                                    선택
                                                                </label>
                                                                <select
                                                                    value={
                                                                        prize.collectionAddress ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleNFTSelection(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                >
                                                                    <option value="">
                                                                        컬렉션
                                                                        선택
                                                                    </option>
                                                                    {spgsData?.map(
                                                                        (
                                                                            spg: SPG
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    spg.id
                                                                                }
                                                                                value={
                                                                                    spg.address
                                                                                }
                                                                            >
                                                                                {
                                                                                    spg.name
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    spg.symbol
                                                                                }

                                                                                )
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                상품 이름 *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    prize.title
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "title",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="상품 이름"
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                상품 설명
                                                            </label>
                                                            <textarea
                                                                value={
                                                                    prize.description
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "description",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="상품에 대한 설명"
                                                                rows={3}
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                            />
                                                        </div>

                                                        {prize.prizeType ===
                                                            1 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    <FaImage
                                                                        className="inline mr-2"
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    에셋 이미지
                                                                </label>
                                                                <div className="space-y-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                                                    {prize.assetId && (
                                                                        <div>
                                                                            <label className="block text-xs text-gray-400 mb-2">
                                                                                에셋에서
                                                                                선택
                                                                            </label>
                                                                            <select
                                                                                value={
                                                                                    prize.imageUrl ===
                                                                                    assetsData?.find(
                                                                                        (
                                                                                            a
                                                                                        ) =>
                                                                                            a.id ===
                                                                                            prize.assetId
                                                                                    )
                                                                                        ?.iconUrl
                                                                                        ? "iconUrl"
                                                                                        : "imageUrl"
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    handleAssetImageSelection(
                                                                                        index,
                                                                                        e
                                                                                            .target
                                                                                            .value as
                                                                                            | "iconUrl"
                                                                                            | "imageUrl"
                                                                                    )
                                                                                }
                                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                                disabled={
                                                                                    !prize.assetId
                                                                                }
                                                                            >
                                                                                <option value="iconUrl">
                                                                                    아이콘
                                                                                    이미지
                                                                                </option>
                                                                                <option value="imageUrl">
                                                                                    상세
                                                                                    이미지
                                                                                </option>
                                                                            </select>
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <label className="block text-xs text-gray-400 mb-2">
                                                                            또는
                                                                            직접
                                                                            업로드
                                                                        </label>
                                                                        <FileUploaderIPFS
                                                                            userId={
                                                                                session
                                                                                    ?.user
                                                                                    ?.id ||
                                                                                ""
                                                                            }
                                                                            type="image"
                                                                            multiple={
                                                                                false
                                                                            }
                                                                            onComplete={(
                                                                                files
                                                                            ) =>
                                                                                handleImageUpload(
                                                                                    index,
                                                                                    files
                                                                                )
                                                                            }
                                                                            className="mb-3"
                                                                        />
                                                                    </div>

                                                                    <input
                                                                        type="url"
                                                                        value={
                                                                            prize.imageUrl
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updatePrize(
                                                                                index,
                                                                                "imageUrl",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="또는 직접 URL 입력: https://example.com/image.jpg"
                                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                    />

                                                                    {prize.imageUrl && (
                                                                        <div className="mt-3">
                                                                            <img
                                                                                src={
                                                                                    prize.imageUrl
                                                                                }
                                                                                alt="에셋 이미지 미리보기"
                                                                                className="w-full h-32 object-contain rounded-lg border border-gray-600"
                                                                                onError={(
                                                                                    e
                                                                                ) => {
                                                                                    const target =
                                                                                        e.target as HTMLImageElement;
                                                                                    target.style.display =
                                                                                        "none";
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            2 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    <FaImage
                                                                        className="inline mr-2"
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    NFT 이미지
                                                                </label>
                                                                <div className="space-y-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                                                    {prize.collectionAddress && (
                                                                        <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-300">
                                                                            <div className="text-sm">
                                                                                <span className="text-purple-400">
                                                                                    💜
                                                                                    컬렉션에서
                                                                                    자동
                                                                                    설정:
                                                                                </span>
                                                                                <span className="ml-2">
                                                                                    {prize.imageUrl ||
                                                                                        "이미지 없음"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <label className="block text-xs text-gray-400 mb-2">
                                                                            또는
                                                                            직접
                                                                            업로드
                                                                        </label>
                                                                        <FileUploaderIPFS
                                                                            userId={
                                                                                session
                                                                                    ?.user
                                                                                    ?.id ||
                                                                                ""
                                                                            }
                                                                            type="image"
                                                                            multiple={
                                                                                false
                                                                            }
                                                                            onComplete={(
                                                                                files
                                                                            ) =>
                                                                                handleImageUpload(
                                                                                    index,
                                                                                    files
                                                                                )
                                                                            }
                                                                            className="mb-3"
                                                                        />
                                                                    </div>

                                                                    <input
                                                                        type="url"
                                                                        value={
                                                                            prize.imageUrl
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updatePrize(
                                                                                index,
                                                                                "imageUrl",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="또는 직접 URL 입력: https://example.com/image.jpg"
                                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                    />

                                                                    {prize.imageUrl && (
                                                                        <div className="mt-3">
                                                                            <img
                                                                                src={
                                                                                    prize.imageUrl
                                                                                }
                                                                                alt="NFT 이미지 미리보기"
                                                                                className="w-full h-32 object-contain rounded-lg border border-gray-600"
                                                                                onError={(
                                                                                    e
                                                                                ) => {
                                                                                    const target =
                                                                                        e.target as HTMLImageElement;
                                                                                    target.style.display =
                                                                                        "none";
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            0 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    <FaImage
                                                                        className="inline mr-2"
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                    상품 이미지
                                                                    (선택사항)
                                                                </label>
                                                                <div className="space-y-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                                                    <FileUploaderIPFS
                                                                        userId={
                                                                            session
                                                                                ?.user
                                                                                ?.id ||
                                                                            ""
                                                                        }
                                                                        type="image"
                                                                        multiple={
                                                                            false
                                                                        }
                                                                        onComplete={(
                                                                            files
                                                                        ) =>
                                                                            handleImageUpload(
                                                                                index,
                                                                                files
                                                                            )
                                                                        }
                                                                        className="mb-3"
                                                                    />
                                                                    <input
                                                                        type="url"
                                                                        value={
                                                                            prize.imageUrl
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updatePrize(
                                                                                index,
                                                                                "imageUrl",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="또는 직접 URL 입력: https://example.com/image.jpg"
                                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                    />
                                                                    {prize.imageUrl && (
                                                                        <div className="mt-3">
                                                                            <img
                                                                                src={
                                                                                    prize.imageUrl
                                                                                }
                                                                                alt="상품 이미지 미리보기"
                                                                                className="w-full h-32 object-contain rounded-lg border border-gray-600"
                                                                                onError={(
                                                                                    e
                                                                                ) => {
                                                                                    const target =
                                                                                        e.target as HTMLImageElement;
                                                                                    target.style.display =
                                                                                        "none";
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            2 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    NFT 토큰
                                                                    ID들 (쉼표로
                                                                    구분)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={prize.tokenIds.join(
                                                                        ", "
                                                                    )}
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        const ids =
                                                                            e.target.value
                                                                                .split(
                                                                                    ","
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        parseInt(
                                                                                            id.trim()
                                                                                        )
                                                                                )
                                                                                .filter(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        !isNaN(
                                                                                            id
                                                                                        )
                                                                                );
                                                                        updatePrize(
                                                                            index,
                                                                            "tokenIds",
                                                                            ids
                                                                        );
                                                                    }}
                                                                    placeholder="1, 2, 3, 4, 5"
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                    <div className="lg:col-span-2">
                                                        {prize.description && (
                                                            <p className="text-gray-300 mb-4 leading-relaxed">
                                                                {
                                                                    prize.description
                                                                }
                                                            </p>
                                                        )}

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    당첨 확률
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {prizeStats.totalTickets >
                                                                    0
                                                                        ? `${(
                                                                              (prize.registeredTicketQuantity /
                                                                                  prizeStats.totalTickets) *
                                                                              100
                                                                          ).toFixed(
                                                                              2
                                                                          )}%`
                                                                        : "0%"}
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    상품 수
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {
                                                                        prize.prizeQuantity
                                                                    }
                                                                    개
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    티켓 수
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {
                                                                        prize.registeredTicketQuantity
                                                                    }
                                                                    개
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    종류
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {
                                                                        prizeType?.label
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {prize.prizeType ===
                                                            1 &&
                                                            assetInfo && (
                                                                <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
                                                                    <div className="text-sm">
                                                                        <span className="text-yellow-400 font-medium">
                                                                            💰
                                                                            에셋:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {
                                                                                assetInfo.name
                                                                            }{" "}
                                                                            (
                                                                            {
                                                                                assetInfo.symbol
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {prize.prizeType ===
                                                            2 &&
                                                            spgInfo && (
                                                                <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700">
                                                                    <div className="text-sm">
                                                                        <span className="text-purple-400 font-medium">
                                                                            🎨
                                                                            NFT:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {
                                                                                spgInfo.name
                                                                            }{" "}
                                                                            (
                                                                            {
                                                                                spgInfo.symbol
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                        {
                                                                            prize.collectionAddress
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>

                                                    {prize.imageUrl && (
                                                        <div className="flex justify-center">
                                                            <div className="relative w-32 h-32 overflow-hidden rounded-xl">
                                                                {/* Holographic border effect for NFT */}
                                                                {prize.prizeType ===
                                                                    2 && (
                                                                    <div
                                                                        className="absolute inset-0 rounded-xl animate-spin scale-150"
                                                                        style={{
                                                                            animationDuration:
                                                                                "3s",
                                                                            background:
                                                                                "conic-gradient(from 0deg, #a855f7, #06b6d4, #10b981, #eab308, #a855f7)",
                                                                        }}
                                                                    />
                                                                )}

                                                                <div
                                                                    className={cn(
                                                                        "relative w-full h-full rounded-xl overflow-hidden",
                                                                        "bg-gradient-to-br",
                                                                        rarity.bg,
                                                                        "border-2",
                                                                        `border-${rarity.border
                                                                            .replace(
                                                                                "[",
                                                                                ""
                                                                            )
                                                                            .replace(
                                                                                "]",
                                                                                ""
                                                                            )}`
                                                                    )}
                                                                >
                                                                    <img
                                                                        src={
                                                                            prize.imageUrl
                                                                        }
                                                                        alt={
                                                                            prize.title ||
                                                                            "상품 이미지"
                                                                        }
                                                                        className="w-full h-full object-cover"
                                                                        onError={(
                                                                            e
                                                                        ) => {
                                                                            const target =
                                                                                e.target as HTMLImageElement;
                                                                            target.style.display =
                                                                                "none";
                                                                        }}
                                                                    />

                                                                    {/* Shimmer effect */}
                                                                    <div
                                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                                                        style={{
                                                                            animation:
                                                                                "shimmer 2s infinite",
                                                                            background:
                                                                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                                                            transform:
                                                                                "translateX(-100%) skewX(-12deg)",
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!prize.imageUrl && (
                                                        <div className="flex justify-center">
                                                            <div className="relative w-32 h-32">
                                                                <div
                                                                    className={cn(
                                                                        "w-full h-full rounded-xl border-2 flex items-center justify-center",
                                                                        "bg-gradient-to-br",
                                                                        rarity.bg,
                                                                        `border-${rarity.border
                                                                            .replace(
                                                                                "[",
                                                                                ""
                                                                            )
                                                                            .replace(
                                                                                "]",
                                                                                ""
                                                                            )}`
                                                                    )}
                                                                >
                                                                    {prize.prizeType ===
                                                                    0 ? (
                                                                        <div className="text-center">
                                                                            <div className="text-red-400 mb-1 text-4xl">
                                                                                💔
                                                                            </div>
                                                                            <div className="text-xs text-gray-400">
                                                                                빈
                                                                                상품
                                                                            </div>
                                                                        </div>
                                                                    ) : prize.prizeType ===
                                                                      2 ? (
                                                                        <FaGem className="text-purple-400 text-3xl animate-pulse" />
                                                                    ) : (
                                                                        <IconComponent className="text-white text-3xl" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaChartPie
                                className="mr-3 text-blue-400"
                                size={16}
                            />
                            상품 통계
                        </h4>

                        <div className="space-y-4">
                            <div className="text-center bg-gray-750 rounded-lg p-4">
                                <div className="text-3xl font-bold text-blue-400 mb-1">
                                    {prizeStats.totalTickets}
                                </div>
                                <div className="text-sm text-gray-400">
                                    총 당첨 티켓
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-3">
                                    희귀도별 분포
                                </h5>
                                <div className="space-y-2">
                                    {prizeStats.rarityDistribution
                                        .filter((r) => r.count > 0)
                                        .map((rarity) => (
                                            <div
                                                key={rarity.value}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${rarity.gradient}`}
                                                    />
                                                    <span
                                                        className={rarity.color}
                                                    >
                                                        {rarity.name}
                                                    </span>
                                                </div>
                                                <div className="text-gray-400">
                                                    {rarity.count}개 (
                                                    {rarity.percentage.toFixed(
                                                        1
                                                    )}
                                                    %)
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-3">
                                    상품 타입별
                                </h5>
                                <div className="space-y-2">
                                    {prizeStats.typeDistribution
                                        .filter((t) => t.count > 0)
                                        .map((type) => {
                                            const IconComponent = type.icon;
                                            return (
                                                <div
                                                    key={type.value}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <IconComponent
                                                            className={
                                                                type.color
                                                            }
                                                            size={14}
                                                        />
                                                        <span className="text-gray-300">
                                                            {type.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-400">
                                                        {type.count}개
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                            <FaLightbulb
                                className="text-blue-400 mr-2"
                                size={16}
                            />
                            <span className="text-blue-400 font-medium">
                                상품 설정 가이드
                            </span>
                        </div>
                        <div className="space-y-2 text-sm text-blue-300">
                            <p>• 드래그앤드롭으로 상품 순서 변경</p>
                            <p>• 희귀도가 높을수록 적은 티켓 권장</p>
                            <p>• 총 티켓 수는 참가 제한과 비례</p>
                            <p>• 에셋/NFT 선택으로 실제 상품 연결</p>
                        </div>
                    </div>

                    {prizeStats.totalTickets > 0 && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <FaDice
                                    className="mr-3 text-green-400"
                                    size={16}
                                />
                                확률 계산기
                            </h4>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">
                                        아무 상품 당첨:
                                    </span>
                                    <span className="text-green-400 font-medium">
                                        {(
                                            (prizeStats.totalTickets /
                                                Math.max(
                                                    data.settings
                                                        ?.participationLimit ||
                                                        1000,
                                                    1
                                                )) *
                                            100
                                        ).toFixed(1)}
                                        %
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">
                                        1인당 평균 시도:
                                    </span>
                                    <span className="text-blue-400 font-medium">
                                        {(
                                            (data.settings
                                                ?.participationLimit || 1000) /
                                            prizeStats.totalTickets
                                        ).toFixed(1)}
                                        회
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">
                                        예상 당첨자:
                                    </span>
                                    <span className="text-purple-400 font-medium">
                                        {Math.min(
                                            prizeStats.totalTickets,
                                            data.settings?.participationLimit ||
                                                1000
                                        )}
                                        명
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 실시간 분석 결과 */}
                    {showAnalysis && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white flex items-center">
                                    <FaChartPie
                                        className="mr-3 text-blue-400"
                                        size={16}
                                    />
                                    실시간 분석
                                </h4>
                                {isAnalyzing && (
                                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                        분석 중...
                                    </div>
                                )}
                            </div>

                            {simulationState.result ? (
                                <div className="space-y-4">
                                    {/* 주요 지표 */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gray-750 rounded-lg p-3">
                                            <div className="text-gray-400 mb-1">
                                                공정성 지수
                                            </div>
                                            <div
                                                className={`font-bold ${
                                                    simulationState.result
                                                        .finalStats
                                                        .fairnessIndex > 0.7
                                                        ? "text-green-400"
                                                        : simulationState.result
                                                              .finalStats
                                                              .fairnessIndex >
                                                          0.5
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {(
                                                    simulationState.result
                                                        .finalStats
                                                        .fairnessIndex * 100
                                                ).toFixed(1)}
                                                %
                                            </div>
                                        </div>
                                        <div className="bg-gray-750 rounded-lg p-3">
                                            <div className="text-gray-400 mb-1">
                                                평균 ROI
                                            </div>
                                            <div
                                                className={`font-bold ${
                                                    simulationState.result
                                                        .finalStats.mean > 0
                                                        ? "text-green-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {simulationState.result.finalStats.mean.toFixed(
                                                    2
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-750 rounded-lg p-3">
                                            <div className="text-gray-400 mb-1">
                                                샤프 비율
                                            </div>
                                            <div
                                                className={`font-bold ${
                                                    simulationState.result
                                                        .finalStats
                                                        .sharpeRatio > 0.5
                                                        ? "text-green-400"
                                                        : simulationState.result
                                                              .finalStats
                                                              .sharpeRatio > 0.2
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {simulationState.result.finalStats.sharpeRatio.toFixed(
                                                    3
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-750 rounded-lg p-3">
                                            <div className="text-gray-400 mb-1">
                                                당첨률
                                            </div>
                                            <div className="text-blue-400 font-bold">
                                                {simulationState.result.winRate.toFixed(
                                                    1
                                                )}
                                                %
                                            </div>
                                        </div>
                                    </div>

                                    {/* 인사이트 및 제안 */}
                                    {analysisInsights.length > 0 && (
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-gray-300">
                                                분석 결과 및 제안
                                            </h5>
                                            {analysisInsights.map(
                                                (insight, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-3 rounded-lg border text-sm ${
                                                            insight.type ===
                                                            "error"
                                                                ? "bg-red-900/30 border-red-700"
                                                                : insight.type ===
                                                                  "warning"
                                                                ? "bg-yellow-900/30 border-yellow-700"
                                                                : insight.type ===
                                                                  "success"
                                                                ? "bg-green-900/30 border-green-700"
                                                                : "bg-blue-900/30 border-blue-700"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`font-medium mb-1 ${
                                                                insight.type ===
                                                                "error"
                                                                    ? "text-red-400"
                                                                    : insight.type ===
                                                                      "warning"
                                                                    ? "text-yellow-400"
                                                                    : insight.type ===
                                                                      "success"
                                                                    ? "text-green-400"
                                                                    : "text-blue-400"
                                                            }`}
                                                        >
                                                            {insight.title}
                                                        </div>
                                                        <div
                                                            className={
                                                                insight.type ===
                                                                "error"
                                                                    ? "text-red-300"
                                                                    : insight.type ===
                                                                      "warning"
                                                                    ? "text-yellow-300"
                                                                    : insight.type ===
                                                                      "success"
                                                                    ? "text-green-300"
                                                                    : "text-blue-300"
                                                            }
                                                        >
                                                            {insight.message}
                                                        </div>
                                                        <div className="text-gray-400 text-xs mt-1">
                                                            💡{" "}
                                                            {insight.suggestion}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* 최적화 제안 */}
                                    {simulationState.result
                                        .optimizationSuggestions.length > 0 && (
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-gray-300">
                                                AI 최적화 제안
                                            </h5>
                                            {simulationState.result.optimizationSuggestions
                                                .slice(0, 2)
                                                .map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-3 rounded-lg border text-sm ${
                                                            suggestion.priority ===
                                                            "high"
                                                                ? "bg-purple-900/30 border-purple-700"
                                                                : "bg-gray-750 border-gray-600"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`font-medium mb-1 ${
                                                                suggestion.priority ===
                                                                "high"
                                                                    ? "text-purple-400"
                                                                    : "text-gray-300"
                                                            }`}
                                                        >
                                                            우선순위:{" "}
                                                            {suggestion.priority ===
                                                            "high"
                                                                ? "높음"
                                                                : suggestion.priority ===
                                                                  "medium"
                                                                ? "보통"
                                                                : "낮음"}
                                                        </div>
                                                        <div className="text-gray-300 mb-2">
                                                            {
                                                                suggestion.description
                                                            }
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            예상 개선:{" "}
                                                            {Object.entries(
                                                                suggestion.expectedImpact
                                                            )
                                                                .filter(
                                                                    ([
                                                                        _,
                                                                        value,
                                                                    ]) =>
                                                                        value !==
                                                                        0
                                                                )
                                                                .map(
                                                                    ([
                                                                        key,
                                                                        value,
                                                                    ]) =>
                                                                        `${key} ${
                                                                            value >
                                                                            0
                                                                                ? "+"
                                                                                : ""
                                                                        }${value}%`
                                                                )
                                                                .join(", ")}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    {isAnalyzing ? (
                                        <div className="text-blue-400">
                                            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-sm">
                                                분석 중...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            <FaChartPie
                                                className="mx-auto mb-2"
                                                size={24}
                                            />
                                            <p className="text-sm mb-2">
                                                상품과 참가비 설정을 완료하면
                                                자동으로 분석이 시작됩니다.
                                            </p>
                                            {(() => {
                                                const prizes = Array.isArray(
                                                    data.prizes
                                                )
                                                    ? data.prizes
                                                    : [];
                                                const entryFee = parseFloat(
                                                    data.fee
                                                        ?.participationFeeAmount ||
                                                        "0"
                                                );
                                                const validPrizes =
                                                    prizes.filter(
                                                        (p) =>
                                                            p.userValue !==
                                                                undefined &&
                                                            p.userValue !==
                                                                null &&
                                                            p.userValue > 0
                                                    );

                                                if (
                                                    prizes.length > 0 &&
                                                    entryFee > 0 &&
                                                    validPrizes.length === 0
                                                ) {
                                                    return (
                                                        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mt-3 text-left">
                                                            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
                                                                <FaExclamationTriangle
                                                                    size={14}
                                                                />
                                                                <span className="font-medium">
                                                                    분석을 위해
                                                                    상품 가치를
                                                                    입력하세요
                                                                </span>
                                                            </div>
                                                            <p className="text-yellow-300 text-xs">
                                                                각 상품의 실제
                                                                가치를 입력해야
                                                                정확한 분석이
                                                                가능합니다.
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                if (prizes.length === 0) {
                                                    return (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            먼저 상품을
                                                            추가해주세요.
                                                        </p>
                                                    );
                                                }

                                                if (entryFee <= 0) {
                                                    return (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            참가비를
                                                            설정해주세요.
                                                        </p>
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
