"use client";

import { useCallback } from "react";
import {
    FaClock,
    FaBolt,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

export function AdminRafflesWeb3CreateTiming({ data, updateData }: Props) {
    const handleTimingChange = useCallback(
        (field: string, value: any) => {
            updateData("timing", { [field]: value });
        },
        [updateData]
    );

    const formatDateForInput = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toISOString().slice(0, 16);
    };

    const parseInputDate = (dateString: string) => {
        return Math.floor(new Date(dateString).getTime() / 1000);
    };

    const getTimeStatus = (timeUntil: number) => {
        if (timeUntil < 3600)
            return { text: "1시간 이내", color: "text-red-400" };
        if (timeUntil < 86400)
            return { text: "오늘", color: "text-yellow-400" };
        if (timeUntil < 604800)
            return { text: "이번 주", color: "text-blue-400" };
        return { text: "다음 주 이후", color: "text-green-400" };
    };

    const now = Math.floor(Date.now() / 1000);
    const startTimeUntil = data.timing.startDate - now;
    const endTimeUntil = data.timing.endDate - now;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <FaClock className="text-6xl text-blue-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">
                    일정 설정
                </h2>
                <p className="text-gray-300">
                    V2 래플의 시작, 종료, 추첨 시간을 설정합니다
                </p>
            </div>

            <div className="bg-black/20 rounded-xl p-8 border border-purple-500/20">
                <div className="space-y-8">
                    <div className="border-t border-gray-600 pt-8">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <FaClock className="mr-3 text-purple-400" />
                            상세 일정
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    시작 시간 *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formatDateForInput(
                                        data.timing.startDate
                                    )}
                                    onChange={(e) =>
                                        handleTimingChange(
                                            "startDate",
                                            parseInputDate(e.target.value)
                                        )
                                    }
                                    min={new Date(Date.now() + 60 * 60 * 1000)
                                        .toISOString()
                                        .slice(0, 16)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {startTimeUntil > 0 && (
                                    <p
                                        className={`text-xs mt-1 ${
                                            getTimeStatus(startTimeUntil).color
                                        }`}
                                    >
                                        {getTimeStatus(startTimeUntil).text}에
                                        시작
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    종료 시간 *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formatDateForInput(
                                        data.timing.endDate
                                    )}
                                    onChange={(e) =>
                                        handleTimingChange(
                                            "endDate",
                                            parseInputDate(e.target.value)
                                        )
                                    }
                                    min={formatDateForInput(
                                        data.timing.startDate + 3600
                                    )}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {endTimeUntil > 0 && (
                                    <p
                                        className={`text-xs mt-1 ${
                                            getTimeStatus(endTimeUntil).color
                                        }`}
                                    >
                                        {getTimeStatus(endTimeUntil).text}에
                                        종료
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-600 pt-8">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <FaBolt className="mr-3 text-yellow-400" />
                            추첨 설정
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                                <div className="flex-1">
                                    <label className="text-white font-medium flex items-center">
                                        <FaBolt
                                            className="mr-2 text-yellow-400"
                                            size={16}
                                        />
                                        즉시 추첨
                                    </label>
                                    <p className="text-gray-400 text-sm mt-1">
                                        래플 종료와 동시에 자동 추첨을
                                        시작합니다
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        handleTimingChange(
                                            "instantDraw",
                                            !data.timing.instantDraw
                                        )
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                                        data.timing.instantDraw
                                            ? "bg-yellow-600"
                                            : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            data.timing.instantDraw
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {!data.timing.instantDraw && (
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        추첨 시간 *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formatDateForInput(
                                            data.timing.drawDate
                                        )}
                                        onChange={(e) =>
                                            handleTimingChange(
                                                "drawDate",
                                                parseInputDate(e.target.value)
                                            )
                                        }
                                        min={formatDateForInput(
                                            data.timing.endDate
                                        )}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        종료 시간 이후로 설정해주세요
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
