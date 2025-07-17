"use client";

import { useState, useCallback } from "react";
import {
    FaCalculator,
    FaCog,
    FaRocket,
    FaChartBar,
    FaInfoCircle,
    FaMagic,
    FaThLarge,
    FaBullseye,
    FaShieldAlt,
} from "react-icons/fa";
import {
    MdSpeed,
    MdPrecisionManufacturing,
    MdAutoAwesome,
} from "react-icons/md";

interface SimulationConfig {
    totalRuns: number;
    entryFee: number;
    batchSize: number;
    optimizationGoals?: {
        targetROI?: number;
        targetWinRate?: number;
        riskTolerance?: "conservative" | "moderate" | "aggressive";
        fairnessWeight?: number;
        profitabilityWeight?: number;
    };
}

interface EntryFeeAsset {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    iconUrl?: string;
}

interface Props {
    config: SimulationConfig;
    onConfigChange: (config: SimulationConfig) => void;
    isRunning: boolean;
    entryFeeAsset?: EntryFeeAsset | null;
    onOptimizeSettings?: () => void;
}

const SIMULATION_PRESETS = [
    {
        name: "빠른 테스트",
        description: "빠른 결과 확인용 (개발/테스트)",
        icon: MdSpeed,
        color: "text-green-400",
        config: {
            totalRuns: 1000,
            batchSize: 100,
            optimizationGoals: {
                riskTolerance: "moderate" as const,
                fairnessWeight: 0.5,
                profitabilityWeight: 0.5,
            },
        },
    },
    {
        name: "표준 분석",
        description: "일반적인 래플 분석용 (권장)",
        icon: FaChartBar,
        color: "text-blue-400",
        config: {
            totalRuns: 10000,
            batchSize: 1000,
            optimizationGoals: {
                riskTolerance: "moderate" as const,
                fairnessWeight: 0.6,
                profitabilityWeight: 0.4,
            },
        },
    },
    {
        name: "정밀 분석",
        description: "높은 정확도가 필요한 중요 래플용",
        icon: MdPrecisionManufacturing,
        color: "text-purple-400",
        config: {
            totalRuns: 100000,
            batchSize: 5000,
            optimizationGoals: {
                riskTolerance: "conservative" as const,
                fairnessWeight: 0.7,
                profitabilityWeight: 0.3,
            },
        },
    },
    {
        name: "대규모 검증",
        description: "최대 정확도 분석 (시간 소요)",
        icon: FaRocket,
        color: "text-red-400",
        config: {
            totalRuns: 1000000,
            batchSize: 10000,
            optimizationGoals: {
                riskTolerance: "conservative" as const,
                fairnessWeight: 0.8,
                profitabilityWeight: 0.2,
            },
        },
    },
];

const RISK_TOLERANCE_OPTIONS = [
    {
        value: "conservative",
        label: "보수적",
        description: "안정성과 공정성 우선",
        icon: FaShieldAlt,
        color: "text-green-400",
    },
    {
        value: "moderate",
        label: "균형",
        description: "리스크와 수익의 균형",
        icon: FaThLarge,
        color: "text-blue-400",
    },
    {
        value: "aggressive",
        label: "공격적",
        description: "수익성 최우선",
        icon: FaBullseye,
        color: "text-red-400",
    },
] as const;

export default function SimulationSettings({
    config,
    onConfigChange,
    isRunning,
    entryFeeAsset,
    onOptimizeSettings,
}: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handlePresetSelect = useCallback(
        (preset: (typeof SIMULATION_PRESETS)[0]) => {
            onConfigChange({
                ...config,
                ...preset.config,
            });
        },
        [config, onConfigChange]
    );

    const updateConfig = useCallback(
        (updates: Partial<SimulationConfig>) => {
            onConfigChange({
                ...config,
                ...updates,
            });
        },
        [config, onConfigChange]
    );

    const updateOptimizationGoals = useCallback(
        (
            updates: Partial<NonNullable<SimulationConfig["optimizationGoals"]>>
        ) => {
            onConfigChange({
                ...config,
                optimizationGoals: {
                    ...config.optimizationGoals,
                    ...updates,
                },
            });
        },
        [config, onConfigChange]
    );

    const getEstimatedTime = (runs: number, batchSize: number) => {
        const timePerBatch = 50; // milliseconds
        const totalTime = (runs / batchSize) * timePerBatch;

        if (totalTime < 1000) {
            return `~${Math.ceil(totalTime)}ms`;
        } else if (totalTime < 60000) {
            return `~${(totalTime / 1000).toFixed(1)}초`;
        } else {
            return `~${(totalTime / 60000).toFixed(1)}분`;
        }
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-900/30 rounded-xl">
                        <FaCalculator className="text-2xl text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            시뮬레이션 설정
                        </h3>
                        <p className="text-blue-300 text-sm">
                            {entryFeeAsset
                                ? `${entryFeeAsset.symbol} 기반 분석`
                                : "래플 분석 매개변수 설정"}
                        </p>
                    </div>
                </div>

                {onOptimizeSettings && (
                    <button
                        onClick={onOptimizeSettings}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <FaMagic />
                        AI 최적화
                    </button>
                )}
            </div>

            {/* Asset 정보 */}
            {entryFeeAsset && (
                <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                        💎 참가비 Asset 정보
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-300">이름:</span>
                            <span className="text-white ml-2">
                                {entryFeeAsset.name}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-300">심볼:</span>
                            <span className="text-cyan-400 ml-2 font-medium">
                                {entryFeeAsset.symbol}
                            </span>
                        </div>
                        {entryFeeAsset.description && (
                            <div className="lg:col-span-2">
                                <span className="text-gray-300">설명:</span>
                                <span className="text-gray-200 ml-2">
                                    {entryFeeAsset.description}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 프리셋 선택 */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <MdAutoAwesome className="text-yellow-400" />
                    빠른 설정 프리셋
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {SIMULATION_PRESETS.map((preset, index) => (
                        <button
                            key={index}
                            onClick={() => handlePresetSelect(preset)}
                            disabled={isRunning}
                            className="p-4 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-gray-500 rounded-lg transition-all text-left disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <preset.icon
                                    className={`text-lg ${preset.color}`}
                                />
                                <span className="font-medium text-white">
                                    {preset.name}
                                </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">
                                {preset.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>
                                    {preset.config.totalRuns.toLocaleString()}회
                                </span>
                                <span>배치: {preset.config.batchSize}</span>
                                <span>
                                    {getEstimatedTime(
                                        preset.config.totalRuns,
                                        preset.config.batchSize
                                    )}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 기본 설정 */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FaCog className="text-gray-400" />
                    기본 설정
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            시뮬레이션 횟수
                        </label>
                        <select
                            value={config.totalRuns}
                            onChange={(e) =>
                                updateConfig({
                                    totalRuns: parseInt(e.target.value),
                                })
                            }
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            disabled={isRunning}
                        >
                            <option value={1000}>1,000회 (빠른 테스트)</option>
                            <option value={10000}>10,000회 (표준)</option>
                            <option value={100000}>100,000회 (정밀)</option>
                            <option value={1000000}>
                                1,000,000회 (최고 정확도)
                            </option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            예상 소요시간:{" "}
                            {getEstimatedTime(
                                config.totalRuns,
                                config.batchSize
                            )}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            참가비{" "}
                            {entryFeeAsset && `(${entryFeeAsset.symbol})`}
                        </label>
                        <input
                            type="number"
                            value={config.entryFee}
                            onChange={(e) =>
                                updateConfig({
                                    entryFee: parseFloat(e.target.value) || 0,
                                })
                            }
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            disabled={isRunning}
                            min="0"
                            step="0.01"
                        />
                        {entryFeeAsset && (
                            <p className="text-xs text-gray-500 mt-1">
                                Smart Contract에서 자동 로드됨
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
                                updateConfig({
                                    batchSize: parseInt(e.target.value),
                                })
                            }
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            disabled={isRunning}
                        >
                            <option value={100}>
                                100 (느림, 정확한 진행률)
                            </option>
                            <option value={1000}>1,000 (균형)</option>
                            <option value={5000}>5,000 (빠름)</option>
                            <option value={10000}>10,000 (매우 빠름)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            작을수록 실시간 업데이트, 클수록 성능 향상
                        </p>
                    </div>
                </div>
            </div>

            {/* 고급 설정 */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h4 className="text-md font-semibold text-white flex items-center gap-2">
                        <FaMagic className="text-purple-400" />
                        AI 최적화 목표 설정
                    </h4>
                    <FaInfoCircle
                        className={`text-gray-400 transition-transform ${
                            showAdvanced ? "rotate-180" : ""
                        }`}
                    />
                </button>

                {showAdvanced && (
                    <div className="mt-6 space-y-6">
                        {/* 위험 허용도 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                위험 허용도
                            </label>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                {RISK_TOLERANCE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() =>
                                            updateOptimizationGoals({
                                                riskTolerance: option.value,
                                            })
                                        }
                                        disabled={isRunning}
                                        className={`p-4 border rounded-lg transition-all text-left ${
                                            config.optimizationGoals
                                                ?.riskTolerance === option.value
                                                ? "border-purple-500 bg-purple-900/30"
                                                : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <option.icon
                                                className={`text-lg ${option.color}`}
                                            />
                                            <span className="font-medium text-white">
                                                {option.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300">
                                            {option.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 목표 설정 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    목표 ROI (%)
                                </label>
                                <input
                                    type="number"
                                    value={
                                        config.optimizationGoals?.targetROI ||
                                        ""
                                    }
                                    onChange={(e) =>
                                        updateOptimizationGoals({
                                            targetROI: e.target.value
                                                ? parseFloat(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    disabled={isRunning}
                                    placeholder="예: 5.0"
                                    step="0.1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    AI가 이 목표에 맞춰 최적화 제안
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    목표 당첨률 (%)
                                </label>
                                <input
                                    type="number"
                                    value={
                                        config.optimizationGoals
                                            ?.targetWinRate || ""
                                    }
                                    onChange={(e) =>
                                        updateOptimizationGoals({
                                            targetWinRate: e.target.value
                                                ? parseFloat(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    disabled={isRunning}
                                    placeholder="예: 25.0"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    참여자 만족도에 영향
                                </p>
                            </div>
                        </div>

                        {/* 가중치 설정 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    공정성 중요도:{" "}
                                    {(
                                        (config.optimizationGoals
                                            ?.fairnessWeight || 0.5) * 100
                                    ).toFixed(0)}
                                    %
                                </label>
                                <input
                                    type="range"
                                    value={
                                        config.optimizationGoals
                                            ?.fairnessWeight || 0.5
                                    }
                                    onChange={(e) =>
                                        updateOptimizationGoals({
                                            fairnessWeight: parseFloat(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                    disabled={isRunning}
                                    min="0"
                                    max="1"
                                    step="0.1"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>낮음</span>
                                    <span>높음</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    수익성 중요도:{" "}
                                    {(
                                        (config.optimizationGoals
                                            ?.profitabilityWeight || 0.5) * 100
                                    ).toFixed(0)}
                                    %
                                </label>
                                <input
                                    type="range"
                                    value={
                                        config.optimizationGoals
                                            ?.profitabilityWeight || 0.5
                                    }
                                    onChange={(e) =>
                                        updateOptimizationGoals({
                                            profitabilityWeight: parseFloat(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                    disabled={isRunning}
                                    min="0"
                                    max="1"
                                    step="0.1"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>낮음</span>
                                    <span>높음</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FaInfoCircle className="text-blue-400" />
                                <span className="text-sm font-medium text-blue-300">
                                    AI 최적화 팁
                                </span>
                            </div>
                            <ul className="text-xs text-blue-200 space-y-1">
                                <li>
                                    • 공정성 중요도가 높을수록 균등한 당첨
                                    확률을 권장
                                </li>
                                <li>
                                    • 수익성 중요도가 높을수록 ROI 최적화에 집중
                                </li>
                                <li>
                                    • 보수적 설정은 안정성을, 공격적 설정은
                                    수익성을 우선시
                                </li>
                                <li>
                                    • 목표값을 설정하면 더 정교한 최적화 제안을
                                    받을 수 있음
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
