"use client";

import { useMemo } from "react";
import {
    FaBrain,
    FaExclamationTriangle,
    FaCheckCircle,
    FaInfoCircle,
    FaLightbulb,
    FaTrophy,
    FaBalanceScale,
    FaShieldAlt,
} from "react-icons/fa";
import { MdTrendingUp, MdInsights, MdSpeed } from "react-icons/md";
import { TbMathFunction, TbBrain } from "react-icons/tb";

interface AdvancedStats {
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdown: number;
    valueAtRisk95: number;
    conditionalVaR95: number;
    bayesianConfidenceInterval: [number, number];
    posteriorMean: number;
    credibleInterval95: [number, number];
    tailRisk: number;
    expectedShortfall: number;
    riskParityScore: number;
    fairnessIndex: number;
    giniCoefficient: number;
    entropyScore: number;
    kellyBetSize: number;
    optimalEntryFee: number;
    recommendedPrizeAdjustments: Array<{
        prizeId: string;
        currentQuantity: number;
        recommendedQuantity: number;
        reason: string;
        impact: number;
    }>;
    participationPrediction: {
        expectedParticipants: number;
        confidenceInterval: [number, number];
        factorsInfluence: Record<string, number>;
    };
}

interface OptimizationSuggestion {
    type:
        | "entry_fee"
        | "prize_quantity"
        | "prize_value"
        | "new_prize"
        | "remove_prize";
    priority: "high" | "medium" | "low";
    description: string;
    expectedImpact: {
        roiChange: number;
        winRateChange: number;
        fairnessChange: number;
        participationChange: number;
    };
    implementation: {
        prizeId?: string;
        newValue?: number;
        newQuantity?: number;
        newEntryFee?: number;
    };
    confidence: number;
}

interface SimulationResult {
    totalRuns: number;
    prizeWins: Record<string, number>;
    totalValue: number;
    totalCost: number;
    roi: number;
    winRate: number;
    distribution: Record<string, number>;
    profitLossHistory: number[];
    cumulativeReturns: number[];
    runningStats: AdvancedStats[];
    finalStats: AdvancedStats;
    optimizationSuggestions: OptimizationSuggestion[];
}

interface Props {
    result: SimulationResult;
    assetSymbol?: string;
    theoreticalROI: number;
}

export default function SmartInsightsDashboard({
    result,
    assetSymbol = "$",
    theoreticalROI,
}: Props) {
    const { finalStats, optimizationSuggestions } = result;

    // 스마트 점수 계산
    const smartScores = useMemo(() => {
        const profitabilityScore = Math.max(
            0,
            Math.min(100, 50 + finalStats.mean * 2)
        );
        const fairnessScore = finalStats.fairnessIndex * 100;
        const stabilityScore = Math.max(0, 100 - finalStats.stdDev * 2);
        const riskScore = Math.max(
            0,
            100 - Math.abs(finalStats.maxDrawdown) / 10
        );
        const overallScore =
            (profitabilityScore + fairnessScore + stabilityScore + riskScore) /
            4;

        return {
            overall: overallScore,
            profitability: profitabilityScore,
            fairness: fairnessScore,
            stability: stabilityScore,
            risk: riskScore,
        };
    }, [finalStats]);

    // 리스크 등급 판정
    const riskAssessment = useMemo(() => {
        const { sharpeRatio, maxDrawdown, tailRisk } = finalStats;

        if (sharpeRatio > 1 && Math.abs(maxDrawdown) < 100 && tailRisk < 0.1) {
            return {
                level: "low" as const,
                color: "text-green-400",
                bgColor: "bg-green-900/30",
                borderColor: "border-green-700",
                icon: FaShieldAlt,
                description: "낮은 위험도",
            };
        } else if (
            sharpeRatio > 0.5 &&
            Math.abs(maxDrawdown) < 300 &&
            tailRisk < 0.2
        ) {
            return {
                level: "medium" as const,
                color: "text-yellow-400",
                bgColor: "bg-yellow-900/30",
                borderColor: "border-yellow-700",
                icon: FaInfoCircle,
                description: "보통 위험도",
            };
        } else {
            return {
                level: "high" as const,
                color: "text-red-400",
                bgColor: "bg-red-900/30",
                borderColor: "border-red-700",
                icon: FaExclamationTriangle,
                description: "높은 위험도",
            };
        }
    }, [finalStats]);

    // AI 기반 인사이트 생성
    const aiInsights = useMemo(() => {
        const insights = [];

        // 수익성 분석
        if (result.roi > theoreticalROI + 2) {
            insights.push({
                type: "positive",
                icon: MdTrendingUp,
                title: "예상보다 우수한 성과",
                description: `실제 ROI(${result.roi.toFixed(
                    2
                )}%)가 이론값(${theoreticalROI.toFixed(2)}%)을 상회합니다.`,
                action: "현재 설정을 유지하되, 더 많은 참여자 유도를 고려하세요.",
            });
        } else if (result.roi < theoreticalROI - 5) {
            insights.push({
                type: "warning",
                icon: FaExclamationTriangle,
                title: "이론값 대비 저조한 성과",
                description: `실제 ROI가 이론값보다 ${Math.abs(
                    result.roi - theoreticalROI
                ).toFixed(2)}%p 낮습니다.`,
                action: "상품 구성 또는 참가비 재검토가 필요합니다.",
            });
        }

        // 공정성 분석
        if (finalStats.fairnessIndex > 0.8) {
            insights.push({
                type: "positive",
                icon: FaBalanceScale,
                title: "높은 공정성 점수",
                description: `공정성 지수 ${(
                    finalStats.fairnessIndex * 100
                ).toFixed(1)}%로 매우 우수합니다.`,
                action: "현재의 균등한 확률 분배를 유지하세요.",
            });
        } else if (finalStats.fairnessIndex < 0.6) {
            insights.push({
                type: "warning",
                icon: FaBalanceScale,
                title: "공정성 개선 필요",
                description: `공정성 지수 ${(
                    finalStats.fairnessIndex * 100
                ).toFixed(1)}%로 개선이 필요합니다.`,
                action: "상품 당첨 확률을 더 균등하게 분배하세요.",
            });
        }

        // 리스크 분석
        if (finalStats.sharpeRatio > 1) {
            insights.push({
                type: "positive",
                icon: FaTrophy,
                title: "우수한 리스크 조정 수익률",
                description: `샤프 비율 ${finalStats.sharpeRatio.toFixed(
                    3
                )}으로 우수한 위험 대비 수익률입니다.`,
                action: "현재 리스크 관리 전략을 유지하세요.",
            });
        } else if (finalStats.sharpeRatio < 0.5) {
            insights.push({
                type: "warning",
                icon: FaExclamationTriangle,
                title: "리스크 대비 낮은 수익률",
                description: `샤프 비율 ${finalStats.sharpeRatio.toFixed(
                    3
                )}으로 리스크 관리가 필요합니다.`,
                action: "변동성을 줄이거나 기대 수익을 높이는 방안을 검토하세요.",
            });
        }

        // 베이지안 분석
        const bayesianRange =
            finalStats.credibleInterval95[1] - finalStats.credibleInterval95[0];
        if (bayesianRange < 50) {
            insights.push({
                type: "info",
                icon: TbMathFunction,
                title: "높은 예측 정확도",
                description: `베이지안 신뢰구간이 ${bayesianRange.toFixed(
                    1
                )} ${assetSymbol}로 예측이 안정적입니다.`,
                action: "통계적으로 신뢰할 수 있는 설정입니다.",
            });
        }

        // 참여 예측
        const { expectedParticipants } = finalStats.participationPrediction;
        if (expectedParticipants > 500) {
            insights.push({
                type: "positive",
                icon: MdSpeed,
                title: "높은 참여 예상",
                description: `예상 참여자 ${expectedParticipants.toFixed(
                    0
                )}명으로 높은 관심도가 예상됩니다.`,
                action: "서버 용량과 상품 재고를 충분히 준비하세요.",
            });
        } else if (expectedParticipants < 100) {
            insights.push({
                type: "warning",
                icon: FaInfoCircle,
                title: "낮은 참여 예상",
                description: `예상 참여자 ${expectedParticipants.toFixed(
                    0
                )}명으로 참여 유도가 필요합니다.`,
                action: "참가비 조정이나 마케팅 강화를 고려하세요.",
            });
        }

        return insights.slice(0, 6); // 최대 6개 인사이트
    }, [result, finalStats, theoreticalROI, assetSymbol]);

    // 스마트 액션 아이템 생성
    const actionItems = useMemo(() => {
        const actions = [];

        // 크리티컬 액션
        if (smartScores.overall < 40) {
            actions.push({
                priority: "critical" as const,
                title: "래플 구조 전면 재검토",
                description: "현재 설정으로는 성공적인 래플 운영이 어렵습니다.",
                steps: [
                    "참가비와 상품 가치 비율 재계산",
                    "상품 구성 다변화 검토",
                    "목표 참여자 수 재설정",
                ],
            });
        }

        // 최적화 제안사항 기반 액션
        optimizationSuggestions.forEach((suggestion, index) => {
            if (index < 3) {
                // 상위 3개만 표시
                actions.push({
                    priority: suggestion.priority as "high" | "medium" | "low",
                    title: suggestion.description,
                    description: `예상 효과: ROI ${
                        suggestion.expectedImpact.roiChange > 0 ? "+" : ""
                    }${suggestion.expectedImpact.roiChange}%, 참여율 ${
                        suggestion.expectedImpact.participationChange > 0
                            ? "+"
                            : ""
                    }${suggestion.expectedImpact.participationChange}%`,
                    steps: Object.entries(suggestion.implementation)
                        .filter(([_, value]) => value !== undefined)
                        .map(([key, value]) => `${key}: ${value}`),
                });
            }
        });

        return actions;
    }, [smartScores, optimizationSuggestions]);

    const ScoreCircle = ({
        score,
        label,
        color,
    }: {
        score: number;
        label: string;
        color: string;
    }) => (
        <div className="flex flex-col items-center p-4">
            <div className="relative w-16 h-16 mb-2">
                <svg
                    className="w-16 h-16 transform -rotate-90"
                    viewBox="0 0 64 64"
                >
                    <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-700"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${score * 1.75} 175`}
                        className={color}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                        {score.toFixed(0)}
                    </span>
                </div>
            </div>
            <span className="text-xs text-gray-300 text-center">{label}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* AI 종합 분석 헤더 */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-600/30 rounded-xl">
                        <FaBrain className="text-2xl text-purple-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            AI 기반 스마트 분석
                        </h3>
                        <p className="text-purple-300">
                            최첨단 알고리즘으로 분석한 래플 최적화 인사이트
                        </p>
                    </div>
                </div>

                {/* 종합 점수 */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <ScoreCircle
                        score={smartScores.overall}
                        label="종합 점수"
                        color="text-purple-400"
                    />
                    <ScoreCircle
                        score={smartScores.profitability}
                        label="수익성"
                        color="text-green-400"
                    />
                    <ScoreCircle
                        score={smartScores.fairness}
                        label="공정성"
                        color="text-blue-400"
                    />
                    <ScoreCircle
                        score={smartScores.stability}
                        label="안정성"
                        color="text-yellow-400"
                    />
                    <ScoreCircle
                        score={smartScores.risk}
                        label="리스크 관리"
                        color="text-red-400"
                    />
                </div>
            </div>

            {/* 리스크 평가 */}
            <div
                className={`${riskAssessment.bgColor} rounded-xl p-6 border ${riskAssessment.borderColor}`}
            >
                <div className="flex items-center gap-3 mb-4">
                    <riskAssessment.icon
                        className={`text-2xl ${riskAssessment.color}`}
                    />
                    <div>
                        <h4 className="text-lg font-semibold text-white">
                            리스크 평가
                        </h4>
                        <p className={`${riskAssessment.color} font-medium`}>
                            {riskAssessment.description}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">샤프 비율</span>
                        <div
                            className={`text-lg font-bold ${riskAssessment.color}`}
                        >
                            {finalStats.sharpeRatio.toFixed(3)}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-400">최대 낙폭</span>
                        <div
                            className={`text-lg font-bold ${riskAssessment.color}`}
                        >
                            {Math.abs(finalStats.maxDrawdown).toFixed(1)}{" "}
                            {assetSymbol}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-400">VaR (95%)</span>
                        <div
                            className={`text-lg font-bold ${riskAssessment.color}`}
                        >
                            {Math.abs(finalStats.valueAtRisk95).toFixed(1)}{" "}
                            {assetSymbol}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-400">꼬리 리스크</span>
                        <div
                            className={`text-lg font-bold ${riskAssessment.color}`}
                        >
                            {(finalStats.tailRisk * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* AI 인사이트 */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <TbBrain className="text-2xl text-cyan-400" />
                    <h4 className="text-lg font-semibold text-white">
                        AI 인사이트
                    </h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {aiInsights.map((insight, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                                insight.type === "positive"
                                    ? "bg-green-900/30 border-green-700"
                                    : insight.type === "warning"
                                    ? "bg-yellow-900/30 border-yellow-700"
                                    : "bg-blue-900/30 border-blue-700"
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <insight.icon
                                    className={`text-lg ${
                                        insight.type === "positive"
                                            ? "text-green-400"
                                            : insight.type === "warning"
                                            ? "text-yellow-400"
                                            : "text-blue-400"
                                    }`}
                                />
                                <h5 className="font-semibold text-white">
                                    {insight.title}
                                </h5>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">
                                {insight.description}
                            </p>
                            <p className="text-xs text-gray-400">
                                {insight.action}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 스마트 액션 아이템 */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <FaLightbulb className="text-2xl text-yellow-400" />
                    <h4 className="text-lg font-semibold text-white">
                        추천 액션 아이템
                    </h4>
                </div>

                <div className="space-y-4">
                    {actionItems.map((action, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                                action.priority === "critical"
                                    ? "bg-red-900/30 border-red-700"
                                    : action.priority === "high"
                                    ? "bg-orange-900/30 border-orange-700"
                                    : action.priority === "medium"
                                    ? "bg-yellow-900/30 border-yellow-700"
                                    : "bg-blue-900/30 border-blue-700"
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        action.priority === "critical"
                                            ? "bg-red-600 text-white"
                                            : action.priority === "high"
                                            ? "bg-orange-600 text-white"
                                            : action.priority === "medium"
                                            ? "bg-yellow-600 text-black"
                                            : "bg-blue-600 text-white"
                                    }`}
                                >
                                    {action.priority.toUpperCase()}
                                </span>
                                <h5 className="font-semibold text-white">
                                    {action.title}
                                </h5>
                            </div>
                            <p className="text-sm text-gray-300 mb-3">
                                {action.description}
                            </p>
                            {action.steps && action.steps.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 font-medium">
                                        구체적 실행 방안:
                                    </p>
                                    {action.steps.map((step, stepIndex) => (
                                        <div
                                            key={stepIndex}
                                            className="flex items-center gap-2 text-xs text-gray-300"
                                        >
                                            <FaCheckCircle className="text-green-400 flex-shrink-0" />
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 고급 통계 요약 */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <MdInsights className="text-2xl text-purple-400" />
                    <h4 className="text-lg font-semibold text-white">
                        고급 통계 요약
                    </h4>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                        <div className="text-gray-400">베이지안 평균</div>
                        <div className="text-white font-semibold">
                            {finalStats.posteriorMean.toFixed(4)} {assetSymbol}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-gray-400">비대칭도</div>
                        <div className="text-white font-semibold">
                            {finalStats.skewness.toFixed(3)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-gray-400">첨도</div>
                        <div className="text-white font-semibold">
                            {finalStats.kurtosis.toFixed(3)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-gray-400">지니 계수</div>
                        <div className="text-white font-semibold">
                            {finalStats.giniCoefficient.toFixed(3)}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="text-sm text-gray-400 mb-2">
                        95% 베이지안 신뢰구간
                    </div>
                    <div className="text-white font-semibold">
                        {finalStats.credibleInterval95[0].toFixed(4)} ~{" "}
                        {finalStats.credibleInterval95[1].toFixed(4)}{" "}
                        {assetSymbol}
                    </div>
                </div>
            </div>
        </div>
    );
}
