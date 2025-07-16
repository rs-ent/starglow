"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    FaPlay,
    FaPause,
    FaStop,
    FaChartLine,
    FaCalculator,
} from "react-icons/fa";
import { TbMathFunction, TbChartPie } from "react-icons/tb";
import { MdAnalytics, MdTrendingUp } from "react-icons/md";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";

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

interface SimulationConfig {
    totalRuns: number;
    entryFee: number;
    prizes: Prize[];
    batchSize: number;
}

interface SimulationResult {
    totalRuns: number;
    prizeWins: Record<string, number>;
    totalValue: number;
    totalCost: number;
    roi: number;
    expectedValue: number;
    winRate: number;
    distribution: Record<string, number>;
    profitLossHistory: number[];
}

interface SimulationStats {
    mean: number;
    median: number;
    stdDev: number;
    minValue: number;
    maxValue: number;
    winStreaks: number[];
    lossStreaks: number[];
    breakEvenPoint: number;
    confidenceInterval95: [number, number];
    sharpeRatio: number;
    maxDrawdown: number;
    valueAtRisk95: number;
    kellyBetSize: number;
}

interface InitialRaffleData {
    raffleId: string;
    title: string;
    description: string;
    entryFee: number;
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

export default function AdminRafflesWeb3Simulation({
    initialRaffleData,
}: Props) {
    const [config, setConfig] = useState<SimulationConfig>({
        totalRuns: 10000,
        entryFee: 100,
        prizes: [],
        batchSize: 1000,
    });

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentRun, setCurrentRun] = useState(0);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [stats, setStats] = useState<SimulationStats | null>(null);
    const [runningAverage, setRunningAverage] = useState<number[]>([]);

    const COLORS = [
        "#8884d8",
        "#82ca9d",
        "#ffc658",
        "#ff7c7c",
        "#8dd1e1",
        "#d084d0",
        "#ffb347",
        "#87ceeb",
    ];

    const chartData = useMemo(() => {
        return runningAverage.map((roi, index) => ({
            run: (index + 1) * 100,
            roi: roi,
            breakEven: 0,
        }));
    }, [runningAverage]);

    const distributionChartData = useMemo(() => {
        if (!result) return [];

        return config.prizes.map((prize, index) => ({
            name: prize.title,
            actual: result.distribution[prize.id] || 0,
            expected:
                config.prizes.reduce((sum, p) => sum + p.quantity, 0) > 0
                    ? (prize.quantity /
                          config.prizes.reduce(
                              (sum, p) => sum + p.quantity,
                              0
                          )) *
                      100
                    : 0,
            value: prize.userValue || 0,
            color: COLORS[index % COLORS.length],
        }));
    }, [result, config.prizes]);

    const profitLossChartData = useMemo(() => {
        if (!result || !stats) return [];

        const histogramBins = 20;
        const min = stats.minValue;
        const max = stats.maxValue;
        const binSize = (max - min) / histogramBins;

        const bins = Array(histogramBins)
            .fill(0)
            .map((_, i) => ({
                range: `${(min + i * binSize).toFixed(1)} ~ ${(
                    min +
                    (i + 1) * binSize
                ).toFixed(1)}`,
                count: 0,
                midpoint: min + (i + 0.5) * binSize,
            }));

        result.profitLossHistory.forEach((value) => {
            const binIndex = Math.min(
                Math.floor((value - min) / binSize),
                histogramBins - 1
            );
            if (binIndex >= 0) bins[binIndex].count++;
        });

        return bins;
    }, [result, stats]);

    const addPrize = useCallback(() => {
        const newPrize: Prize = {
            id: `prize_${Date.now()}`,
            title: `상품 ${config.prizes.length + 1}`,
            description: "",
            imageUrl: "",
            order: config.prizes.length,
            quantity: 100,
            prizeType: 1,
            userValue: 0,
        };
        setConfig((prev) => ({
            ...prev,
            prizes: [...prev.prizes, newPrize],
        }));
    }, [config.prizes.length]);

    const updatePrize = useCallback((id: string, updates: Partial<Prize>) => {
        setConfig((prev) => ({
            ...prev,
            prizes: prev.prizes.map((prize) =>
                prize.id === id ? { ...prize, ...updates } : prize
            ),
        }));
    }, []);

    const removePrize = useCallback((id: string) => {
        setConfig((prev) => ({
            ...prev,
            prizes: prev.prizes.filter((prize) => prize.id !== id),
        }));
    }, []);

    const calculateExpectedValue = useMemo(() => {
        const totalTickets = config.prizes.reduce(
            (sum, prize) => sum + prize.quantity,
            0
        );
        if (totalTickets === 0) return 0;

        return config.prizes.reduce((sum, prize) => {
            const probability = prize.quantity / totalTickets;
            const value = prize.userValue || 0;
            return sum + probability * value;
        }, 0);
    }, [config.prizes]);

    const calculateTheoreticalROI = useMemo(() => {
        if (config.entryFee === 0) return 0;
        return (
            ((calculateExpectedValue - config.entryFee) / config.entryFee) * 100
        );
    }, [calculateExpectedValue, config.entryFee]);

    const runSingleDraw = useCallback(() => {
        const totalTickets = config.prizes.reduce(
            (sum, prize) => sum + prize.quantity,
            0
        );
        if (totalTickets === 0) return null;

        const randomTicket = Math.floor(Math.random() * totalTickets);
        let currentTicket = 0;

        for (const prize of config.prizes.sort((a, b) => a.order - b.order)) {
            if (randomTicket < currentTicket + prize.quantity) {
                return prize;
            }
            currentTicket += prize.quantity;
        }

        return config.prizes[config.prizes.length - 1];
    }, [config.prizes]);

    const calculateStats = useCallback(
        (profitLossHistory: number[]): SimulationStats => {
            const sortedValues = [...profitLossHistory].sort((a, b) => a - b);
            const n = sortedValues.length;

            const mean =
                profitLossHistory.reduce((sum, val) => sum + val, 0) / n;
            const median =
                n % 2 === 0
                    ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
                    : sortedValues[Math.floor(n / 2)];

            const variance =
                profitLossHistory.reduce(
                    (sum, val) => sum + Math.pow(val - mean, 2),
                    0
                ) / n;
            const stdDev = Math.sqrt(variance);

            const winStreaks: number[] = [];
            const lossStreaks: number[] = [];
            let currentWinStreak = 0;
            let currentLossStreak = 0;

            for (const value of profitLossHistory) {
                if (value > 0) {
                    if (currentLossStreak > 0) {
                        lossStreaks.push(currentLossStreak);
                        currentLossStreak = 0;
                    }
                    currentWinStreak++;
                } else {
                    if (currentWinStreak > 0) {
                        winStreaks.push(currentWinStreak);
                        currentWinStreak = 0;
                    }
                    currentLossStreak++;
                }
            }

            const breakEvenPoint = profitLossHistory.findIndex(
                (value) => value >= 0
            );

            const standardError = stdDev / Math.sqrt(n);
            const zScore95 = 1.96;
            const confidenceInterval95: [number, number] = [
                mean - zScore95 * standardError,
                mean + zScore95 * standardError,
            ];

            const riskFreeRate = 0;
            const sharpeRatio = stdDev > 0 ? (mean - riskFreeRate) / stdDev : 0;

            let maxDrawdown = 0;
            let peak = profitLossHistory[0] || 0;
            let cumulativeReturn = 0;

            for (const value of profitLossHistory) {
                cumulativeReturn += value;
                if (cumulativeReturn > peak) {
                    peak = cumulativeReturn;
                }
                const drawdown = peak - cumulativeReturn;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }

            const valueAtRisk95 = sortedValues[Math.floor(n * 0.05)] || 0;

            const winProbability =
                profitLossHistory.filter((v) => v > 0).length / n;
            const averageWin =
                profitLossHistory
                    .filter((v) => v > 0)
                    .reduce((sum, v) => sum + v, 0) /
                (profitLossHistory.filter((v) => v > 0).length || 1);
            const averageLoss = Math.abs(
                profitLossHistory
                    .filter((v) => v <= 0)
                    .reduce((sum, v) => sum + v, 0) /
                    (profitLossHistory.filter((v) => v <= 0).length || 1)
            );

            const kellyBetSize =
                averageLoss > 0
                    ? Math.max(
                          0,
                          (winProbability * averageWin -
                              (1 - winProbability) * averageLoss) /
                              averageWin
                      )
                    : 0;

            return {
                mean,
                median,
                stdDev,
                minValue: sortedValues[0],
                maxValue: sortedValues[n - 1],
                winStreaks,
                lossStreaks,
                breakEvenPoint: breakEvenPoint === -1 ? n : breakEvenPoint,
                confidenceInterval95,
                sharpeRatio,
                maxDrawdown,
                valueAtRisk95,
                kellyBetSize,
            };
        },
        []
    );

    const runSimulation = useCallback(async () => {
        if (config.prizes.length === 0) return;

        setIsRunning(true);
        setIsPaused(false);
        setProgress(0);
        setCurrentRun(0);
        setResult(null);
        setStats(null);
        setRunningAverage([]);

        const prizeWins: Record<string, number> = {};
        const profitLossHistory: number[] = [];
        const runningAverageData: number[] = [];
        let totalValue = 0;
        let totalCost = 0;
        let cumulativeProfit = 0;

        config.prizes.forEach((prize) => {
            prizeWins[prize.id] = 0;
        });

        for (let i = 0; i < config.totalRuns; i++) {
            if (isPaused) {
                await new Promise((resolve) => {
                    const checkPause = () => {
                        if (!isPaused) resolve(undefined);
                        else setTimeout(checkPause, 100);
                    };
                    checkPause();
                });
            }

            const wonPrize = runSingleDraw();
            if (wonPrize) {
                prizeWins[wonPrize.id]++;
                const prizeValue = wonPrize.userValue || 0;
                totalValue += prizeValue;
                cumulativeProfit += prizeValue - config.entryFee;
                profitLossHistory.push(prizeValue - config.entryFee);
            } else {
                cumulativeProfit -= config.entryFee;
                profitLossHistory.push(-config.entryFee);
            }

            totalCost += config.entryFee;

            if ((i + 1) % 100 === 0) {
                const currentROI =
                    totalCost > 0
                        ? ((totalValue - totalCost) / totalCost) * 100
                        : 0;
                runningAverageData.push(currentROI);
            }

            if ((i + 1) % config.batchSize === 0) {
                setProgress(((i + 1) / config.totalRuns) * 100);
                setCurrentRun(i + 1);
                setRunningAverage([...runningAverageData]);

                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }

        const finalROI =
            totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
        const winRate =
            (Object.values(prizeWins).reduce((sum, wins) => sum + wins, 0) /
                config.totalRuns) *
            100;

        const distribution: Record<string, number> = {};
        config.prizes.forEach((prize) => {
            distribution[prize.id] =
                (prizeWins[prize.id] / config.totalRuns) * 100;
        });

        const finalResult: SimulationResult = {
            totalRuns: config.totalRuns,
            prizeWins,
            totalValue,
            totalCost,
            roi: finalROI,
            expectedValue: calculateExpectedValue,
            winRate,
            distribution,
            profitLossHistory,
        };

        const finalStats = calculateStats(profitLossHistory);

        setResult(finalResult);
        setStats(finalStats);
        setProgress(100);
        setIsRunning(false);
    }, [
        config,
        isPaused,
        runSingleDraw,
        calculateExpectedValue,
        calculateStats,
    ]);

    const pauseSimulation = useCallback(() => {
        setIsPaused(!isPaused);
    }, [isPaused]);

    const stopSimulation = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentRun(0);
    }, []);

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

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-[#181c2b] to-[#2a2342] rounded-2xl border border-purple-900/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-900/30 rounded-xl">
                    <TbMathFunction className="text-2xl text-purple-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {initialRaffleData
                            ? `${initialRaffleData.title} - 공정성 시뮬레이션`
                            : "Raffle 공정성 시뮬레이션"}
                    </h2>
                    <p className="text-purple-300">
                        {initialRaffleData
                            ? `${initialRaffleData.networkName} • 래플 #${initialRaffleData.raffleId} • 수학적 검증`
                            : "수학적 검증을 통한 래플 시스템 분석"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaCalculator className="text-purple-400" />
                            시뮬레이션 설정
                        </h3>

                        <div className="space-y-4">
                            {initialRaffleData && (
                                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                                    <p className="text-sm text-blue-300">
                                        🎯{" "}
                                        <strong>
                                            Smart Contract 데이터 로드됨:
                                        </strong>
                                        "{initialRaffleData.title}" 래플의 실제
                                        상품 구성과 참가비가 자동으로
                                        설정되었습니다. 각 상품의 상대가치를
                                        입력하여 시뮬레이션을 시작하세요.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    시뮬레이션 횟수
                                </label>
                                <select
                                    value={config.totalRuns}
                                    onChange={(e) =>
                                        setConfig((prev) => ({
                                            ...prev,
                                            totalRuns: parseInt(e.target.value),
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    disabled={isRunning}
                                >
                                    <option value={1000}>1,000회</option>
                                    <option value={10000}>10,000회</option>
                                    <option value={100000}>100,000회</option>
                                    <option value={1000000}>1,000,000회</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    상대가치
                                </label>
                                <input
                                    type="number"
                                    value={config.entryFee}
                                    onChange={(e) =>
                                        setConfig((prev) => ({
                                            ...prev,
                                            entryFee:
                                                parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    disabled={isRunning}
                                    min="0"
                                    step="0.01"
                                />
                                {initialRaffleData && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Smart Contract에서 불러온 참가비입니다
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    배치 크기 (성능 조절)
                                </label>
                                <select
                                    value={config.batchSize}
                                    onChange={(e) =>
                                        setConfig((prev) => ({
                                            ...prev,
                                            batchSize: parseInt(e.target.value),
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    disabled={isRunning}
                                >
                                    <option value={100}>
                                        100 (느림, 정확)
                                    </option>
                                    <option value={1000}>1,000 (보통)</option>
                                    <option value={10000}>10,000 (빠름)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TbChartPie className="text-green-400" />
                                상품 설정
                            </h3>
                            <button
                                onClick={addPrize}
                                disabled={isRunning}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                                상품 추가
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {config.prizes.map((prize, index) => (
                                <div
                                    key={prize.id}
                                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">
                                                상품명
                                            </label>
                                            <input
                                                type="text"
                                                value={prize.title}
                                                onChange={(e) =>
                                                    updatePrize(prize.id, {
                                                        title: e.target.value,
                                                    })
                                                }
                                                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                                disabled={isRunning}
                                            />
                                        </div>
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
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">
                                                상대가치
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
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() =>
                                                    removePrize(prize.id)
                                                }
                                                disabled={isRunning}
                                                className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <MdAnalytics className="text-blue-400" />
                            이론적 분석
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="text-sm text-gray-400">
                                    기대값
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {calculateExpectedValue.toFixed(4)} $
                                </div>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="text-sm text-gray-400">
                                    이론적 ROI
                                </div>
                                <div
                                    className={`text-xl font-bold ${
                                        calculateTheoreticalROI >= 0
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {calculateTheoreticalROI.toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="text-sm text-gray-400 mb-2">
                                상품별 이론적 확률
                            </div>
                            <div className="space-y-2">
                                {config.prizes.map((prize) => {
                                    const totalTickets = config.prizes.reduce(
                                        (sum, p) => sum + p.quantity,
                                        0
                                    );
                                    const probability =
                                        totalTickets > 0
                                            ? (prize.quantity / totalTickets) *
                                              100
                                            : 0;
                                    return (
                                        <div
                                            key={prize.id}
                                            className="flex justify-between text-sm"
                                        >
                                            <span className="text-gray-300">
                                                {prize.title}
                                            </span>
                                            <span className="text-white">
                                                {probability.toFixed(2)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaPlay className="text-yellow-400" />
                            시뮬레이션 실행
                        </h3>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={runSimulation}
                                    disabled={
                                        isRunning || config.prizes.length === 0
                                    }
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <FaPlay />
                                    시뮬레이션 시작
                                </button>
                                {isRunning && (
                                    <>
                                        <button
                                            onClick={pauseSimulation}
                                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <FaPause />
                                            {isPaused ? "재개" : "일시정지"}
                                        </button>
                                        <button
                                            onClick={stopSimulation}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <FaStop />
                                            중지
                                        </button>
                                    </>
                                )}
                            </div>

                            {isRunning && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">
                                            진행률
                                        </span>
                                        <span className="text-white">
                                            {progress.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {currentRun.toLocaleString()} /{" "}
                                        {config.totalRuns.toLocaleString()} 완료
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {result && stats && (
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <MdTrendingUp className="text-green-400" />
                                시뮬레이션 결과
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">
                                        실제 ROI
                                    </div>
                                    <div
                                        className={`text-xl font-bold ${
                                            result.roi >= 0
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {result.roi.toFixed(2)}%
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">
                                        당첨률
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {result.winRate.toFixed(2)}%
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">
                                        총 수익
                                    </div>
                                    <div
                                        className={`text-xl font-bold ${
                                            result.totalValue -
                                                result.totalCost >=
                                            0
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {(
                                            result.totalValue - result.totalCost
                                        ).toFixed(4)}{" "}
                                        $
                                    </div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="text-sm text-gray-400">
                                        손익분기점
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {stats.breakEvenPoint.toLocaleString()}
                                        회
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-400 mb-2">
                                        상품별 실제 당첨 분포
                                    </div>
                                    <div className="space-y-2">
                                        {config.prizes.map((prize) => {
                                            const actualRate =
                                                result.distribution[prize.id] ||
                                                0;
                                            const totalTickets =
                                                config.prizes.reduce(
                                                    (sum, p) =>
                                                        sum + p.quantity,
                                                    0
                                                );
                                            const expectedRate =
                                                totalTickets > 0
                                                    ? (prize.quantity /
                                                          totalTickets) *
                                                      100
                                                    : 0;
                                            const deviation =
                                                actualRate - expectedRate;

                                            return (
                                                <div
                                                    key={prize.id}
                                                    className="flex justify-between items-center text-sm"
                                                >
                                                    <span className="text-gray-300">
                                                        {prize.title}
                                                    </span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-white">
                                                            {actualRate.toFixed(
                                                                2
                                                            )}
                                                            %
                                                        </span>
                                                        <span
                                                            className={`text-xs ${
                                                                deviation >= 0
                                                                    ? "text-green-400"
                                                                    : "text-red-400"
                                                            }`}
                                                        >
                                                            (
                                                            {deviation >= 0
                                                                ? "+"
                                                                : ""}
                                                            {deviation.toFixed(
                                                                2
                                                            )}
                                                            %)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-400 mb-2">
                                        기본 통계
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                평균
                                            </span>
                                            <span className="text-white">
                                                {stats.mean.toFixed(4)} $
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                중앙값
                                            </span>
                                            <span className="text-white">
                                                {stats.median.toFixed(4)} $
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                표준편차
                                            </span>
                                            <span className="text-white">
                                                {stats.stdDev.toFixed(4)} $
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                최대 연승
                                            </span>
                                            <span className="text-white">
                                                {Math.max(
                                                    ...stats.winStreaks,
                                                    0
                                                )}
                                                회
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-400 mb-2">
                                        리스크 메트릭
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                샤프 비율
                                            </span>
                                            <span
                                                className={`text-white ${
                                                    stats.sharpeRatio > 0
                                                        ? "text-green-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {stats.sharpeRatio.toFixed(3)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                최대 낙폭
                                            </span>
                                            <span className="text-red-400">
                                                {stats.maxDrawdown.toFixed(4)} $
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                VaR (95%)
                                            </span>
                                            <span className="text-orange-400">
                                                {stats.valueAtRisk95.toFixed(4)}{" "}
                                                $
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">
                                                켈리 기준
                                            </span>
                                            <span className="text-blue-400">
                                                {(
                                                    stats.kellyBetSize * 100
                                                ).toFixed(1)}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-400 mb-2">
                                        신뢰구간 (95%)
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">
                                            예상 수익 범위
                                        </span>
                                        <span className="text-white">
                                            {stats.confidenceInterval95[0].toFixed(
                                                4
                                            )}{" "}
                                            ~{" "}
                                            {stats.confidenceInterval95[1].toFixed(
                                                4
                                            )}{" "}
                                            $
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        95% 확률로 이 범위 내에서 수익이
                                        발생합니다
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-400 mb-2">
                                        권장사항
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        {stats.sharpeRatio > 1 ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                높은 샤프 비율: 리스크 대비
                                                수익률이 우수합니다
                                            </div>
                                        ) : stats.sharpeRatio > 0 ? (
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                보통 샤프 비율: 적절한 리스크
                                                수준입니다
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-400">
                                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                낮은 샤프 비율: 리스크가
                                                수익보다 큽니다
                                            </div>
                                        )}

                                        {stats.kellyBetSize > 0.5 ? (
                                            <div className="flex items-center gap-2 text-red-400">
                                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                높은 켈리 기준: 참가비를 낮추는
                                                것을 고려하세요
                                            </div>
                                        ) : stats.kellyBetSize > 0.1 ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                적절한 켈리 기준: 참가비 수준이
                                                적정합니다
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                낮은 켈리 기준: 상품 가치를
                                                높이거나 참가비를 낮추세요
                                            </div>
                                        )}

                                        {Math.abs(
                                            result.roi - calculateTheoreticalROI
                                        ) < 2 ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                이론값과 실제값 일치: 공정한
                                                확률 구조입니다
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-orange-400">
                                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                                이론값과 편차 발생: 더 많은
                                                시뮬레이션이 필요할 수 있습니다
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {chartData.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FaChartLine className="text-blue-400" />
                        ROI 추이 (100회마다 갱신)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#374151"
                                />
                                <XAxis
                                    dataKey="run"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    label={{
                                        value: "ROI (%)",
                                        angle: -90,
                                        position: "insideLeft",
                                        style: {
                                            textAnchor: "middle",
                                            fill: "#9CA3AF",
                                        },
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1F2937",
                                        border: "1px solid #374151",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                    formatter={(value: any) => [
                                        `${value.toFixed(2)}%`,
                                        "ROI",
                                    ]}
                                    labelFormatter={(label) =>
                                        `${label}회 시점`
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="roi"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="breakEven"
                                    stroke="#EF4444"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {distributionChartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <TbChartPie className="text-green-400" />
                            상품별 당첨 분포
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, actual }) =>
                                            `${name}: ${actual.toFixed(1)}%`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="actual"
                                    >
                                        {distributionChartData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            )
                                        )}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1F2937",
                                            border: "1px solid #374151",
                                            borderRadius: "8px",
                                            color: "#fff",
                                        }}
                                        formatter={(value: any, name) => [
                                            `${value.toFixed(2)}%`,
                                            name === "actual"
                                                ? "실제 확률"
                                                : "기대 확률",
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <MdAnalytics className="text-yellow-400" />
                            확률 편차 분석
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distributionChartData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9CA3AF"
                                        fontSize={10}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                        label={{
                                            value: "확률 (%)",
                                            angle: -90,
                                            position: "insideLeft",
                                            style: {
                                                textAnchor: "middle",
                                                fill: "#9CA3AF",
                                            },
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1F2937",
                                            border: "1px solid #374151",
                                            borderRadius: "8px",
                                            color: "#fff",
                                        }}
                                        formatter={(value: any, name) => [
                                            `${value.toFixed(2)}%`,
                                            name === "actual"
                                                ? "실제 확률"
                                                : "기대 확률",
                                        ]}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="expected"
                                        fill="#82ca9d"
                                        name="기대 확률"
                                    />
                                    <Bar
                                        dataKey="actual"
                                        fill="#8884d8"
                                        name="실제 확률"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {profitLossChartData.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MdTrendingUp className="text-purple-400" />
                        손익 분포 히스토그램
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profitLossChartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#374151"
                                />
                                <XAxis
                                    dataKey="range"
                                    stroke="#9CA3AF"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    label={{
                                        value: "빈도",
                                        angle: -90,
                                        position: "insideLeft",
                                        style: {
                                            textAnchor: "middle",
                                            fill: "#9CA3AF",
                                        },
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1F2937",
                                        border: "1px solid #374151",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                    formatter={(value: any) => [
                                        `${value}회`,
                                        "빈도",
                                    ]}
                                    labelFormatter={(label) =>
                                        `구간: ${label} BERA`
                                    }
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#8B5CF6"
                                    radius={[2, 2, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
