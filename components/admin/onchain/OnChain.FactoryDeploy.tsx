/// components\admin\onchain\OnChain.FactoryDeploy.tsx
/// Factory Contract Deployment Component

"use client";

import { useState, useEffect } from "react";
import {
    useBlockchainNetworksManager,
    useEscrowWalletManager,
} from "@/app/hooks/useBlockchain";
import { useDeployFactory } from "@/app/hooks/useFactoryContracts";
import { type DeployFactoryParams } from "@/app/actions/factoryContracts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
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
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    Check,
    AlertTriangle,
    Server,
    Shield,
    Settings,
    Key,
    Eye,
    EyeOff,
    HelpCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/app/hooks/useToast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface DeploymentResult {
    success: boolean;
    address?: string;
    transactionHash?: string;
    error?: string;
    owner?: string;
}

interface FactoryDeployProps {
    preSelectedNetworkId?: string;
    onCancel: () => void;
    onDeploySuccess: (result: {
        address: string;
        transactionHash: string;
        networkId: string;
        owner?: string;
    }) => void;
}

export default function FactoryDeploy({
    preSelectedNetworkId,
    onCancel,
    onDeploySuccess,
}: FactoryDeployProps) {
    const { networks, isLoading: isLoadingNetworks } =
        useBlockchainNetworksManager();
    const {
        deployFactory,
        isDeploying,
        error: deployError,
        data,
    } = useDeployFactory();
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
        try {
            setDeploymentProgress(0);
            const selectedNetworkObj = networks?.find(
                (n) => n.id === selectedNetwork
            );
            if (!selectedNetworkObj) {
                throw new Error("Please select a network.");
            }

            // Prepare deployment parameters
            const deployParams: Partial<DeployFactoryParams> = {
                network: selectedNetworkObj.name,
                privateKey: deploymentConfig.privateKey,
                useDefaultGas: deploymentConfig.useDefaultGas,
            };

            // Add gas parameters only if not using defaults
            if (!deploymentConfig.useDefaultGas) {
                deployParams.gasMaxFee = deploymentConfig.gasSettings.maxFee;
                deployParams.gasMaxPriorityFee =
                    deploymentConfig.gasSettings.maxPriorityFee;
                deployParams.gasLimit = deploymentConfig.gasSettings.gasLimit;
            }

            // Call the deployment function - need to convert to a complete DeployFactoryParams
            await deployFactory(deployParams as DeployFactoryParams);

            // After successful deployment, data will be updated in the hook result
            // This waits for the mutation to complete and avoids using the return value directly
            if (!data) {
                throw new Error(
                    "Deployment succeeded but no data was returned"
                );
            }

            setDeploymentProgress(100);

            onDeploySuccess({
                address: data.address,
                transactionHash: data.transactionHash,
                networkId: selectedNetworkObj.id,
                owner: data.owner,
            });

            toast.success("Factory contract deployed successfully!");
        } catch (error) {
            console.error("Deployment error:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* 배포 진행 상태 */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Deployment Progress</span>
                    <span>{deploymentProgress}%</span>
                </div>
                <Progress value={deploymentProgress} className="h-2" />
            </div>

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
                            <CardTitle>1. Select Network</CardTitle>
                        </div>
                        <CardDescription>
                            Choose the blockchain network for deployment
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
                            <CardTitle>2. Select Wallet</CardTitle>
                        </div>
                        <CardDescription>
                            Choose a wallet to deploy the contract
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Wallet</Label>
                            <Select
                                value={selectedWalletId}
                                onValueChange={handleWalletSelect}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a wallet" />
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
                                <p className="text-xs text-muted-foreground">
                                    Private key is securely loaded from the
                                    selected wallet
                                </p>
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
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeploy}
                        disabled={!selectedNetwork || isDeploying}
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deploying...
                            </>
                        ) : (
                            "Deploy Factory"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
