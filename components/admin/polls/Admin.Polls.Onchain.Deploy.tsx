"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    CheckCircle,
    XCircle,
    Copy,
    Network,
    Server,
    Wallet,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

import {
    deployOnchainPollContract,
    getOnchainPollContracts,
    updateOnchainPollContractStatus,
    type DeployPollContractInput,
} from "@/app/actions/polls/onchain/actions-admin";

import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { cn } from "@/lib/utils/tailwind";

interface Network {
    id: string;
    name: string;
    chainId: number;
    isTestnet: boolean;
    isActive: boolean;
    isStoryNetwork: boolean;
    defaultNetwork: boolean;
}

interface Contract {
    id: string;
    address: string;
    txHash: string;
    deployedBy: string;
    blockNumber: number | null;
    isActive: boolean;
    networkName: string;
    chainId: number;
    createdAt: Date;
    pollsCount: number;
}

export function AdminPollsOnchainDeploy() {
    const toast = useToast();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
    const [selectedWalletAddress, setSelectedWalletAddress] =
        useState<string>("");
    const [isDeploying, setIsDeploying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalances, setWalletBalances] = useState<
        Record<string, string>
    >({});

    // Story Network 훅
    const { storyNetworks, isLoadingStoryNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    // Escrow Wallets 훅
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

    const fetchAllBalances = useCallback(
        async (networkId?: string) => {
            const targetNetworkId = networkId || selectedNetworkId;
            if (!escrowWallets || !targetNetworkId) return;

            try {
                const result = await fetchEscrowWalletsBalanceAsync({
                    networkId: targetNetworkId,
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
        },
        [selectedNetworkId, escrowWallets, fetchEscrowWalletsBalanceAsync]
    );

    // 네트워크 변경 시 기본 설정
    useEffect(() => {
        if (
            Array.isArray(storyNetworks) &&
            storyNetworks.length > 0 &&
            !selectedNetworkId
        ) {
            const defaultNetwork = storyNetworks.find(
                (n: any) => n.defaultNetwork
            );
            if (defaultNetwork) {
                setSelectedNetworkId(defaultNetwork.id);
                fetchAllBalances(defaultNetwork.id).catch((err) => {
                    console.error("Failed to fetch wallet balances:", err);
                });
            }
        }
    }, [storyNetworks, selectedNetworkId, fetchAllBalances]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const contractsResult = await getOnchainPollContracts();

            if (contractsResult.success && contractsResult.contracts) {
                setContracts(contractsResult.contracts);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("컨트랙트 데이터 로딩에 실패했습니다");
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleNetworkSelect = (networkId: string) => {
        setSelectedNetworkId(networkId);
        setSelectedWalletAddress(""); // 네트워크 변경 시 지갑 선택 초기화
        fetchAllBalances(networkId).catch((err) => {
            console.error("Failed to fetch wallet balances:", err);
        });
    };

    const handleDeploy = async () => {
        if (!selectedNetworkId || !selectedWalletAddress) {
            toast.error("네트워크와 에스크로 지갑을 선택해주세요");
            return;
        }

        setIsDeploying(true);
        try {
            const deployInput: DeployPollContractInput = {
                networkId: selectedNetworkId,
                deployerAddress: selectedWalletAddress,
                constructorArgs: {
                    name: "StarglowPolls",
                    symbol: "SGP",
                    baseURI: "https://starglow.app/metadata/polls/",
                },
            };

            const result = await deployOnchainPollContract(deployInput);

            if (result.success) {
                toast.success(
                    `컨트랙트가 성공적으로 배포되었습니다! 주소: ${result.contractAddress}`
                );
                await loadData().catch((err) => {
                    console.error("Failed to load data:", err);
                }); // 목록 새로고침
                setSelectedWalletAddress(""); // 지갑 선택 초기화
            } else {
                toast.error(`배포 실패: ${result.error}`);
            }
        } catch (error) {
            console.error("Deployment error:", error);
            toast.error("예상치 못한 오류로 배포에 실패했습니다");
        } finally {
            setIsDeploying(false);
        }
    };

    const handleToggleContractStatus = async (
        contractId: string,
        currentStatus: boolean
    ) => {
        try {
            const result = await updateOnchainPollContractStatus(
                contractId,
                !currentStatus
            );

            if (result.success) {
                toast.success(
                    `컨트랙트가 성공적으로 ${
                        !currentStatus ? "활성화" : "비활성화"
                    }되었습니다`
                );
                await loadData().catch((err) => {
                    console.error("Failed to load data:", err);
                }); // 목록 새로고침
            } else {
                toast.error(`컨트랙트 상태 업데이트 실패: ${result.error}`);
            }
        } catch (error) {
            console.error("Status update error:", error);
            toast.error("컨트랙트 상태 업데이트에 실패했습니다");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Failed to copy to clipboard:", err);
            toast.error("클립보드에 복사에 실패했습니다");
        });
        toast.success("클립보드에 복사되었습니다");
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <span className="ml-2 text-slate-300">데이터 로딩 중...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 배포 섹션 */}
            <Card className="bg-slate-900 border-slate-700/50 shadow-lg">
                <CardHeader className="border-b border-slate-700/50">
                    <CardTitle className="text-white flex items-center gap-3">
                        <Server className="w-5 h-5 text-purple-400" />새 온체인
                        컨트랙트 배포
                        <Badge
                            variant="outline"
                            className="text-xs text-purple-400 border-purple-400/50"
                        >
                            Blockchain
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                    {/* 네트워크 선택 */}
                    <div className="space-y-4">
                        <Label className="text-slate-300 font-medium flex items-center gap-2">
                            <Network className="w-4 h-4 text-purple-400" />
                            블록체인 네트워크 선택
                        </Label>
                        {isLoadingStoryNetworks ? (
                            <div className="text-center text-slate-400 py-8">
                                네트워크 불러오는 중...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.isArray(storyNetworks) &&
                                    storyNetworks?.map((network: any) => (
                                        <button
                                            key={network.id}
                                            onClick={() =>
                                                handleNetworkSelect(network.id)
                                            }
                                            className={`
                                                relative group p-4 rounded-xl border-2 transition-all duration-300
                                                ${
                                                    selectedNetworkId ===
                                                    network.id
                                                        ? "border-purple-400 bg-purple-900/30 scale-105 ring-2 ring-purple-300/30"
                                                        : "border-slate-600 bg-slate-800/50 hover:border-purple-500/50 hover:scale-102"
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
                                                    <h4 className="font-bold text-purple-200">
                                                        {network.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        Chain ID:{" "}
                                                        {network.chainId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs ${
                                                        network.isTestnet
                                                            ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/50"
                                                            : "bg-green-600/20 text-green-400 border-green-600/50"
                                                    }`}
                                                >
                                                    {network.isTestnet
                                                        ? "테스트넷"
                                                        : "메인넷"}
                                                </Badge>
                                                {network.defaultNetwork && (
                                                    <Badge
                                                        variant="default"
                                                        className="text-xs bg-purple-600/20 text-purple-400 border-purple-600/50"
                                                    >
                                                        기본
                                                    </Badge>
                                                )}
                                            </div>
                                            {selectedNetworkId ===
                                                network.id && (
                                                <div className="absolute -top-2 -right-2 bg-purple-400 text-black rounded-full px-2 py-1 text-xs font-bold">
                                                    ✓
                                                </div>
                                            )}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* 에스크로 지갑 선택 - 네트워크 선택 후 표시 */}
                    {selectedNetworkId && (
                        <div className="space-y-4">
                            <Label className="text-slate-300 font-medium flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-purple-400" />
                                에스크로 지갑 선택
                            </Label>
                            {isLoadingEscrowWallets ? (
                                <div className="text-center text-slate-400 py-8">
                                    지갑 불러오는 중...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {escrowWallets?.map((wallet) => (
                                        <button
                                            key={wallet.address}
                                            onClick={() =>
                                                setSelectedWalletAddress(
                                                    wallet.address
                                                )
                                            }
                                            className={`
                                                relative group p-6 rounded-xl border-2 transition-all duration-300
                                                ${
                                                    selectedWalletAddress ===
                                                    wallet.address
                                                        ? "border-purple-400 bg-purple-900/30 scale-105 ring-2 ring-purple-300/30"
                                                        : "border-slate-600 bg-slate-800/50 hover:border-purple-500/50 hover:scale-102"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                                    W
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-purple-200">
                                                        에스크로 지갑
                                                    </h4>
                                                    <p className="text-sm text-blue-300 font-mono">
                                                        {formatAddress(
                                                            wallet.address
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">
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
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs bg-green-600/20 text-green-400 border-green-600/50"
                                                    >
                                                        Active
                                                    </Badge>
                                                </div>
                                            )}
                                            {selectedWalletAddress ===
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

                    {/* 배포 버튼 */}
                    <Button
                        onClick={handleDeploy}
                        disabled={
                            isDeploying ||
                            !selectedNetworkId ||
                            !selectedWalletAddress
                        }
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200"
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                컨트랙트 배포 중...
                            </>
                        ) : (
                            <>
                                <Server className="mr-2 h-4 w-4" />
                                Poll 컨트랙트 배포하기
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* 배포된 컨트랙트 목록 */}
            <Card className="bg-slate-900 border-slate-700/50 shadow-lg">
                <CardHeader className="border-b border-slate-700/50">
                    <CardTitle className="text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Network className="w-5 h-5 text-purple-400" />
                            배포된 컨트랙트 목록
                        </div>
                        <Badge
                            variant="outline"
                            className="text-slate-300 border-slate-600"
                        >
                            총 {contracts.length}개
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                loadData().catch((err) => {
                                    console.error("Failed to load data:", err);
                                })
                            }
                            className={cn(
                                "text-slate-300 border-slate-600",
                                isLoading && "animate-pulse cursor-not-allowed"
                            )}
                        >
                            새로고침
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                    {contracts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Server className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                            <p className="text-lg font-medium mb-2">
                                배포된 컨트랙트가 없습니다
                            </p>
                            <p className="text-sm">
                                위에서 새 컨트랙트를 배포해보세요
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contracts.map((contract) => (
                                <div
                                    key={contract.id}
                                    className="border border-slate-700/50 rounded-lg p-6 space-y-4 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {contract.isActive ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                )}
                                                <span className="text-white font-medium text-lg">
                                                    {contract.networkName}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="text-xs text-slate-400 border-slate-600"
                                            >
                                                체인 ID {contract.chainId}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="secondary"
                                                className="text-xs bg-blue-600/20 text-blue-400 border-blue-600/50"
                                            >
                                                {contract.pollsCount}개 폴
                                            </Badge>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">
                                                    {contract.isActive
                                                        ? "활성화됨"
                                                        : "비활성화됨"}
                                                </span>
                                                <Switch
                                                    checked={contract.isActive}
                                                    onCheckedChange={() =>
                                                        handleToggleContractStatus(
                                                            contract.id,
                                                            contract.isActive
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-400 block mb-1">
                                                컨트랙트 주소:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-blue-400 bg-slate-900 px-3 py-1 rounded-md font-mono">
                                                    {formatAddress(
                                                        contract.address
                                                    )}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            contract.address
                                                        )
                                                    }
                                                    className="h-7 w-7 p-0 hover:bg-slate-700"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block mb-1">
                                                배포자:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-green-400 bg-slate-900 px-3 py-1 rounded-md font-mono">
                                                    {formatAddress(
                                                        contract.deployedBy
                                                    )}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            contract.deployedBy
                                                        )
                                                    }
                                                    className="h-7 w-7 p-0 hover:bg-slate-700"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block mb-1">
                                                트랜잭션 해시:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-purple-400 bg-slate-900 px-3 py-1 rounded-md font-mono">
                                                    {formatAddress(
                                                        contract.txHash
                                                    )}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            contract.txHash
                                                        )
                                                    }
                                                    className="h-7 w-7 p-0 hover:bg-slate-700"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block mb-1">
                                                배포 일시:
                                            </span>
                                            <div className="text-white">
                                                {formatDate(contract.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {contract.blockNumber && (
                                        <div className="text-sm border-t border-slate-700/50 pt-3">
                                            <span className="text-slate-400">
                                                블록 번호:
                                            </span>
                                            <span className="text-white ml-2 font-mono">
                                                #{contract.blockNumber}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
