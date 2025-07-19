"use client";

import { useState, useCallback, useMemo } from "react";
import {
    FaGift,
    FaPlus,
    FaTrash,
    FaEdit,
    FaMagic,
    FaExclamationTriangle,
    FaCheckCircle,
    FaInfoCircle,
    FaBullseye,
} from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";

interface Prize {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    order: number;
    quantity: number;
    prizeType: number;
    userValue?: number;
}

interface PrizeRecommendation {
    prizeId: string;
    currentQuantity: number;
    recommendedQuantity: number;
    reason: string;
    impact: number;
}

interface Props {
    prizes: Prize[];
    onPrizesChange: (prizes: Prize[]) => void;
    entryFee: number;
    isRunning: boolean;
    recommendations?: PrizeRecommendation[];
    assetSymbol?: string;
}

const PRIZE_TEMPLATES = [
    {
        title: "1등 상품",
        description: "최고 가치 상품",
        quantity: 1,
        suggestedValueMultiplier: 50, // 참가비의 50배
        color: "text-yellow-400",
        icon: "🏆",
    },
    {
        title: "2등 상품",
        description: "고가치 상품",
        quantity: 5,
        suggestedValueMultiplier: 20,
        color: "text-gray-300",
        icon: "🥈",
    },
    {
        title: "3등 상품",
        description: "중간 가치 상품",
        quantity: 20,
        suggestedValueMultiplier: 10,
        color: "text-amber-600",
        icon: "🥉",
    },
    {
        title: "참가상",
        description: "기본 당첨 상품",
        quantity: 100,
        suggestedValueMultiplier: 2,
        color: "text-blue-400",
        icon: "🎁",
    },
];

export default function PrizeManager({
    prizes,
    onPrizesChange,
    entryFee,
    isRunning,
    recommendations = [],
    assetSymbol = "$",
}: Props) {
    const [editingPrize, setEditingPrize] = useState<string | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    // 통계 계산
    const statistics = useMemo(() => {
        const totalTickets = prizes.reduce(
            (sum, prize) => sum + prize.quantity,
            0
        );
        const totalValue = prizes.reduce(
            (sum, prize) => sum + (prize.userValue || 0) * prize.quantity,
            0
        );
        const expectedValue = prizes.reduce((sum, prize) => {
            const probability =
                totalTickets > 0 ? prize.quantity / totalTickets : 0;
            return sum + probability * (prize.userValue || 0);
        }, 0);
        const theoreticalROI =
            entryFee > 0 ? ((expectedValue - entryFee) / entryFee) * 100 : 0;

        // 공정성 점수 계산 (엔트로피 기반)
        const probabilities = prizes.map((p) =>
            totalTickets > 0 ? p.quantity / totalTickets : 0
        );
        const entropy = -probabilities.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log2(p) : 0);
        }, 0);
        const maxEntropy = Math.log2(prizes.length || 1);
        const fairnessScore = maxEntropy > 0 ? entropy / maxEntropy : 1;

        // 가치 분포 분석
        const valueDistribution = prizes.map((prize) => ({
            title: prize.title,
            probability:
                totalTickets > 0 ? (prize.quantity / totalTickets) * 100 : 0,
            value: prize.userValue || 0,
            valueRatio: entryFee > 0 ? (prize.userValue || 0) / entryFee : 0,
            expectedPayout:
                totalTickets > 0
                    ? (prize.quantity / totalTickets) * (prize.userValue || 0)
                    : 0,
        }));

        return {
            totalTickets,
            totalValue,
            expectedValue,
            theoreticalROI,
            fairnessScore,
            valueDistribution,
        };
    }, [prizes, entryFee]);

    // 상품 추가
    const addPrize = useCallback(() => {
        const newPrize: Prize = {
            id: `prize_${Date.now()}`,
            title: `상품 ${prizes.length + 1}`,
            description: "",
            imageUrl: "",
            order: prizes.length,
            quantity: 100,
            prizeType: 1,
            userValue: entryFee * 2, // 기본값: 참가비의 2배
        };
        onPrizesChange([...prizes, newPrize]);
        setEditingPrize(newPrize.id);
    }, [prizes, onPrizesChange, entryFee]);

    // 템플릿으로 상품 추가
    const addFromTemplate = useCallback(
        (template: (typeof PRIZE_TEMPLATES)[0]) => {
            const newPrize: Prize = {
                id: `prize_${Date.now()}`,
                title: template.title,
                description: template.description,
                imageUrl: "",
                order: prizes.length,
                quantity: template.quantity,
                prizeType: 1,
                userValue: entryFee * template.suggestedValueMultiplier,
            };
            onPrizesChange([...prizes, newPrize]);
            setShowTemplates(false);
        },
        [prizes, onPrizesChange, entryFee]
    );

    // 상품 업데이트
    const updatePrize = useCallback(
        (id: string, updates: Partial<Prize>) => {
            onPrizesChange(
                prizes.map((prize) =>
                    prize.id === id ? { ...prize, ...updates } : prize
                )
            );
        },
        [prizes, onPrizesChange]
    );

    // 상품 삭제
    const removePrize = useCallback(
        (id: string) => {
            onPrizesChange(prizes.filter((prize) => prize.id !== id));
            if (editingPrize === id) {
                setEditingPrize(null);
            }
        },
        [prizes, onPrizesChange, editingPrize]
    );

    // 추천사항 적용
    const applyRecommendation = useCallback(
        (rec: PrizeRecommendation) => {
            updatePrize(rec.prizeId, { quantity: rec.recommendedQuantity });
        },
        [updatePrize]
    );

    // 자동 최적화
    const autoOptimize = useCallback(() => {
        const optimizedPrizes = prizes.map((prize) => {
            const valueRatio = (prize.userValue || 0) / entryFee;
            let newQuantity = prize.quantity;

            // 고가치 상품은 희소성 증가
            if (valueRatio > 10) {
                newQuantity = Math.max(1, Math.floor(prize.quantity * 0.7));
            }
            // 저가치 상품은 당첨률 증가
            else if (valueRatio < 2) {
                newQuantity = Math.floor(prize.quantity * 1.3);
            }
            // 중간 가치는 현상 유지하되 약간 조정
            else {
                newQuantity = Math.floor(prize.quantity * 0.9);
            }

            return { ...prize, quantity: newQuantity };
        });

        onPrizesChange(optimizedPrizes);
    }, [prizes, entryFee, onPrizesChange]);

    const getHealthStatus = (prize: Prize) => {
        const valueRatio = (prize.userValue || 0) / entryFee;
        const probability =
            statistics.totalTickets > 0
                ? (prize.quantity / statistics.totalTickets) * 100
                : 0;

        if (valueRatio > 20 && probability > 10) {
            return {
                status: "warning",
                message: "고가치 상품의 당첨률이 너무 높음",
                color: "text-yellow-400",
                bgColor: "bg-yellow-900/30",
                icon: FaExclamationTriangle,
            };
        } else if (valueRatio < 1) {
            return {
                status: "error",
                message: "참가비보다 낮은 가치",
                color: "text-red-400",
                bgColor: "bg-red-900/30",
                icon: FaExclamationTriangle,
            };
        } else if (
            valueRatio >= 2 &&
            valueRatio <= 10 &&
            probability >= 5 &&
            probability <= 30
        ) {
            return {
                status: "good",
                message: "최적화된 설정",
                color: "text-green-400",
                bgColor: "bg-green-900/30",
                icon: FaCheckCircle,
            };
        } else {
            return {
                status: "info",
                message: "적절한 설정",
                color: "text-blue-400",
                bgColor: "bg-blue-900/30",
                icon: FaInfoCircle,
            };
        }
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-900/30 rounded-xl">
                        <FaGift className="text-2xl text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            상품 관리
                        </h3>
                        <p className="text-green-300 text-sm">
                            {prizes.length}개 상품 • 총{" "}
                            {statistics.totalTickets.toLocaleString()}장 티켓
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTemplates(true)}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <MdAutoAwesome />
                        템플릿
                    </button>
                    <button
                        onClick={autoOptimize}
                        disabled={isRunning || prizes.length === 0}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <FaMagic />
                        자동 최적화
                    </button>
                    <button
                        onClick={addPrize}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <FaPlus />
                        상품 추가
                    </button>
                </div>
            </div>

            {/* 통계 요약 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400">기대값</div>
                    <div className="text-xl font-bold text-white">
                        {statistics.expectedValue.toFixed(4)} {assetSymbol}
                    </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400">이론적 ROI</div>
                    <div
                        className={`text-xl font-bold ${
                            statistics.theoreticalROI >= 0
                                ? "text-green-400"
                                : "text-red-400"
                        }`}
                    >
                        {statistics.theoreticalROI.toFixed(2)}%
                    </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400">공정성 점수</div>
                    <div
                        className={`text-xl font-bold ${
                            statistics.fairnessScore > 0.8
                                ? "text-green-400"
                                : statistics.fairnessScore > 0.6
                                ? "text-yellow-400"
                                : "text-red-400"
                        }`}
                    >
                        {(statistics.fairnessScore * 100).toFixed(1)}
                    </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400">총 상품 가치</div>
                    <div className="text-xl font-bold text-white">
                        {statistics.totalValue.toFixed(2)} {assetSymbol}
                    </div>
                </div>
            </div>

            {/* 추천사항 */}
            {recommendations.length > 0 && (
                <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <FaBullseye className="text-purple-400" />
                        <h4 className="text-md font-semibold text-white">
                            AI 최적화 추천
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {recommendations.map((rec, index) => {
                            const prize = prizes.find(
                                (p) => p.id === rec.prizeId
                            );
                            if (!prize) return null;

                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-purple-800/30 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-white">
                                            {prize.title}
                                        </div>
                                        <div className="text-sm text-purple-300">
                                            {rec.reason}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {rec.currentQuantity} →{" "}
                                            {rec.recommendedQuantity}(
                                            {rec.impact > 0 ? "+" : ""}
                                            {(rec.impact * 100).toFixed(1)}%
                                            영향)
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => applyRecommendation(rec)}
                                        disabled={isRunning}
                                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                                    >
                                        적용
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 상품 목록 */}
            <div className="space-y-4">
                {prizes.map((prize, index) => {
                    const health = getHealthStatus(prize);
                    const probability =
                        statistics.totalTickets > 0
                            ? (prize.quantity / statistics.totalTickets) * 100
                            : 0;
                    const valueRatio = (prize.userValue || 0) / entryFee;
                    const isEditing = editingPrize === prize.id;

                    return (
                        <div
                            key={prize.id}
                            className={`bg-gray-700/50 rounded-lg border border-gray-600 ${
                                isEditing ? "ring-2 ring-blue-500" : ""
                            }`}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {index === 0
                                                ? "🏆"
                                                : index === 1
                                                ? "🥈"
                                                : index === 2
                                                ? "🥉"
                                                : "🎁"}
                                        </div>
                                        <div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={prize.title}
                                                    onChange={(e) =>
                                                        updatePrize(prize.id, {
                                                            title: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="text-lg font-semibold bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
                                                    autoFocus
                                                />
                                            ) : (
                                                <h4 className="text-lg font-semibold text-white">
                                                    {prize.title}
                                                </h4>
                                            )}
                                            <div className="flex items-center gap-2 text-sm">
                                                <health.icon
                                                    className={`${health.color}`}
                                                />
                                                <span className={health.color}>
                                                    {health.message}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setEditingPrize(
                                                    isEditing ? null : prize.id
                                                )
                                            }
                                            disabled={isRunning}
                                            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() =>
                                                removePrize(prize.id)
                                            }
                                            disabled={isRunning}
                                            className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            티켓 수량
                                        </label>
                                        <input
                                            type="number"
                                            value={prize.quantity}
                                            onChange={(e) =>
                                                updatePrize(prize.id, {
                                                    quantity:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                            disabled={isRunning}
                                            min="0"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            확률: {probability.toFixed(2)}%
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            상품 가치 ({assetSymbol})
                                        </label>
                                        <input
                                            type="number"
                                            value={prize.userValue || 0}
                                            onChange={(e) =>
                                                updatePrize(prize.id, {
                                                    userValue:
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                            disabled={isRunning}
                                            min="0"
                                            step="0.01"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            비율: {valueRatio.toFixed(1)}x
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">
                                            설명
                                        </label>
                                        <input
                                            type="text"
                                            value={prize.description}
                                            onChange={(e) =>
                                                updatePrize(prize.id, {
                                                    description: e.target.value,
                                                })
                                            }
                                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                            disabled={isRunning}
                                            placeholder="상품에 대한 설명"
                                        />
                                        <div className="text-xs text-gray-400 mt-1">
                                            기대 지급액:{" "}
                                            {(
                                                (prize.quantity /
                                                    statistics.totalTickets) *
                                                (prize.userValue || 0)
                                            ).toFixed(4)}{" "}
                                            {assetSymbol}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {prizes.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <FaGift className="text-4xl mx-auto mb-4 opacity-50" />
                        <p className="mb-4">등록된 상품이 없습니다</p>
                        <button
                            onClick={() => setShowTemplates(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                            템플릿으로 시작하기
                        </button>
                    </div>
                )}
            </div>

            {/* 템플릿 모달 */}
            {showTemplates && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                상품 템플릿 선택
                            </h3>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {PRIZE_TEMPLATES.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() => addFromTemplate(template)}
                                    className="p-4 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-gray-500 rounded-lg transition-all text-left"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">
                                            {template.icon}
                                        </span>
                                        <div>
                                            <div className="font-semibold text-white">
                                                {template.title}
                                            </div>
                                            <div className="text-sm text-gray-300">
                                                {template.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        <div>수량: {template.quantity}장</div>
                                        <div>
                                            가치:{" "}
                                            {(
                                                entryFee *
                                                template.suggestedValueMultiplier
                                            ).toFixed(2)}{" "}
                                            {assetSymbol}
                                        </div>
                                        <div>
                                            확률:{" "}
                                            {(
                                                (template.quantity /
                                                    (template.quantity + 100)) *
                                                100
                                            ).toFixed(1)}
                                            % (예상)
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={addPrize}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                빈 상품으로 시작
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
