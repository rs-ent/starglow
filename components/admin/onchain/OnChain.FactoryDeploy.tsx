/// components\admin\onchain\OnChain.FactoryDeploy.tsx
/// Factory Contract Deployment Component

"use client";

import { useState, useEffect } from "react";
import {
    useBlockchainNetworksManager,
    useEscrowWalletManager,
} from "@/app/hooks/useBlockchain";
import { useFactorySet } from "@/app/hooks/useFactoryContracts";
import type {
    DeployFactoryInput,
    DeployFactoryResult,
} from "@/app/actions/factoryContracts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Server, Shield, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Progress } from "@/components/ui/progress";

interface FactoryDeployProps {
    preSelectedNetworkId?: string;
    onCancel: () => void;
    onDeploySuccess: (result: DeployFactoryResult) => void;
}

export default function FactoryDeploy({
    preSelectedNetworkId,
    onCancel,
    onDeploySuccess,
}: FactoryDeployProps) {
    const { networks } = useBlockchainNetworksManager();

    const {
        deployFactory,
        isDeploying,
        error: deployError,
    } = useFactorySet({
        networkId: preSelectedNetworkId || "",
    });

    const { wallets, getWalletWithPrivateKey } = useEscrowWalletManager();
    const toast = useToast();

    // 상태 관리
    const [deploymentStep, setDeploymentStep] = useState(1);
    const [deploymentProgress, setDeploymentProgress] = useState(0);
    const [selectedNetwork, setSelectedNetwork] = useState(
        preSelectedNetworkId || ""
    );
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [deploymentConfig, setDeploymentConfig] = useState({
        useDefaultGas: true,
        gasSettings: {
            maxFee: "3",
            maxPriorityFee: "2",
            gasLimit: "4000000",
        },
        skipVerification: false,
        useViem: true,
        privateKey: "",
        initialOwner: "",
    });

    // 배포 진행 상태 시각화
    useEffect(() => {
        if (isDeploying) {
            const interval = setInterval(() => {
                setDeploymentProgress((prev) => (prev < 90 ? prev + 10 : prev));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isDeploying]);

    // Wallet 선택 핸들러 추가
    const handleWalletSelect = async (walletId: string) => {
        try {
            setSelectedWalletId(walletId);

            if (!walletId) {
                setDeploymentConfig((prev) => ({ ...prev, privateKey: "" }));
                return;
            }

            const result = await getWalletWithPrivateKey(walletId);
            setDeploymentConfig((prev) => ({
                ...prev,
                privateKey: result.privateKey,
                initialOwner: result.address,
            }));
            toast.success("Wallet loaded successfully");
        } catch (error) {
            console.error("Error fetching wallet:", error);
            toast.error("Failed to load wallet");
            setSelectedWalletId("");
            setDeploymentConfig((prev) => ({ ...prev, privateKey: "" }));
        }
    };

    const handleDeploy = async () => {
        const confirmed = window.confirm(
            "⚠️ 중요 안내\n\n" +
                "새로운 팩토리 컨트랙트 배포를 진행하시겠습니까?\n\n" +
                "- 관리자와 상의하셨나요?\n" +
                "- 새로운 배포가 필요한 이유가 명확한가요?\n" +
                "- 기존 컨트랙트와의 호환성을 검토하셨나요?\n\n" +
                "진행하시려면 '확인'을 눌러주세요."
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeploymentProgress(0);
            const selectedNetworkObj = networks?.find(
                (n) => n.id === selectedNetwork
            );
            if (!selectedNetworkObj) {
                throw new Error("Please select a network.");
            }

            if (!selectedWalletId) {
                throw new Error("Please select a wallet.");
            }

            // Prepare deployment parameters
            const deployInput: DeployFactoryInput = {
                networkId: selectedNetwork,
                walletId: selectedWalletId,
            };

            const result = await deployFactory(deployInput);

            if (!result.success || !result.data) {
                throw new Error(result.error || "Deployment failed");
            }

            setDeploymentProgress(100);

            onDeploySuccess(result);
        } catch (error) {
            console.error("Deployment error:", error);
            setDeploymentProgress(0);
        }
    };

    return (
        <div className="space-y-6">
            {/* 배포 진행 상태 */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>팩토리 배포 진행 상태</span>
                    <span>{deploymentProgress}%</span>
                </div>
                <Progress value={deploymentProgress} className="h-2" />
            </div>

            {/* 에러 메시지 표시 */}
            {deployError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                    {deployError instanceof Error
                        ? deployError.message
                        : String(deployError)}
                </div>
            )}

            {/* 단계별 배포 프로세스 */}
            <div className="grid gap-6">
                {/* Step 1: Network Selection */}
                <Card
                    className={
                        deploymentStep === 1 ? "ring-2 ring-primary" : ""
                    }
                >
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            <CardTitle>1. 네트워크 선택</CardTitle>
                        </div>
                        <CardDescription>
                            배포할 블록체인 네트워크를 선택하세요
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedNetwork}
                            onValueChange={(value) => {
                                setSelectedNetwork(value);
                                setDeploymentStep(2);
                            }}
                            disabled={isDeploying || !!preSelectedNetworkId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent>
                                {networks?.map((network) => (
                                    <SelectItem
                                        key={network.id}
                                        value={network.id}
                                    >
                                        <div className="flex items-center gap-2">
                                            {network.isTestnet ? (
                                                <Shield className="h-4 w-4" />
                                            ) : (
                                                <Server className="h-4 w-4" />
                                            )}
                                            {network.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Step 2: Wallet Selection */}
                <Card
                    className={
                        deploymentStep === 2 ? "ring-2 ring-primary" : ""
                    }
                >
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            <CardTitle>2. 지갑 선택</CardTitle>
                        </div>
                        <CardDescription>
                            배포할 컨트랙트의 어드민(에스크로) 지갑을 선택하세요
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>지갑 선택</Label>
                            <Select
                                value={selectedWalletId}
                                onValueChange={handleWalletSelect}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="지갑 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets?.map((wallet) => (
                                        <SelectItem
                                            key={wallet.id}
                                            value={wallet.id}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm">
                                                    {wallet.address.substring(
                                                        0,
                                                        6
                                                    )}
                                                    ...
                                                    {wallet.address.substring(
                                                        wallet.address.length -
                                                            4
                                                    )}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {wallet.networkIds
                                                        .map((id) => {
                                                            const network =
                                                                networks?.find(
                                                                    (n) =>
                                                                        n.id ===
                                                                        id
                                                                );
                                                            return (
                                                                network?.name ||
                                                                id
                                                            );
                                                        })
                                                        .join(", ")}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {deploymentConfig.privateKey && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Private Key</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setShowPrivateKey(!showPrivateKey)
                                        }
                                    >
                                        {showPrivateKey ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <Input
                                    type={showPrivateKey ? "text" : "password"}
                                    value={deploymentConfig.privateKey}
                                    disabled
                                    className="font-mono"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 배포 버튼 */}
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isDeploying}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleDeploy}
                        disabled={
                            !selectedNetwork || !selectedWalletId || isDeploying
                        }
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                배포 중...
                            </>
                        ) : (
                            "팩토리 배포"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
