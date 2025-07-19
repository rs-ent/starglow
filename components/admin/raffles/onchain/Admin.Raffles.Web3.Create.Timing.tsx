"use client";

import { useCallback, useMemo } from "react";
import {
    FaClock,
    FaCalendarAlt,
    FaBolt,
    FaPlay,
    FaStop,
    FaHourglass,
    FaLightbulb,
    FaChartLine,
    FaExclamationTriangle,
    FaInfoCircle,
    FaMagic,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

// 프리셋 옵션들
const DURATION_PRESETS = [
    {
        id: "quick",
        name: "빠른 래플",
        description: "6시간 진행",
        icon: FaBolt,
        color: "text-yellow-400",
        getDuration: () => ({ hours: 6, days: 0 }),
    },
    {
        id: "standard",
        name: "표준 래플",
        description: "3일 진행",
        icon: FaPlay,
        color: "text-blue-400",
        getDuration: () => ({ hours: 0, days: 3 }),
    },
    {
        id: "extended",
        name: "장기 래플",
        description: "1주일 진행",
        icon: FaHourglass,
        color: "text-purple-400",
        getDuration: () => ({ hours: 0, days: 7 }),
    },
    {
        id: "mega",
        name: "메가 래플",
        description: "2주일 진행",
        icon: FaChartLine,
        color: "text-green-400",
        getDuration: () => ({ hours: 0, days: 14 }),
    },
];

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

    const now = new Date();
    const minDateTime = new Date(now.getTime() + 60 * 60 * 1000);
    const minDateTimeString = minDateTime.toISOString().slice(0, 16);

    // 스마트 기본값 적용 함수
    const applyPreset = useCallback(
        (preset: (typeof DURATION_PRESETS)[0]) => {
            const duration = preset.getDuration();
            const startDate = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 시작
            const endDate =
                startDate + duration.days * 86400 + duration.hours * 3600;
            const drawDate = data.timing.instantDraw ? endDate : endDate + 3600;

            handleTimingChange("startDate", startDate);
            handleTimingChange("endDate", endDate);
            handleTimingChange("drawDate", drawDate);
        },
        [data.timing.instantDraw, handleTimingChange]
    );

    // 일정 정보 계산
    const scheduleInfo = useMemo(() => {
        const duration = data.timing.endDate - data.timing.startDate;
        const durationDays = Math.floor(duration / 86400);
        const durationHours = Math.floor((duration % 86400) / 3600);

        const timeUntilStart =
            data.timing.startDate - Math.floor(Date.now() / 1000);
        const timeUntilEnd =
            data.timing.endDate - Math.floor(Date.now() / 1000);
        const timeUntilDraw =
            data.timing.drawDate - Math.floor(Date.now() / 1000);

        const getTimeStatus = (timeUntil: number) => {
            if (timeUntil < 3600) return "긴급";
            if (timeUntil < 86400) return "임박";
            if (timeUntil < 86400 * 3) return "가까움";
            return "여유";
        };

        return {
            duration: { days: durationDays, hours: durationHours },
            timeUntilStart,
            timeUntilEnd,
            timeUntilDraw,
            startStatus: getTimeStatus(timeUntilStart),
            isValidSchedule:
                data.timing.startDate > Math.floor(Date.now() / 1000) + 3600 &&
                data.timing.endDate > data.timing.startDate &&
                (data.timing.instantDraw ||
                    data.timing.drawDate > data.timing.endDate),
        };
    }, [data.timing]);

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-indigo-900/30 to-cyan-900/30 rounded-xl p-6 border border-indigo-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaClock className="mr-3 text-indigo-400" size={20} />
                        래플 일정 설정
                    </h3>
                    <div className="flex items-center gap-2">
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                scheduleInfo.isValidSchedule
                                    ? "bg-green-900/50 text-green-400 border border-green-700"
                                    : "bg-red-900/50 text-red-400 border border-red-700"
                            }`}
                        >
                            {scheduleInfo.isValidSchedule
                                ? "일정 유효"
                                : "일정 수정 필요"}
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    래플의 시작일, 종료일, 추첨일을 설정합니다. 프리셋을
                    사용하여 빠르게 설정하거나 세부적으로 조정할 수 있습니다.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 메인 설정 영역 */}
                <div className="xl:col-span-2 space-y-6">
                    {/* 프리셋 선택 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaMagic
                                className="mr-3 text-purple-400"
                                size={16}
                            />
                            빠른 설정 (프리셋)
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            {DURATION_PRESETS.map((preset) => {
                                const IconComponent = preset.icon;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        className="p-4 bg-gray-750 border border-gray-600 rounded-lg hover:border-gray-500 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <IconComponent
                                                className={`${preset.color} group-hover:scale-110 transition-transform`}
                                                size={18}
                                            />
                                            <span className="font-medium text-white">
                                                {preset.name}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 text-left">
                                            {preset.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 상세 일정 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaCalendarAlt
                                className="mr-3 text-blue-400"
                                size={16}
                            />
                            상세 일정 설정
                        </h4>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 시작일 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaPlay
                                        className="inline mr-2 text-green-400"
                                        size={14}
                                    />
                                    래플 시작일 *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formatDateForInput(
                                        data.timing.startDate
                                    )}
                                    onChange={(e) => {
                                        const newStartDate = parseInputDate(
                                            e.target.value
                                        );
                                        handleTimingChange(
                                            "startDate",
                                            newStartDate
                                        );

                                        // 자동 조정: 종료일이 시작일보다 이전이면 조정
                                        if (
                                            newStartDate >= data.timing.endDate
                                        ) {
                                            handleTimingChange(
                                                "endDate",
                                                newStartDate + 86400
                                            );
                                        }

                                        // 자동 조정: 추첨일이 종료일보다 이전이면 조정
                                        if (
                                            !data.timing.instantDraw &&
                                            newStartDate >= data.timing.drawDate
                                        ) {
                                            handleTimingChange(
                                                "drawDate",
                                                newStartDate + 86400 + 3600
                                            );
                                        }
                                    }}
                                    min={minDateTimeString}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    required
                                />
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-400">
                                        최소 1시간 후부터 설정 가능
                                    </span>
                                    <span
                                        className={`font-medium ${
                                            scheduleInfo.startStatus === "긴급"
                                                ? "text-red-400"
                                                : scheduleInfo.startStatus ===
                                                  "임박"
                                                ? "text-yellow-400"
                                                : scheduleInfo.startStatus ===
                                                  "가까움"
                                                ? "text-blue-400"
                                                : "text-green-400"
                                        }`}
                                    >
                                        {scheduleInfo.timeUntilStart > 0
                                            ? `${Math.ceil(
                                                  scheduleInfo.timeUntilStart /
                                                      3600
                                              )}시간 후`
                                            : "즉시 시작"}
                                    </span>
                                </div>
                            </div>

                            {/* 종료일 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaStop
                                        className="inline mr-2 text-red-400"
                                        size={14}
                                    />
                                    래플 종료일 *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formatDateForInput(
                                        data.timing.endDate
                                    )}
                                    onChange={(e) => {
                                        const newEndDate = parseInputDate(
                                            e.target.value
                                        );
                                        handleTimingChange(
                                            "endDate",
                                            newEndDate
                                        );

                                        // 자동 조정: 즉시 추첨이 아닐 때 추첨일 조정
                                        if (
                                            !data.timing.instantDraw &&
                                            newEndDate >= data.timing.drawDate
                                        ) {
                                            handleTimingChange(
                                                "drawDate",
                                                newEndDate + 3600
                                            );
                                        }
                                    }}
                                    min={formatDateForInput(
                                        data.timing.startDate + 3600
                                    )}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                    required
                                />
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-400">
                                        시작일보다 최소 1시간 후
                                    </span>
                                    <span className="text-blue-400 font-medium">
                                        {scheduleInfo.duration.days > 0 &&
                                            `${scheduleInfo.duration.days}일 `}
                                        {scheduleInfo.duration.hours > 0 &&
                                            `${scheduleInfo.duration.hours}시간`}
                                        {scheduleInfo.duration.days === 0 &&
                                            scheduleInfo.duration.hours === 0 &&
                                            "0시간"}
                                        진행
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 추첨 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaBolt
                                className="mr-3 text-yellow-400"
                                size={16}
                            />
                            추첨 방식 설정
                        </h4>

                        <div className="space-y-6">
                            {/* 즉시 추첨 옵션 */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                <label className="flex items-start space-x-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.timing.instantDraw}
                                        onChange={(e) => {
                                            const instantDraw =
                                                e.target.checked;
                                            handleTimingChange(
                                                "instantDraw",
                                                instantDraw
                                            );

                                            if (instantDraw) {
                                                handleTimingChange(
                                                    "drawDate",
                                                    data.timing.endDate
                                                );
                                            } else {
                                                handleTimingChange(
                                                    "drawDate",
                                                    data.timing.endDate + 3600
                                                );
                                            }
                                        }}
                                        className="w-5 h-5 mt-1 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaBolt
                                                className="text-yellow-400"
                                                size={16}
                                            />
                                            <span className="text-lg font-medium text-white">
                                                즉시 추첨
                                            </span>
                                            <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded-full">
                                                추천
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-3">
                                            래플 종료와 동시에 추첨이
                                            진행됩니다. 참가자들이 즉시 결과를
                                            확인할 수 있어 참여도가 높아집니다.
                                        </p>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1 text-green-400">
                                                <FaLightbulb size={10} />
                                                높은 참여도
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-400">
                                                <FaClock size={10} />
                                                빠른 결과
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* 예약 추첨 설정 */}
                            {!data.timing.instantDraw && (
                                <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FaHourglass
                                            className="text-purple-400"
                                            size={16}
                                        />
                                        <span className="text-lg font-medium text-white">
                                            예약 추첨
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                                추첨일 *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formatDateForInput(
                                                    data.timing.drawDate
                                                )}
                                                onChange={(e) =>
                                                    handleTimingChange(
                                                        "drawDate",
                                                        parseInputDate(
                                                            e.target.value
                                                        )
                                                    )
                                                }
                                                min={formatDateForInput(
                                                    data.timing.endDate + 60
                                                )}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                            <p className="mt-2 text-xs text-gray-400">
                                                종료일 이후에 추첨이 진행됩니다.
                                            </p>
                                        </div>

                                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaInfoCircle
                                                    className="text-blue-400"
                                                    size={14}
                                                />
                                                <span className="text-blue-400 font-medium text-sm">
                                                    예약 추첨 안내
                                                </span>
                                            </div>
                                            <p className="text-blue-300 text-xs">
                                                추첨을 특정 시간으로 예약할 수
                                                있습니다. 이벤트성 추첨이나
                                                특별한 시점에 맞춰 진행하고 싶을
                                                때 유용합니다.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 사이드바 - 일정 요약 및 시각화 */}
                <div className="space-y-6">
                    {/* 일정 요약 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaInfoCircle
                                className="mr-3 text-blue-400"
                                size={16}
                            />
                            일정 요약
                        </h4>

                        <div className="space-y-4">
                            {/* 타임라인 시각화 */}
                            <div className="relative">
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600"></div>

                                {/* 시작 */}
                                <div className="relative flex items-center gap-4 pb-6">
                                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center relative z-10">
                                        <FaPlay
                                            className="text-white"
                                            size={16}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            래플 시작
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(
                                                data.timing.startDate * 1000
                                            ).toLocaleString("ko-KR")}
                                        </p>
                                    </div>
                                </div>

                                {/* 종료 */}
                                <div className="relative flex items-center gap-4 pb-6">
                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center relative z-10">
                                        <FaStop
                                            className="text-white"
                                            size={16}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            래플 종료
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(
                                                data.timing.endDate * 1000
                                            ).toLocaleString("ko-KR")}
                                        </p>
                                    </div>
                                </div>

                                {/* 추첨 */}
                                <div className="relative flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                                            data.timing.instantDraw
                                                ? "bg-yellow-600"
                                                : "bg-purple-600"
                                        }`}
                                    >
                                        {data.timing.instantDraw ? (
                                            <FaBolt
                                                className="text-white"
                                                size={16}
                                            />
                                        ) : (
                                            <FaHourglass
                                                className="text-white"
                                                size={16}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            {data.timing.instantDraw
                                                ? "즉시 추첨"
                                                : "예약 추첨"}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(
                                                data.timing.drawDate * 1000
                                            ).toLocaleString("ko-KR")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 주요 정보 */}
                            <div className="border-t border-gray-700 pt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">
                                        총 기간:
                                    </span>
                                    <span className="text-white font-medium">
                                        {scheduleInfo.duration.days > 0 &&
                                            `${scheduleInfo.duration.days}일 `}
                                        {scheduleInfo.duration.hours > 0 &&
                                            `${scheduleInfo.duration.hours}시간`}
                                        {scheduleInfo.duration.days === 0 &&
                                            scheduleInfo.duration.hours === 0 &&
                                            "0시간"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">
                                        추첨 방식:
                                    </span>
                                    <span
                                        className={`font-medium ${
                                            data.timing.instantDraw
                                                ? "text-yellow-400"
                                                : "text-purple-400"
                                        }`}
                                    >
                                        {data.timing.instantDraw
                                            ? "즉시 추첨"
                                            : "예약 추첨"}
                                    </span>
                                </div>
                                {!data.timing.instantDraw && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">
                                            추첨 대기:
                                        </span>
                                        <span className="text-purple-400 font-medium">
                                            {Math.ceil(
                                                (data.timing.drawDate -
                                                    data.timing.endDate) /
                                                    3600
                                            )}
                                            시간
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 경고 및 권장사항 */}
                    {data.timing.startDate <=
                        Math.floor(Date.now() / 1000) + 3600 && (
                        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                            <div className="flex items-center mb-2">
                                <FaExclamationTriangle
                                    className="text-red-400 mr-2"
                                    size={16}
                                />
                                <span className="text-red-400 font-medium">
                                    시간 설정 경고
                                </span>
                            </div>
                            <p className="text-red-300 text-sm">
                                시작일이 현재 시간과 너무 가깝습니다. 트랜잭션
                                처리 시간을 고려하여 최소 1시간 후로
                                설정해주세요.
                            </p>
                        </div>
                    )}

                    {/* 권장사항 */}
                    <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                            <FaLightbulb
                                className="text-blue-400 mr-2"
                                size={16}
                            />
                            <span className="text-blue-400 font-medium">
                                권장사항
                            </span>
                        </div>
                        <div className="space-y-2 text-sm text-blue-300">
                            <p>• 빠른 래플(6시간): 긴급 이벤트나 한정 상품</p>
                            <p>• 표준 래플(3일): 일반적인 프로모션 이벤트</p>
                            <p>• 장기 래플(1주일): 대규모 이벤트나 고가 상품</p>
                            <p>• 즉시 추첨: 참여도 높임, 빠른 만족도</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
