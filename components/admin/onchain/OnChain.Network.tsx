/// components\admin\onchain\OnChain.Network.tsx
/// Blockchain Network Component

"use client";

import { useState } from "react";

import { Loader2, ExternalLink, PlusCircle, Edit, X } from "lucide-react";

import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useAddBlockchainNetwork } from "@/app/mutations/blockchainMutations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface OnChainNetworkProps {
    onDeployClick: (networkId: string) => void;
}

export default function OnChainNetwork({ onDeployClick }: OnChainNetworkProps) {
    const { networks, isLoading, error, isError } =
        useBlockchainNetworksManager();
    const addNetworkMutation = useAddBlockchainNetwork();

    const [showAddForm, setShowAddForm] = useState(false);
    const [newNetwork, setNewNetwork] = useState({
        name: "",
        symbol: "",
        chainId: "",
        rpcUrl: "",
        explorerUrl: "",
        isTestnet: true,
        multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setNewNetwork((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAddNetwork = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addNetworkMutation.mutateAsync({
                name: newNetwork.name,
                symbol: newNetwork.symbol,
                chainId: parseInt(newNetwork.chainId),
                rpcUrl: newNetwork.rpcUrl,
                explorerUrl: newNetwork.explorerUrl,
                isTestnet: newNetwork.isTestnet,
            });

            // 폼 초기화
            setNewNetwork({
                name: "",
                symbol: "",
                chainId: "",
                rpcUrl: "",
                explorerUrl: "",
                isTestnet: true,
                multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
            });
            setShowAddForm(false);
        } catch (error) {
            console.error("Failed to add network:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px] bg-muted/5 rounded-xl">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                        네트워크 로드 중...
                    </span>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="destructive" className="mb-4 border-2">
                <AlertDescription className="flex items-center gap-2">
                    <X className="h-5 w-5" />
                    <span>
                        {error instanceof Error
                            ? error.message
                            : "네트워크 데이터 로드 실패"}
                    </span>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Networks List Card */}
            <Card className="lg:col-span-2 border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold">
                            블록체인 네트워크
                        </CardTitle>
                    </div>
                    <Button
                        variant={showAddForm ? "secondary" : "default"}
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="transition-all duration-200"
                    >
                        {showAddForm ? (
                            <div className="flex items-center gap-2">
                                <X className="h-4 w-4" />
                                <span>취소</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                <span>네트워크 추가</span>
                            </div>
                        )}
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">
                                        네트워크명
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        체인 ID
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        유형
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Explorer
                                    </TableHead>
                                    <TableHead className="font-semibold text-right">
                                        기능
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {networks?.map((network) => (
                                    <TableRow
                                        key={network.id}
                                        className="hover:bg-muted/5"
                                    >
                                        <TableCell className="font-medium">
                                            {network.name}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {network.chainId}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    network.isTestnet
                                                        ? "outline"
                                                        : "default"
                                                }
                                                className={
                                                    network.isTestnet
                                                        ? ""
                                                        : "bg-green-500/10 text-green-500"
                                                }
                                            >
                                                {network.isTestnet
                                                    ? "Testnet"
                                                    : "Mainnet"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                href={network.explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                                            >
                                                <span>Explorer</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    수정
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        onDeployClick(
                                                            network.id
                                                        )
                                                    }
                                                    className="h-8"
                                                >
                                                    네트워크 선택
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!networks || networks.length === 0) && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <p>네트워크가 없습니다</p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setShowAddForm(true)
                                                    }
                                                    className="mt-2"
                                                >
                                                    <PlusCircle className="h-4 w-4 mr-2" />
                                                    첫 번째 네트워크 추가
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Network Form */}
            {showAddForm && (
                <Card className="lg:col-span-2 border-2 border-primary/10 bg-muted/5">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">
                            새로운 네트워크 추가
                        </CardTitle>
                        <CardDescription>
                            새로운 블록체인 네트워크 연결 구성
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddNetwork}>
                        <CardContent className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="name"
                                        className="font-medium"
                                    >
                                        네트워크명
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Ethereum Mainnet"
                                        value={newNetwork.name}
                                        onChange={handleInputChange}
                                        className="bg-background"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="symbol"
                                        className="font-medium"
                                    >
                                        심볼
                                    </Label>
                                    <Input
                                        id="symbol"
                                        name="symbol"
                                        placeholder="e.g. ETH"
                                        value={newNetwork.symbol}
                                        onChange={handleInputChange}
                                        className="bg-background"
                                    />
                                </div>
                            </div>

                            {/* Network Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="chainId"
                                        className="font-medium"
                                    >
                                        체인 ID
                                    </Label>
                                    <Input
                                        id="chainId"
                                        name="chainId"
                                        type="number"
                                        placeholder="e.g. 1"
                                        value={newNetwork.chainId}
                                        onChange={handleInputChange}
                                        className="bg-background"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="rpcUrl"
                                        className="font-medium"
                                    >
                                        RPC URL
                                    </Label>
                                    <Input
                                        id="rpcUrl"
                                        name="rpcUrl"
                                        placeholder="e.g. https://mainnet.infura.io/v3/your-api-key"
                                        value={newNetwork.rpcUrl}
                                        onChange={handleInputChange}
                                        className="bg-background font-mono text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="explorerUrl"
                                        className="font-medium"
                                    >
                                        Explorer URL
                                    </Label>
                                    <Input
                                        id="explorerUrl"
                                        name="explorerUrl"
                                        placeholder="e.g. https://etherscan.io"
                                        value={newNetwork.explorerUrl}
                                        onChange={handleInputChange}
                                        className="bg-background font-mono text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="multicallAddress"
                                        className="font-medium flex items-center justify-between"
                                    >
                                        <span>Multicall 컨트랙트 주소</span>
                                        <a
                                            href="https://www.multicall3.com/deployments"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                                        >
                                            <span>
                                                Multicall 주소는 여기서 확인
                                                가능합니다.
                                            </span>
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </Label>
                                    <Input
                                        id="multicallAddress"
                                        name="multicallAddress"
                                        placeholder="e.g. 0xcA11bde05977b3631167028862bE2a173976CA11"
                                        value={newNetwork.multicallAddress}
                                        onChange={handleInputChange}
                                        className="bg-background font-mono text-sm"
                                    />
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>
                                            기본 Multicall3 주소:
                                            0xcA11bde05977b3631167028862bE2a173976CA11
                                        </p>
                                        <p>
                                            multicall3.com/deployments 에서
                                            네트워크별 주소를 확인할 수
                                            있습니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Network Type */}
                            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                                <Switch
                                    id="isTestnet"
                                    name="isTestnet"
                                    checked={newNetwork.isTestnet}
                                    onCheckedChange={(checked) =>
                                        setNewNetwork((prev) => ({
                                            ...prev,
                                            isTestnet: checked,
                                        }))
                                    }
                                />
                                <Label
                                    htmlFor="isTestnet"
                                    className="font-medium cursor-pointer"
                                >
                                    이 네트워크는 테스트넷입니다.
                                </Label>
                            </div>

                            {addNetworkMutation.isError && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertDescription>
                                        {addNetworkMutation.error instanceof
                                        Error
                                            ? addNetworkMutation.error.message
                                            : "네트워크 추가 실패"}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 border-t pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddForm(false)}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                disabled={addNetworkMutation.isPending}
                            >
                                {addNetworkMutation.isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>추가 중...</span>
                                    </div>
                                ) : (
                                    "네트워크 추가"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}
        </div>
    );
}
