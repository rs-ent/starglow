import { useState, useCallback, useRef } from "react";

// Web Worker 인터페이스 정의 (Worker와 동기화)
interface Prize {
    id: string;
    title: string;
    quantity: number;
    userValue: number;
    prizeType: number;
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

interface SimulationProgress {
    progress: number;
    currentRun: number;
    currentStats: AdvancedStats;
    runningAverage: number;
}

interface SimulationState {
    isRunning: boolean;
    isPaused: boolean;
    progress: number;
    currentRun: number;
    result: SimulationResult | null;
    error: string | null;
    progressData: SimulationProgress | null;
}

interface SimulationControls {
    runSimulation: (config: SimulationConfig, seed?: number) => Promise<void>;
    pauseSimulation: () => void;
    resumeSimulation: () => void;
    stopSimulation: () => void;
    calculateStats: (
        profitLossHistory: number[]
    ) => Promise<AdvancedStats | null>;
}

// 고급 수학 함수들 (Worker에서 가져온 로직)
class AdvancedMath {
    static calculateBayesianStats(
        data: number[],
        priorMean = 0,
        priorVariance = 1000
    ): {
        posteriorMean: number;
        posteriorVariance: number;
        credibleInterval: [number, number];
    } {
        const n = data.length;
        const sampleMean = data.reduce((sum, x) => sum + x, 0) / n;
        const sampleVariance =
            data.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) /
            (n - 1);

        const posteriorVariance = 1 / (1 / priorVariance + n / sampleVariance);
        const posteriorMean =
            posteriorVariance *
            (priorMean / priorVariance + (n * sampleMean) / sampleVariance);

        const stdError = Math.sqrt(posteriorVariance);
        const credibleInterval: [number, number] = [
            posteriorMean - 1.96 * stdError,
            posteriorMean + 1.96 * stdError,
        ];

        return { posteriorMean, posteriorVariance, credibleInterval };
    }

    static calculateSkewness(data: number[]): number {
        const n = data.length;
        const mean = data.reduce((sum, x) => sum + x, 0) / n;
        const variance =
            data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        const skewness =
            data.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 3), 0) /
            n;
        return skewness;
    }

    static calculateKurtosis(data: number[]): number {
        const n = data.length;
        const mean = data.reduce((sum, x) => sum + x, 0) / n;
        const variance =
            data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        const kurtosis =
            data.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 4), 0) /
                n -
            3;
        return kurtosis;
    }

    static calculateGiniCoefficient(values: number[]): number {
        const sortedValues = [...values].sort((a, b) => a - b);
        const n = sortedValues.length;
        const mean = sortedValues.reduce((sum, x) => sum + x, 0) / n;

        let numerator = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                numerator += Math.abs(sortedValues[i] - sortedValues[j]);
            }
        }

        return numerator / (2 * n * n * mean);
    }

    static calculateEntropy(probabilities: number[]): number {
        return -probabilities.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log2(p) : 0);
        }, 0);
    }

    static calculateSortinoRatio(returns: number[], targetReturn = 0): number {
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const downwardReturns = returns.filter((r) => r < targetReturn);

        if (downwardReturns.length === 0) return Infinity;

        const downwardVariance =
            downwardReturns.reduce(
                (sum, r) => sum + Math.pow(r - targetReturn, 2),
                0
            ) / downwardReturns.length;
        const downwardDeviation = Math.sqrt(downwardVariance);

        return (mean - targetReturn) / downwardDeviation;
    }
}

// 시뮬레이션 엔진 (Worker에서 가져온 로직을 클라이언트 사이드로)
class RaffleSimulationEngine {
    private config: SimulationConfig;
    private random: () => number;
    private shouldStop: boolean = false;
    private shouldPause: boolean = false;

    constructor(config: SimulationConfig, seed?: number) {
        this.config = config;
        this.random = seed ? this.seededRandom(seed) : Math.random;
    }

    private seededRandom(seed: number): () => number {
        let x = Math.sin(seed) * 10000;
        return () => {
            x = Math.sin(x) * 10000;
            return x - Math.floor(x);
        };
    }

    stop() {
        this.shouldStop = true;
    }

    pause() {
        this.shouldPause = true;
    }

    resume() {
        this.shouldPause = false;
    }

    private runSingleDraw(): Prize | null {
        const totalTickets = this.config.prizes.reduce(
            (sum, prize) => sum + prize.quantity,
            0
        );
        if (totalTickets === 0) return null;

        const randomTicket = Math.floor(this.random() * totalTickets);
        let currentTicket = 0;

        for (const prize of this.config.prizes) {
            if (randomTicket < currentTicket + prize.quantity) {
                return prize;
            }
            currentTicket += prize.quantity;
        }

        return this.config.prizes[this.config.prizes.length - 1];
    }

    calculateAdvancedStats(profitLossHistory: number[]): AdvancedStats {
        const data = [...profitLossHistory];
        const n = data.length;

        if (n === 0) {
            return this.getEmptyStats();
        }

        // 기본 통계
        const sortedData = [...data].sort((a, b) => a - b);
        const mean = data.reduce((sum, x) => sum + x, 0) / n;
        const median =
            n % 2 === 0
                ? (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2
                : sortedData[Math.floor(n / 2)];

        // 최빈값 계산
        const frequency: Record<string, number> = {};
        data.forEach((x) => {
            const key = x.toFixed(2);
            frequency[key] = (frequency[key] || 0) + 1;
        });
        const mode = parseFloat(
            Object.keys(frequency).reduce((a, b) =>
                frequency[a] > frequency[b] ? a : b
            )
        );

        const variance =
            data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        // 고급 통계
        const skewness = AdvancedMath.calculateSkewness(data);
        const kurtosis = AdvancedMath.calculateKurtosis(data);

        // 베이지안 통계
        const bayesian = AdvancedMath.calculateBayesianStats(data);

        // 리스크 메트릭
        const sharpeRatio = stdDev > 0 ? mean / stdDev : 0;
        const sortinoRatio = AdvancedMath.calculateSortinoRatio(data);

        // VaR 및 CVaR
        const valueAtRisk95 = sortedData[Math.floor(n * 0.05)] || 0;
        const conditionalVaR95 =
            sortedData
                .slice(0, Math.floor(n * 0.05))
                .reduce((sum, x) => sum + x, 0) /
            Math.max(1, Math.floor(n * 0.05));

        // 최대 낙폭 계산
        let maxDrawdown = 0;
        let peak = data[0] || 0;
        let cumulativeReturn = 0;

        for (const value of data) {
            cumulativeReturn += value;
            if (cumulativeReturn > peak) peak = cumulativeReturn;
            const drawdown = peak - cumulativeReturn;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        const calmarRatio = maxDrawdown > 0 ? mean / maxDrawdown : 0;

        // 공정성 지표
        const prizeValues = this.config.prizes.map((p) => p.userValue);
        const prizeQuantities = this.config.prizes.map((p) => p.quantity);
        const totalQuantity = prizeQuantities.reduce((sum, q) => sum + q, 0);
        const probabilities = prizeQuantities.map((q) => q / totalQuantity);

        const giniCoefficient =
            AdvancedMath.calculateGiniCoefficient(prizeValues);
        const entropyScore = AdvancedMath.calculateEntropy(probabilities);
        const maxEntropy = Math.log2(this.config.prizes.length);
        const fairnessIndex = maxEntropy > 0 ? entropyScore / maxEntropy : 1;

        // 켈리 기준 계산
        const winProbability = data.filter((x) => x > 0).length / n;
        const avgWin =
            data.filter((x) => x > 0).reduce((sum, x) => sum + x, 0) /
            Math.max(1, data.filter((x) => x > 0).length);
        const avgLoss = Math.abs(
            data.filter((x) => x <= 0).reduce((sum, x) => sum + x, 0) /
                Math.max(1, data.filter((x) => x <= 0).length)
        );

        const kellyBetSize =
            avgLoss > 0
                ? Math.max(
                      0,
                      (winProbability * avgWin -
                          (1 - winProbability) * avgLoss) /
                          avgWin
                  )
                : 0;

        // 최적 참가비 계산
        const expectedValue = this.config.prizes.reduce((sum, prize) => {
            const prob = prize.quantity / totalQuantity;
            return sum + prob * prize.userValue;
        }, 0);
        const optimalEntryFee = expectedValue * 0.85;

        // 참여 예측
        const priceElasticity = -1.2;
        const baseDemand = 1000;
        const participationPrediction = {
            expectedParticipants: Math.max(
                0,
                baseDemand *
                    Math.pow(this.config.entryFee / 100, priceElasticity)
            ),
            confidenceInterval: [0, 0] as [number, number],
            factorsInfluence: {
                entryFee: -0.8,
                prizeValue: 0.6,
                fairness: 0.3,
                winRate: 0.4,
            },
        };

        return {
            mean,
            median,
            mode,
            stdDev,
            variance,
            skewness,
            kurtosis,
            sharpeRatio,
            sortinoRatio,
            calmarRatio,
            maxDrawdown,
            valueAtRisk95,
            conditionalVaR95,
            bayesianConfidenceInterval: bayesian.credibleInterval,
            posteriorMean: bayesian.posteriorMean,
            credibleInterval95: bayesian.credibleInterval,
            tailRisk: data.filter((x) => x < valueAtRisk95).length / n,
            expectedShortfall: conditionalVaR95,
            riskParityScore: 1 - Math.min(1, stdDev / Math.abs(mean)),
            fairnessIndex,
            giniCoefficient,
            entropyScore,
            kellyBetSize,
            optimalEntryFee,
            recommendedPrizeAdjustments: this.generatePrizeRecommendations(),
            participationPrediction,
        };
    }

    private getEmptyStats(): AdvancedStats {
        return {
            mean: 0,
            median: 0,
            mode: 0,
            stdDev: 0,
            variance: 0,
            skewness: 0,
            kurtosis: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            maxDrawdown: 0,
            valueAtRisk95: 0,
            conditionalVaR95: 0,
            bayesianConfidenceInterval: [0, 0],
            posteriorMean: 0,
            credibleInterval95: [0, 0],
            tailRisk: 0,
            expectedShortfall: 0,
            riskParityScore: 0,
            fairnessIndex: 1,
            giniCoefficient: 0,
            entropyScore: 0,
            kellyBetSize: 0,
            optimalEntryFee: 0,
            recommendedPrizeAdjustments: [],
            participationPrediction: {
                expectedParticipants: 0,
                confidenceInterval: [0, 0],
                factorsInfluence: {},
            },
        };
    }

    private generatePrizeRecommendations(): Array<{
        prizeId: string;
        currentQuantity: number;
        recommendedQuantity: number;
        reason: string;
        impact: number;
    }> {
        return this.config.prizes.map((prize) => {
            const totalQuantity = this.config.prizes.reduce(
                (sum, p) => sum + p.quantity,
                0
            );
            const currentProb = prize.quantity / totalQuantity;
            const valueRatio = prize.userValue / this.config.entryFee;

            let recommendedQuantity = prize.quantity;
            let reason = "현재 설정이 적절합니다";
            let impact = 0;

            if (valueRatio > 10 && currentProb > 0.1) {
                recommendedQuantity = Math.max(
                    1,
                    Math.floor(prize.quantity * 0.7)
                );
                reason = "고가치 상품의 희소성을 높여 참여 동기 증진";
                impact = 0.15;
            }

            if (valueRatio < 2 && currentProb < 0.3) {
                recommendedQuantity = Math.floor(prize.quantity * 1.3);
                reason = "저가치 상품의 당첨률을 높여 만족도 증진";
                impact = 0.08;
            }

            return {
                prizeId: prize.id,
                currentQuantity: prize.quantity,
                recommendedQuantity,
                reason,
                impact,
            };
        });
    }

    async runSimulation(
        onProgress?: (progress: SimulationProgress) => void
    ): Promise<SimulationResult> {
        const { totalRuns, entryFee } = this.config;
        const batchSize = Math.min(this.config.batchSize || 1000, 1000);

        const prizeWins: Record<string, number> = {};
        const profitLossHistory: number[] = [];
        const cumulativeReturns: number[] = [];
        const runningStats: AdvancedStats[] = [];

        let totalValue = 0;
        let totalCost = 0;
        let cumulativeReturn = 0;

        // 초기화
        this.config.prizes.forEach((prize) => {
            prizeWins[prize.id] = 0;
        });

        // 배치별로 처리 (UI 블로킹 방지)
        for (let batch = 0; batch < Math.ceil(totalRuns / batchSize); batch++) {
            if (this.shouldStop) break;

            // 일시정지 처리
            while (this.shouldPause && !this.shouldStop) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, totalRuns);

            // 배치 내 시뮬레이션 실행
            for (let i = batchStart; i < batchEnd; i++) {
                const wonPrize = this.runSingleDraw();
                let roundProfit = -entryFee;

                if (wonPrize) {
                    prizeWins[wonPrize.id]++;
                    totalValue += wonPrize.userValue;
                    roundProfit += wonPrize.userValue;
                }

                totalCost += entryFee;
                cumulativeReturn += roundProfit;

                profitLossHistory.push(roundProfit);
                cumulativeReturns.push(cumulativeReturn);
            }

            // 진행률 업데이트
            const progress = (batchEnd / totalRuns) * 100;
            const currentStats = this.calculateAdvancedStats(profitLossHistory);

            if (onProgress) {
                onProgress({
                    progress,
                    currentRun: batchEnd,
                    currentStats,
                    runningAverage: cumulativeReturn / batchEnd,
                });
            }

            if (batchEnd % 5000 === 0) {
                runningStats.push(currentStats);
            }

            // UI 업데이트를 위한 짧은 대기
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        // 최종 통계 계산
        const finalStats = this.calculateAdvancedStats(profitLossHistory);
        const optimizationSuggestions =
            this.generateOptimizationSuggestions(finalStats);

        const roi =
            totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
        const winRate =
            (Object.values(prizeWins).reduce((sum, wins) => sum + wins, 0) /
                totalRuns) *
            100;

        const distribution: Record<string, number> = {};
        this.config.prizes.forEach((prize) => {
            distribution[prize.id] = (prizeWins[prize.id] / totalRuns) * 100;
        });

        return {
            totalRuns: profitLossHistory.length,
            prizeWins,
            totalValue,
            totalCost,
            roi,
            winRate,
            distribution,
            profitLossHistory,
            cumulativeReturns,
            runningStats,
            finalStats,
            optimizationSuggestions,
        };
    }

    private generateOptimizationSuggestions(
        stats: AdvancedStats
    ): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        if (stats.mean < 0) {
            suggestions.push({
                type: "entry_fee",
                priority: "high",
                description: `참가비를 ${stats.optimalEntryFee.toFixed(
                    2
                )}로 조정하여 수익성 개선`,
                expectedImpact: {
                    roiChange: 15,
                    winRateChange: 0,
                    fairnessChange: 0,
                    participationChange: 10,
                },
                implementation: {
                    newEntryFee: stats.optimalEntryFee,
                },
                confidence: 0.85,
            });
        }

        if (stats.fairnessIndex < 0.7) {
            suggestions.push({
                type: "prize_quantity",
                priority: "medium",
                description:
                    "상품 당첨 확률을 더 균등하게 분배하여 공정성 향상",
                expectedImpact: {
                    roiChange: -2,
                    winRateChange: 5,
                    fairnessChange: 20,
                    participationChange: 8,
                },
                implementation: {},
                confidence: 0.75,
            });
        }

        if (stats.sharpeRatio < 0.5) {
            suggestions.push({
                type: "prize_value",
                priority: "medium",
                description:
                    "높은 리스크 대비 낮은 수익률 - 상품 구성 재검토 필요",
                expectedImpact: {
                    roiChange: 8,
                    winRateChange: 3,
                    fairnessChange: 0,
                    participationChange: 5,
                },
                implementation: {},
                confidence: 0.7,
            });
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
}

export function useRaffleSimulation(): [SimulationState, SimulationControls] {
    const [state, setState] = useState<SimulationState>({
        isRunning: false,
        isPaused: false,
        progress: 0,
        currentRun: 0,
        result: null,
        error: null,
        progressData: null,
    });

    const currentEngine = useRef<RaffleSimulationEngine | null>(null);

    const runSimulation = useCallback(
        async (config: SimulationConfig, seed?: number) => {
            try {
                setState((prev) => ({
                    ...prev,
                    isRunning: true,
                    isPaused: false,
                    progress: 0,
                    currentRun: 0,
                    result: null,
                    error: null,
                    progressData: null,
                }));

                currentEngine.current = new RaffleSimulationEngine(
                    config,
                    seed
                );

                const result = await currentEngine.current.runSimulation(
                    (progressData: SimulationProgress) => {
                        setState((prev) => ({
                            ...prev,
                            progress: progressData.progress,
                            currentRun: progressData.currentRun,
                            progressData,
                        }));
                    }
                );

                setState((prev) => ({
                    ...prev,
                    isRunning: false,
                    isPaused: false,
                    progress: 100,
                    result,
                    error: null,
                }));
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    isRunning: false,
                    isPaused: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "시뮬레이션 실행 중 오류가 발생했습니다.",
                }));
            }
        },
        []
    );

    const pauseSimulation = useCallback(() => {
        if (currentEngine.current) {
            currentEngine.current.pause();
            setState((prev) => ({
                ...prev,
                isPaused: true,
            }));
        }
    }, []);

    const resumeSimulation = useCallback(() => {
        if (currentEngine.current) {
            currentEngine.current.resume();
            setState((prev) => ({
                ...prev,
                isPaused: false,
            }));
        }
    }, []);

    const stopSimulation = useCallback(() => {
        if (currentEngine.current) {
            currentEngine.current.stop();
        }
        setState((prev) => ({
            ...prev,
            isRunning: false,
            isPaused: false,
            progress: 0,
            currentRun: 0,
            error: null,
        }));
    }, []);

    const calculateStats = useCallback(
        async (profitLossHistory: number[]): Promise<AdvancedStats | null> => {
            try {
                const tempEngine = new RaffleSimulationEngine({
                    totalRuns: 0,
                    entryFee: 0,
                    prizes: [],
                    batchSize: 1000,
                });
                return tempEngine.calculateAdvancedStats(profitLossHistory);
            } catch (error) {
                console.error("Stats calculation failed:", error);
                return null;
            }
        },
        []
    );

    return [
        state,
        {
            runSimulation,
            pauseSimulation,
            resumeSimulation,
            stopSimulation,
            calculateStats,
        },
    ];
}

// 유틸리티 함수들
export const simulationUtils = {
    // 이론적 기대값 계산
    calculateExpectedValue: (prizes: Prize[]): number => {
        const totalTickets = prizes.reduce(
            (sum, prize) => sum + prize.quantity,
            0
        );
        if (totalTickets === 0) return 0;

        return prizes.reduce((sum, prize) => {
            const probability = prize.quantity / totalTickets;
            return sum + probability * prize.userValue;
        }, 0);
    },

    // 이론적 ROI 계산
    calculateTheoreticalROI: (prizes: Prize[], entryFee: number): number => {
        if (entryFee === 0) return 0;
        const expectedValue = simulationUtils.calculateExpectedValue(prizes);
        return ((expectedValue - entryFee) / entryFee) * 100;
    },

    // 공정성 점수 계산
    calculateFairnessScore: (prizes: Prize[]): number => {
        const totalQuantity = prizes.reduce((sum, p) => sum + p.quantity, 0);
        if (totalQuantity === 0) return 1;

        const probabilities = prizes.map((p) => p.quantity / totalQuantity);
        const entropy = -probabilities.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log2(p) : 0);
        }, 0);
        const maxEntropy = Math.log2(prizes.length);

        return maxEntropy > 0 ? entropy / maxEntropy : 1;
    },

    // 리스크 등급 판정
    assessRiskLevel: (stats: AdvancedStats): "low" | "medium" | "high" => {
        const { sharpeRatio, maxDrawdown, tailRisk } = stats;

        if (sharpeRatio > 1 && maxDrawdown < 100 && tailRisk < 0.1) {
            return "low";
        } else if (sharpeRatio > 0.5 && maxDrawdown < 300 && tailRisk < 0.2) {
            return "medium";
        } else {
            return "high";
        }
    },

    // 최적화 점수 계산 (0-100)
    calculateOptimizationScore: (stats: AdvancedStats): number => {
        const roiScore = Math.max(0, Math.min(30, stats.mean + 10)); // -10~20 범위를 0~30으로
        const fairnessScore = stats.fairnessIndex * 25; // 0~25
        const riskScore = Math.max(0, 25 - stats.maxDrawdown / 10); // 0~25
        const stabilityScore = Math.max(0, 20 - stats.stdDev); // 0~20

        return Math.min(
            100,
            roiScore + fairnessScore + riskScore + stabilityScore
        );
    },

    // 권장 액션 생성
    generateActionItems: (
        stats: AdvancedStats,
        suggestions: OptimizationSuggestion[]
    ): Array<{
        priority: "critical" | "high" | "medium" | "low";
        action: string;
        impact: string;
        implementation: string;
    }> => {
        const actions: Array<{
            priority: "critical" | "high" | "medium" | "low";
            action: string;
            impact: string;
            implementation: string;
        }> = [];

        // 크리티컬 이슈들
        if (stats.mean < -50) {
            actions.push({
                priority: "critical",
                action: "참가비 또는 상품 구성 즉시 재검토",
                impact: "현재 구조는 심각한 손실 위험",
                implementation: `참가비를 ${stats.optimalEntryFee.toFixed(
                    2
                )}로 조정`,
            });
        }

        if (stats.fairnessIndex < 0.5) {
            actions.push({
                priority: "high",
                action: "공정성 개선 필요",
                impact: "사용자 신뢰도 하락 위험",
                implementation: "상품 당첨 확률 재분배",
            });
        }

        // 제안사항 기반 액션
        suggestions.forEach((suggestion) => {
            actions.push({
                priority: suggestion.priority as any,
                action: suggestion.description,
                impact: `ROI ${
                    suggestion.expectedImpact.roiChange > 0 ? "+" : ""
                }${suggestion.expectedImpact.roiChange}%, 참여율 ${
                    suggestion.expectedImpact.participationChange > 0 ? "+" : ""
                }${suggestion.expectedImpact.participationChange}%`,
                implementation:
                    Object.entries(suggestion.implementation)
                        .filter(([_, value]) => value !== undefined)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ") || "세부 분석 필요",
            });
        });

        return actions.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    },
};
