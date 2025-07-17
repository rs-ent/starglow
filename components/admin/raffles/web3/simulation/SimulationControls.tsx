"use client";

import { useMemo } from "react";
import {
    FaPlay,
    FaPause,
    FaStop,
    FaRocket,
    FaChartLine,
    FaClock,
    FaMemory,
    FaCompactDisc,
    FaDownload,
    FaShare,
    FaHistory,
} from "react-icons/fa";
import { MdSpeed, MdAnalytics } from "react-icons/md";
import { TbMathFunction } from "react-icons/tb";

interface SimulationState {
    isRunning: boolean;
    isPaused: boolean;
    progress: number;
    currentRun: number;
    result: any | null;
    error: string | null;
    progressData: any | null;
}

interface SimulationControls {
    runSimulation: (config: any, seed?: number) => Promise<void>;
    pauseSimulation: () => void;
    resumeSimulation: () => void;
    stopSimulation: () => void;
}

interface Props {
    state: SimulationState;
    controls: SimulationControls;
    config: {
        totalRuns: number;
        entryFee: number;
        prizes: any[];
        batchSize: number;
    };
    canRun: boolean;
    onExportResults?: () => void;
    onSaveConfiguration?: () => void;
    onLoadConfiguration?: () => void;
    theoreticalROI: number;
    assetSymbol?: string;
}

export default function SimulationControls({
    state,
    controls,
    config,
    canRun,
    onExportResults,
    onSaveConfiguration,
    onLoadConfiguration,
    theoreticalROI,
    assetSymbol = "$",
}: Props) {
    // 시뮬레이션 메타데이터 계산
    const simulationMeta = useMemo(() => {
        const timePerBatch = 50; // milliseconds
        const totalBatches = Math.ceil(config.totalRuns / config.batchSize);
        const estimatedTime = totalBatches * timePerBatch;

        // 메모리 사용량 추정 (MB)
        const memoryPerRun = 0.001; // 1KB per run
        const estimatedMemory = config.totalRuns * memoryPerRun;

        // 복잡도 점수 (0-100)
        const complexityScore = Math.min(
            100,
            (config.totalRuns / 10000) * 30 +
                (config.prizes.length / 10) * 20 +
                (config.batchSize < 1000
                    ? 25
                    : config.batchSize > 5000
                    ? 10
                    : 15) +
                25
        );

        return {
            estimatedTime,
            estimatedMemory,
            complexityScore,
            totalBatches,
        };
    }, [config]);

    // 진행률 계산
    const progressStats = useMemo(() => {
        if (!state.isRunning && !state.result) {
            return null;
        }

        const elapsedRuns = state.currentRun;
        const remainingRuns = config.totalRuns - elapsedRuns;
        const progressPercent = (elapsedRuns / config.totalRuns) * 100;

        // 예상 남은 시간 계산
        const timePerRun = simulationMeta.estimatedTime / config.totalRuns;
        const estimatedRemaining = remainingRuns * timePerRun;

        // 실시간 ROI (진행 중인 경우)
        const currentROI = state.progressData?.runningAverage || 0;
        const roiDeviation =
            currentROI - (theoreticalROI / 100) * config.entryFee;

        return {
            progressPercent,
            elapsedRuns,
            remainingRuns,
            estimatedRemaining,
            currentROI,
            roiDeviation,
        };
    }, [state, config, simulationMeta, theoreticalROI]);

    const handleRunSimulation = async () => {
        const seed = Date.now(); // 재현 가능한 시뮬레이션을 위한 시드
        await controls.runSimulation(config, seed);
    };

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${Math.ceil(ms)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}초`;
        return `${(ms / 60000).toFixed(1)}분`;
    };

    const formatMemory = (mb: number) => {
        if (mb < 1) return `${(mb * 1024).toFixed(0)}KB`;
        if (mb < 1024) return `${mb.toFixed(1)}MB`;
        return `${(mb / 1024).toFixed(2)}GB`;
    };

    const getComplexityColor = (score: number) => {
        if (score < 30) return "text-green-400";
        if (score < 60) return "text-yellow-400";
        if (score < 80) return "text-orange-400";
        return "text-red-400";
    };

    const getComplexityLabel = (score: number) => {
        if (score < 30) return "간단";
        if (score < 60) return "보통";
        if (score < 80) return "복잡";
        return "매우 복잡";
    };

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-900/30 rounded-xl">
                        <FaRocket className="text-2xl text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            시뮬레이션 컨트롤
                        </h3>
                        <p className="text-yellow-300 text-sm">
                            {config.totalRuns.toLocaleString()}회 •{" "}
                            {config.prizes.length}개 상품
                        </p>
                    </div>
                </div>

                {/* 유틸리티 버튼들 */}
                <div className="flex gap-2">
                    {onLoadConfiguration && (
                        <button
                            onClick={onLoadConfiguration}
                            disabled={state.isRunning}
                            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            title="설정 불러오기"
                        >
                            <FaHistory />
                        </button>
                    )}
                    {onSaveConfiguration && (
                        <button
                            onClick={onSaveConfiguration}
                            disabled={state.isRunning}
                            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            title="설정 저장"
                        >
                            <FaDownload />
                        </button>
                    )}
                    {state.result && onExportResults && (
                        <button
                            onClick={onExportResults}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="결과 내보내기"
                        >
                            <FaShare />
                        </button>
                    )}
                </div>
            </div>

            {/* 시뮬레이션 메타 정보 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FaClock className="text-blue-400 text-sm" />
                        <span className="text-sm text-gray-400">예상 시간</span>
                    </div>
                    <div className="text-white font-semibold">
                        {formatTime(simulationMeta.estimatedTime)}
                    </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FaMemory className="text-green-400 text-sm" />
                        <span className="text-sm text-gray-400">메모리</span>
                    </div>
                    <div className="text-white font-semibold">
                        {formatMemory(simulationMeta.estimatedMemory)}
                    </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FaCompactDisc className="text-purple-400 text-sm" />
                        <span className="text-sm text-gray-400">복잡도</span>
                    </div>
                    <div
                        className={`font-semibold ${getComplexityColor(
                            simulationMeta.complexityScore
                        )}`}
                    >
                        {getComplexityLabel(simulationMeta.complexityScore)}
                    </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <TbMathFunction className="text-yellow-400 text-sm" />
                        <span className="text-sm text-gray-400">이론 ROI</span>
                    </div>
                    <div
                        className={`font-semibold ${
                            theoreticalROI >= 0
                                ? "text-green-400"
                                : "text-red-400"
                        }`}
                    >
                        {theoreticalROI.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* 메인 컨트롤 버튼 */}
            <div className="space-y-4">
                <div className="flex gap-3">
                    {!state.isRunning ? (
                        <button
                            onClick={handleRunSimulation}
                            disabled={!canRun}
                            className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaPlay />
                            <span>시뮬레이션 시작</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={controls.pauseSimulation}
                                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg font-medium transition-all"
                            >
                                <FaPause />
                                <span>
                                    {state.isPaused ? "재개" : "일시정지"}
                                </span>
                            </button>
                            <button
                                onClick={controls.stopSimulation}
                                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all"
                            >
                                <FaStop />
                                <span>중지</span>
                            </button>
                        </>
                    )}
                </div>

                {!canRun && (
                    <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-orange-400">
                            <FaClock />
                            <span className="text-sm font-medium">
                                시뮬레이션 준비 중
                            </span>
                        </div>
                        <p className="text-sm text-orange-300 mt-1">
                            상품을 추가하고 설정을 완료해주세요.
                        </p>
                    </div>
                )}
            </div>

            {/* 진행률 표시 */}
            {(state.isRunning || progressStats) && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">진행률</span>
                        <span className="text-white font-medium">
                            {progressStats?.progressPercent.toFixed(1)}%
                        </span>
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                            style={{
                                width: `${
                                    progressStats?.progressPercent || 0
                                }%`,
                            }}
                        >
                            <div className="h-full bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">진행</span>
                            <div className="text-white font-medium">
                                {progressStats?.elapsedRuns.toLocaleString()} /{" "}
                                {config.totalRuns.toLocaleString()}
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-400">남은 시간</span>
                            <div className="text-white font-medium">
                                {progressStats
                                    ? formatTime(
                                          progressStats.estimatedRemaining
                                      )
                                    : "-"}
                            </div>
                        </div>

                        {progressStats?.currentROI !== undefined && (
                            <div>
                                <span className="text-gray-400">
                                    실시간 ROI
                                </span>
                                <div
                                    className={`font-medium ${
                                        progressStats.currentROI >= 0
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {(
                                        (progressStats.currentROI /
                                            config.entryFee) *
                                        100
                                    ).toFixed(2)}
                                    %
                                </div>
                            </div>
                        )}

                        {state.isPaused && (
                            <div>
                                <span className="text-yellow-400">
                                    일시정지됨
                                </span>
                                <div className="text-yellow-300 font-medium">
                                    대기 중
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 실시간 통계 */}
                    {state.progressData?.currentStats && (
                        <div className="bg-gray-700/30 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <MdAnalytics className="text-cyan-400" />
                                실시간 통계 미리보기
                            </h4>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <span className="text-gray-400">
                                        평균 수익
                                    </span>
                                    <div className="text-white font-medium">
                                        {state.progressData.currentStats.mean?.toFixed(
                                            4
                                        )}{" "}
                                        {assetSymbol}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        표준편차
                                    </span>
                                    <div className="text-white font-medium">
                                        {state.progressData.currentStats.stdDev?.toFixed(
                                            4
                                        )}{" "}
                                        {assetSymbol}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        샤프 비율
                                    </span>
                                    <div
                                        className={`font-medium ${
                                            (state.progressData.currentStats
                                                .sharpeRatio || 0) > 0.5
                                                ? "text-green-400"
                                                : "text-yellow-400"
                                        }`}
                                    >
                                        {state.progressData.currentStats.sharpeRatio?.toFixed(
                                            3
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        공정성
                                    </span>
                                    <div
                                        className={`font-medium ${
                                            (state.progressData.currentStats
                                                .fairnessIndex || 0) > 0.7
                                                ? "text-green-400"
                                                : "text-yellow-400"
                                        }`}
                                    >
                                        {(
                                            (state.progressData.currentStats
                                                .fairnessIndex || 0) * 100
                                        ).toFixed(1)}
                                        %
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 에러 표시 */}
            {state.error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <FaStop />
                        <span className="font-medium">시뮬레이션 오류</span>
                    </div>
                    <p className="text-red-300 text-sm">{state.error}</p>
                    <button
                        onClick={controls.stopSimulation}
                        className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                        상태 초기화
                    </button>
                </div>
            )}

            {/* 완료 알림 */}
            {state.result && !state.isRunning && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <FaChartLine />
                        <span className="font-medium">시뮬레이션 완료</span>
                    </div>
                    <p className="text-green-300 text-sm">
                        {config.totalRuns.toLocaleString()}회 시뮬레이션이
                        성공적으로 완료되었습니다.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleRunSimulation}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                            다시 실행
                        </button>
                        {onExportResults && (
                            <button
                                onClick={onExportResults}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                                결과 내보내기
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 성능 팁 */}
            {simulationMeta.complexityScore > 70 && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <MdSpeed />
                        <span className="font-medium">성능 최적화 팁</span>
                    </div>
                    <ul className="text-blue-300 text-sm space-y-1">
                        {config.batchSize < 1000 && (
                            <li>
                                • 배치 크기를 1000 이상으로 늘리면 성능이
                                향상됩니다
                            </li>
                        )}
                        {config.totalRuns > 100000 && (
                            <li>
                                • 100만회 이상 시뮬레이션은 시간이 오래 걸릴 수
                                있습니다
                            </li>
                        )}
                        {simulationMeta.estimatedMemory > 100 && (
                            <li>
                                • 대용량 시뮬레이션으로 인해 메모리 사용량이
                                높습니다
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
