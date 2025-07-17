"use client";

import { useState, useCallback } from "react";
import {
    FaCog,
    FaArrowLeft,
    FaPlay,
    FaPause,
    FaUserShield,
    FaEye,
    FaSync,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";
import type { OnchainRaffleContract } from "@prisma/client";

import { useToast } from "@/app/hooks/useToast";
import { useStoryNetwork } from "@/app/story/network/hooks";
import {
    getRafflesContracts,
    updateRafflesContract,
} from "@/app/actions/raffles/web3/actions-admin";

interface Props {
    onBack: () => void;
}

interface ContractWithNetwork extends OnchainRaffleContract {
    network?: {
        name: string;
        symbol: string;
        chainId: number;
        isTestnet: boolean;
    };
}

export default function AdminRafflesWeb3Contracts({ onBack }: Props) {
    const toast = useToast();
    const [contracts, setContracts] = useState<ContractWithNetwork[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { storyNetworks } = useStoryNetwork({
        getStoryNetworksInput: { isActive: true },
    });

    const fetchContracts = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const result = await getRafflesContracts({ isActive: true });

            if (result.success && result.data) {
                const contractsWithNetworks = result.data.map((contract) => {
                    const network = Array.isArray(storyNetworks)
                        ? storyNetworks.find((n) => n.id === contract.networkId)
                        : undefined;
                    return {
                        ...contract,
                        network: network
                            ? {
                                  name: network.name,
                                  symbol: network.symbol,
                                  chainId: network.chainId,
                                  isTestnet: network.isTestnet,
                              }
                            : undefined,
                    };
                });
                setContracts(contractsWithNetworks);
            } else {
                toast.error(result.error || "컨트랙트 조회에 실패했습니다.");
                setContracts([]);
            }
        } catch (error) {
            console.error("Error fetching contracts:", error);
            toast.error("컨트랙트 조회 중 오류가 발생했습니다.");
            setContracts([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [storyNetworks, toast]);

    const loadContracts = useCallback(async () => {
        if (
            storyNetworks &&
            Array.isArray(storyNetworks) &&
            storyNetworks.length > 0
        ) {
            try {
                await fetchContracts();
            } catch (error) {
                console.error("Error loading contracts:", error);
                toast.error("컨트랙트 로딩 중 오류가 발생했습니다.");
            }
        }
    }, [storyNetworks, fetchContracts, toast]);

    const handleToggleStatus = async (
        contractId: string,
        currentStatus: boolean
    ) => {
        try {
            const result = await updateRafflesContract({
                id: contractId,
                isActive: !currentStatus,
            });

            if (result.success) {
                toast.success(
                    `컨트랙트가 ${
                        !currentStatus ? "활성화" : "비활성화"
                    }되었습니다.`
                );
                await loadContracts();
            } else {
                toast.error(
                    result.error || "컨트랙트 상태 변경에 실패했습니다."
                );
            }
        } catch (error) {
            console.error("Error updating contract status:", error);
            toast.error("컨트랙트 상태 변경 중 오류가 발생했습니다.");
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 10)}...${address.slice(-8)}`;
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                컨트랙트 <span className="text-purple-400">관리</span>
            </h1>

            <div className="w-full max-w-6xl bg-black/20 rounded-xl p-8 border border-purple-500/20">
                <div className="space-y-8">
                    <div className="text-center">
                        <FaCog className="text-6xl text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg mb-6">
                            배포된 래플 컨트랙트를 관리합니다
                        </p>
                        <button
                            onClick={loadContracts}
                            disabled={isRefreshing}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                        >
                            <FaSync
                                className={isRefreshing ? "animate-spin" : ""}
                            />
                            {isRefreshing ? "새로고침 중..." : "새로고침"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4 text-lg">
                                배포된 컨트랙트 목록
                            </h3>
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-blue-200">
                                        컨트랙트 불러오는 중...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {contracts.map((contract) => (
                                        <div
                                            key={contract.id}
                                            className="bg-black/40 rounded-lg p-4 border border-gray-600"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${
                                                            contract.isActive
                                                                ? "bg-green-400"
                                                                : "bg-red-400"
                                                        }`}
                                                    ></div>
                                                    <span className="text-white font-medium font-mono">
                                                        {formatAddress(
                                                            contract.address
                                                        )}
                                                    </span>
                                                    {contract.network && (
                                                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                                            {
                                                                contract.network
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                    {contract.network
                                                        ?.isTestnet && (
                                                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                                                            Testnet
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="상세보기"
                                                        onClick={() => {
                                                            navigator.clipboard
                                                                .writeText(
                                                                    contract.address
                                                                )
                                                                .catch(
                                                                    (err) => {
                                                                        console.error(
                                                                            "Failed to copy address:",
                                                                            err
                                                                        );
                                                                    }
                                                                );
                                                            toast.success(
                                                                "주소가 복사되었습니다!"
                                                            );
                                                        }}
                                                    >
                                                        <FaEye className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                contract.id,
                                                                contract.isActive
                                                            )
                                                        }
                                                        className={`p-2 text-white rounded transition-colors ${
                                                            contract.isActive
                                                                ? "bg-orange-600 hover:bg-orange-700"
                                                                : "bg-green-600 hover:bg-green-700"
                                                        }`}
                                                        title={
                                                            contract.isActive
                                                                ? "비활성화"
                                                                : "활성화"
                                                        }
                                                    >
                                                        {contract.isActive ? (
                                                            <FaPause className="text-sm" />
                                                        ) : (
                                                            <FaPlay className="text-sm" />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                                                        title="관리자 관리"
                                                    >
                                                        <FaUserShield className="text-sm" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-400">
                                                        배포일:
                                                    </span>
                                                    <span className="text-white ml-2">
                                                        {formatDate(
                                                            contract.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">
                                                        블록:
                                                    </span>
                                                    <span className="text-white ml-2">
                                                        #{contract.blockNumber}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">
                                                        배포자:
                                                    </span>
                                                    <span className="text-cyan-300 ml-2 font-mono">
                                                        {formatAddress(
                                                            contract.deployedBy
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">
                                                        체인 ID:
                                                    </span>
                                                    <span className="text-white ml-2">
                                                        {contract.network
                                                            ?.chainId || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {contracts.length === 0 && !isLoading && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">
                                                배포된 컨트랙트가 없습니다
                                            </p>
                                            <p className="text-gray-500 text-sm mt-2">
                                                새 컨트랙트를 배포해보세요
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    컨트랙트 상태
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            활성 컨트랙트
                                        </span>
                                        <span className="text-green-400 font-medium">
                                            {
                                                contracts.filter(
                                                    (c) => c.isActive
                                                ).length
                                            }
                                            개
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            비활성
                                        </span>
                                        <span className="text-red-400 font-medium">
                                            {
                                                contracts.filter(
                                                    (c) => !c.isActive
                                                ).length
                                            }
                                            개
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            총 컨트랙트
                                        </span>
                                        <span className="text-white font-medium">
                                            {contracts.length}개
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    네트워크 분포
                                </h3>
                                <div className="space-y-3">
                                    {Array.isArray(storyNetworks)
                                        ? storyNetworks.map((network) => {
                                              const networkContracts =
                                                  contracts.filter(
                                                      (c) =>
                                                          c.networkId ===
                                                          network.id
                                                  );
                                              return (
                                                  <div
                                                      key={network.id}
                                                      className="flex justify-between"
                                                  >
                                                      <span className="text-gray-400 text-sm">
                                                          {network.name}
                                                      </span>
                                                      <span className="text-white font-medium">
                                                          {
                                                              networkContracts.length
                                                          }
                                                          개
                                                      </span>
                                                  </div>
                                              );
                                          })
                                        : null}
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    관리 작업
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                                        onClick={() =>
                                            toast.info(
                                                "관리자 추가 기능 준비 중..."
                                            )
                                        }
                                    >
                                        관리자 추가
                                    </button>
                                    <button
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                                        onClick={() =>
                                            toast.info(
                                                "일괄 비활성화 기능 준비 중..."
                                            )
                                        }
                                    >
                                        일괄 비활성화
                                    </button>
                                    <button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                                        onClick={() =>
                                            toast.info(
                                                "일괄 활성화 기능 준비 중..."
                                            )
                                        }
                                    >
                                        일괄 활성화
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                onClick={onBack}
            >
                <FaArrowLeft />
                뒤로
            </button>
        </div>
    );
}
