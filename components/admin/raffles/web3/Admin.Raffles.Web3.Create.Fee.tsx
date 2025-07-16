"use client";

import { useCallback, useMemo, useState } from "react";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import {
    FaCoins,
    FaDollarSign,
    FaCalculator,
    FaInfoCircle,
    FaLightbulb,
    FaCheckCircle,
    FaExclamationTriangle,
    FaMagic,
    FaEye,
    FaPercent,
    FaPiggyBank,
    FaDatabase,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

// 참가비 프리셋 (오프체인 에셋 기준)
const FEE_PRESETS = [
    {
        id: "free",
        name: "무료 래플",
        description: "참가비 없음",
        icon: FaPiggyBank,
        color: "text-green-400",
        amount: "0",
        targetAudience: "대중 참여",
    },
    {
        id: "low",
        name: "저렴한 래플",
        description: "낮은 진입 장벽",
        icon: FaCoins,
        color: "text-blue-400",
        amount: "10",
        targetAudience: "일반 사용자",
    },
    {
        id: "standard",
        name: "표준 래플",
        description: "적당한 참가비",
        icon: FaDollarSign,
        color: "text-yellow-400",
        amount: "50",
        targetAudience: "적극적 참여자",
    },
    {
        id: "premium",
        name: "프리미엄 래플",
        description: "높은 가치 이벤트",
        icon: FaDatabase,
        color: "text-purple-400",
        amount: "100",
        targetAudience: "VIP 고객",
    },
];

interface Asset {
    id: string;
    name: string;
    symbol: string;
    description?: string;
}

export function AdminRafflesWeb3CreateFee({ data, updateData }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    // 오프체인 에셋 가져오기
    const assetsResult = useAssetsGet({ getAssetsInput: {} });
    const offchainAssets = (assetsResult.assets?.assets || []) as Asset[];

    // 현재 선택된 에셋 찾기
    const selectedAsset = useMemo(() => {
        return (
            offchainAssets.find(
                (asset) => asset.id === data.fee.participationFeeAsset
            ) || offchainAssets[0]
        );
    }, [offchainAssets, data.fee.participationFeeAsset]);

    const handleFeeChange = useCallback(
        (field: string, value: any) => {
            updateData("fee", { [field]: value });
        },
        [updateData]
    );

    // 에셋 선택 함수
    const selectAsset = useCallback(
        (asset: Asset) => {
            handleFeeChange("participationFeeAsset", asset.id);
            handleFeeChange("participationFeeAssetId", asset.id);
        },
        [handleFeeChange]
    );

    // 프리셋 적용 함수
    const applyPreset = useCallback(
        (preset: (typeof FEE_PRESETS)[0]) => {
            handleFeeChange("participationFeeAmount", preset.amount);
        },
        [handleFeeChange]
    );

    // 수익 계산
    const revenueCalculation = useMemo(() => {
        const feeAmount = parseFloat(data.fee.participationFeeAmount) || 0;
        const maxParticipants = data.settings.participationLimit || 0;
        const maxTicketsPerPerson =
            data.settings.participationLimitPerPlayer || 1;

        const scenarios = {
            conservative: Math.floor(maxParticipants * 0.3),
            realistic: Math.floor(maxParticipants * 0.6),
            optimistic: Math.floor(maxParticipants * 0.9),
        };

        const calculations = Object.entries(scenarios).map(
            ([scenario, participants]) => {
                const totalTickets =
                    participants *
                    (maxTicketsPerPerson > 1
                        ? Math.ceil(maxTicketsPerPerson * 0.7)
                        : 1);
                const grossRevenue = totalTickets * feeAmount;

                // 오프체인 에셋 운영비 (3%)
                const operatingCosts = grossRevenue * 0.03;
                const netRevenue = grossRevenue - operatingCosts;

                return {
                    scenario,
                    participants,
                    totalTickets,
                    grossRevenue,
                    operatingCosts,
                    netRevenue,
                    participationRate: (participants / maxParticipants) * 100,
                };
            }
        );

        return calculations;
    }, [data.fee.participationFeeAmount, data.settings]);

    // 권장사항 계산
    const recommendations = useMemo(() => {
        const recs = [];
        const feeAmount = parseFloat(data.fee.participationFeeAmount) || 0;

        if (feeAmount === 0) {
            recs.push({
                type: "info",
                message: "무료 래플은 참여도는 높지만 수익성이 없습니다.",
                suggestion:
                    "프로모션이나 브랜드 인지도 향상 목적에 적합합니다.",
            });
        }

        if (feeAmount > 200) {
            recs.push({
                type: "warning",
                message: "높은 참가비는 참여율을 크게 떨어뜨릴 수 있습니다.",
                suggestion: "상품 가치와 비교하여 적정 수준인지 검토해주세요.",
            });
        }

        if (feeAmount >= 20 && feeAmount <= 100) {
            recs.push({
                type: "success",
                message: "적정한 참가비 수준입니다.",
                suggestion: "참여도와 수익성의 균형이 좋습니다.",
            });
        }

        if (offchainAssets.length > 0) {
            recs.push({
                type: "info",
                message: "오프체인 에셋을 사용하여 가스비가 없습니다.",
                suggestion: "비용 효율적이며 빠른 처리가 가능합니다.",
            });
        }

        return recs;
    }, [data.fee.participationFeeAmount, offchainAssets.length]);

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-6 border border-cyan-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaCoins className="mr-3 text-cyan-400" size={20} />
                        참가비 설정 (오프체인 에셋)
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-cyan-900/50 text-cyan-400 rounded-full text-xs font-medium border border-cyan-700">
                            가스비 없음
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    플랫폼 내 포인트, 크레딧 등 오프체인 에셋을 참가비로
                    사용합니다. 가스비가 없어 비용 효율적이며 빠른 처리가
                    가능합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 메인 설정 영역 */}
                <div className="xl:col-span-2 space-y-6">
                    {/* 오프체인 에셋 선택 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaDatabase
                                className="mr-3 text-cyan-400"
                                size={16}
                            />
                            오프체인 에셋 선택
                        </h4>

                        {offchainAssets.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {offchainAssets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                            selectedAsset?.id === asset.id
                                                ? "bg-cyan-900/30 border-cyan-600"
                                                : "bg-gray-750 border-gray-600 hover:border-gray-500"
                                        }`}
                                        onClick={() => selectAsset(asset)}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="text-2xl">🏦</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">
                                                        {asset.symbol}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {asset.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-400">
                                                {asset.description ||
                                                    "오프체인 에셋"}
                                            </p>
                                        </div>

                                        {selectedAsset?.id === asset.id && (
                                            <div className="mt-3 pt-3 border-t border-cyan-700">
                                                <FaCheckCircle
                                                    className="text-cyan-400 mx-auto"
                                                    size={16}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaInfoCircle
                                    className="text-gray-400 mx-auto mb-2"
                                    size={24}
                                />
                                <p className="text-gray-400">
                                    등록된 오프체인 에셋이 없습니다.
                                </p>
                                <p className="text-sm text-gray-500">
                                    관리자 &gt; 자산 관리에서 에셋을 먼저
                                    등록해주세요.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 참가비 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaDollarSign
                                className="mr-3 text-yellow-400"
                                size={16}
                            />
                            참가비 금액 설정
                        </h4>

                        {/* 프리셋 선택 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-4">
                                빠른 설정 (프리셋)
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {FEE_PRESETS.map((preset) => {
                                    const IconComponent = preset.icon;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            className="p-3 bg-gray-750 border border-gray-600 rounded-lg hover:border-gray-500 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <IconComponent
                                                    className={preset.color}
                                                    size={14}
                                                />
                                                <span className="font-medium text-white text-sm">
                                                    {preset.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-1">
                                                {preset.amount === "0"
                                                    ? "무료"
                                                    : `${preset.amount} ${
                                                          selectedAsset?.symbol ||
                                                          "에셋"
                                                      }`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {preset.targetAudience}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 수동 금액 입력 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaCoins
                                        className="inline mr-2 text-yellow-400"
                                        size={14}
                                    />
                                    참가비 ({selectedAsset?.symbol || "에셋"}) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={data.fee.participationFeeAmount}
                                        onChange={(e) =>
                                            handleFeeChange(
                                                "participationFeeAmount",
                                                e.target.value
                                            )
                                        }
                                        min="0"
                                        step="1"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-16 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <span className="text-gray-400 text-sm font-medium">
                                            {selectedAsset?.symbol || "에셋"}
                                        </span>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    티켓 1개당 참가비
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaDatabase
                                        className="inline mr-2 text-cyan-400"
                                        size={14}
                                    />
                                    에셋 정보
                                </label>
                                <div className="bg-gray-750 border border-gray-600 rounded-lg px-4 py-3">
                                    {selectedAsset ? (
                                        <div>
                                            <div className="text-white font-medium">
                                                {selectedAsset.name}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {selectedAsset.description ||
                                                    "오프체인 에셋"}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            에셋을 선택해주세요
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    선택된 오프체인 에셋 정보
                                </p>
                            </div>
                        </div>

                        {/* 고급 설정 */}
                        <div className="mt-6">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                <FaEye size={14} />
                                <span className="text-sm">
                                    {showAdvanced
                                        ? "고급 설정 숨기기"
                                        : "고급 설정 보기"}
                                </span>
                            </button>

                            {showAdvanced && (
                                <div className="mt-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                최소 참가비
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                                placeholder="1"
                                                min="0"
                                                step="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                할인 정책
                                            </label>
                                            <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                                                <option value="none">
                                                    할인 없음
                                                </option>
                                                <option value="early_bird">
                                                    얼리버드 할인
                                                </option>
                                                <option value="bulk">
                                                    대량 구매 할인
                                                </option>
                                                <option value="loyalty">
                                                    충성도 할인
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 참가비 통계 및 정보 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaInfoCircle
                                className="mr-3 text-cyan-400"
                                size={16}
                            />
                            참가비 정보
                        </h4>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <h5 className="font-medium text-white mb-3">
                                    현재 설정
                                </h5>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">
                                            선택된 에셋:
                                        </span>
                                        <span className="text-white">
                                            {selectedAsset?.symbol || "미선택"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">
                                            참가비:
                                        </span>
                                        <span className="text-white">
                                            {data.fee.participationFeeAmount ||
                                                "0"}{" "}
                                            {selectedAsset?.symbol || "에셋"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">
                                            타입:
                                        </span>
                                        <span className="text-cyan-400">
                                            오프체인 에셋
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <h5 className="font-medium text-white mb-3">
                                    장점
                                </h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-green-300">
                                            가스비 없음
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-green-300">
                                            즉시 처리
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-green-300">
                                            사용자 친화적
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-green-300">
                                            안정적 처리
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 사이드바 - 수익 계산기 */}
                <div className="space-y-6">
                    {/* 수익 계산기 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaCalculator
                                className="mr-3 text-green-400"
                                size={16}
                            />
                            수익 계산기
                        </h4>

                        {selectedAsset ? (
                            <div className="space-y-4">
                                {revenueCalculation.map((calc, index) => (
                                    <div
                                        key={calc.scenario}
                                        className={`p-4 rounded-lg border ${
                                            calc.scenario === "realistic"
                                                ? "bg-blue-900/30 border-blue-700"
                                                : calc.scenario === "optimistic"
                                                ? "bg-green-900/30 border-green-700"
                                                : "bg-gray-750 border-gray-600"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span
                                                className={`font-medium ${
                                                    calc.scenario ===
                                                    "realistic"
                                                        ? "text-blue-400"
                                                        : calc.scenario ===
                                                          "optimistic"
                                                        ? "text-green-400"
                                                        : "text-gray-300"
                                                }`}
                                            >
                                                {calc.scenario ===
                                                "conservative"
                                                    ? "보수적"
                                                    : calc.scenario ===
                                                      "realistic"
                                                    ? "현실적"
                                                    : "낙관적"}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                {calc.participationRate.toFixed(
                                                    0
                                                )}
                                                % 참여
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">
                                                    참가자:
                                                </span>
                                                <span className="text-white">
                                                    {calc.participants}명
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">
                                                    총 티켓:
                                                </span>
                                                <span className="text-white">
                                                    {calc.totalTickets}개
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">
                                                    총 수익:
                                                </span>
                                                <div className="text-right">
                                                    <div className="text-white font-medium">
                                                        {calc.grossRevenue.toFixed(
                                                            0
                                                        )}{" "}
                                                        {selectedAsset.symbol}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-t border-gray-600 pt-2">
                                                <span className="text-gray-300">
                                                    순수익:
                                                </span>
                                                <div className="text-right">
                                                    <div
                                                        className={`font-medium ${
                                                            calc.scenario ===
                                                            "realistic"
                                                                ? "text-blue-400"
                                                                : calc.scenario ===
                                                                  "optimistic"
                                                                ? "text-green-400"
                                                                : "text-gray-300"
                                                        }`}
                                                    >
                                                        {calc.netRevenue.toFixed(
                                                            0
                                                        )}{" "}
                                                        {selectedAsset.symbol}
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                        운영비 3% 차감 후
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaInfoCircle
                                    className="text-gray-400 mx-auto mb-2"
                                    size={20}
                                />
                                <p className="text-gray-400 text-sm">
                                    에셋을 선택하면 수익 계산이 표시됩니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 권장사항 */}
                    {recommendations.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <FaLightbulb
                                    className="mr-3 text-yellow-400"
                                    size={16}
                                />
                                권장사항
                            </h4>

                            <div className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${
                                            rec.type === "warning"
                                                ? "bg-yellow-900/30 border-yellow-700"
                                                : rec.type === "success"
                                                ? "bg-green-900/30 border-green-700"
                                                : "bg-cyan-900/30 border-cyan-700"
                                        }`}
                                    >
                                        <div className="flex items-start gap-2 mb-2">
                                            {rec.type === "warning" ? (
                                                <FaExclamationTriangle
                                                    className="text-yellow-400"
                                                    size={14}
                                                />
                                            ) : rec.type === "success" ? (
                                                <FaCheckCircle
                                                    className="text-green-400"
                                                    size={14}
                                                />
                                            ) : (
                                                <FaInfoCircle
                                                    className="text-cyan-400"
                                                    size={14}
                                                />
                                            )}
                                            <span
                                                className={`font-medium text-sm ${
                                                    rec.type === "warning"
                                                        ? "text-yellow-400"
                                                        : rec.type === "success"
                                                        ? "text-green-400"
                                                        : "text-cyan-400"
                                                }`}
                                            >
                                                {rec.type === "warning"
                                                    ? "주의"
                                                    : rec.type === "success"
                                                    ? "좋음"
                                                    : "정보"}
                                            </span>
                                        </div>
                                        <p
                                            className={`text-xs mb-2 ${
                                                rec.type === "warning"
                                                    ? "text-yellow-300"
                                                    : rec.type === "success"
                                                    ? "text-green-300"
                                                    : "text-cyan-300"
                                            }`}
                                        >
                                            {rec.message}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            💡 {rec.suggestion}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 빠른 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaMagic
                                className="mr-3 text-purple-400"
                                size={16}
                            />
                            빠른 설정
                        </h4>

                        <div className="space-y-3">
                            <button
                                onClick={() => applyPreset(FEE_PRESETS[0])}
                                className="w-full p-3 bg-green-900/30 border border-green-700 rounded-lg hover:border-green-600 transition-all text-left"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FaPiggyBank
                                        className="text-green-400"
                                        size={14}
                                    />
                                    <span className="font-medium text-white text-sm">
                                        무료 프로모션 래플
                                    </span>
                                </div>
                                <p className="text-xs text-green-300">
                                    0 참가비, 브랜드 마케팅용
                                </p>
                            </button>

                            <button
                                onClick={() => applyPreset(FEE_PRESETS[1])}
                                className="w-full p-3 bg-blue-900/30 border border-blue-700 rounded-lg hover:border-blue-600 transition-all text-left"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FaCoins
                                        className="text-blue-400"
                                        size={14}
                                    />
                                    <span className="font-medium text-white text-sm">
                                        저렴한 래플
                                    </span>
                                </div>
                                <p className="text-xs text-blue-300">
                                    10 에셋, 대중 참여형
                                </p>
                            </button>

                            <button
                                onClick={() => applyPreset(FEE_PRESETS[2])}
                                className="w-full p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg hover:border-yellow-600 transition-all text-left"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FaDollarSign
                                        className="text-yellow-400"
                                        size={14}
                                    />
                                    <span className="font-medium text-white text-sm">
                                        표준 래플
                                    </span>
                                </div>
                                <p className="text-xs text-yellow-300">
                                    50 에셋, 균형잡힌 수익성
                                </p>
                            </button>

                            <button
                                onClick={() => applyPreset(FEE_PRESETS[3])}
                                className="w-full p-3 bg-purple-900/30 border border-purple-700 rounded-lg hover:border-purple-600 transition-all text-left"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FaDatabase
                                        className="text-purple-400"
                                        size={14}
                                    />
                                    <span className="font-medium text-white text-sm">
                                        프리미엄 래플
                                    </span>
                                </div>
                                <p className="text-xs text-purple-300">
                                    100 에셋, VIP 고객 대상
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
