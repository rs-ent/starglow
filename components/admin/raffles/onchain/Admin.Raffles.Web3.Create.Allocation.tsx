"use client";

import { useState, useCallback } from "react";
import {
    FaCheck,
    FaCog,
    FaGift,
    FaPlay,
    FaSpinner,
    FaExclamationTriangle,
    FaTrash,
    FaEye,
} from "react-icons/fa";
import { useToast } from "@/app/hooks/useToast";
import {
    allocatePrizeV2,
    activateRaffleV2,
    deallocatePrizeV2,
    getRaffleAllocationSummaryV2,
    getTicketAllocationRangeV2,
} from "@/app/actions/raffles/onchain/actions-admin-v2";
import { getFullRaffleInfoV2 } from "@/app/actions/raffles/onchain/actions-read-v2";

interface AllocationProps {
    contractAddress: string;
    raffleId: string;
    onComplete?: () => void;
}

interface PrizeAllocationStatus {
    index: number;
    allocated: boolean;
    allocating: boolean;
    deallocating: boolean;
    error: string | null;
    startTicket?: number;
    endTicket?: number;
    ticketCount?: number;
}

interface AllocationSummary {
    totalTickets: number;
    allocatedTickets: number;
    totalPrizes: number;
    allocatedPrizes: number;
    allPrizesAllocated: boolean;
}

export function AdminRafflesWeb3CreateAllocation({
    contractAddress,
    raffleId,
    onComplete,
}: AllocationProps) {
    const toast = useToast();
    const [raffleInfo, setRaffleInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [prizeStatuses, setPrizeStatuses] = useState<PrizeAllocationStatus[]>(
        []
    );
    const [activating, setActivating] = useState(false);
    const [isReadyToActivate, setIsReadyToActivate] = useState(false);
    const [allocationSummary, setAllocationSummary] =
        useState<AllocationSummary | null>(null);
    const [showTicketDetails, setShowTicketDetails] = useState(false);

    const loadAllocationSummary = useCallback(async () => {
        try {
            const result = await getRaffleAllocationSummaryV2({
                contractAddress,
                raffleId,
            });

            if (result.success && result.data) {
                setAllocationSummary({
                    totalTickets: result.data.totalTickets,
                    allocatedTickets: result.data.allocatedTickets,
                    totalPrizes: result.data.totalPrizes,
                    allocatedPrizes: result.data.allocatedPrizes,
                    allPrizesAllocated: result.data.allPrizesAllocated,
                });
            }
        } catch (error) {
            console.warn("Failed to load allocation summary:", error);
        }
    }, [contractAddress, raffleId]);

    const loadTicketRanges = useCallback(
        async (statuses: PrizeAllocationStatus[]) => {
            const updatedStatuses = [...statuses];

            for (let i = 0; i < statuses.length; i++) {
                if (statuses[i].allocated) {
                    try {
                        const result = await getTicketAllocationRangeV2({
                            contractAddress,
                            raffleId,
                            prizeIndex: i,
                        });

                        if (result.success && result.data) {
                            updatedStatuses[i] = {
                                ...updatedStatuses[i],
                                startTicket: result.data.startTicket,
                                endTicket: result.data.endTicket,
                                ticketCount:
                                    result.data.endTicket -
                                    result.data.startTicket +
                                    1,
                            };
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to load ticket range for prize ${i}:`,
                            error
                        );
                    }
                }
            }

            setPrizeStatuses(updatedStatuses);
        },
        [contractAddress, raffleId]
    );

    const loadRaffleInfo = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getFullRaffleInfoV2({
                contractAddress,
                raffleId,
            });

            if (result.success && result.data) {
                setRaffleInfo(result.data);

                const statuses = result.data.prizes.map(
                    (prize: any, index: number) => ({
                        index,
                        allocated: prize.allocated,
                        allocating: false,
                        deallocating: false,
                        error: null,
                    })
                );

                setPrizeStatuses(statuses);

                const allAllocated = statuses.every(
                    (status) => status.allocated
                );
                setIsReadyToActivate(
                    allAllocated && result.data.status.readyToActive
                );

                await loadAllocationSummary();
                await loadTicketRanges(statuses);
            } else {
                toast.error(
                    result.error || "래플 정보를 불러오는데 실패했습니다."
                );
            }
        } catch (error) {
            console.error("Error loading raffle info:", error);
            toast.error("래플 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [
        contractAddress,
        raffleId,
        toast,
        loadAllocationSummary,
        loadTicketRanges,
    ]);

    const validateAllocation = useCallback(
        (prizeIndex: number): { valid: boolean; warning?: string } => {
            if (!raffleInfo?.prizes[prizeIndex]) {
                return {
                    valid: false,
                    warning: "상품 정보를 찾을 수 없습니다.",
                };
            }

            const status = prizeStatuses[prizeIndex];

            if (status?.allocated) {
                return { valid: false, warning: "이미 할당된 상품입니다." };
            }

            if (status?.allocating) {
                return { valid: false, warning: "현재 할당 중인 상품입니다." };
            }

            const allocatedCount = prizeStatuses.filter(
                (s) => s.allocated
            ).length;
            if (allocatedCount >= raffleInfo.prizes.length) {
                return {
                    valid: false,
                    warning: "모든 상품이 이미 할당되었습니다.",
                };
            }

            return { valid: true };
        },
        [raffleInfo, prizeStatuses]
    );

    const handleAllocatePrize = useCallback(
        async (prizeIndex: number) => {
            const validation = validateAllocation(prizeIndex);
            if (!validation.valid) {
                toast.error(validation.warning || "할당할 수 없습니다.");
                return;
            }

            setPrizeStatuses((prev) =>
                prev.map((status) =>
                    status.index === prizeIndex
                        ? { ...status, allocating: true, error: null }
                        : status
                )
            );

            try {
                const result = await allocatePrizeV2({
                    contractAddress,
                    raffleId,
                    prizeIndex,
                });

                if (result.success) {
                    toast.success(`상품 ${prizeIndex + 1} 할당 완료`);

                    if (result.data?.allPrizesAllocated) {
                        toast.info(
                            "🎉 모든 상품이 할당되었습니다! 이제 래플을 활성화할 수 있습니다."
                        );
                    }

                    // 성공시 즉시 상태 새로고침
                    await loadRaffleInfo();
                } else {
                    console.error(
                        `❌ Prize ${prizeIndex} allocation failed:`,
                        result.error
                    );

                    setPrizeStatuses((prev) =>
                        prev.map((status) =>
                            status.index === prizeIndex
                                ? {
                                      ...status,
                                      allocating: false,
                                      error: result.error || "할당 실패",
                                  }
                                : status
                        )
                    );

                    // 가스 관련 에러인지 확인
                    const isGasError =
                        result.error?.includes("가스 부족") ||
                        result.error?.includes("out of gas") ||
                        result.error?.includes("gas required exceeds");

                    if (isGasError) {
                        toast.error(
                            `⛽ 가스 부족으로 할당 실패: 상품 ${
                                prizeIndex + 1
                            }의 티켓 수량이 너무 많습니다. 래플 설정을 조정해주세요.`
                        );
                    } else {
                        toast.error(
                            result.error ||
                                `상품 ${prizeIndex + 1} 할당에 실패했습니다.`
                        );
                    }
                }
            } catch (error) {
                console.error(
                    `💥 Prize ${prizeIndex} allocation error:`,
                    error
                );

                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "할당 중 오류가 발생했습니다.";

                setPrizeStatuses((prev) =>
                    prev.map((status) =>
                        status.index === prizeIndex
                            ? {
                                  ...status,
                                  allocating: false,
                                  error: errorMessage,
                              }
                            : status
                    )
                );

                // 네트워크 관련 에러인지 확인
                const isNetworkError =
                    errorMessage.includes("network") ||
                    errorMessage.includes("timeout") ||
                    errorMessage.includes("connection");

                if (isNetworkError) {
                    toast.error(
                        `🌐 네트워크 오류: 연결을 확인하고 다시 시도해주세요. (${errorMessage})`
                    );
                } else {
                    toast.error(errorMessage);
                }
            }
        },
        [contractAddress, raffleId, toast, validateAllocation, loadRaffleInfo]
    );

    const handleDeallocatePrize = useCallback(
        async (prizeIndex: number) => {
            const status = prizeStatuses[prizeIndex];
            if (!status?.allocated) {
                toast.error("할당되지 않은 상품입니다.");
                return;
            }

            if (status.deallocating) {
                toast.error("이미 할당 해제 중입니다.");
                return;
            }

            setPrizeStatuses((prev) =>
                prev.map((status) =>
                    status.index === prizeIndex
                        ? { ...status, deallocating: true, error: null }
                        : status
                )
            );

            try {
                const result = await deallocatePrizeV2({
                    contractId: contractAddress,
                    raffleId,
                    prizeIndex,
                });

                if (result.success) {
                    toast.success(`상품 ${prizeIndex + 1} 할당 해제 완료`);
                    await loadRaffleInfo();
                } else {
                    setPrizeStatuses((prev) =>
                        prev.map((status) =>
                            status.index === prizeIndex
                                ? {
                                      ...status,
                                      deallocating: false,
                                      error: result.error || "할당 해제 실패",
                                  }
                                : status
                        )
                    );
                    toast.error(
                        result.error ||
                            `상품 ${prizeIndex + 1} 할당 해제에 실패했습니다.`
                    );
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "할당 해제 중 오류가 발생했습니다.";
                setPrizeStatuses((prev) =>
                    prev.map((status) =>
                        status.index === prizeIndex
                            ? {
                                  ...status,
                                  deallocating: false,
                                  error: errorMessage,
                              }
                            : status
                    )
                );
                toast.error(errorMessage);
            }
        },
        [contractAddress, raffleId, toast, prizeStatuses, loadRaffleInfo]
    );

    const handleActivateRaffle = useCallback(async () => {
        setActivating(true);

        try {
            const result = await activateRaffleV2({
                contractAddress,
                raffleId,
            });

            if (result.success) {
                toast.success("래플이 성공적으로 활성화되었습니다!");
                onComplete?.();
            } else {
                toast.error(result.error || "래플 활성화에 실패했습니다.");
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "활성화 중 오류가 발생했습니다.";
            toast.error(errorMessage);
        } finally {
            setActivating(false);
        }
    }, [contractAddress, raffleId, toast, onComplete]);

    if (!raffleInfo) {
        return (
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center py-8">
                    <FaExclamationTriangle
                        className="text-red-400 mr-3"
                        size={20}
                    />
                    <span className="text-white">
                        래플 정보를 찾을 수 없습니다.
                    </span>

                    <button
                        onClick={loadRaffleInfo}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg ml-4"
                    >
                        래플 정보 새로고침
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center py-8">
                    <FaSpinner
                        className="animate-spin text-blue-400 mr-3"
                        size={20}
                    />
                    <span className="text-white">
                        래플 정보를 불러오는 중...
                    </span>
                </div>
            </div>
        );
    }

    const allocatedCount = prizeStatuses.filter(
        (status) => status.allocated
    ).length;
    const totalPrizes = prizeStatuses.length;
    const progressPercentage =
        totalPrizes > 0 ? (allocatedCount / totalPrizes) * 100 : 0;

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    티켓 할당 관리
                </h2>
                <p className="text-gray-400">
                    래플 ID: <span className="text-blue-400">{raffleId}</span>
                </p>
                <p className="text-gray-400">
                    제목:{" "}
                    <span className="text-white">
                        {raffleInfo.basicInfo.title}
                    </span>
                </p>
            </div>

            {allocationSummary && (
                <div className="mb-6 bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-white">
                            할당 요약
                        </h3>
                        <button
                            onClick={() =>
                                setShowTicketDetails(!showTicketDetails)
                            }
                            className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
                        >
                            <FaEye className="mr-1" size={12} />
                            {showTicketDetails ? "숨기기" : "상세보기"}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-gray-400">전체 티켓</div>
                            <div className="text-white font-medium">
                                {allocationSummary.totalTickets.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-400">할당된 티켓</div>
                            <div className="text-green-400 font-medium">
                                {allocationSummary.allocatedTickets.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-400">할당 상품</div>
                            <div className="text-blue-400 font-medium">
                                {allocationSummary.allocatedPrizes}/
                                {allocationSummary.totalPrizes}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-400">할당 상태</div>
                            <div
                                className={`font-medium ${
                                    allocationSummary.allPrizesAllocated
                                        ? "text-green-400"
                                        : "text-yellow-400"
                                }`}
                            >
                                {allocationSummary.allPrizesAllocated
                                    ? "완료"
                                    : "진행중"}
                            </div>
                        </div>
                    </div>

                    {showTicketDetails && raffleInfo && (
                        <div className="mt-4 border-t border-gray-600 pt-4">
                            <h4 className="text-sm font-medium text-white mb-3">
                                상품별 티켓 할당 현황
                            </h4>
                            <div className="space-y-2">
                                {raffleInfo.prizes.map(
                                    (prize: any, index: number) => {
                                        const status = prizeStatuses[index];
                                        const isAllocated =
                                            status?.allocated || false;

                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded-lg text-sm"
                                            >
                                                <div className="flex items-center">
                                                    <span className="text-purple-400 mr-2">
                                                        #{index + 1}
                                                    </span>
                                                    <span className="text-white truncate max-w-[200px]">
                                                        {prize.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-gray-400">
                                                        수량: {prize.quantity}
                                                    </span>
                                                    {isAllocated &&
                                                    status.ticketCount !==
                                                        undefined ? (
                                                        <span className="text-green-400 font-medium">
                                                            티켓:{" "}
                                                            {status.ticketCount.toLocaleString()}
                                                            개
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">
                                                            미할당
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            {allocationSummary &&
                                allocationSummary.totalTickets > 0 && (
                                    <div className="mt-3 text-xs text-gray-400 text-center">
                                        총{" "}
                                        {allocationSummary.allocatedTickets.toLocaleString()}
                                        개 티켓이{" "}
                                        {allocationSummary.allocatedPrizes}개
                                        상품에 할당됨 (
                                        {(
                                            (allocationSummary.allocatedTickets /
                                                allocationSummary.totalTickets) *
                                            100
                                        ).toFixed(1)}
                                        % 할당 완료)
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            )}

            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-white">
                        할당 진행률
                    </h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                            {allocatedCount}/{totalPrizes} 완료
                        </span>
                    </div>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                            allocatedCount === totalPrizes
                                ? "bg-green-500"
                                : "bg-blue-500"
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {allocatedCount === totalPrizes && isReadyToActivate && (
                    <div className="flex items-center text-green-400 text-sm">
                        <FaCheck size={14} className="mr-2" />
                        모든 상품이 할당되었습니다. 래플을 활성화할 수 있습니다.
                    </div>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">
                    상품 목록
                </h3>
                <div className="space-y-4">
                    {raffleInfo.prizes.map((prize: any, index: number) => {
                        const status = prizeStatuses[index];
                        const isAllocated = status?.allocated || false;
                        const isAllocating = status?.allocating || false;
                        const isDeallocating = status?.deallocating || false;
                        const error = status?.error;
                        const validation = validateAllocation(index);

                        return (
                            <div
                                key={index}
                                className={`border rounded-lg p-4 ${
                                    isAllocated
                                        ? "border-green-600 bg-green-900/20"
                                        : error
                                        ? "border-red-600 bg-red-900/20"
                                        : "border-gray-600 bg-gray-750"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <FaGift
                                                className="text-purple-400 mr-2"
                                                size={16}
                                            />
                                            <h4 className="font-medium text-white">
                                                상품 {index + 1}: {prize.title}
                                            </h4>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-2">
                                            {prize.description}
                                        </p>
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <span className="mr-4">
                                                수량: {prize.quantity}
                                            </span>
                                            <span className="mr-4">
                                                레어도: {prize.rarity}
                                            </span>
                                            <span>순서: {prize.order}</span>
                                        </div>

                                        {isAllocated &&
                                            status.ticketCount !==
                                                undefined && (
                                                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 mt-2">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-xs text-blue-300 mb-1">
                                                                할당된 티켓
                                                            </div>
                                                            <div className="text-lg font-bold text-blue-100">
                                                                {status.ticketCount?.toLocaleString()}
                                                                개
                                                            </div>
                                                            {allocationSummary &&
                                                                allocationSummary.totalTickets >
                                                                    0 && (
                                                                    <div className="text-xs text-blue-300/70 mt-1">
                                                                        당첨
                                                                        확률:{" "}
                                                                        {(
                                                                            (status.ticketCount /
                                                                                allocationSummary.totalTickets) *
                                                                            100
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                        %
                                                                    </div>
                                                                )}
                                                        </div>
                                                        {showTicketDetails &&
                                                            status.startTicket !==
                                                                undefined && (
                                                                <div className="text-right">
                                                                    <div className="text-xs text-gray-300 mb-1">
                                                                        티켓
                                                                        범위
                                                                    </div>
                                                                    <div className="text-sm text-white">
                                                                        #
                                                                        {status.startTicket?.toLocaleString()}{" "}
                                                                        ~ #
                                                                        {status.endTicket?.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            )}

                                        {!isAllocated && (
                                            <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3 mt-2">
                                                <div className="text-xs text-gray-400 mb-1">
                                                    티켓 할당 상태
                                                </div>
                                                <div className="text-sm text-gray-300">
                                                    할당되지 않음 (티켓 0개)
                                                </div>
                                            </div>
                                        )}

                                        {error && (
                                            <div className="mt-2 text-red-400 text-sm">
                                                오류: {error}
                                            </div>
                                        )}

                                        {!validation.valid && !isAllocated && (
                                            <div className="mt-2 text-yellow-400 text-sm flex items-center">
                                                <FaExclamationTriangle
                                                    className="mr-1"
                                                    size={12}
                                                />
                                                {validation.warning}
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex space-x-2">
                                        {isAllocated ? (
                                            <>
                                                <div className="flex items-center text-green-400 mr-2">
                                                    <FaCheck
                                                        size={16}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">
                                                        할당 완료
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleDeallocatePrize(
                                                            index
                                                        )
                                                    }
                                                    disabled={isDeallocating}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        isDeallocating
                                                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                            : "bg-red-600 hover:bg-red-700 text-white"
                                                    }`}
                                                >
                                                    {isDeallocating ? (
                                                        <div className="flex items-center">
                                                            <FaSpinner
                                                                className="animate-spin mr-2"
                                                                size={12}
                                                            />
                                                            해제 중...
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center">
                                                            <FaTrash
                                                                className="mr-2"
                                                                size={12}
                                                            />
                                                            할당 해제
                                                        </div>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleAllocatePrize(index)
                                                }
                                                disabled={
                                                    isAllocating ||
                                                    !validation.valid
                                                }
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isAllocating ||
                                                    !validation.valid
                                                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                            >
                                                {isAllocating ? (
                                                    <div className="flex items-center">
                                                        <FaSpinner
                                                            className="animate-spin mr-2"
                                                            size={14}
                                                        />
                                                        할당 중...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <FaCog
                                                            className="mr-2"
                                                            size={14}
                                                        />
                                                        할당하기
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isReadyToActivate && (
                <div className="border-t border-gray-600 pt-6">
                    <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-4">
                        <div className="flex items-center text-green-400 mb-2">
                            <FaCheck size={16} className="mr-2" />
                            <span className="font-medium">
                                모든 상품이 할당되었습니다!
                            </span>
                        </div>
                        <p className="text-green-300 text-sm">
                            이제 래플을 활성화하여 참여자들이 참가할 수 있도록
                            하세요.
                        </p>
                    </div>

                    <button
                        onClick={handleActivateRaffle}
                        disabled={activating}
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${
                            activating
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                        {activating ? (
                            <div className="flex items-center justify-center">
                                <FaSpinner
                                    className="animate-spin mr-2"
                                    size={16}
                                />
                                래플 활성화 중...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <FaPlay className="mr-2" size={16} />
                                래플 활성화
                            </div>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
