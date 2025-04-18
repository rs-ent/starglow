/// components\admin\onchain\OnChain.FactoryList.tsx
/// Factory Contract List Component

"use client";

import { Fragment, useState } from "react";
import { useFactoryContractsManager } from "@/app/hooks/useFactoryContracts";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Code,
    ExternalLink,
    PlusCircle,
    ChevronDown,
    Activity,
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Copy,
} from "lucide-react";
import { format } from "date-fns";
import PartialLoading from "@/components/atoms/PartialLoading";
import FactoryFunctions from "./OnChain.FactoryFunctions";
import { useToast } from "@/app/hooks/useToast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FactoryContract } from "@/app/hooks/useFactoryContracts";

interface FactoryListProps {
    onDeployClick: () => void;
}

export default function FactoryList({ onDeployClick }: FactoryListProps) {
    const {
        contracts,
        isLoading: isLoadingContracts,
        error: contractsError,
        isError,
        refetch,
    } = useFactoryContractsManager();

    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [selectedFactory, setSelectedFactory] = useState<{
        address: string;
        networkId: string;
        id: string;
    } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const toast = useToast();

    // 복사 상태 관리
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    function getExplorerAddressUrl(contract: FactoryContract) {
        return `${contract.network.explorerUrl}/address/${contract.address}`;
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(text);
            setTimeout(() => setCopiedAddress(null), 2000);
            toast.success("Address copied to clipboard");
        } catch (err) {
            toast.error("Failed to copy address");
        }
    }

    async function handleRefresh() {
        setIsRefreshing(true);
        try {
            await refetch();
            toast.success("Contract list refreshed");
        } catch (error) {
            toast.error("Failed to refresh contracts");
        } finally {
            setIsRefreshing(false);
        }
    }

    function toggleFactoryFunctions(
        factoryAddress: string,
        networkId: string,
        id: string
    ) {
        setSelectedFactory({
            address: factoryAddress,
            networkId,
            id,
        });

        setOpenAccordion(openAccordion === id ? null : id);
    }

    return (
        <Card className="border-none shadow-md bg-gradient-to-b from-background to-muted/5">
            <CardHeader className="border-b bg-muted/5 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Code className="h-6 w-6 text-primary" />
                            Factory Contracts
                        </CardTitle>
                        <CardDescription className="text-base">
                            Manage your deployed factory contracts
                        </CardDescription>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="hover:bg-muted/50 transition-colors"
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${
                                    isRefreshing ? "animate-spin" : ""
                                }`}
                            />
                            Refresh
                        </Button>
                        <Button
                            onClick={onDeployClick}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Deploy New Contract
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {isLoadingContracts ? (
                    <div className="flex justify-center items-center py-12">
                        <PartialLoading text="Loading contracts..." />
                    </div>
                ) : isError ? (
                    <Alert
                        variant="destructive"
                        className="bg-red-500/5 border-red-500/20"
                    >
                        <AlertDescription className="flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            {contractsError instanceof Error
                                ? contractsError.message
                                : "Failed to load contracts"}
                        </AlertDescription>
                    </Alert>
                ) : !contracts || contracts.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Code className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">
                                    No Factory Contracts
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Get started by deploying your first factory
                                    contract to manage NFT collections.
                                </p>
                            </div>
                            <Button
                                onClick={onDeployClick}
                                className="bg-primary/10 text-primary hover:bg-primary/20"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Deploy Your First Contract
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {contracts.map((contract: FactoryContract) => (
                            <Card
                                key={contract.id}
                                className={`overflow-hidden transition-all duration-200 hover:shadow-lg border ${
                                    openAccordion === contract.id
                                        ? "ring-2 ring-primary/20 bg-muted/5"
                                        : "hover:border-primary/20"
                                }`}
                            >
                                <CardContent className="p-0">
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-lg">
                                                    {contract.name ||
                                                        "Factory Contract"}
                                                </span>
                                                <div className="flex gap-2">
                                                    <Badge
                                                        variant={
                                                            contract.verified
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        className={
                                                            contract.verified
                                                                ? "bg-green-500/10 text-green-500"
                                                                : ""
                                                        }
                                                    >
                                                        {contract.verified ? (
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <Shield className="h-3 w-3 mr-1" />
                                                        )}
                                                        {contract.verified
                                                            ? "Verified"
                                                            : "Unverified"}
                                                    </Badge>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-blue-500/10 text-blue-500"
                                                    >
                                                        {contract.network.name}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <div
                                                    className="font-mono bg-muted/30 px-3 py-1 rounded-md cursor-pointer 
                                                             hover:bg-primary/10 transition-colors flex items-center gap-2"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            contract.address
                                                        )
                                                    }
                                                >
                                                    {contract.address.substring(
                                                        0,
                                                        8
                                                    )}
                                                    ...
                                                    {contract.address.substring(
                                                        contract.address
                                                            .length - 6
                                                    )}
                                                    {copiedAddress ===
                                                    contract.address ? (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <a
                                                    href={getExplorerAddressUrl(
                                                        contract
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 flex items-center gap-1"
                                                >
                                                    View on Explorer
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-md">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(
                                                    contract.deployedAt
                                                )}
                                            </div>
                                            <Button
                                                variant={
                                                    openAccordion ===
                                                    contract.id
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                className="flex items-center gap-2 min-w-[120px]"
                                                onClick={() =>
                                                    toggleFactoryFunctions(
                                                        contract.address,
                                                        contract.networkId,
                                                        contract.id
                                                    )
                                                }
                                            >
                                                <Code className="h-4 w-4" />
                                                Functions
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${
                                                        openAccordion ===
                                                        contract.id
                                                            ? "rotate-180"
                                                            : ""
                                                    }`}
                                                />
                                            </Button>
                                        </div>
                                    </div>

                                    {openAccordion === contract.id && (
                                        <div className="border-t bg-muted/5">
                                            {selectedFactory?.id ===
                                                contract.id && (
                                                <FactoryFunctions
                                                    factory={selectedFactory}
                                                    onClose={() =>
                                                        setOpenAccordion(null)
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
