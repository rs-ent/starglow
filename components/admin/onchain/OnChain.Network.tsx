/// components\admin\onchain\OnChain.Network.tsx
/// Blockchain Network Component

"use client";

import { useState } from "react";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useAddBlockchainNetwork } from "@/app/mutations/blockchainMutations";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, PlusCircle, Edit, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
            });
            setShowAddForm(false);
        } catch (error) {
            console.error("Failed to add network:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading networks...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                    {error instanceof Error
                        ? error.message
                        : "Failed to load network data"}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="w-full flex gap-4">
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Blockchain Networks</CardTitle>
                        <CardDescription>
                            Available blockchain networks for deployment
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? (
                            <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Network
                            </>
                        )}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Chain ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Explorer</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {networks?.map((network) => (
                                    <TableRow key={network.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {network.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{network.chainId}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    network.isTestnet
                                                        ? "outline"
                                                        : "default"
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
                                                className="text-primary hover:text-primary/80 flex items-center"
                                            >
                                                <span className="mr-1">
                                                    Explorer
                                                </span>
                                                <ExternalLink size={14} />
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() =>
                                                        onDeployClick(
                                                            network.id
                                                        )
                                                    }
                                                >
                                                    Deploy to
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!networks || networks.length === 0) && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-4 text-muted-foreground"
                                        >
                                            No networks available. Add a network
                                            to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {showAddForm && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Add New Network</CardTitle>
                        <CardDescription>
                            Enter details for the new blockchain network
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddNetwork}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Network Name*</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Ethereum Mainnet"
                                        value={newNetwork.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="symbol">Symbol*</Label>
                                    <Input
                                        id="symbol"
                                        name="symbol"
                                        placeholder="e.g. ETH"
                                        value={newNetwork.symbol}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="chainId">Chain ID*</Label>
                                <Input
                                    id="chainId"
                                    name="chainId"
                                    type="number"
                                    placeholder="e.g. 1"
                                    value={newNetwork.chainId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rpcUrl">RPC URL*</Label>
                                <Input
                                    id="rpcUrl"
                                    name="rpcUrl"
                                    placeholder="e.g. https://mainnet.infura.io/v3/your-api-key"
                                    value={newNetwork.rpcUrl}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="explorerUrl">
                                    Block Explorer URL*
                                </Label>
                                <Input
                                    id="explorerUrl"
                                    name="explorerUrl"
                                    placeholder="e.g. https://etherscan.io"
                                    value={newNetwork.explorerUrl}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
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
                                <Label htmlFor="isTestnet">
                                    This is a testnet
                                </Label>
                            </div>

                            {addNetworkMutation.isError && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {addNetworkMutation.error instanceof
                                        Error
                                            ? addNetworkMutation.error.message
                                            : "Failed to add network"}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={addNetworkMutation.isPending}
                            >
                                {addNetworkMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Network"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}
        </div>
    );
}
