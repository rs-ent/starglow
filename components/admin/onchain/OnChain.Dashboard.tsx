/// components\admin\onchain\OnChain.Dashboard.tsx
/// Blockchain Dashboard Component

"use client";

import { useState } from "react";
import { useFactoryContractsManager } from "@/app/hooks/useBlockchain";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import { Loader2, ExternalLink, PlusCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import OnChainNetwork from "./OnChain.Network";
import OnChainDeploy from "./OnChain.Deploy";
import OnChainEscrowWallet from "./OnChain.EscrowWallet";
import PartialLoading from "@/components/atoms/PartialLoading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OnChainDashboard() {
    const { contracts, isLoading, error, isError } =
        useFactoryContractsManager();

    const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
        null
    );
    const [showDeployForm, setShowDeployForm] = useState(false);
    const [activeTab, setActiveTab] = useState("networks");

    function getExplorerAddressUrl(contract: (typeof contracts)[0]) {
        return `${contract.network.explorerUrl}/address/${contract.address}`;
    }

    function getExplorerTxUrl(contract: (typeof contracts)[0]) {
        return `${contract.network.explorerUrl}/tx/${contract.transactionHash}`;
    }

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    const handleDeployClick = (networkId: string) => {
        setSelectedNetworkId(networkId);
        setShowDeployForm(true);
    };

    const handleDeploySuccess = () => {
        setShowDeployForm(false);
        // The contracts list will automatically update when deployment succeeds
    };

    return (
        <div className="space-y-6">
            <Tabs
                defaultValue="networks"
                value={activeTab}
                onValueChange={setActiveTab}
            >
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="networks">Networks</TabsTrigger>
                    <TabsTrigger value="wallets">Escrow Wallets</TabsTrigger>
                    <TabsTrigger value="contracts">
                        Factory Contracts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="networks" className="mt-6">
                    {/* Network Component */}
                    <OnChainNetwork onDeployClick={handleDeployClick} />
                </TabsContent>

                <TabsContent value="contracts" className="mt-6">
                    {/* Deployment Form (only shown when showDeployForm is true) */}
                    {showDeployForm && selectedNetworkId && (
                        <OnChainDeploy
                            preSelectedNetworkId={selectedNetworkId}
                            onDeploySuccess={handleDeploySuccess}
                        />
                    )}

                    {/* Contracts List */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Factory Contracts</CardTitle>
                                <CardDescription>
                                    Deployed factory contracts for NFT
                                    collections
                                </CardDescription>
                            </div>
                            <Button
                                variant="default"
                                onClick={() => setShowDeployForm(true)}
                                disabled={!selectedNetworkId}
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Deploy New Contract
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <PartialLoading text="Loading contracts..." />
                                </div>
                            ) : isError ? (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>
                                        {error instanceof Error
                                            ? error.message
                                            : "Failed to load contracts"}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="overflow-x-auto">
                                    {!contracts || contracts.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground mb-4">
                                                No Factory contracts have been
                                                deployed yet.
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowDeployForm(true)
                                                }
                                                disabled={!selectedNetworkId}
                                            >
                                                Deploy Your First Contract
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Network
                                                    </TableHead>
                                                    <TableHead>
                                                        Contract Address
                                                    </TableHead>
                                                    <TableHead>
                                                        Deployed At
                                                    </TableHead>
                                                    <TableHead>
                                                        Deployed By
                                                    </TableHead>
                                                    <TableHead>
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {contracts.map((contract) => (
                                                    <TableRow key={contract.id}>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {
                                                                    contract
                                                                        .network
                                                                        .name
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="truncate max-w-[120px]">
                                                                    {
                                                                        contract.address
                                                                    }
                                                                </span>
                                                                <a
                                                                    href={getExplorerAddressUrl(
                                                                        contract
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:text-primary/80"
                                                                >
                                                                    <ExternalLink
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </a>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDate(
                                                                contract.deployedAt
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                contract.deployedBy
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    Details
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                >
                                                                    Collections
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="wallets" className="mt-6">
                    {/* Escrow Wallets Component */}
                    <OnChainEscrowWallet />
                </TabsContent>
            </Tabs>
        </div>
    );
}
