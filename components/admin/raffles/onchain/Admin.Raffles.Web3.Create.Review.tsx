"use client";

import { useState } from "react";
import {
    FaCheck,
    FaEdit,
    FaExclamationTriangle,
    FaInfoCircle,
    FaRocket,
    FaGlobe,
    FaClock,
    FaCog,
    FaCoins,
    FaGift,
    FaEye,
    FaSpinner,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
    onEditStep: (step: number) => void;
    creationProgress: {
        step: number;
        total: number;
        status: "idle" | "creating" | "completed" | "error";
        raffleId: string;
        error: string | null;
    };
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

const V2_CREATION_STEPS = [
    {
        id: "create",
        title: "래플 생성",
        description: "기본 래플 정보를 블록체인에 기록",
        icon: FaRocket,
        color: "blue",
    },
    {
        id: "allocate",
        title: "상품 할당",
        description: "각 상품을 개별적으로 컨트랙트에 할당",
        icon: FaGift,
        color: "yellow",
    },
    {
        id: "activate",
        title: "래플 활성화",
        description: "모든 준비가 완료된 후 래플을 활성화",
        icon: FaCheck,
        color: "green",
    },
];

export function AdminRafflesWeb3CreateReview({
    data,
    onSubmit,
    isSubmitting,
    onEditStep,
    creationProgress,
}: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const validateForm = (): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!data.contractAddress) errors.push("래플 컨트랙트를 선택해주세요.");
        if (!data.networkId) errors.push("네트워크를 선택해주세요.");
        if (!data.walletAddress) errors.push("에스크로 지갑을 선택해주세요.");
        if (!data.basicInfo.title.trim())
            errors.push("래플 제목을 입력해주세요.");

        const currentTime = Math.floor(Date.now() / 1000);
        if (data.timing.startDate <= currentTime) {
            errors.push("시작 시간은 현재 시간보다 미래여야 합니다.");
        }
        if (data.timing.endDate <= data.timing.startDate) {
            errors.push("종료 시간은 시작 시간보다 늦어야 합니다.");
        }
        if (
            !data.timing.instantDraw &&
            data.timing.drawDate < data.timing.endDate
        ) {
            errors.push("추첨 시간은 종료 시간 이후여야 합니다.");
        }

        if (data.prizes.length === 0) {
            errors.push("최소 1개의 상품을 추가해주세요.");
        }

        if (data.settings.participationLimit <= 0) {
            warnings.push("참가 제한이 0입니다. 무제한 참가가 허용됩니다.");
        }

        if (parseFloat(data.fee.participationFeeAmount) === 0) {
            warnings.push("참가비가 0입니다. 무료 래플로 설정됩니다.");
        }

        if (data.prizes.some((p) => p.quantity <= 0)) {
            errors.push("모든 상품의 티켓 수량은 1개 이상이어야 합니다.");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    };

    const validation = validateForm();

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getEstimatedParticipants = () => {
        const feeAmount = parseFloat(data.fee.participationFeeAmount) || 0;
        if (feeAmount === 0) return data.settings.participationLimit;

        const baseParticipation = Math.min(
            data.settings.participationLimit,
            1000
        );
        const feeImpact = Math.max(0.1, 1 - (feeAmount / 100) * 0.1);
        return Math.floor(baseParticipation * feeImpact);
    };

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaCheck className="mr-3 text-green-400" size={20} />
                        최종 확인 및 V2 래플 생성
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-medium border border-green-700">
                            RafflesV2
                        </div>
                        <div className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs font-medium border border-blue-700">
                            3단계 생성
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    설정한 내용을 최종 확인하고 V2 래플을 생성합니다. V2는 3단계
                    프로세스로 진행됩니다: 래플 생성 → 상품 할당 → 래플 활성화
                </p>
            </div>

            {/* V2 생성 프로세스 설명 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FaRocket className="mr-3 text-purple-400" size={16} />
                    V2 생성 프로세스
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {V2_CREATION_STEPS.map((step, index) => {
                        const IconComponent = step.icon;
                        const isActive =
                            creationProgress.step >= index + 1 ||
                            (creationProgress.step === index &&
                                creationProgress.status !== "idle");
                        const isCompleted = creationProgress.step > index;
                        const isError =
                            creationProgress.status === "error" &&
                            creationProgress.step === index;

                        return (
                            <div
                                key={step.id}
                                className={`p-4 rounded-lg border transition-all ${
                                    isError
                                        ? "bg-red-900/30 border-red-700"
                                        : isCompleted
                                        ? "bg-green-900/30 border-green-700"
                                        : isActive
                                        ? `bg-${step.color}-900/30 border-${step.color}-700`
                                        : "bg-gray-750 border-gray-600"
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            isError
                                                ? "bg-red-600"
                                                : isCompleted
                                                ? "bg-green-600"
                                                : isActive
                                                ? `bg-${step.color}-600`
                                                : "bg-gray-600"
                                        }`}
                                    >
                                        {isError ? (
                                            <FaExclamationTriangle
                                                className="text-white"
                                                size={14}
                                            />
                                        ) : isCompleted ? (
                                            <FaCheck
                                                className="text-white"
                                                size={14}
                                            />
                                        ) : isActive ? (
                                            <FaSpinner
                                                className="text-white animate-spin"
                                                size={14}
                                            />
                                        ) : (
                                            <IconComponent
                                                className="text-white"
                                                size={14}
                                            />
                                        )}
                                    </div>
                                    <span
                                        className={`font-medium ${
                                            isError
                                                ? "text-red-400"
                                                : isCompleted
                                                ? "text-green-400"
                                                : isActive
                                                ? `text-${step.color}-400`
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {index + 1}. {step.title}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">
                                    {step.description}
                                </p>

                                {/* 추가 진행 정보 */}
                                {isError && (
                                    <div className="text-xs text-red-400 mt-1">
                                        생성 실패: {creationProgress.error}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 설정 요약 */}
                <div className="xl:col-span-2 space-y-6">
                    {/* 유효성 검사 */}
                    {(!validation.isValid ||
                        validation.warnings.length > 0) && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <FaExclamationTriangle
                                    className="mr-3 text-yellow-400"
                                    size={16}
                                />
                                검증 결과
                            </h4>

                            {validation.errors.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-red-400 font-medium mb-2">
                                        오류 ({validation.errors.length})
                                    </h5>
                                    <div className="space-y-2">
                                        {validation.errors.map(
                                            (error, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    <FaExclamationTriangle
                                                        className="text-red-400 mt-0.5 flex-shrink-0"
                                                        size={12}
                                                    />
                                                    <span className="text-red-300">
                                                        {error}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {validation.warnings.length > 0 && (
                                <div>
                                    <h5 className="text-yellow-400 font-medium mb-2">
                                        주의사항 ({validation.warnings.length})
                                    </h5>
                                    <div className="space-y-2">
                                        {validation.warnings.map(
                                            (warning, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    <FaInfoCircle
                                                        className="text-yellow-400 mt-0.5 flex-shrink-0"
                                                        size={12}
                                                    />
                                                    <span className="text-yellow-300">
                                                        {warning}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 기본 정보 요약 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-white flex items-center">
                                <FaGlobe
                                    className="mr-3 text-blue-400"
                                    size={16}
                                />
                                기본 정보
                            </h4>
                            <button
                                onClick={() => onEditStep(0)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <FaEdit size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-gray-400 text-sm">
                                        래플 제목
                                    </span>
                                    <p className="text-white font-medium">
                                        {data.basicInfo.title}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm">
                                        설명
                                    </span>
                                    <p className="text-white text-sm">
                                        {data.basicInfo.description ||
                                            "설명 없음"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-gray-400 text-sm">
                                        네트워크
                                    </span>
                                    <p className="text-white font-medium">
                                        {data.networkId}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm">
                                        컨트랙트
                                    </span>
                                    <p className="text-white font-mono text-sm">
                                        {data.contractAddress}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 일정 및 설정 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white flex items-center">
                                    <FaClock
                                        className="mr-3 text-orange-400"
                                        size={16}
                                    />
                                    일정
                                </h4>
                                <button
                                    onClick={() => onEditStep(1)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <FaEdit size={14} />
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">시작:</span>
                                    <span className="text-white ml-2">
                                        {formatDate(data.timing.startDate)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">종료:</span>
                                    <span className="text-white ml-2">
                                        {formatDate(data.timing.endDate)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">추첨:</span>
                                    <span className="text-white ml-2">
                                        {data.timing.instantDraw
                                            ? "즉시 추첨"
                                            : formatDate(data.timing.drawDate)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white flex items-center">
                                    <FaCog
                                        className="mr-3 text-purple-400"
                                        size={16}
                                    />
                                    설정
                                </h4>
                                <button
                                    onClick={() => onEditStep(2)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <FaEdit size={14} />
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">
                                        참가 제한:
                                    </span>
                                    <span className="text-white ml-2">
                                        {data.settings.participationLimit === -1
                                            ? "무제한"
                                            : `${data.settings.participationLimit}명`}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        개인 제한:
                                    </span>
                                    <span className="text-white ml-2">
                                        {data.settings
                                            .participationLimitPerPlayer === -1
                                            ? "무제한"
                                            : `${data.settings.participationLimitPerPlayer}회`}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        중복 당첨:
                                    </span>
                                    <span className="text-white ml-2">
                                        {data.settings.allowMultipleWins
                                            ? "허용"
                                            : "불허용"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        동적 가중치:
                                    </span>
                                    <span className="text-white ml-2">
                                        {data.settings.dynamicWeight
                                            ? "활성화"
                                            : "비활성화"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 참가비 및 상품 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white flex items-center">
                                    <FaCoins
                                        className="mr-3 text-yellow-400"
                                        size={16}
                                    />
                                    참가비
                                </h4>
                                <button
                                    onClick={() => onEditStep(3)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <FaEdit size={14} />
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">에셋:</span>
                                    <span className="text-white ml-2">
                                        {data.fee.participationFeeAsset}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">금액:</span>
                                    <span className="text-white ml-2">
                                        {data.fee.participationFeeAmount}{" "}
                                        {data.fee.participationFeeAsset}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">타입:</span>
                                    <span className="text-cyan-400 ml-2">
                                        오프체인 에셋
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white flex items-center">
                                    <FaGift
                                        className="mr-3 text-green-400"
                                        size={16}
                                    />
                                    상품 요약
                                </h4>
                                <button
                                    onClick={() => onEditStep(4)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <FaEdit size={14} />
                                </button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">
                                        총 상품:
                                    </span>
                                    <span className="text-white ml-2">
                                        {data.prizes.length}개
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        총 수량:
                                    </span>
                                    <span className="text-white ml-2">
                                        {data.prizes.reduce(
                                            (sum, p) => sum + p.quantity,
                                            0
                                        )}
                                        개
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 상세 상품 목록 */}
                    {showAdvanced && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4">
                                상품 상세 목록
                            </h4>
                            <div className="space-y-3">
                                {data.prizes.map((prize, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-3 bg-gray-750 rounded-lg border border-gray-600"
                                    >
                                        {prize.imageUrl && (
                                            <img
                                                src={prize.imageUrl}
                                                alt={prize.title}
                                                className="w-12 h-12 object-cover rounded border border-gray-600"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="font-medium text-white">
                                                {prize.title}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                수량: {prize.quantity}개 |
                                                희귀도: {prize.rarity} | 순서:{" "}
                                                {prize.order}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {prize.userValue
                                                ? `${prize.userValue.toLocaleString()}원`
                                                : "가치 미설정"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 사이드바 - 분석 및 작업 */}
                <div className="space-y-6">
                    {/* 래플 분석 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaEye className="mr-3 text-cyan-400" size={16} />
                            래플 분석
                        </h4>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-750 rounded-lg border border-gray-600">
                                <div className="text-sm text-gray-400 mb-1">
                                    예상 참여자
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {getEstimatedParticipants().toLocaleString()}
                                    명
                                </div>
                                <div className="text-xs text-gray-500">
                                    참가비와 제한 기준
                                </div>
                            </div>

                            <div className="p-3 bg-gray-750 rounded-lg border border-gray-600">
                                <div className="text-sm text-gray-400 mb-1">
                                    예상 수익
                                </div>
                                <div className="text-xl font-bold text-green-400">
                                    {(
                                        getEstimatedParticipants() *
                                        parseFloat(
                                            data.fee.participationFeeAmount ||
                                                "0"
                                        )
                                    ).toLocaleString()}{" "}
                                    {data.fee.participationFeeAsset}
                                </div>
                                <div className="text-xs text-gray-500">
                                    운영비 차감 전
                                </div>
                            </div>

                            <div className="p-3 bg-gray-750 rounded-lg border border-gray-600">
                                <div className="text-sm text-gray-400 mb-1">
                                    당첨 확률
                                </div>
                                <div className="text-xl font-bold text-purple-400">
                                    {(
                                        (data.prizes.reduce(
                                            (sum, p) => sum + p.quantity,
                                            0
                                        ) /
                                            Math.max(
                                                getEstimatedParticipants(),
                                                1
                                            )) *
                                        100
                                    ).toFixed(2)}
                                    %
                                </div>
                                <div className="text-xs text-gray-500">
                                    총 상품 기준
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 작업 버튼 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4">
                            작업
                        </h4>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                            >
                                {showAdvanced ? "간단히 보기" : "상세히 보기"}
                            </button>

                            <button
                                onClick={onSubmit}
                                disabled={!validation.isValid}
                                className={`w-full p-3 rounded-lg transition-colors text-sm font-medium ${
                                    !validation.isValid ||
                                    isSubmitting ||
                                    creationProgress.status !== "idle"
                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FaSpinner
                                            className="animate-spin"
                                            size={14}
                                        />
                                        V2 래플 생성 중...
                                    </div>
                                ) : creationProgress.status !== "idle" ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FaSpinner
                                            className="animate-spin"
                                            size={14}
                                        />
                                        진행 중...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <FaRocket size={14} />
                                        V2 래플 생성
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* V2 특징 안내 */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-700/30">
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <FaInfoCircle
                                className="mr-3 text-purple-400"
                                size={16}
                            />
                            V2 특징
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-purple-300">
                                    역할 기반 접근 제어
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-purple-300">
                                    컨트랙트 일시정지 지원
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-purple-300">
                                    배치 추첨 시스템
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-purple-300">
                                    3단계 안전한 생성
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
