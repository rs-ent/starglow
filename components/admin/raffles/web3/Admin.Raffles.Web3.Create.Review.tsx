"use client";

import { useCallback, useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaSpinner,
    FaEdit,
    FaCalendarAlt,
    FaCogs,
    FaCoins,
    FaGift,
    FaRocket,
    FaList,
    FaEye,
    FaClock,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
    onEditStep: (step: number) => void;
}

// 체크리스트 항목들
const CHECKLIST_ITEMS = [
    {
        id: "basic_info",
        label: "기본 정보 입력",
        description: "제목과 이미지가 설정되었는지 확인",
        validator: (data: RaffleFormData) =>
            data.basicInfo.title && data.basicInfo.imageUrl,
        detailValidator: (data: RaffleFormData) => {
            const issues = [];
            if (!data.basicInfo.title)
                issues.push("제목이 입력되지 않았습니다");
            if (!data.basicInfo.imageUrl)
                issues.push("이미지가 선택되지 않았습니다");
            return issues;
        },
    },
    {
        id: "timing",
        label: "일정 설정",
        description: "종료일과 추첨일이 올바르게 설정되었는지 확인",
        validator: (data: RaffleFormData) =>
            data.timing.startDate &&
            data.timing.endDate > data.timing.startDate &&
            (data.timing.instantDraw ||
                data.timing.drawDate > data.timing.endDate),
        detailValidator: (data: RaffleFormData) => {
            const issues = [];
            if (!data.timing.startDate)
                issues.push("시작일이 설정되지 않았습니다");
            if (!data.timing.endDate)
                issues.push("종료일이 설정되지 않았습니다");
            else if (data.timing.endDate <= data.timing.startDate)
                issues.push("종료일이 시작일보다 빠릅니다");
            if (
                !data.timing.instantDraw &&
                (!data.timing.drawDate ||
                    data.timing.drawDate <= data.timing.endDate)
            ) {
                issues.push("추첨일이 종료일보다 빠릅니다");
            }
            return issues;
        },
    },
    {
        id: "settings",
        label: "래플 설정",
        description: "참여 제한과 추첨 방법이 설정되었는지 확인",
        validator: (data: RaffleFormData) =>
            (data.settings.participationLimit >= 0 ||
                data.settings.participationLimit === -1) &&
            (data.settings.participationLimitPerPlayer >= 0 ||
                data.settings.participationLimitPerPlayer === -1),
        detailValidator: (data: RaffleFormData) => {
            const issues = [];
            if (data.settings.participationLimit < -1)
                issues.push(
                    "최대 참가자 수가 유효하지 않습니다 (-1: 무제한, 0 이상: 제한)"
                );
            if (data.settings.participationLimitPerPlayer < -1)
                issues.push(
                    "개인 참여 한도가 유효하지 않습니다 (-1: 무제한, 0 이상: 제한)"
                );
            return issues;
        },
    },
    {
        id: "fee",
        label: "참가비 설정",
        description: "토큰과 금액이 올바르게 설정되었는지 확인",
        validator: (data: RaffleFormData) =>
            data.fee.participationFeeAsset &&
            parseFloat(data.fee.participationFeeAmount) >= 0,
        detailValidator: (data: RaffleFormData) => {
            const issues = [];
            if (!data.fee.participationFeeAsset)
                issues.push("참가비 토큰이 선택되지 않았습니다");
            if (parseFloat(data.fee.participationFeeAmount) < 0)
                issues.push("참가비 금액이 유효하지 않습니다");
            return issues;
        },
    },
    {
        id: "prizes",
        label: "상품 설정",
        description: "최소 1개 이상의 상품이 설정되었는지 확인",
        validator: (data: RaffleFormData) =>
            data.prizes.length > 0 && data.prizes.every((p) => p.title),
        detailValidator: (data: RaffleFormData) => {
            const issues = [];
            if (data.prizes.length === 0)
                issues.push("최소 1개 이상의 상품이 필요합니다");
            data.prizes.forEach((prize, index) => {
                if (!prize.title)
                    issues.push(
                        `상품 ${index + 1}: 제목이 입력되지 않았습니다`
                    );
            });
            return issues;
        },
    },
    {
        id: "contract",
        label: "컨트랙트 선택",
        description: "활성화된 컨트랙트가 선택되었는지 확인",
        validator: (data: RaffleFormData) =>
            data.contractId && data.networkId && data.walletAddress,
        detailValidator: (data: RaffleFormData) => {
            const issues = [];
            if (!data.contractId) issues.push("컨트랙트가 선택되지 않았습니다");
            if (!data.networkId) issues.push("네트워크가 선택되지 않았습니다");
            if (!data.walletAddress)
                issues.push("지갑 주소가 연결되지 않았습니다");
            return issues;
        },
    },
];

export function AdminRafflesWeb3CreateReview({
    data,
    onSubmit,
    isSubmitting,
    onEditStep,
}: Props) {
    const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>(
        {}
    );

    // 유효성 검증 결과
    const validationResults = useMemo(() => {
        return CHECKLIST_ITEMS.map((item) => ({
            ...item,
            isValid: item.validator(data),
            issues: item.detailValidator ? item.detailValidator(data) : [],
        }));
    }, [data]);

    const totalValid = validationResults.filter((r) => r.isValid).length;
    const isAllValid = totalValid === CHECKLIST_ITEMS.length;

    // 예상 가스비 계산
    const gasEstimation = useMemo(() => {
        const baseGasPrice = 20; // gwei
        const estimatedGasUsage = 150000; // gas units
        const gasFeeBERA = (baseGasPrice * estimatedGasUsage) / 1e9;
        return {
            gasUsage: estimatedGasUsage,
            gasPrice: baseGasPrice,
            gasFee: gasFeeBERA,
        };
    }, []);

    // 세부 정보 토글
    const toggleDetails = useCallback((section: string) => {
        setShowDetails((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaList className="mr-3 text-purple-400" size={20} />
                        최종 검토 및 배포
                    </h3>
                    <div className="flex items-center gap-2">
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                isAllValid
                                    ? "bg-green-900/50 text-green-400 border-green-700"
                                    : "bg-yellow-900/50 text-yellow-400 border-yellow-700"
                            }`}
                        >
                            {totalValid}/{CHECKLIST_ITEMS.length} 완료
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    래플 설정을 최종 검토하고 블록체인에 배포합니다. 모든 항목을
                    확인한 후 배포를 진행해주세요.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 메인 영역 - 검토 및 체크리스트 */}
                <div className="xl:col-span-2 space-y-6">
                    {/* 체크리스트 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaCheckCircle
                                className="mr-3 text-green-400"
                                size={16}
                            />
                            배포 전 체크리스트
                        </h4>

                        <div className="space-y-4">
                            {validationResults.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-lg border transition-all ${
                                        item.isValid
                                            ? "bg-green-900/20 border-green-700"
                                            : "bg-red-900/20 border-red-700"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    item.isValid
                                                        ? "bg-green-600"
                                                        : "bg-red-600"
                                                }`}
                                            >
                                                {item.isValid ? (
                                                    <FaCheckCircle
                                                        className="text-white"
                                                        size={12}
                                                    />
                                                ) : (
                                                    <FaExclamationTriangle
                                                        className="text-white"
                                                        size={12}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium text-white">
                                                    {item.label}
                                                </h5>
                                                <p className="text-sm text-gray-400">
                                                    {item.description}
                                                </p>
                                                {!item.isValid &&
                                                    item.issues &&
                                                    item.issues.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {item.issues.map(
                                                                (
                                                                    issue,
                                                                    issueIndex
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            issueIndex
                                                                        }
                                                                        className="flex items-center gap-1 text-xs text-red-300"
                                                                    >
                                                                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                                                        {issue}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onEditStep(index)}
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                            title="수정하기"
                                        >
                                            <FaEdit size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 설정 요약 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaEye className="mr-3 text-blue-400" size={16} />
                            설정 요약
                        </h4>

                        <div className="space-y-4">
                            {/* 기본 정보 */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-white flex items-center">
                                        <FaInfoCircle
                                            className="mr-2 text-blue-400"
                                            size={14}
                                        />
                                        기본 정보
                                    </h5>
                                    <button
                                        onClick={() => toggleDetails("basic")}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FaEye size={12} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-300">
                                            제목:
                                        </span>
                                        <p className="text-white font-medium">
                                            {data.basicInfo.title || "미설정"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-300">
                                            설명:
                                        </span>
                                        <p className="text-white font-medium">
                                            {data.basicInfo.description
                                                ? `${data.basicInfo.description.slice(
                                                      0,
                                                      30
                                                  )}...`
                                                : "미설정"}
                                        </p>
                                    </div>
                                </div>
                                {showDetails.basic && (
                                    <div className="mt-3 pt-3 border-t border-gray-600 text-sm">
                                        <div className="grid grid-cols-1 gap-2">
                                            <div>
                                                <span className="text-gray-300">
                                                    이미지:
                                                </span>
                                                <p className="text-blue-400 break-all">
                                                    {data.basicInfo.imageUrl ||
                                                        "미설정"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-300">
                                                    아이콘:
                                                </span>
                                                <p className="text-blue-400 break-all">
                                                    {data.basicInfo.iconUrl ||
                                                        "미설정"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 일정 */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-white flex items-center">
                                        <FaCalendarAlt
                                            className="mr-2 text-green-400"
                                            size={14}
                                        />
                                        일정
                                    </h5>
                                    <button
                                        onClick={() => toggleDetails("timing")}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FaEye size={12} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-300">
                                            시작:
                                        </span>
                                        <p className="text-white font-medium">
                                            {new Date(
                                                data.timing.startDate * 1000
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-300">
                                            종료:
                                        </span>
                                        <p className="text-white font-medium">
                                            {new Date(
                                                data.timing.endDate * 1000
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-300">
                                            추첨:
                                        </span>
                                        <p
                                            className={`font-medium ${
                                                data.timing.instantDraw
                                                    ? "text-yellow-400"
                                                    : "text-purple-400"
                                            }`}
                                        >
                                            {data.timing.instantDraw
                                                ? "즉시"
                                                : "예약"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 참여 설정 */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-white flex items-center">
                                        <FaCogs
                                            className="mr-2 text-purple-400"
                                            size={14}
                                        />
                                        참여 설정
                                    </h5>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-300">
                                            최대 참가자:
                                        </span>
                                        <p
                                            className={`font-medium ${
                                                data.settings
                                                    .participationLimit === -1
                                                    ? "text-green-400"
                                                    : "text-white"
                                            }`}
                                        >
                                            {data.settings
                                                .participationLimit === -1
                                                ? "무제한"
                                                : `${data.settings.participationLimit.toLocaleString()}명`}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-300">
                                            개인 한도:
                                        </span>
                                        <p
                                            className={`font-medium ${
                                                data.settings
                                                    .participationLimitPerPlayer ===
                                                -1
                                                    ? "text-green-400"
                                                    : "text-white"
                                            }`}
                                        >
                                            {data.settings
                                                .participationLimitPerPlayer ===
                                            -1
                                                ? "무제한"
                                                : `${data.settings.participationLimitPerPlayer}개`}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-300">
                                            추첨 방법:
                                        </span>
                                        <p
                                            className={`font-medium ${
                                                data.settings.dynamicWeight
                                                    ? "text-purple-400"
                                                    : "text-blue-400"
                                            }`}
                                        >
                                            {data.settings.dynamicWeight
                                                ? "동적"
                                                : "랜덤"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 참가비 */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-white flex items-center">
                                        <FaCoins
                                            className="mr-2 text-yellow-400"
                                            size={14}
                                        />
                                        참가비
                                    </h5>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-300">
                                            토큰:
                                        </span>
                                        <p className="text-white font-medium">
                                            {data.fee.participationFeeAsset ||
                                                "미설정"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-300">
                                            금액:
                                        </span>
                                        <p
                                            className={`font-medium ${
                                                parseFloat(
                                                    data.fee
                                                        .participationFeeAmount
                                                ) === 0
                                                    ? "text-green-400"
                                                    : "text-yellow-400"
                                            }`}
                                        >
                                            {parseFloat(
                                                data.fee.participationFeeAmount
                                            ) === 0
                                                ? "무료"
                                                : `${data.fee.participationFeeAmount} ${data.fee.participationFeeAsset}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 상품 */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-white flex items-center">
                                        <FaGift
                                            className="mr-2 text-pink-400"
                                            size={14}
                                        />
                                        상품 ({data.prizes.length}개)
                                    </h5>
                                    <button
                                        onClick={() => toggleDetails("prizes")}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FaEye size={12} />
                                    </button>
                                </div>
                                {data.prizes.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        {data.prizes
                                            .slice(
                                                0,
                                                showDetails.prizes
                                                    ? data.prizes.length
                                                    : 3
                                            )
                                            .map((prize, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between"
                                                >
                                                    <span className="text-gray-300">
                                                        {prize.title}
                                                    </span>
                                                    <span className="text-white font-medium">
                                                        {prize.prizeQuantity}개
                                                    </span>
                                                </div>
                                            ))}
                                        {!showDetails.prizes &&
                                            data.prizes.length > 3 && (
                                                <p className="text-gray-400 text-xs">
                                                    +{data.prizes.length - 3}개
                                                    더보기
                                                </p>
                                            )}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">
                                        상품이 설정되지 않았습니다
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 사이드바 - 배포 상태 및 액션 */}
                <div className="space-y-6">
                    {/* 배포 준비 상태 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaRocket
                                className="mr-3 text-orange-400"
                                size={16}
                            />
                            배포 준비 상태
                        </h4>

                        <div className="space-y-4">
                            <div className="text-center">
                                <div
                                    className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                                        isAllValid
                                            ? "bg-green-600"
                                            : "bg-yellow-600"
                                    }`}
                                >
                                    {isAllValid ? (
                                        <FaCheckCircle
                                            className="text-white"
                                            size={24}
                                        />
                                    ) : (
                                        <FaClock
                                            className="text-white"
                                            size={24}
                                        />
                                    )}
                                </div>
                                <h5
                                    className={`font-semibold ${
                                        isAllValid
                                            ? "text-green-400"
                                            : "text-yellow-400"
                                    }`}
                                >
                                    {isAllValid
                                        ? "배포 준비 완료"
                                        : "설정 확인 필요"}
                                </h5>
                                <p className="text-gray-400 text-sm mt-1">
                                    {isAllValid
                                        ? "모든 설정이 완료되었습니다"
                                        : `${
                                              CHECKLIST_ITEMS.length -
                                              totalValid
                                          }개 항목 확인 필요`}
                                </p>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">
                                            예상 가스비:
                                        </span>
                                        <span className="text-white font-medium">
                                            {gasEstimation.gasFee.toFixed(6)}{" "}
                                            BERA
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">
                                            가스 한도:
                                        </span>
                                        <span className="text-white font-medium">
                                            {gasEstimation.gasUsage.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">
                                            네트워크:
                                        </span>
                                        <span className="text-blue-400 font-medium">
                                            {data.networkId || "미선택"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 배포 액션 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <button
                            onClick={onSubmit}
                            disabled={!isAllValid || isSubmitting}
                            className={`w-full py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${
                                !isAllValid || isSubmitting
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner
                                        className="animate-spin"
                                        size={16}
                                    />
                                    배포 중...
                                </>
                            ) : (
                                <>
                                    <FaRocket size={16} />
                                    래플 배포하기
                                </>
                            )}
                        </button>

                        {!isAllValid && (
                            <p className="text-yellow-400 text-xs mt-3 text-center">
                                모든 설정을 완료한 후 배포할 수 있습니다
                            </p>
                        )}

                        {isSubmitting && (
                            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaSpinner
                                        className="animate-spin text-blue-400"
                                        size={14}
                                    />
                                    <span className="text-blue-400 font-medium text-sm">
                                        배포 진행 중
                                    </span>
                                </div>
                                <p className="text-blue-300 text-xs">
                                    트랜잭션이 블록체인에 전송되고 있습니다.
                                    완료까지 1-2분 소요됩니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 도움말 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaInfoCircle
                                className="mr-3 text-blue-400"
                                size={16}
                            />
                            배포 안내
                        </h4>

                        <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>
                                    배포 후에는 래플 설정을 변경할 수 없습니다
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>
                                    트랜잭션 완료 후 래플이 자동으로
                                    활성화됩니다
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>가스비는 배포 시 지갑에서 자동 차감됩니다</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>배포 상태는 실시간으로 추적할 수 있습니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
