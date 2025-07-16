"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FaRocket,
    FaArrowLeft,
    FaNetworkWired,
    FaWallet,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { useToast } from "@/app/hooks/useToast";
import {
    estimateGasSimple,
    estimateGasComprehensive,
} from "@/app/story/interaction/actions";
import { deployRafflesContract } from "@/app/actions/raffles/web3/actions-admin";

interface Props {
    onBack: () => void;
}

interface DeployForm {
    networkId: string;
    walletAddress: string;
    contractName: string;
}

interface GasEstimation {
    gas: string;
    cost: string;
    symbol: string;
    recommendation?: "low" | "standard" | "fast" | "urgent";
    confidence?: number;
    usd?: string;
}

export default function AdminRafflesWeb3Deploy({ onBack }: Props) {
    const toast = useToast();
    const [form, setForm] = useState<DeployForm>({
        networkId: "",
        walletAddress: "",
        contractName: "StarglowRaffles",
    });
    const [isDeploying, setIsDeploying] = useState(false);
    const [gasEstimation, setGasEstimation] = useState<GasEstimation | null>(
        null
    );
    const [isEstimatingGas, setIsEstimatingGas] = useState(false);
    const [walletBalances, setWalletBalances] = useState<
        Record<string, string>
    >({});

    const { storyNetworks, isLoadingStoryNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    const {
        escrowWallets,
        isLoadingEscrowWallets,
        fetchEscrowWalletsBalanceAsync,
        isPendingFetchEscrowWalletsBalance,
    } = useEscrowWallets({
        getEscrowWalletsInput: {
            isActive: true,
        },
    });

    // 네트워크 선택 시 지갑 잔액 조회
    useEffect(() => {
        if (form.networkId && escrowWallets && escrowWallets.length > 0) {
            const fetchAllBalances = async () => {
                try {
                    const result = await fetchEscrowWalletsBalanceAsync({
                        networkId: form.networkId,
                        addresses: escrowWallets.map((w) => w.address),
                    });
                    if (result) {
                        setWalletBalances(
                            result.reduce(
                                (acc, cur) => ({
                                    ...acc,
                                    [cur.address]: cur.balance,
                                }),
                                {} as Record<string, string>
                            )
                        );
                    }
                } catch (error) {
                    console.error("Failed to fetch wallet balances:", error);
                }
            };
            fetchAllBalances().catch((e) => {
                console.error("Failed to fetch wallet balances:", e);
            });
        }
    }, [form.networkId, escrowWallets, fetchEscrowWalletsBalanceAsync]);

    const refreshGasEstimate = useCallback(async () => {
        if (!form.networkId || !form.walletAddress) {
            toast.warning("먼저 네트워크와 지갑을 선택해주세요.");
            return;
        }

        setIsEstimatingGas(true);
        setGasEstimation(null);

        try {
            // 간단한 가스 계산 (빠른 예상치)
            const simpleEstimate = await estimateGasSimple({
                networkId: form.networkId,
                transactionType: "contractDeploy",
                complexity: "medium",
            });

            setGasEstimation({
                gas: simpleEstimate.estimatedGas,
                cost: simpleEstimate.estimatedCost,
                symbol: simpleEstimate.symbol,
            });

            // 백그라운드에서 정밀한 계산 수행
            try {
                const comprehensiveEstimate = await estimateGasComprehensive({
                    networkId: form.networkId,
                    walletAddress: form.walletAddress,
                    deploymentBytecode:
                        "0x608060405234801561001057600080fd5b50600080fd5b50" as `0x${string}`, // 임시 바이트코드
                    gasMultiplier: 1.2,
                });

                setGasEstimation({
                    gas: comprehensiveEstimate.estimatedGas.toString(),
                    cost: comprehensiveEstimate.estimatedCostFormatted,
                    symbol: comprehensiveEstimate.networkInfo.symbol,
                    recommendation: comprehensiveEstimate.recommendation,
                    confidence: comprehensiveEstimate.confidence,
                });
            } catch (detailedError) {
                console.warn(
                    "Detailed gas estimation failed, using simple estimate",
                    detailedError
                );
            }
        } catch (error) {
            console.error("Gas estimation failed:", error);
            toast.error("가스비 계산에 실패했습니다.");
            setGasEstimation({
                gas: "계산 실패",
                cost: "계산 실패",
                symbol: "BERA",
            });
        } finally {
            setIsEstimatingGas(false);
        }
    }, [form.networkId, form.walletAddress, toast]);

    // 네트워크와 지갑이 선택되면 자동으로 가스비 계산
    useEffect(() => {
        if (form.networkId && form.walletAddress) {
            refreshGasEstimate().catch((e: any) => {
                console.error("Gas estimation error:", e);
            });
        }
    }, [form.networkId, form.walletAddress, refreshGasEstimate]);

    const handleDeploy = async () => {
        if (!form.networkId || !form.walletAddress || !form.contractName) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        if (!gasEstimation) {
            toast.error("가스비를 먼저 계산해주세요.");
            return;
        }

        setIsDeploying(true);
        try {
            const result = await deployRafflesContract({
                networkId: form.networkId,
                walletAddress: form.walletAddress,
                contractName: form.contractName,
            });

            if (result.success && result.data) {
                toast.success(
                    `컨트랙트가 성공적으로 배포되었습니다!\n주소: ${result.data.address.slice(
                        0,
                        10
                    )}...${result.data.address.slice(-8)}`
                );
                onBack();
            } else {
                toast.error(result.error || "배포 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Contract deployment error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "배포 중 예상치 못한 오류가 발생했습니다."
            );
        } finally {
            setIsDeploying(false);
        }
    };

    const getRecommendationColor = (recommendation?: string) => {
        switch (recommendation) {
            case "low":
                return "text-green-400";
            case "standard":
                return "text-blue-400";
            case "fast":
                return "text-yellow-400";
            case "urgent":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    const getRecommendationText = (recommendation?: string) => {
        switch (recommendation) {
            case "low":
                return "저속 (낮은 가스비)";
            case "standard":
                return "표준 (권장)";
            case "fast":
                return "고속 (높은 가스비)";
            case "urgent":
                return "긴급 (매우 높은 가스비)";
            default:
                return "계산 중...";
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                컨트랙트 <span className="text-purple-400">배포</span>
            </h1>

            <div className="w-full max-w-6xl bg-black/20 rounded-xl p-8 border border-purple-500/20">
                <div className="space-y-8">
                    <div className="text-center">
                        <FaRocket className="text-6xl text-purple-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg mb-6">
                            새로운 래플 컨트랙트를 블록체인에 배포합니다
                        </p>
                    </div>

                    {/* 네트워크 선택 */}
                    <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                            <FaNetworkWired className="text-cyan-400" />
                            네트워크 선택
                        </h3>
                        {isLoadingStoryNetworks ? (
                            <div className="text-center text-blue-200 py-8">
                                네트워크 불러오는 중...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.isArray(storyNetworks) &&
                                    storyNetworks?.map((network) => (
                                        <button
                                            key={network.id}
                                            onClick={() =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    networkId: network.id,
                                                    walletAddress: "", // 네트워크 변경 시 지갑 선택 초기화
                                                }))
                                            }
                                            className={`
                                            relative group p-4 rounded-xl border-2 transition-all duration-300
                                            ${
                                                form.networkId === network.id
                                                    ? "border-cyan-400 bg-cyan-900/30 scale-105 ring-2 ring-cyan-300/30"
                                                    : "border-gray-600 bg-gray-800/50 hover:border-cyan-500/50 hover:scale-102"
                                            }
                                        `}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="text-2xl">
                                                    {network.isTestnet
                                                        ? "🧪"
                                                        : "🌐"}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-cyan-200">
                                                        {network.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-400">
                                                        Chain ID:{" "}
                                                        {network.chainId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${
                                                        network.isTestnet
                                                            ? "bg-yellow-500/20 text-yellow-300"
                                                            : "bg-green-500/20 text-green-300"
                                                    }`}
                                                >
                                                    {network.isTestnet
                                                        ? "Testnet"
                                                        : "Mainnet"}
                                                </span>
                                                {network.isActive && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                                                        Active
                                                    </span>
                                                )}
                                                {network.defaultNetwork && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            {form.networkId === network.id && (
                                                <div className="absolute -top-2 -right-2 bg-cyan-400 text-black rounded-full px-2 py-1 text-xs font-bold">
                                                    ✓
                                                </div>
                                            )}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* 지갑 선택 - 네트워크 선택 후 표시 */}
                    {form.networkId && (
                        <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                                <FaWallet className="text-purple-400" />
                                관리자 지갑 선택
                            </h3>
                            {isLoadingEscrowWallets ? (
                                <div className="text-center text-blue-200 py-8">
                                    지갑 불러오는 중...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {escrowWallets?.map((wallet) => (
                                        <button
                                            key={wallet.address}
                                            onClick={() =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    walletAddress:
                                                        wallet.address,
                                                }))
                                            }
                                            className={`
                                                relative group p-6 rounded-xl border-2 transition-all duration-300
                                                ${
                                                    form.walletAddress ===
                                                    wallet.address
                                                        ? "border-purple-400 bg-purple-900/30 scale-105 ring-2 ring-purple-300/30"
                                                        : "border-gray-600 bg-gray-800/50 hover:border-purple-500/50 hover:scale-102"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                                    W
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-purple-200">
                                                        관리자 지갑
                                                    </h4>
                                                    <p className="text-sm text-blue-300 font-mono">
                                                        {wallet.address.slice(
                                                            0,
                                                            10
                                                        )}
                                                        ...
                                                        {wallet.address.slice(
                                                            -8
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">
                                                    잔액:
                                                </span>
                                                <span className="text-cyan-300 font-bold">
                                                    {isPendingFetchEscrowWalletsBalance ? (
                                                        <span className="animate-pulse">
                                                            ...
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {String(
                                                                walletBalances[
                                                                    wallet
                                                                        .address
                                                                ] || "0"
                                                            )}{" "}
                                                            BERA
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {wallet.isActive && (
                                                <div className="mt-2 text-center">
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                                                        Active
                                                    </span>
                                                </div>
                                            )}
                                            {form.walletAddress ===
                                                wallet.address && (
                                                <div className="absolute -top-2 -right-2 bg-purple-400 text-black rounded-full px-2 py-1 text-xs font-bold">
                                                    ✓
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {form.networkId && form.walletAddress && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 컨트랙트 설정 */}
                            <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                                    <FaRocket className="text-green-400" />
                                    컨트랙트 설정
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">
                                            컨트랙트 이름
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="StarglowRaffles"
                                            value={form.contractName}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    contractName:
                                                        e.target.value,
                                                }))
                                            }
                                            className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-green-400 focus:outline-none transition-colors"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            배포될 컨트랙트의 식별자
                                        </p>
                                    </div>
                                    <div className="bg-black/40 rounded-lg p-3 border border-gray-600">
                                        <h4 className="text-white text-sm font-medium mb-2">
                                            선택된 관리자
                                        </h4>
                                        <p className="text-purple-300 text-sm font-mono">
                                            {form.walletAddress.slice(0, 10)}...
                                            {form.walletAddress.slice(-8)}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            잔액:{" "}
                                            {walletBalances[
                                                form.walletAddress
                                            ] || "0"}{" "}
                                            BERA
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 가스비 추정 */}
                            <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                                    ⛽ 가스비 추정
                                    {gasEstimation?.confidence && (
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                                gasEstimation.confidence >= 80
                                                    ? "bg-green-500/20 text-green-300"
                                                    : gasEstimation.confidence >=
                                                      60
                                                    ? "bg-yellow-500/20 text-yellow-300"
                                                    : "bg-red-500/20 text-red-300"
                                            }`}
                                        >
                                            신뢰도 {gasEstimation.confidence}%
                                        </span>
                                    )}
                                </h3>
                                <div className="space-y-3">
                                    {isEstimatingGas ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                                            <span className="text-blue-300">
                                                가스비 계산 중...
                                            </span>
                                        </div>
                                    ) : gasEstimation ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">
                                                    예상 가스
                                                </span>
                                                <span className="text-white font-mono">
                                                    {Number(
                                                        gasEstimation.gas
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">
                                                    예상 비용
                                                </span>
                                                <span className="text-white font-bold">
                                                    {parseFloat(
                                                        gasEstimation.cost
                                                    ).toFixed(6)}{" "}
                                                    {gasEstimation.symbol}
                                                </span>
                                            </div>
                                            {gasEstimation.recommendation && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">
                                                        가스비 수준
                                                    </span>
                                                    <span
                                                        className={getRecommendationColor(
                                                            gasEstimation.recommendation
                                                        )}
                                                    >
                                                        {getRecommendationText(
                                                            gasEstimation.recommendation
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {gasEstimation.usd && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">
                                                        USD 예상
                                                    </span>
                                                    <span className="text-white">
                                                        ${gasEstimation.usd}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400">
                                            네트워크와 지갑을 선택하면 자동으로
                                            계산됩니다
                                        </div>
                                    )}

                                    <button
                                        onClick={refreshGasEstimate}
                                        disabled={
                                            !form.networkId ||
                                            !form.walletAddress ||
                                            isEstimatingGas
                                        }
                                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
                                    >
                                        {isEstimatingGas
                                            ? "계산 중..."
                                            : "가스비 새로고침"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {form.networkId && (
                        <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4 text-lg">
                                배포 상태
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            form.networkId
                                                ? "bg-green-400"
                                                : "bg-gray-500"
                                        }`}
                                    ></div>
                                    <span
                                        className={
                                            form.networkId
                                                ? "text-green-400"
                                                : "text-gray-400"
                                        }
                                    >
                                        네트워크 선택됨
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            form.walletAddress
                                                ? "bg-green-400"
                                                : "bg-gray-500"
                                        }`}
                                    ></div>
                                    <span
                                        className={
                                            form.walletAddress
                                                ? "text-green-400"
                                                : "text-gray-400"
                                        }
                                    >
                                        관리자 지갑 선택됨
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            gasEstimation && !isEstimatingGas
                                                ? "bg-green-400"
                                                : "bg-gray-500"
                                        }`}
                                    ></div>
                                    <span
                                        className={
                                            gasEstimation && !isEstimatingGas
                                                ? "text-green-400"
                                                : "text-gray-400"
                                        }
                                    >
                                        가스비 계산 완료
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            form.contractName
                                                ? "bg-green-400"
                                                : "bg-gray-500"
                                        }`}
                                    ></div>
                                    <span
                                        className={
                                            form.contractName
                                                ? "text-green-400"
                                                : "text-gray-400"
                                        }
                                    >
                                        컨트랙트 이름 설정됨
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 pt-6">
                        <button
                            onClick={handleDeploy}
                            disabled={
                                !form.networkId ||
                                !form.walletAddress ||
                                !form.contractName ||
                                !gasEstimation ||
                                isEstimatingGas ||
                                isDeploying
                            }
                            className={`px-8 py-3 font-semibold rounded-lg transition-colors ${
                                form.networkId &&
                                form.walletAddress &&
                                form.contractName &&
                                gasEstimation &&
                                !isEstimatingGas &&
                                !isDeploying
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {isDeploying ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    배포 중...
                                </div>
                            ) : (
                                "컨트랙트 배포"
                            )}
                        </button>
                        <button
                            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            onClick={onBack}
                        >
                            취소
                        </button>
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
