"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Copy, Check, Calculator, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
    getRaffles,
    updateRaffle,
    getRaffleDataForSimulation,
} from "@/app/actions/raffles/onchain/actions-admin";
import AdminRafflesWeb3Simulation from "./Admin.Raffles.Web3.Simulation";

interface RaffleData {
    id: string;
    contractAddress: string;
    raffleId: string;
    txHash: string;
    blockNumber: number | null;
    networkId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    network: {
        id: string;
        name: string;
        chainId: number;
    };
}

// Server Action에서 반환하는 데이터 타입과 동일
type SimulationRaffleData = NonNullable<
    Awaited<ReturnType<typeof getRaffleDataForSimulation>>["data"]
>;

type Filters = {
    networkId: string;
    contractAddress: string;
    isActive: boolean | undefined;
};

export default function AdminRafflesWeb3List() {
    const [raffles, setRaffles] = useState<RaffleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    // 시뮬레이션 관련 상태
    const [simulationMode, setSimulationMode] = useState(false);
    const [selectedRaffle, setSelectedRaffle] =
        useState<SimulationRaffleData | null>(null);
    const [loadingSimulation, setLoadingSimulation] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        networkId: "",
        contractAddress: "",
        isActive: undefined as boolean | undefined,
    });

    const loadData = useCallback(async (filters: Filters) => {
        setLoading(true);
        try {
            const rafflesResult = await getRaffles(filters);

            if (rafflesResult.success && rafflesResult.data) {
                setRaffles(rafflesResult.data);
            } else {
                toast.error(
                    "래플 목록 조회 실패: " +
                        (rafflesResult.error || "알 수 없는 오류")
                );
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("데이터 로딩 중 오류가 발생했습니다");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadRaffleForSimulation = async (raffle: RaffleData) => {
        setLoadingSimulation(true);
        try {
            // Server Action을 통해 Smart Contract 데이터 가져오기
            const result = await getRaffleDataForSimulation({
                contractAddress: raffle.contractAddress,
                raffleId: raffle.raffleId,
                networkId: raffle.networkId,
            });

            if (result.success && result.data) {
                setSelectedRaffle(result.data);
                setSimulationMode(true);
                toast.success(
                    "래플 데이터를 불러왔습니다. 상품 가치를 설정해주세요."
                );
            } else {
                toast.error(
                    "래플 데이터 로딩 실패: " +
                        (result.error || "알 수 없는 오류")
                );
            }
        } catch (error) {
            console.error("Error loading raffle for simulation:", error);
            toast.error(
                "래플 데이터 로딩 실패: " +
                    (error instanceof Error ? error.message : "알 수 없는 오류")
            );
        } finally {
            setLoadingSimulation(false);
        }
    };

    const handleToggleActive = async (
        raffleId: string,
        currentStatus: boolean
    ) => {
        setUpdating(raffleId);
        try {
            const result = await updateRaffle({
                id: raffleId,
                isActive: !currentStatus,
            });

            if (result.success) {
                setRaffles((prev) =>
                    prev.map((raffle) =>
                        raffle.id === raffleId
                            ? { ...raffle, isActive: !currentStatus }
                            : raffle
                    )
                );
                toast.success("래플 상태가 업데이트되었습니다");
            } else {
                toast.error(
                    "업데이트 실패: " + (result.error || "알 수 없는 오류")
                );
            }
        } catch (error) {
            console.error("Error updating raffle:", error);
            toast.error("업데이트 중 오류가 발생했습니다");
        } finally {
            setUpdating(null);
        }
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedHash(text);
            toast.success(`${type} 복사됨`);
            setTimeout(() => setCopiedHash(null), 2000);
        } catch (error) {
            console.error("Error copying to clipboard:", error);
            toast.error("복사 실패");
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getNetworkExplorerUrl = (networkId: string, txHash: string) => {
        const networkMap: Record<string, string> = {
            "berachain-testnet": "https://bartio.beratrail.io/tx/",
            "ethereum-mainnet": "https://etherscan.io/tx/",
            "polygon-mainnet": "https://polygonscan.com/tx/",
        };

        const baseUrl = networkMap[networkId];
        return baseUrl ? `${baseUrl}${txHash}` : null;
    };

    const uniqueNetworks = Array.from(
        new Set(raffles.map((raffle) => raffle.network.id))
    )
        .map((networkId) => {
            const raffle = raffles.find((r) => r.network.id === networkId);
            return raffle?.network;
        })
        .filter(Boolean);

    const uniqueContracts = Array.from(
        new Set(raffles.map((raffle) => raffle.contractAddress))
    );

    // 시뮬레이션 모드일 때 시뮬레이션 컴포넌트 렌더링
    if (simulationMode && selectedRaffle) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => {
                            setSimulationMode(false);
                            setSelectedRaffle(null);
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        래플 목록으로 돌아가기
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold">
                            {selectedRaffle.title} - 시뮬레이션
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {selectedRaffle.networkName} • 래플 #
                            {selectedRaffle.raffleId}
                        </p>
                    </div>
                </div>
                <AdminRafflesWeb3Simulation
                    initialRaffleData={selectedRaffle}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Web3 래플 목록</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-6">
                        <Select
                            value={filters.networkId}
                            onValueChange={(value) => {
                                setFilters((prev) => ({
                                    ...prev,
                                    networkId: value === "all" ? "" : value,
                                }));
                                loadData(filters).catch(console.error);
                            }}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="네트워크 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    모든 네트워크
                                </SelectItem>
                                {uniqueNetworks.map((network) => (
                                    <SelectItem
                                        key={network!.id}
                                        value={network!.id}
                                    >
                                        {network!.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.contractAddress}
                            onValueChange={(value) => {
                                setFilters((prev) => ({
                                    ...prev,
                                    contractAddress:
                                        value === "all" ? "" : value,
                                }));
                                loadData(filters).catch(console.error);
                            }}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="컨트랙트 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    모든 컨트랙트
                                </SelectItem>
                                {uniqueContracts.map((address) => (
                                    <SelectItem key={address} value={address}>
                                        {formatAddress(address)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={
                                filters.isActive === undefined
                                    ? "all"
                                    : filters.isActive.toString()
                            }
                            onValueChange={(value) => {
                                setFilters((prev) => ({
                                    ...prev,
                                    isActive:
                                        value === "all"
                                            ? undefined
                                            : value === "true",
                                }));
                                loadData(filters).catch(console.error);
                            }}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="상태" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">모든 상태</SelectItem>
                                <SelectItem value="true">활성</SelectItem>
                                <SelectItem value="false">비활성</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() =>
                                loadData(filters).catch(console.error)
                            }
                            variant="outline"
                            disabled={loading}
                        >
                            새로고침
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">로딩 중...</div>
                    ) : raffles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            조건에 맞는 래플이 없습니다
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>래플 ID</TableHead>
                                        <TableHead>네트워크</TableHead>
                                        <TableHead>컨트랙트</TableHead>
                                        <TableHead>트랜잭션</TableHead>
                                        <TableHead>블록</TableHead>
                                        <TableHead>상태</TableHead>
                                        <TableHead>생성일</TableHead>
                                        <TableHead>액션</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {raffles.map((raffle) => (
                                        <TableRow key={raffle.id}>
                                            <TableCell className="font-mono">
                                                #{raffle.raffleId}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {raffle.network.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">
                                                        {formatAddress(
                                                            raffle.contractAddress
                                                        )}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                raffle.contractAddress,
                                                                "컨트랙트 주소"
                                                            )
                                                        }
                                                    >
                                                        {copiedHash ===
                                                        raffle.contractAddress ? (
                                                            <Check className="h-3 w-3" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">
                                                        {formatAddress(
                                                            raffle.txHash
                                                        )}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                raffle.txHash,
                                                                "트랜잭션 해시"
                                                            )
                                                        }
                                                    >
                                                        {copiedHash ===
                                                        raffle.txHash ? (
                                                            <Check className="h-3 w-3" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                    {getNetworkExplorerUrl(
                                                        raffle.networkId,
                                                        raffle.txHash
                                                    ) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    getNetworkExplorerUrl(
                                                                        raffle.networkId,
                                                                        raffle.txHash
                                                                    )!
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                {raffle.blockNumber?.toLocaleString() ||
                                                    "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        raffle.isActive
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {raffle.isActive
                                                        ? "활성"
                                                        : "비활성"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(raffle.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            loadRaffleForSimulation(
                                                                raffle
                                                            )
                                                        }
                                                        disabled={
                                                            loadingSimulation ||
                                                            updating ===
                                                                raffle.id
                                                        }
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Calculator className="h-3 w-3" />
                                                        시뮬레이션
                                                    </Button>
                                                    <Switch
                                                        checked={
                                                            raffle.isActive
                                                        }
                                                        onCheckedChange={() =>
                                                            handleToggleActive(
                                                                raffle.id,
                                                                raffle.isActive
                                                            )
                                                        }
                                                        disabled={
                                                            updating ===
                                                            raffle.id
                                                        }
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
