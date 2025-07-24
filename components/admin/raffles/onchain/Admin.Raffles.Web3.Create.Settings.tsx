"use client";

import { useCallback } from "react";
import {
    FaCog,
    FaUsers,
    FaTrophy,
    FaWeight,
    FaCheckCircle,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

export function AdminRafflesWeb3CreateSettings({ data, updateData }: Props) {
    const handleSettingChange = useCallback(
        (field: string, value: any) => {
            updateData("settings", { [field]: value });
        },
        [updateData]
    );

    return (
        <div className="space-y-8">
            <div className="text-center">
                <FaCog className="text-6xl text-purple-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">
                    래플 설정
                </h2>
                <p className="text-gray-300">
                    V2 래플의 참가 조건과 동작 방식을 설정합니다
                </p>
            </div>

            <div className="bg-black/20 rounded-xl p-8 border border-purple-500/20">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <FaUsers className="mr-3 text-blue-400" />
                            참가 제한 설정
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    총 유니크 참가자 제한
                                </label>
                                <div className="flex items-center gap-3">
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
                                            handleSettingChange(
                                                "participationLimit",
                                                e.target.value === ""
                                                    ? -1
                                                    : parseInt(
                                                          e.target.value
                                                      ) || 0
                                            )
                                        }
                                        placeholder="무제한"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-400 text-sm">
                                        명
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    비워두면 무제한 참가 가능
                                </p>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    1인당 참가 제한
                                </label>
                                <div className="flex items-center gap-3">
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
                                            handleSettingChange(
                                                "participationLimitPerPlayer",
                                                e.target.value === ""
                                                    ? -1
                                                    : parseInt(
                                                          e.target.value
                                                      ) || 0
                                            )
                                        }
                                        placeholder="무제한"
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-400 text-sm">
                                        회
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    한 사람이 참가할 수 있는 최대 횟수
                                </p>
                            </div>
                        </div>

                        <div>
                            전체 티켓 수 :{" "}
                            {(
                                data.settings.participationLimit *
                                data.settings.participationLimitPerPlayer
                            ).toLocaleString()}{" "}
                            개
                        </div>
                    </div>

                    <div className="border-t border-gray-600 pt-8">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <FaTrophy className="mr-3 text-yellow-400" />
                            당첨 설정
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                                <div className="flex-1">
                                    <label className="text-white font-medium flex items-center">
                                        <FaCheckCircle
                                            className="mr-2 text-green-400"
                                            size={16}
                                        />
                                        중복 당첨 허용
                                    </label>
                                    <p className="text-gray-400 text-sm mt-1">
                                        한 사람이 여러 상품에 당첨될 수 있습니다
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        handleSettingChange(
                                            "allowMultipleWins",
                                            !data.settings.allowMultipleWins
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                        data.settings.allowMultipleWins
                                            ? "bg-purple-600"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            data.settings.allowMultipleWins
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-600 pt-8">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <FaWeight className="mr-3 text-orange-400" />
                            고급 설정
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                                <div className="flex-1">
                                    <label className="text-white font-medium flex items-center">
                                        <FaWeight
                                            className="mr-2 text-orange-400"
                                            size={16}
                                        />
                                        동적 가중치
                                    </label>
                                    <p className="text-gray-400 text-sm mt-1">
                                        참가 횟수에 따라 당첨 확률이 조정됩니다
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        handleSettingChange(
                                            "dynamicWeight",
                                            !data.settings.dynamicWeight
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                        data.settings.dynamicWeight
                                            ? "bg-orange-600"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            data.settings.dynamicWeight
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
