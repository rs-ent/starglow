/// components\admin\onchain\OnChain.FactoryDeploy.tsx
/// Factory Contract Deployment Component

"use client";

import { useState, useEffect } from "react";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useDeployFactory } from "@/app/hooks/useFactoryContracts";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/app/hooks/useToast";

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

    // useDeployFactory 훅 사용
    const {
        deployFactory,
        isDeploying: deploying,
        error: deployError,
        data: deployData,
        reset: resetDeploy,
    } = useDeployFactory();

    const [selectedNetwork, setSelectedNetwork] = useState(
        preSelectedNetworkId || ""
    );
    const [useDefaultGas, setUseDefaultGas] = useState(true);
    const [gasSettings, setGasSettings] = useState({
        maxFee: "3",
        maxPriorityFee: "2",
        gasLimit: "4000000",
    });
    const [skipVerification, setSkipVerification] = useState(false);
    const [result, setResult] = useState<DeploymentResult | null>(null);

    // Viem 관련 상태
    const [useViem, setUseViem] = useState(true);
    const [privateKey, setPrivateKey] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [initialOwner, setInitialOwner] = useState("");

    const toast = useToast();

    async function handleDeploy() {
        try {
            setResult(null);

            const selectedNetworkObj = networks?.find(
                (n) => n.id === selectedNetwork
            );
            if (!selectedNetworkObj) {
                throw new Error("Please select a network.");
            }

            // Viem 사용 시 privateKey 필요
            if (useViem && !privateKey) {
                throw new Error(
                    "Private key is required when using Viem deployment."
                );
            }

            // deployFactory mutation 호출
            await deployFactory({
                network: selectedNetworkObj.name,
                gasMaxFee: gasSettings.maxFee,
                gasMaxPriorityFee: gasSettings.maxPriorityFee,
                gasLimit: gasSettings.gasLimit,
                useDefaultGas,
                skipVerification,
                useViem,
                privateKey: useViem ? privateKey : "",
                initialOwner: initialOwner || undefined,
            });

            // mutation 결과 처리
            if (deployData) {
                const deployResult = {
                    success: true,
                    address: deployData.address,
                    transactionHash: deployData.transactionHash,
                    owner: deployData.owner,
                };

                setResult(deployResult);

                if (onDeploySuccess) {
                    onDeploySuccess({
                        address: deployData.address,
                        transactionHash: deployData.transactionHash,
                        networkId: selectedNetwork,
                        owner: deployData.owner,
                    });
                }

                toast.success("Factory contract deployed successfully!");
            }
        } catch (error) {
            console.error("Deployment error:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred.";

            setResult({
                success: false,
                error: errorMessage,
            });

            toast.error(`Deployment failed: ${errorMessage}`);
        }
    }

    // 에러 발생 시 처리
    useEffect(() => {
        if (deployError) {
            setResult({
                success: false,
                error:
                    deployError instanceof Error
                        ? deployError.message
                        : "Unknown error occurred",
            });

            toast.error(
                `Deployment failed: ${
                    deployError instanceof Error
                        ? deployError.message
                        : "Unknown error"
                }`
            );
        }
    }, [deployError]);

    function handleGasSettingChange(
        field: keyof typeof gasSettings,
        value: string
    ) {
        setGasSettings((prev) => ({ ...prev, [field]: value }));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deploy Factory Contract</CardTitle>
                <CardDescription>
                    Deploy a Factory contract to the selected network.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleDeploy();
                    }}
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="network">Network</Label>
                            <Select
                                value={selectedNetwork}
                                onValueChange={setSelectedNetwork}
                                disabled={
                                    deploying ||
                                    isLoadingNetworks ||
                                    !!preSelectedNetworkId
                                }
                            >
                                <SelectTrigger id="network">
                                    <SelectValue placeholder="Select network to deploy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoadingNetworks ? (
                                        <div className="flex items-center justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            <span>Loading networks...</span>
                                        </div>
                                    ) : (
                                        networks?.map((network) => (
                                            <SelectItem
                                                key={network.id}
                                                value={network.id}
                                            >
                                                {network.name} (Chain ID:{" "}
                                                {network.chainId})
                                                {network.isTestnet &&
                                                    " - Testnet"}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Viem 사용 옵션 추가 */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="use-viem"
                                checked={useViem}
                                onCheckedChange={setUseViem}
                                disabled={deploying}
                            />
                            <Label htmlFor="use-viem">
                                Use Viem for deployment (Recommended)
                            </Label>
                        </div>

                        {/* Viem 사용 시 프라이빗 키 입력 필드 추가 */}
                        {useViem && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="private-key">
                                        Private Key
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowPrivateKey(!showPrivateKey)
                                        }
                                    >
                                        {showPrivateKey ? "Hide" : "Show"}
                                    </Button>
                                </div>
                                <Input
                                    id="private-key"
                                    type={showPrivateKey ? "text" : "password"}
                                    value={privateKey}
                                    onChange={(e) =>
                                        setPrivateKey(e.target.value)
                                    }
                                    placeholder="Enter private key for contract deployment"
                                    disabled={deploying}
                                    className="font-mono"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Your private key is only used for signing
                                    the deployment transaction and is never
                                    stored.
                                </p>
                            </div>
                        )}

                        {/* 초기 소유자 입력 필드 추가 */}
                        {useViem && (
                            <div className="space-y-2">
                                <Label htmlFor="initial-owner">
                                    Initial Owner Address (Optional)
                                </Label>
                                <Input
                                    id="initial-owner"
                                    type="text"
                                    value={initialOwner}
                                    onChange={(e) =>
                                        setInitialOwner(e.target.value)
                                    }
                                    placeholder="Default: Deployer's address"
                                    disabled={deploying}
                                    className="font-mono"
                                />
                                <p className="text-sm text-muted-foreground">
                                    If not specified, the deployer's address
                                    will be used as the contract owner.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="use-default-gas"
                                checked={useDefaultGas}
                                onCheckedChange={setUseDefaultGas}
                                disabled={deploying}
                            />
                            <Label htmlFor="use-default-gas">
                                Use default gas settings
                            </Label>
                        </div>

                        {!useDefaultGas && (
                            <div className="space-y-4 border p-4 rounded-md">
                                <div>
                                    <Label htmlFor="max-fee">
                                        Max Fee (Gwei)
                                    </Label>
                                    <Input
                                        id="max-fee"
                                        type="text"
                                        value={gasSettings.maxFee}
                                        onChange={(e) =>
                                            handleGasSettingChange(
                                                "maxFee",
                                                e.target.value
                                            )
                                        }
                                        disabled={deploying}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="max-priority-fee">
                                        Max Priority Fee (Gwei)
                                    </Label>
                                    <Input
                                        id="max-priority-fee"
                                        type="text"
                                        value={gasSettings.maxPriorityFee}
                                        onChange={(e) =>
                                            handleGasSettingChange(
                                                "maxPriorityFee",
                                                e.target.value
                                            )
                                        }
                                        disabled={deploying}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="gas-limit">Gas Limit</Label>
                                    <Input
                                        id="gas-limit"
                                        type="text"
                                        value={gasSettings.gasLimit}
                                        onChange={(e) =>
                                            handleGasSettingChange(
                                                "gasLimit",
                                                e.target.value
                                            )
                                        }
                                        disabled={deploying}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="skip-verification"
                                checked={skipVerification}
                                onCheckedChange={setSkipVerification}
                                disabled={deploying}
                            />
                            <Label htmlFor="skip-verification">
                                Skip contract verification
                            </Label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={deploying}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                deploying ||
                                !selectedNetwork ||
                                (useViem && !privateKey)
                            }
                        >
                            {deploying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deploying...
                                </>
                            ) : (
                                "Deploy"
                            )}
                        </Button>
                    </div>
                </form>

                {result && (
                    <div className="mt-6 space-y-4">
                        {result.success ? (
                            <div className="space-y-4">
                                <Alert>
                                    <Check className="h-4 w-4 text-green-600" />
                                    <AlertTitle>
                                        Deployment Successful
                                    </AlertTitle>
                                    <AlertDescription>
                                        Factory contract has been successfully
                                        deployed.
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label>Contract Address</Label>
                                        <div className="font-mono bg-muted p-2 rounded-md overflow-x-auto">
                                            {result.address}
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Transaction Hash</Label>
                                        <div className="font-mono bg-muted p-2 rounded-md overflow-x-auto">
                                            {result.transactionHash}
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Contract Owner</Label>
                                        <div className="font-mono bg-muted p-2 rounded-md overflow-x-auto">
                                            {result.owner}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={onCancel}>
                                        Back to Contracts
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Deployment Failed</AlertTitle>
                                <AlertDescription>
                                    {result.error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
