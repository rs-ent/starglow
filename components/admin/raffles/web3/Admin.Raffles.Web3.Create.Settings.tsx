"use client";

import { useCallback } from "react";
import {
    FaCogs,
    FaUsers,
    FaUserCheck,
    FaDice,
    FaRandom,
    FaBalanceScale,
    FaInfoCircle,
    FaCheckCircle,
    FaSlidersH,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

// 추첨 방법 옵션들
const DRAW_METHODS = [
    {
        id: "pure_random",
        name: "순수 랜덤",
        description: "모든 티켓이 동등한 확률로 추첨",
        icon: FaRandom,
        color: "text-blue-400",
        recommended: true,
        pros: ["공정한 확률", "단순한 구조", "높은 신뢰도"],
        cons: ["전략성 부족"],
    },
    {
        id: "dynamic_weight",
        name: "동적 가중치",
        description: "상품별 최대 소진 개수 보장 및 정확한 재고 관리",
        icon: FaBalanceScale,
        color: "text-purple-400",
        recommended: false,
        pros: [
            "정확한 상품 재고 관리",
            "최대 소진 개수 예측 가능",
            "상품별 공정한 분배",
        ],
        cons: ["복잡한 계산", "가스비 상승"],
    },
];

export function AdminRafflesWeb3CreateSettings({ data, updateData }: Props) {
    const handleSettingsChange = useCallback(
        (field: string, value: any) => {
            updateData("settings", { [field]: value });
        },
        [updateData]
    );

    // 추첨 방법 선택 함수
    const selectDrawMethod = useCallback(
        (methodId: string) => {
            handleSettingsChange(
                "dynamicWeight",
                methodId === "dynamic_weight"
            );
            // 추후 다른 추첨 방법들도 추가할 수 있음
        },
        [handleSettingsChange]
    );

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaCogs className="mr-3 text-purple-400" size={20} />
                        래플 설정
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-xs font-medium border border-purple-700">
                            고급 설정
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    참여 제한, 추첨 방법, 보안 설정 등을 구성하여 래플의 특성을
                    결정합니다. 설정에 따라 참여자의 경험과 래플의 공정성이
                    달라집니다.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 메인 설정 영역 */}
                <div className="xl:col-span-2 space-y-6">
                    {/* 참여 제한 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaUsers className="mr-3 text-blue-400" size={16} />
                            참여 제한 설정
                        </h4>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 최대 참가자 수 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaUsers
                                        className="inline mr-2 text-blue-400"
                                        size={14}
                                    />
                                    최대 참가자 수 *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={
                                            data.settings.participationLimit ===
                                            -1
                                                ? ""
                                                : data.settings
                                                      .participationLimit
                                        }
                                        onChange={(e) =>
                                            handleSettingsChange(
                                                "participationLimit",
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        min="1"
                                        max="10000"
                                        disabled={
                                            data.settings.participationLimit ===
                                            -1
                                        }
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-800 disabled:text-gray-400"
                                        placeholder={
                                            data.settings.participationLimit ===
                                            -1
                                                ? "무제한"
                                                : "예: 1000"
                                        }
                                        required={
                                            data.settings.participationLimit !==
                                            -1
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSettingsChange(
                                                "participationLimit",
                                                data.settings
                                                    .participationLimit === -1
                                                    ? 1000
                                                    : -1
                                            )
                                        }
                                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                                            data.settings.participationLimit ===
                                            -1
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                        }`}
                                    >
                                        무제한
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-400">
                                        {data.settings.participationLimit === -1
                                            ? "제한 없음"
                                            : "1 ~ 10,000명"}
                                    </span>
                                    <span
                                        className={`font-medium ${
                                            data.settings.participationLimit ===
                                            -1
                                                ? "text-green-400"
                                                : data.settings
                                                      .participationLimit < 50
                                                ? "text-yellow-400"
                                                : data.settings
                                                      .participationLimit > 1000
                                                ? "text-green-400"
                                                : "text-blue-400"
                                        }`}
                                    >
                                        {data.settings.participationLimit === -1
                                            ? "무제한"
                                            : data.settings.participationLimit <
                                              50
                                            ? "소규모"
                                            : data.settings.participationLimit >
                                              1000
                                            ? "대규모"
                                            : "중간규모"}{" "}
                                        래플
                                    </span>
                                </div>
                            </div>

                            {/* 개인당 최대 티켓 수 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaUserCheck
                                        className="inline mr-2 text-green-400"
                                        size={14}
                                    />
                                    개인당 최대 티켓 수 *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={
                                            data.settings
                                                .participationLimitPerPlayer ===
                                            -1
                                                ? ""
                                                : data.settings
                                                      .participationLimitPerPlayer
                                        }
                                        onChange={(e) =>
                                            handleSettingsChange(
                                                "participationLimitPerPlayer",
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        min="1"
                                        max="100"
                                        disabled={
                                            data.settings
                                                .participationLimitPerPlayer ===
                                            -1
                                        }
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-800 disabled:text-gray-400"
                                        placeholder={
                                            data.settings
                                                .participationLimitPerPlayer ===
                                            -1
                                                ? "무제한"
                                                : "예: 5"
                                        }
                                        required={
                                            data.settings
                                                .participationLimitPerPlayer !==
                                            -1
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSettingsChange(
                                                "participationLimitPerPlayer",
                                                data.settings
                                                    .participationLimitPerPlayer ===
                                                    -1
                                                    ? 5
                                                    : -1
                                            )
                                        }
                                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                                            data.settings
                                                .participationLimitPerPlayer ===
                                            -1
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                        }`}
                                    >
                                        무제한
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-400">
                                        {data.settings
                                            .participationLimitPerPlayer === -1
                                            ? "제한 없음"
                                            : "1 ~ 100개"}
                                    </span>
                                    <span
                                        className={`font-medium ${
                                            data.settings
                                                .participationLimitPerPlayer ===
                                            -1
                                                ? "text-green-400"
                                                : data.settings
                                                      .participationLimitPerPlayer ===
                                                  1
                                                ? "text-green-400"
                                                : data.settings
                                                      .participationLimitPerPlayer <=
                                                  5
                                                ? "text-blue-400"
                                                : "text-yellow-400"
                                        }`}
                                    >
                                        {data.settings
                                            .participationLimitPerPlayer === -1
                                            ? "무제한"
                                            : data.settings
                                                  .participationLimitPerPlayer ===
                                              1
                                            ? "완전 공정"
                                            : data.settings
                                                  .participationLimitPerPlayer <=
                                              5
                                            ? "적당한 제한"
                                            : "높은 자유도"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 참여 제한 미리보기 */}
                        <div className="mt-6 bg-gray-750 rounded-lg p-4 border border-gray-600">
                            <div className="flex items-center gap-2 mb-3">
                                <FaInfoCircle
                                    className="text-blue-400"
                                    size={14}
                                />
                                <span className="text-blue-400 font-medium text-sm">
                                    참여 제한 요약
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {data.settings.participationLimit === -1
                                            ? "∞"
                                            : data.settings.participationLimit.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        최대 참가자
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {data.settings
                                            .participationLimitPerPlayer === -1
                                            ? "∞"
                                            : data.settings
                                                  .participationLimitPerPlayer}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        개인 한도
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {data.settings.participationLimit ===
                                            -1 ||
                                        data.settings
                                            .participationLimitPerPlayer === -1
                                            ? "∞"
                                            : (
                                                  data.settings
                                                      .participationLimit *
                                                  data.settings
                                                      .participationLimitPerPlayer
                                              ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        최대 총 티켓
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 추첨 방법 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaDice
                                className="mr-3 text-purple-400"
                                size={16}
                            />
                            추첨 방법 설정
                        </h4>

                        <div className="space-y-4">
                            {DRAW_METHODS.map((method) => {
                                const IconComponent = method.icon;
                                const isSelected =
                                    method.id === "dynamic_weight"
                                        ? data.settings.dynamicWeight
                                        : method.id === "pure_random" &&
                                          !data.settings.dynamicWeight;

                                return (
                                    <div
                                        key={method.id}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-purple-900/30 border-purple-600"
                                                : "bg-gray-750 border-gray-600 hover:border-gray-500"
                                        }`}
                                        onClick={() =>
                                            selectDrawMethod(method.id)
                                        }
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                    isSelected
                                                        ? "bg-purple-600"
                                                        : "bg-gray-600"
                                                }`}
                                            >
                                                <IconComponent
                                                    className="text-white"
                                                    size={20}
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h5 className="font-semibold text-white">
                                                        {method.name}
                                                    </h5>
                                                    {method.recommended && (
                                                        <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
                                                            추천
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <FaCheckCircle
                                                            className="text-purple-400"
                                                            size={16}
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 mb-3">
                                                    {method.description}
                                                </p>

                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <p className="text-green-400 font-medium mb-1">
                                                            장점:
                                                        </p>
                                                        <ul className="text-green-300 space-y-1">
                                                            {method.pros.map(
                                                                (pro, idx) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        • {pro}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <p className="text-red-400 font-medium mb-1">
                                                            단점:
                                                        </p>
                                                        <ul className="text-red-300 space-y-1">
                                                            {method.cons.map(
                                                                (con, idx) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        • {con}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 사이드바 - 설정 요약 및 권장사항 */}
                <div className="space-y-6">
                    {/* 설정 요약 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaSlidersH
                                className="mr-3 text-purple-400"
                                size={16}
                            />
                            설정 요약
                        </h4>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm">
                                    최대 참가자:
                                </span>
                                <span className="text-white font-medium">
                                    {data.settings.participationLimit === -1
                                        ? "무제한"
                                        : `${data.settings.participationLimit.toLocaleString()}명`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm">
                                    개인 한도:
                                </span>
                                <span className="text-white font-medium">
                                    {data.settings
                                        .participationLimitPerPlayer === -1
                                        ? "무제한"
                                        : `${data.settings.participationLimitPerPlayer}개`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm">
                                    추첨 방법:
                                </span>
                                <span
                                    className={`font-medium ${
                                        data.settings.dynamicWeight
                                            ? "text-purple-400"
                                            : "text-blue-400"
                                    }`}
                                >
                                    {data.settings.dynamicWeight
                                        ? "동적 가중치"
                                        : "순수 랜덤"}
                                </span>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">
                                        공정성 지수:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${
                                                data.settings
                                                    .participationLimit ===
                                                    -1 ||
                                                data.settings
                                                    .participationLimitPerPlayer ===
                                                    -1
                                                    ? "bg-cyan-400"
                                                    : !data.settings
                                                          .dynamicWeight &&
                                                      data.settings
                                                          .participationLimitPerPlayer <=
                                                          5
                                                    ? "bg-green-400"
                                                    : data.settings
                                                          .participationLimitPerPlayer <=
                                                      10
                                                    ? "bg-yellow-400"
                                                    : "bg-red-400"
                                            }`}
                                        ></div>
                                        <span
                                            className={`font-medium text-sm ${
                                                data.settings
                                                    .participationLimit ===
                                                    -1 ||
                                                data.settings
                                                    .participationLimitPerPlayer ===
                                                    -1
                                                    ? "text-cyan-400"
                                                    : !data.settings
                                                          .dynamicWeight &&
                                                      data.settings
                                                          .participationLimitPerPlayer <=
                                                          5
                                                    ? "text-green-400"
                                                    : data.settings
                                                          .participationLimitPerPlayer <=
                                                      10
                                                    ? "text-yellow-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {data.settings
                                                .participationLimit === -1 ||
                                            data.settings
                                                .participationLimitPerPlayer ===
                                                -1
                                                ? "완전 자유"
                                                : !data.settings
                                                      .dynamicWeight &&
                                                  data.settings
                                                      .participationLimitPerPlayer <=
                                                      5
                                                ? "높음"
                                                : data.settings
                                                      .participationLimitPerPlayer <=
                                                  10
                                                ? "보통"
                                                : "낮음"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
