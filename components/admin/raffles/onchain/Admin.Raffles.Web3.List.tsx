"use client";

import { useState, useCallback } from "react";
import {
    FaList,
    FaPlay,
    FaPause,
    FaEye,
    FaSync,
    FaCopy,
    FaExternalLinkAlt,
    FaTrophy,
    FaDice,
    FaUsers,
    FaBolt,
    FaCheck,
    FaSpinner,
    FaCog,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import { useToast } from "@/app/hooks/useToast";
import { useStoryNetwork } from "@/app/story/network/hooks";
import {
    getOnchainRaffles,
    updateRaffle,
    type Raffle,
    batchDrawV2,
    getBatchDrawProgress,
    completeRaffleV2,
    activateRaffleV2,
} from "@/app/actions/raffles/onchain/actions-admin-v2";
import { AdminRafflesWeb3CreateAllocation } from "@/components/admin/raffles/onchain/Admin.Raffles.Web3.Create.Allocation";

type RaffleData = Raffle;

type Filters = {
    networkId: string;
    contractAddress: string;
    isActive: "ACTIVE" | "INACTIVE" | undefined;
};

interface BatchDrawState {
    raffleId: string;
    isDrawing: boolean;
    progress: {
        totalParticipants: number;
        drawnParticipants: number;
        remainingParticipants: number;
        progressPercentage: number;
    } | null;
    currentBatch: {
        startIndex: number;
        maxCount: number;
    };
}

export default function AdminRafflesWeb3List() {
    const toast = useToast();
    const [raffles, setRaffles] = useState<RaffleData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [batchDrawStates, setBatchDrawStates] = useState<
        Record<string, BatchDrawState>
    >({});
    const [selectedRaffleForAllocation, setSelectedRaffleForAllocation] =
        useState<RaffleData | null>(null);

    const [filters, setFilters] = useState<Filters>({
        networkId: "",
        contractAddress: "",
        isActive: undefined,
    });

    const { storyNetworks } = useStoryNetwork({
        getStoryNetworksInput: { isActive: true },
    });

    const fetchRaffles = useCallback(async () => {
        try {
            setIsRefreshing(true);

            let isActiveParam: "ACTIVE" | "INACTIVE" | undefined;
            if (filters.isActive === "ACTIVE") {
                isActiveParam = "ACTIVE";
            } else if (filters.isActive === "INACTIVE") {
                isActiveParam = "INACTIVE";
            } else {
                isActiveParam = undefined;
            }

            const result = await getOnchainRaffles({
                networkId: filters.networkId || undefined,
                contractAddress: filters.contractAddress || undefined,
                isActive: isActiveParam,
            });

            if (result.success && result.data) {
                setRaffles(result.data.raffles);
            } else {
                toast.error(result.error || "래플 조회에 실패했습니다.");
                setRaffles([]);
            }
        } catch (error) {
            console.error("Error fetching raffles:", error);
            toast.error("래플 조회 중 오류가 발생했습니다.");
            setRaffles([]);
        } finally {
            setIsRefreshing(false);
        }
    }, [filters, toast]);

    const loadRaffles = useCallback(async () => {
        setIsLoading(true);
        try {
            await fetchRaffles();
        } catch (error) {
            console.error("Error loading raffles:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchRaffles]);

    const handleToggleActive = async (
        raffle: RaffleData,
        currentStatus: boolean
    ) => {
        try {
            setIsProcessing(raffle.id);

            if (!currentStatus) {
                // 활성화: 스마트 컨트랙트에서 실제 활성화
                const result = await activateRaffleV2({
                    contractAddress: raffle.contractAddress,
                    raffleId: raffle.raffleId,
                });

                if (result.success) {
                    toast.success(
                        "래플이 스마트 컨트랙트에서 활성화되었습니다."
                    );
                    await loadRaffles();
                } else {
                    toast.error(result.error || "래플 활성화에 실패했습니다.");
                }
            } else {
                // 비활성화: DB만 업데이트 (V2에서는 완료 처리를 별도로 사용)
                const result = await updateRaffle({
                    id: raffle.id,
                    isActive: false,
                });

                if (result.success) {
                    toast.success(
                        "래플이 비활성화되었습니다. (완료하려면 '래플 완료' 버튼을 사용하세요)"
                    );
                    await loadRaffles();
                } else {
                    toast.error(
                        result.error || "래플 비활성화에 실패했습니다."
                    );
                }
            }
        } catch (error) {
            console.error("Error updating raffle status:", error);
            toast.error("래플 상태 변경 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleCompleteRaffle = async (raffle: RaffleData) => {
        try {
            setIsProcessing(raffle.id);
            const result = await completeRaffleV2({
                contractAddress: raffle.contractAddress,
                raffleId: raffle.raffleId,
            });

            if (result.success && result.data) {
                toast.success("래플이 완료되었습니다.");
                await loadRaffles();
            } else {
                toast.error(result.error || "래플 완료에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error completing raffle:", error);
            toast.error("래플 완료 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(null);
        }
    };

    const initializeBatchDraw = async (raffle: RaffleData) => {
        try {
            const progressResult = await getBatchDrawProgress({
                contractAddress: raffle.contractAddress,
                raffleId: raffle.raffleId,
            });

            if (progressResult.success && progressResult.data) {
                const data = progressResult.data;
                setBatchDrawStates((prev) => ({
                    ...prev,
                    [raffle.id]: {
                        raffleId: raffle.raffleId,
                        isDrawing: false,
                        progress: {
                            totalParticipants: data.totalParticipants,
                            drawnParticipants: data.drawnParticipants,
                            remainingParticipants: data.remainingParticipants,
                            progressPercentage: data.progressPercentage,
                        },
                        currentBatch: {
                            startIndex: data.drawnParticipants,
                            maxCount: 100,
                        },
                    },
                }));
            }
        } catch (error) {
            console.error("Error initializing batch draw:", error);
            toast.error("배치 추첨 초기화 중 오류가 발생했습니다.");
        }
    };

    const handleBatchDraw = async (raffle: RaffleData) => {
        const currentState = batchDrawStates[raffle.id];
        if (!currentState) {
            await initializeBatchDraw(raffle);
            return;
        }

        try {
            setBatchDrawStates((prev) => ({
                ...prev,
                [raffle.id]: { ...prev[raffle.id], isDrawing: true },
            }));

            const result = await batchDrawV2({
                contractAddress: raffle.contractAddress,
                raffleId: raffle.raffleId,
                startIndex: currentState.currentBatch.startIndex,
                maxCount: currentState.currentBatch.maxCount,
            });

            if (result.success && result.data) {
                const batchData = result.data;
                toast.success(
                    `배치 추첨 완료: ${batchData.totalDrawn}개 처리됨`
                );

                const progressResult = await getBatchDrawProgress({
                    contractAddress: raffle.contractAddress,
                    raffleId: raffle.raffleId,
                });

                if (progressResult.success && progressResult.data) {
                    const progressData = progressResult.data;
                    setBatchDrawStates((prev) => ({
                        ...prev,
                        [raffle.id]: {
                            ...prev[raffle.id],
                            isDrawing: false,
                            progress: {
                                totalParticipants:
                                    progressData.totalParticipants,
                                drawnParticipants:
                                    progressData.drawnParticipants,
                                remainingParticipants:
                                    progressData.remainingParticipants,
                                progressPercentage:
                                    progressData.progressPercentage,
                            },
                            currentBatch: {
                                startIndex: batchData.nextStartIndex || 0,
                                maxCount: currentState.currentBatch.maxCount,
                            },
                        },
                    }));

                    if (batchData.completed) {
                        toast.success("🎉 모든 배치 추첨이 완료되었습니다!");
                    }
                }
            } else {
                toast.error(result.error || "배치 추첨에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error in batch draw:", error);
            toast.error("배치 추첨 중 오류가 발생했습니다.");
        } finally {
            setBatchDrawStates((prev) => ({
                ...prev,
                [raffle.id]: { ...prev[raffle.id], isDrawing: false },
            }));
        }
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${type}이(가) 복사되었습니다!`);
        } catch (error) {
            console.error("Copy failed:", error);
            toast.error("복사에 실패했습니다.");
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-6)}`;
    };

    const handleManageAllocation = useCallback((raffle: RaffleData) => {
        setSelectedRaffleForAllocation(raffle);
    }, []);

    const handleAllocationComplete = useCallback(() => {
        setSelectedRaffleForAllocation(null);
        loadRaffles().catch((error) => {
            console.error("Error loading raffles:", error);
        });
        toast.success("Allocation이 완료되었습니다!");
    }, [loadRaffles, toast]);

    const getNetworkExplorerUrl = (networkId: string, hash?: string) => {
        const network = Array.isArray(storyNetworks)
            ? storyNetworks.find((n) => n.id === networkId)
            : null;
        if (!network?.explorerUrl || !hash) return null;
        return `${network.explorerUrl}/tx/${hash}`;
    };

    const filteredRaffles = raffles;

    if (selectedRaffleForAllocation) {
        return (
            <div className="min-h-[60vh] flex flex-col bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedRaffleForAllocation(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        ← 래플 목록으로 돌아가기
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        래플 ID: {selectedRaffleForAllocation.raffleId} -
                        Allocation 관리
                    </h2>
                </div>

                <AdminRafflesWeb3CreateAllocation
                    contractAddress={
                        selectedRaffleForAllocation.contractAddress
                    }
                    raffleId={selectedRaffleForAllocation.raffleId}
                    onComplete={handleAllocationComplete}
                />
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                V2 래플 <span className="text-purple-400">목록</span>
            </h1>

            <div className="w-full max-w-7xl bg-black/20 rounded-xl p-8 border border-purple-500/20">
                <div className="mb-8 p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-700/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <FaBolt className="mr-3 text-green-400" size={20} />
                        RafflesV2 관리 기능
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/50">
                            <FaDice className="text-green-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    배치 추첨
                                </div>
                                <div className="text-xs text-green-300">
                                    대량 처리 최적화
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                            <FaUsers className="text-blue-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    진행률 추적
                                </div>
                                <div className="text-xs text-blue-300">
                                    실시간 모니터링
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-700/50">
                            <FaTrophy className="text-purple-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    완료 관리
                                </div>
                                <div className="text-xs text-purple-300">
                                    안전한 종료
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <FaList className="text-4xl text-blue-400" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    생성된 V2 래플 관리
                                </h2>
                                <p className="text-gray-300 text-sm">
                                    배포된 RafflesV2 컨트랙트의 래플을
                                    관리합니다
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={loadRaffles}
                            disabled={isRefreshing}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FaSync
                                className={isRefreshing ? "animate-spin" : ""}
                            />
                            {isRefreshing ? "새로고침 중..." : "새로고침"}
                        </button>
                    </div>

                    <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-white font-semibold mb-4">필터</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">
                                    네트워크
                                </label>
                                <select
                                    value={filters.networkId}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            networkId: e.target.value,
                                        }))
                                    }
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                >
                                    <option value="">모든 네트워크</option>
                                    {Array.isArray(storyNetworks) &&
                                        storyNetworks.map((network) => (
                                            <option
                                                key={network.id}
                                                value={network.id}
                                            >
                                                {network.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">
                                    컨트랙트 주소
                                </label>
                                <input
                                    type="text"
                                    value={filters.contractAddress}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            contractAddress: e.target.value,
                                        }))
                                    }
                                    placeholder="0x..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">
                                    상태
                                </label>
                                <select
                                    value={
                                        filters.isActive === undefined
                                            ? ""
                                            : filters.isActive
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFilters((prev) => ({
                                            ...prev,
                                            isActive:
                                                value === ""
                                                    ? undefined
                                                    : value === "ACTIVE"
                                                    ? "ACTIVE"
                                                    : "INACTIVE",
                                        }));
                                    }}
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                >
                                    <option value="">모든 상태</option>
                                    <option value="ACTIVE">활성</option>
                                    <option value="INACTIVE">비활성</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-white font-semibold mb-6 text-lg">
                            V2 래플 목록 ({filteredRaffles.length}개)
                        </h3>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-blue-200">
                                    래플 불러오는 중...
                                </p>
                            </div>
                        ) : filteredRaffles.length > 0 ? (
                            <div className="space-y-6">
                                {filteredRaffles.map((raffle) => {
                                    const batchState =
                                        batchDrawStates[raffle.id];
                                    const explorerUrl = getNetworkExplorerUrl(
                                        raffle.networkId,
                                        undefined
                                    );

                                    return (
                                        <div
                                            key={raffle.id}
                                            className="bg-black/40 rounded-lg p-6 border border-gray-600"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-4 h-4 rounded-full ${
                                                            raffle.isActive
                                                                ? "bg-green-400"
                                                                : "bg-red-400"
                                                        }`}
                                                    ></div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-white font-medium">
                                                                래플 ID:{" "}
                                                                {
                                                                    raffle.raffleId
                                                                }
                                                            </span>
                                                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                                                V2
                                                            </span>
                                                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                                                {
                                                                    raffle
                                                                        .network
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-400 mt-1">
                                                            컨트랙트:{" "}
                                                            {formatAddress(
                                                                raffle.contractAddress
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                raffle.contractAddress,
                                                                "컨트랙트 주소"
                                                            )
                                                        }
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="주소 복사"
                                                    >
                                                        <FaCopy className="text-sm" />
                                                    </button>
                                                    {explorerUrl && (
                                                        <button
                                                            onClick={() =>
                                                                window.open(
                                                                    explorerUrl,
                                                                    "_blank"
                                                                )
                                                            }
                                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                                            title="탐색기에서 보기"
                                                        >
                                                            <FaExternalLinkAlt className="text-sm" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            handleToggleActive(
                                                                raffle,
                                                                raffle.isActive
                                                            )
                                                        }
                                                        disabled={
                                                            isProcessing ===
                                                            raffle.id
                                                        }
                                                        className={`p-2 text-white rounded transition-colors ${
                                                            raffle.isActive
                                                                ? "bg-orange-600 hover:bg-orange-700"
                                                                : "bg-green-600 hover:bg-green-700"
                                                        } disabled:opacity-50`}
                                                        title={
                                                            raffle.isActive
                                                                ? "비활성화"
                                                                : "활성화"
                                                        }
                                                    >
                                                        {isProcessing ===
                                                        raffle.id ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : raffle.isActive ? (
                                                            <FaPause className="text-sm" />
                                                        ) : (
                                                            <FaPlay className="text-sm" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                                                <div>
                                                    <span className="text-gray-400">
                                                        네트워크:
                                                    </span>
                                                    <span className="text-white ml-2">
                                                        {raffle.network.name}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">
                                                        체인 ID:
                                                    </span>
                                                    <span className="text-white ml-2">
                                                        {raffle.network.chainId}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">
                                                        상태:
                                                    </span>
                                                    <span
                                                        className={`ml-2 ${
                                                            raffle.isActive
                                                                ? "text-green-400"
                                                                : "text-red-400"
                                                        }`}
                                                    >
                                                        {raffle.isActive
                                                            ? "활성"
                                                            : "비활성"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-600 pt-4">
                                                <h4 className="text-white font-medium mb-3 flex items-center">
                                                    <FaDice
                                                        className="mr-2 text-green-400"
                                                        size={14}
                                                    />
                                                    V2 배치 추첨 관리
                                                </h4>

                                                {batchState?.progress && (
                                                    <div className="mb-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-white font-medium text-sm">
                                                                추첨 진행률
                                                            </span>
                                                            <span className="text-blue-400 font-medium">
                                                                {
                                                                    batchState
                                                                        .progress
                                                                        .progressPercentage
                                                                }
                                                                %
                                                            </span>
                                                        </div>

                                                        <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${batchState.progress.progressPercentage}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    총 참가자:
                                                                </span>
                                                                <span className="text-white ml-2">
                                                                    {
                                                                        batchState
                                                                            .progress
                                                                            .totalParticipants
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    추첨 완료:
                                                                </span>
                                                                <span className="text-green-400 ml-2">
                                                                    {
                                                                        batchState
                                                                            .progress
                                                                            .drawnParticipants
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    남은 참가자:
                                                                </span>
                                                                <span className="text-orange-400 ml-2">
                                                                    {
                                                                        batchState
                                                                            .progress
                                                                            .remainingParticipants
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                    <button
                                                        onClick={() =>
                                                            handleManageAllocation(
                                                                raffle
                                                            )
                                                        }
                                                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <FaCog size={10} />
                                                        Allocation 관리
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            initializeBatchDraw(
                                                                raffle
                                                            )
                                                        }
                                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <FaEye size={10} />
                                                        진행률 확인
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleBatchDraw(
                                                                raffle
                                                            )
                                                        }
                                                        disabled={
                                                            batchState?.isDrawing ||
                                                            isProcessing ===
                                                                raffle.id
                                                        }
                                                        className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        {batchState?.isDrawing ? (
                                                            <FaSpinner
                                                                className="animate-spin"
                                                                size={10}
                                                            />
                                                        ) : (
                                                            <FaDice size={10} />
                                                        )}
                                                        배치 추첨
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleCompleteRaffle(
                                                                raffle
                                                            )
                                                        }
                                                        disabled={
                                                            isProcessing ===
                                                            raffle.id
                                                        }
                                                        className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        {isProcessing ===
                                                        raffle.id ? (
                                                            <FaSpinner
                                                                className="animate-spin"
                                                                size={10}
                                                            />
                                                        ) : (
                                                            <FaCheck
                                                                size={10}
                                                            />
                                                        )}
                                                        래플 완료
                                                    </button>
                                                </div>

                                                {batchState?.progress
                                                    ?.progressPercentage ===
                                                    100 && (
                                                    <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <FaCheck
                                                                className="text-green-400"
                                                                size={14}
                                                            />
                                                            <span className="text-green-400 font-medium text-sm">
                                                                모든 배치 추첨이
                                                                완료되었습니다!
                                                            </span>
                                                        </div>
                                                        <p className="text-green-300 text-xs mt-1">
                                                            이제 래플을 완료하여
                                                            상품을 배분할 수
                                                            있습니다.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FaTrophy className="text-6xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">
                                    생성된 V2 래플이 없습니다
                                </p>
                                <p className="text-gray-500 text-sm mt-2">
                                    새 V2 래플을 생성해보세요
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">
                                총 V2 래플
                            </h3>
                            <div className="text-3xl font-bold text-blue-400">
                                {filteredRaffles.length}
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">
                                활성 래플
                            </h3>
                            <div className="text-3xl font-bold text-green-400">
                                {
                                    filteredRaffles.filter((r) => r.isActive)
                                        .length
                                }
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">
                                비활성 래플
                            </h3>
                            <div className="text-3xl font-bold text-red-400">
                                {
                                    filteredRaffles.filter((r) => !r.isActive)
                                        .length
                                }
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">
                                진행 중 추첨
                            </h3>
                            <div className="text-3xl font-bold text-purple-400">
                                {
                                    Object.values(batchDrawStates).filter(
                                        (s) => s.isDrawing
                                    ).length
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
