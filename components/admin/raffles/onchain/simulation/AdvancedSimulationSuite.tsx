"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TbMathFunction } from "react-icons/tb";
import { FaBrain } from "react-icons/fa";

// Custom Hook
import { useRaffleSimulation, simulationUtils } from "./useRaffleSimulation";

// Components
import SmartInsightsDashboard from "./SmartInsightsDashboard";
import SimulationSettings from "./SimulationSettings";
import PrizeManager from "./PrizeManager";
import SimulationControls from "./SimulationControls";

interface Prize {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    order: number;
    quantity: number;
    prizeType: number;
    userValue: number;
}

interface SimulationConfig {
    totalRuns: number;
    entryFee: number;
    prizes: Prize[];
    batchSize: number;
    optimizationGoals?: {
        targetROI?: number;
        targetWinRate?: number;
        riskTolerance?: "conservative" | "moderate" | "aggressive";
        fairnessWeight?: number;
        profitabilityWeight?: number;
    };
}

interface InitialRaffleData {
    raffleId: string;
    title: string;
    description: string;
    entryFee: number;
    entryFeeAsset: {
        id: string;
        name: string;
        symbol: string;
        description?: string;
        iconUrl?: string;
    } | null;
    prizes: Array<{
        id: string;
        title: string;
        description: string;
        imageUrl: string;
        order: number;
        quantity: number;
        prizeType: number;
        userValue?: number;
    }>;
    networkName: string;
    contractAddress: string;
}

interface Props {
    initialRaffleData?: InitialRaffleData;
}

export default function AdvancedSimulationSuite({ initialRaffleData }: Props) {
    // 시뮬레이션 Hook
    const [simulationState, simulationControls] = useRaffleSimulation();

    // 설정 상태
    const [config, setConfig] = useState<SimulationConfig>({
        totalRuns: 10000,
        entryFee: 100,
        prizes: [],
        batchSize: 1000,
        optimizationGoals: {
            riskTolerance: "moderate",
            fairnessWeight: 0.6,
            profitabilityWeight: 0.4,
        },
    });

    // UI 상태
    const [activeTab, setActiveTab] = useState<
        "setup" | "analysis" | "insights"
    >("setup");
    const [configHistory, setConfigHistory] = useState<SimulationConfig[]>([]);

    // 초기 래플 데이터 설정
    useEffect(() => {
        if (initialRaffleData) {
            setConfig((prev) => ({
                ...prev,
                entryFee: initialRaffleData.entryFee,
                prizes: initialRaffleData.prizes.map((prize) => ({
                    id: prize.id,
                    title: prize.title,
                    description: prize.description,
                    imageUrl: prize.imageUrl,
                    order: prize.order,
                    quantity: prize.quantity,
                    prizeType: prize.prizeType,
                    userValue: prize.userValue || 0,
                })),
            }));
        }
    }, [initialRaffleData]);

    // 계산된 값들
    const expectedValue = useMemo(
        () => simulationUtils.calculateExpectedValue(config.prizes),
        [config.prizes]
    );

    const theoreticalROI = useMemo(
        () =>
            simulationUtils.calculateTheoreticalROI(
                config.prizes,
                config.entryFee
            ),
        [config.prizes, config.entryFee]
    );

    const fairnessScore = useMemo(
        () => simulationUtils.calculateFairnessScore(config.prizes),
        [config.prizes]
    );

    // 시뮬레이션 실행 가능 여부
    const canRunSimulation = useMemo(() => {
        return (
            config.prizes.length > 0 &&
            config.entryFee > 0 &&
            config.prizes.every((p) => p.quantity > 0 && p.userValue >= 0)
        );
    }, [config]);

    // 설정 변경 핸들러
    const handleConfigChange = useCallback((newConfig: SimulationConfig) => {
        setConfig(newConfig);
    }, []);

    const handlePrizesChange = useCallback((prizes: Prize[]) => {
        setConfig((prev) => ({ ...prev, prizes }));
    }, []);

    // AI 최적화
    const handleAIOptimization = useCallback(async () => {
        const optimizedConfig = { ...config };

        if (config.optimizationGoals?.targetROI) {
            const targetROI = config.optimizationGoals.targetROI / 100;
            const optimalEntryFee = expectedValue / (1 + targetROI);
            optimizedConfig.entryFee = Math.max(1, optimalEntryFee);
        }

        if (
            config.optimizationGoals?.fairnessWeight &&
            config.optimizationGoals.fairnessWeight > 0.7
        ) {
            const avgQuantity =
                config.prizes.reduce((sum, p) => sum + p.quantity, 0) /
                config.prizes.length;
            optimizedConfig.prizes = config.prizes.map((prize) => ({
                ...prize,
                quantity: Math.max(
                    1,
                    Math.floor(avgQuantity * (0.8 + Math.random() * 0.4))
                ),
            }));
        }

        if (config.optimizationGoals?.riskTolerance === "conservative") {
            optimizedConfig.prizes = config.prizes.map((prize) => ({
                ...prize,
                userValue: prize.userValue * 0.9,
            }));
        } else if (config.optimizationGoals?.riskTolerance === "aggressive") {
            optimizedConfig.prizes = config.prizes.map((prize, index) => ({
                ...prize,
                userValue:
                    index === 0 ? prize.userValue * 1.5 : prize.userValue * 0.8,
            }));
        }

        setConfig(optimizedConfig);
    }, [config, expectedValue]);

    // 설정 저장/불러오기
    const handleSaveConfiguration = useCallback(() => {
        const newHistory = [config, ...configHistory.slice(0, 9)];
        setConfigHistory(newHistory);
        localStorage.setItem(
            "raffleSimulationHistory",
            JSON.stringify(newHistory)
        );

        const configData = {
            ...config,
            timestamp: Date.now(),
            raffleId: initialRaffleData?.raffleId,
        };

        const blob = new Blob([JSON.stringify(configData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `raffle-config-${
            initialRaffleData?.raffleId || "custom"
        }-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [config, configHistory, initialRaffleData]);

    const handleLoadConfiguration = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const loadedConfig = JSON.parse(
                            e.target?.result as string
                        );
                        setConfig({
                            totalRuns: loadedConfig.totalRuns || 10000,
                            entryFee: loadedConfig.entryFee || 100,
                            prizes: loadedConfig.prizes || [],
                            batchSize: loadedConfig.batchSize || 1000,
                            optimizationGoals: loadedConfig.optimizationGoals,
                        });
                    } catch (error) {
                        console.error("Failed to load configuration:", error);
                        alert("설정 파일을 불러오는데 실패했습니다.");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, []);

    // 결과 내보내기
    const handleExportResults = useCallback(() => {
        if (!simulationState.result) return;

        const exportData = {
            simulationConfig: config,
            results: simulationState.result,
            metadata: {
                timestamp: Date.now(),
                raffleInfo: initialRaffleData
                    ? {
                          raffleId: initialRaffleData.raffleId,
                          title: initialRaffleData.title,
                          networkName: initialRaffleData.networkName,
                          contractAddress: initialRaffleData.contractAddress,
                      }
                    : null,
                theoreticalMetrics: {
                    expectedValue,
                    theoreticalROI,
                    fairnessScore,
                },
            },
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `simulation-results-${
            initialRaffleData?.raffleId || "custom"
        }-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [
        simulationState.result,
        config,
        initialRaffleData,
        expectedValue,
        theoreticalROI,
        fairnessScore,
    ]);

    // 자동 탭 전환 제거 - 사용자가 명시적으로 탭을 선택할 수 있도록 함

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-[#181c2b] to-[#2a2342] rounded-2xl border border-purple-900/30">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-900/30 rounded-xl">
                        <TbMathFunction className="text-2xl text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {initialRaffleData
                                ? `${initialRaffleData.title} - 고급 분석 스위트`
                                : "래플 고급 분석 스위트"}
                        </h2>
                        <p className="text-purple-300">
                            {initialRaffleData
                                ? `${initialRaffleData.networkName} • 래플 #${initialRaffleData.raffleId} • 최첨단 AI 분석`
                                : "Web Worker 기반 고성능 시뮬레이션 + AI 인사이트"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleAIOptimization}
                        disabled={
                            simulationState.isRunning || !canRunSimulation
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                        <FaBrain />
                        AI 최적화
                    </button>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
                {[
                    { id: "setup", label: "설정 & 상품", icon: "⚙️" },
                    { id: "analysis", label: "분석 결과", icon: "📊" },
                    { id: "insights", label: "AI 인사이트", icon: "🧠" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? "bg-purple-600 text-white shadow-lg"
                                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 탭 내용 */}
            {activeTab === "setup" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <SimulationSettings
                            config={config as any}
                            onConfigChange={handleConfigChange as any}
                            isRunning={simulationState.isRunning}
                            entryFeeAsset={initialRaffleData?.entryFeeAsset}
                            onOptimizeSettings={handleAIOptimization}
                        />

                        <SimulationControls
                            state={simulationState}
                            controls={simulationControls}
                            config={config}
                            canRun={canRunSimulation}
                            theoreticalROI={theoreticalROI}
                            assetSymbol={
                                initialRaffleData?.entryFeeAsset?.symbol
                            }
                            onExportResults={
                                simulationState.result
                                    ? handleExportResults
                                    : undefined
                            }
                            onSaveConfiguration={handleSaveConfiguration}
                            onLoadConfiguration={handleLoadConfiguration}
                        />
                    </div>

                    <div>
                        <PrizeManager
                            prizes={
                                config.prizes.map((p) => ({
                                    ...p,
                                    userValue: p.userValue || 0,
                                })) as any
                            }
                            onPrizesChange={(prizes: any) =>
                                handlePrizesChange(
                                    prizes.map((p: any) => ({
                                        ...p,
                                        userValue: p.userValue || 0,
                                    }))
                                )
                            }
                            entryFee={config.entryFee}
                            isRunning={simulationState.isRunning}
                            recommendations={
                                simulationState.result?.finalStats
                                    ?.recommendedPrizeAdjustments
                            }
                            assetSymbol={
                                initialRaffleData?.entryFeeAsset?.symbol
                            }
                        />
                    </div>
                </div>
            )}

            {activeTab === "analysis" && simulationState.result && (
                <div className="space-y-6">
                    {/* 기본 결과 통계 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <div className="text-sm text-gray-400">
                                실제 ROI
                            </div>
                            <div
                                className={`text-xl font-bold ${
                                    simulationState.result.roi >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                }`}
                            >
                                {simulationState.result.roi.toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <div className="text-sm text-gray-400">당첨률</div>
                            <div className="text-xl font-bold text-white">
                                {simulationState.result.winRate.toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <div className="text-sm text-gray-400">총 수익</div>
                            <div
                                className={`text-xl font-bold ${
                                    simulationState.result.totalValue -
                                        simulationState.result.totalCost >=
                                    0
                                        ? "text-green-400"
                                        : "text-red-400"
                                }`}
                            >
                                {(
                                    simulationState.result.totalValue -
                                    simulationState.result.totalCost
                                ).toFixed(4)}{" "}
                                {initialRaffleData?.entryFeeAsset?.symbol ||
                                    "$"}
                            </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <div className="text-sm text-gray-400">
                                샤프 비율
                            </div>
                            <div
                                className={`text-xl font-bold ${
                                    simulationState.result.finalStats
                                        .sharpeRatio > 0.5
                                        ? "text-green-400"
                                        : "text-yellow-400"
                                }`}
                            >
                                {simulationState.result.finalStats.sharpeRatio.toFixed(
                                    3
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 고급 통계 테이블 */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            고급 통계 분석
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-md font-medium text-purple-300">
                                    기본 통계
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            평균
                                        </span>
                                        <span className="text-white">
                                            {simulationState.result.finalStats.mean.toFixed(
                                                4
                                            )}{" "}
                                            {initialRaffleData?.entryFeeAsset
                                                ?.symbol || "$"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            중앙값
                                        </span>
                                        <span className="text-white">
                                            {simulationState.result.finalStats.median.toFixed(
                                                4
                                            )}{" "}
                                            {initialRaffleData?.entryFeeAsset
                                                ?.symbol || "$"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            표준편차
                                        </span>
                                        <span className="text-white">
                                            {simulationState.result.finalStats.stdDev.toFixed(
                                                4
                                            )}{" "}
                                            {initialRaffleData?.entryFeeAsset
                                                ?.symbol || "$"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            비대칭도
                                        </span>
                                        <span className="text-white">
                                            {simulationState.result.finalStats.skewness.toFixed(
                                                3
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-md font-medium text-green-300">
                                    리스크 메트릭
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            VaR (95%)
                                        </span>
                                        <span className="text-white">
                                            {Math.abs(
                                                simulationState.result
                                                    .finalStats.valueAtRisk95
                                            ).toFixed(4)}{" "}
                                            {initialRaffleData?.entryFeeAsset
                                                ?.symbol || "$"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            CVaR (95%)
                                        </span>
                                        <span className="text-white">
                                            {Math.abs(
                                                simulationState.result
                                                    .finalStats.conditionalVaR95
                                            ).toFixed(4)}{" "}
                                            {initialRaffleData?.entryFeeAsset
                                                ?.symbol || "$"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            최대 낙폭
                                        </span>
                                        <span className="text-white">
                                            {Math.abs(
                                                simulationState.result
                                                    .finalStats.maxDrawdown
                                            ).toFixed(4)}{" "}
                                            {initialRaffleData?.entryFeeAsset
                                                ?.symbol || "$"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            Sortino 비율
                                        </span>
                                        <span className="text-white">
                                            {simulationState.result.finalStats.sortinoRatio.toFixed(
                                                3
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "insights" && simulationState.result && (
                <SmartInsightsDashboard
                    result={simulationState.result}
                    assetSymbol={initialRaffleData?.entryFeeAsset?.symbol}
                    theoreticalROI={theoreticalROI}
                />
            )}

            {/* 에러 상태 */}
            {simulationState.error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                        시뮬레이션 오류
                    </h3>
                    <p className="text-red-300">{simulationState.error}</p>
                </div>
            )}

            {/* 로딩 상태 표시 */}
            {simulationState.isRunning && (
                <div className="fixed bottom-6 right-6 bg-purple-900/90 border border-purple-700 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                        <div>
                            <div className="text-white font-medium">
                                시뮬레이션 진행 중
                            </div>
                            <div className="text-purple-300 text-sm">
                                {simulationState.progress.toFixed(1)}% 완료 •{" "}
                                {simulationState.currentRun.toLocaleString()}회
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
