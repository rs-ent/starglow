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
    FaPlus,
    FaMinus,
    FaShieldAlt,
    FaExclamationTriangle,
    FaCheckCircle,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";
import type { OnchainRaffleContract } from "@prisma/client";

import { useToast } from "@/app/hooks/useToast";
import { useStoryNetwork } from "@/app/story/network/hooks";
import {
    getRafflesContractsV2,
    updateRafflesContractV2,
} from "@/app/actions/raffles/onchain/actions-admin-v2";
import {
    manageRole,
    pauseContract,
} from "@/app/actions/raffles/onchain/actions-admin-v2";

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

interface RoleManagementModal {
    isOpen: boolean;
    contractAddress: string;
    currentAction: "grant" | "revoke" | null;
    targetRole: "ADMIN" | null;
    targetAddress: string;
}

export default function AdminRafflesWeb3Contracts({ onBack }: Props) {
    const toast = useToast();
    const [contracts, setContracts] = useState<ContractWithNetwork[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const [roleModal, setRoleModal] = useState<RoleManagementModal>({
        isOpen: false,
        contractAddress: "",
        currentAction: null,
        targetRole: null,
        targetAddress: "",
    });

    const { storyNetworks } = useStoryNetwork({
        getStoryNetworksInput: { isActive: true },
    });

    const fetchContracts = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const result = await getRafflesContractsV2({ isActive: true });

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
            setIsProcessing(contractId);
            const result = await updateRafflesContractV2({
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
        } finally {
            setIsProcessing(null);
        }
    };

    const handlePauseContract = async (
        contractId: string,
        shouldPause: boolean
    ) => {
        const contract = contracts.find((c) => c.id === contractId);
        if (!contract) return;

        try {
            setIsProcessing(contractId);
            const result = await pauseContract({
                contractAddress: contract.address,
                walletAddress: contract.deployedBy,
                pause: shouldPause,
            });

            if (result.success && result.data) {
                toast.success(
                    `컨트랙트가 ${shouldPause ? "일시정지" : "재개"}되었습니다.`
                );
                await loadContracts();
            } else {
                toast.error(
                    result.error ||
                        `컨트랙트 ${
                            shouldPause ? "일시정지" : "재개"
                        }에 실패했습니다.`
                );
            }
        } catch (error) {
            console.error("Error pausing/unpausing contract:", error);
            toast.error(
                `컨트랙트 ${
                    shouldPause ? "일시정지" : "재개"
                } 중 오류가 발생했습니다.`
            );
        } finally {
            setIsProcessing(null);
        }
    };

    const openRoleModal = (
        contractAddress: string,
        action: "grant" | "revoke",
        role: "ADMIN"
    ) => {
        setRoleModal({
            isOpen: true,
            contractAddress,
            currentAction: action,
            targetRole: role,
            targetAddress: "",
        });
    };

    const closeRoleModal = () => {
        setRoleModal({
            isOpen: false,
            contractAddress: "",
            currentAction: null,
            targetRole: null,
            targetAddress: "",
        });
    };

    const handleRoleManagement = async () => {
        if (
            !roleModal.contractAddress ||
            !roleModal.currentAction ||
            !roleModal.targetRole ||
            !roleModal.targetAddress
        ) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        try {
            setIsProcessing(roleModal.contractAddress);
            const result = await manageRole({
                contractAddress: roleModal.contractAddress,
                targetAddress: roleModal.targetAddress,
                role: roleModal.targetRole,
                action: roleModal.currentAction.toUpperCase() as
                    | "GRANT"
                    | "REVOKE",
            });

            if (result.success && result.data) {
                toast.success(
                    `${roleModal.targetRole} 역할이 성공적으로 ${
                        roleModal.currentAction === "grant" ? "부여" : "회수"
                    }되었습니다.`
                );
                closeRoleModal();
            } else {
                toast.error(result.error || "역할 관리에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error managing role:", error);
            toast.error("역할 관리 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(null);
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
                V2 컨트랙트 <span className="text-purple-400">관리</span>
            </h1>

            <div className="w-full max-w-6xl bg-black/20 rounded-xl p-8 border border-purple-500/20">
                {/* V2 기능 안내 */}
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-700/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <FaShieldAlt
                            className="mr-3 text-purple-400"
                            size={20}
                        />
                        RafflesV2 관리 기능
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-700/50">
                            <FaUserShield
                                className="text-purple-400"
                                size={16}
                            />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    역할 관리
                                </div>
                                <div className="text-xs text-purple-300">
                                    ADMIN 권한 관리
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                            <FaPause className="text-blue-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    일시정지 제어
                                </div>
                                <div className="text-xs text-blue-300">
                                    긴급 상황 대응
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/50">
                            <FaCog className="text-green-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    고급 관리
                                </div>
                                <div className="text-xs text-green-300">
                                    세밀한 제어 가능
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="text-center">
                        <FaCog className="text-6xl text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg mb-6">
                            배포된 RafflesV2 컨트랙트를 관리합니다
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
                                배포된 V2 컨트랙트 목록
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
                                            className="bg-black/40 rounded-lg p-6 border border-gray-600"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-4 h-4 rounded-full ${
                                                            contract.isActive
                                                                ? "bg-green-400"
                                                                : "bg-red-400"
                                                        }`}
                                                    ></div>
                                                    <div>
                                                        <span className="text-white font-medium font-mono text-lg">
                                                            {formatAddress(
                                                                contract.address
                                                            )}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {contract.network && (
                                                                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                                                    {
                                                                        contract
                                                                            .network
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
                                                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                                                V2
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="주소 복사"
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
                                                                contract.address,
                                                                contract.isActive
                                                            )
                                                        }
                                                        disabled={
                                                            isProcessing ===
                                                            contract.address
                                                        }
                                                        className={`p-2 text-white rounded transition-colors ${
                                                            contract.isActive
                                                                ? "bg-orange-600 hover:bg-orange-700"
                                                                : "bg-green-600 hover:bg-green-700"
                                                        } disabled:opacity-50`}
                                                        title={
                                                            contract.isActive
                                                                ? "비활성화"
                                                                : "활성화"
                                                        }
                                                    >
                                                        {isProcessing ===
                                                        contract.address ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : contract.isActive ? (
                                                            <FaPause className="text-sm" />
                                                        ) : (
                                                            <FaPlay className="text-sm" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 컨트랙트 정보 */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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

                                            {/* V2 관리 기능 */}
                                            <div className="border-t border-gray-600 pt-4">
                                                <h4 className="text-white font-medium mb-3 flex items-center">
                                                    <FaShieldAlt
                                                        className="mr-2 text-purple-400"
                                                        size={14}
                                                    />
                                                    V2 관리 기능
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* 역할 관리 */}
                                                    <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                                        <h5 className="text-white font-medium mb-3 text-sm">
                                                            역할 관리
                                                        </h5>
                                                        <div className="space-y-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        openRoleModal(
                                                                            contract.address,
                                                                            "grant",
                                                                            "ADMIN"
                                                                        )
                                                                    }
                                                                    className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <FaPlus
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    ADMIN 부여
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        openRoleModal(
                                                                            contract.address,
                                                                            "revoke",
                                                                            "ADMIN"
                                                                        )
                                                                    }
                                                                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <FaMinus
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    ADMIN 회수
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 일시정지 제어 */}
                                                    <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                                                        <h5 className="text-white font-medium mb-3 text-sm">
                                                            일시정지 제어
                                                        </h5>
                                                        <div className="space-y-2">
                                                            <button
                                                                onClick={() =>
                                                                    handlePauseContract(
                                                                        contract.id,
                                                                        true
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing ===
                                                                    contract.id
                                                                }
                                                                className="w-full text-xs bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <FaPause
                                                                    size={10}
                                                                />
                                                                컨트랙트
                                                                일시정지
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handlePauseContract(
                                                                        contract.id,
                                                                        false
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing ===
                                                                    contract.id
                                                                }
                                                                className="w-full text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <FaPlay
                                                                    size={10}
                                                                />
                                                                컨트랙트 재개
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {contracts.length === 0 && !isLoading && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">
                                                배포된 V2 컨트랙트가 없습니다
                                            </p>
                                            <p className="text-gray-500 text-sm mt-2">
                                                새 V2 컨트랙트를 배포해보세요
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
                                            총 V2 컨트랙트
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
                                    V2 관리 작업
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                                        onClick={() =>
                                            toast.info(
                                                "ADMIN 역할 관리는 개별 컨트랙트에서 가능합니다."
                                            )
                                        }
                                    >
                                        <FaUserShield
                                            className="inline mr-2"
                                            size={12}
                                        />
                                        ADMIN 역할 관리
                                    </button>
                                    <button
                                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                                        onClick={() =>
                                            toast.info(
                                                "일시정지는 개별 컨트랙트에서 가능합니다."
                                            )
                                        }
                                    >
                                        <FaPause
                                            className="inline mr-2"
                                            size={12}
                                        />
                                        일괄 일시정지
                                    </button>
                                    <button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                                        onClick={() => loadContracts()}
                                    >
                                        <FaSync
                                            className="inline mr-2"
                                            size={12}
                                        />
                                        전체 새로고침
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 역할 관리 모달 */}
            {roleModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md w-full mx-4">
                        <h3 className="text-white font-semibold mb-4 text-lg flex items-center">
                            <FaUserShield className="mr-2 text-purple-400" />
                            {roleModal.targetRole} 역할{" "}
                            {roleModal.currentAction === "grant"
                                ? "부여"
                                : "회수"}
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-gray-300 text-sm mb-2">
                                    컨트랙트 주소
                                </label>
                                <input
                                    type="text"
                                    value={roleModal.contractAddress}
                                    disabled
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 text-sm font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm mb-2">
                                    대상 주소 *
                                </label>
                                <input
                                    type="text"
                                    value={roleModal.targetAddress}
                                    onChange={(e) =>
                                        setRoleModal((prev) => ({
                                            ...prev,
                                            targetAddress: e.target.value,
                                        }))
                                    }
                                    placeholder="0x..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    {roleModal.currentAction === "grant" ? (
                                        <FaCheckCircle
                                            className="text-green-400"
                                            size={14}
                                        />
                                    ) : (
                                        <FaExclamationTriangle
                                            className="text-yellow-400"
                                            size={14}
                                        />
                                    )}
                                    <span className="text-blue-400 font-medium text-sm">
                                        {roleModal.currentAction === "grant"
                                            ? "부여"
                                            : "회수"}{" "}
                                        작업
                                    </span>
                                </div>
                                <p className="text-blue-300 text-xs">
                                    {roleModal.targetRole} 역할을{" "}
                                    {roleModal.currentAction === "grant"
                                        ? "부여"
                                        : "회수"}
                                    합니다. 이 작업은 블록체인에 기록되며 되돌릴
                                    수 없습니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeRoleModal}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRoleManagement}
                                disabled={
                                    !roleModal.targetAddress ||
                                    isProcessing === roleModal.contractAddress
                                }
                                className={`flex-1 py-2 px-4 rounded transition-colors ${
                                    roleModal.currentAction === "grant"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                } text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
                            >
                                {isProcessing === roleModal.contractAddress ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        처리 중...
                                    </div>
                                ) : (
                                    `${
                                        roleModal.currentAction === "grant"
                                            ? "부여"
                                            : "회수"
                                    } 실행`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
