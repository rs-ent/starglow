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
import { Code, ExternalLink, PlusCircle, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import PartialLoading from "@/components/atoms/PartialLoading";
import FactoryFunctions from "./OnChain.FactoryFunctions";

interface FactoryListProps {
    onDeployClick: () => void;
}

export default function FactoryList({ onDeployClick }: FactoryListProps) {
    const {
        contracts,
        isLoading: isLoadingContracts,
        error: contractsError,
        isError,
    } = useFactoryContractsManager();

    // 어코디언 상태 관리
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    // 선택된 Factory 컨트랙트 정보
    const [selectedFactory, setSelectedFactory] = useState<{
        address: string;
        networkId: string;
        id: string;
    } | null>(null);

    // Explorer URL 생성 함수
    function getExplorerAddressUrl(contract: any) {
        return `${contract.network.explorerUrl}/address/${contract.address}`;
    }

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    // 특정 Factory로 Functions 폼 토글
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

        // 선택된 어코디언 토글
        if (openAccordion === id) {
            setOpenAccordion(null);
        } else {
            setOpenAccordion(id);
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Factory Contracts</CardTitle>
                </div>
                <Button variant="default" onClick={onDeployClick}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Deploy New Contract
                </Button>
            </CardHeader>
            <CardContent>
                {isLoadingContracts ? (
                    <div className="flex justify-center items-center py-8">
                        <PartialLoading text="Loading contracts..." />
                    </div>
                ) : isError ? (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                            {contractsError instanceof Error
                                ? contractsError.message
                                : "Failed to load contracts"}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="overflow-x-auto">
                        {!contracts || contracts.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    No Factory contracts have been deployed yet.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={onDeployClick}
                                >
                                    Deploy Your First Contract
                                </Button>
                            </div>
                        ) : (
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[15%]">
                                            Network
                                        </TableHead>
                                        <TableHead className="w-[30%]">
                                            Contract Address
                                        </TableHead>
                                        <TableHead className="w-[20%]">
                                            Deployed At
                                        </TableHead>
                                        <TableHead className="w-[15%]">
                                            Deployed By
                                        </TableHead>
                                        <TableHead className="w-[20%]">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contracts.map((contract) => (
                                        <Fragment key={contract.id}>
                                            <TableRow
                                                className={`w-full ${
                                                    openAccordion ===
                                                    contract.id
                                                        ? "bg-muted/50"
                                                        : ""
                                                }`}
                                            >
                                                <TableCell className="w-[15%]">
                                                    <Badge variant="outline">
                                                        {contract.network.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="w-[30%] font-mono">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="truncate max-w-[120px]">
                                                            {contract.address}
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
                                                                size={14}
                                                            />
                                                        </a>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="w-[20%]">
                                                    {formatDate(
                                                        contract.deployedAt
                                                    )}
                                                </TableCell>
                                                <TableCell className="w-[15%]">
                                                    {contract.deployedBy}
                                                </TableCell>
                                                <TableCell className="w-[20%]">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="flex items-center"
                                                            onClick={() =>
                                                                toggleFactoryFunctions(
                                                                    contract.address,
                                                                    contract.networkId,
                                                                    contract.id
                                                                )
                                                            }
                                                        >
                                                            <Code className="h-4 w-4 mr-1" />
                                                            Functions
                                                            {openAccordion ===
                                                            contract.id ? (
                                                                <ChevronDown className="h-4 w-4 ml-1 rotate-180 transition-transform" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 ml-1 transition-transform" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {openAccordion === contract.id && (
                                                <TableRow className="bg-muted/50">
                                                    <TableCell
                                                        colSpan={5}
                                                        className="p-0"
                                                    >
                                                        <div className="border-t border-t-muted py-4 px-6">
                                                            {selectedFactory?.id ===
                                                                contract.id && (
                                                                <FactoryFunctions
                                                                    factory={
                                                                        selectedFactory
                                                                    }
                                                                    onClose={() =>
                                                                        setOpenAccordion(
                                                                            null
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
