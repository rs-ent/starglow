/// components\admin\onchain\OnChain.Dashboard.tsx
/// Blockchain Dashboard Component

"use client";

import { useState } from "react";
import { useFactoryContractsManager } from "@/app/hooks/useFactoryContracts";
import { format } from "date-fns";
import OnChainNetwork from "./OnChain.Network";
import OnChainFactory from "./OnChain.Factory";
import OnChainEscrowWallet from "./OnChain.EscrowWallet";
import OnChainCollection from "./OnChain.Collection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Factory, Wallet, Layers, Image } from "lucide-react";
import OnChainNFTManager from "./OnChain.NFT";

export default function OnChainDashboard() {
    const { contracts, isLoading, error, isError } =
        useFactoryContractsManager();

    const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
        null
    );
    const [activeTab, setActiveTab] = useState("networks");

    const handleDeployClick = (networkId: string) => {
        setSelectedNetworkId(networkId);
        setActiveTab("contracts");
    };

    return (
        <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Blockchain Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Manage your blockchain networks, contracts, and NFTs
                </p>
            </div>

            <Tabs
                defaultValue="networks"
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-5 gap-4 bg-muted/50 p-1 rounded-xl h-auto">
                    <TabsTrigger
                        value="networks"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Network className="h-4 w-4" />
                        <span>Networks</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="wallets"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Wallet className="h-4 w-4" />
                        <span>Escrow Wallets</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="contracts"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Factory className="h-4 w-4" />
                        <span>Factory Contracts</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="collections"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Layers className="h-4 w-4" />
                        <span>Collections</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="nfts"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Image className="h-4 w-4" />
                        <span>NFTs</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6 bg-card rounded-xl border shadow-sm">
                    <TabsContent value="networks" className="p-6">
                        <OnChainNetwork onDeployClick={handleDeployClick} />
                    </TabsContent>

                    <TabsContent value="contracts" className="p-6">
                        <OnChainFactory
                            preSelectedNetworkId={
                                selectedNetworkId || undefined
                            }
                            onDeploySuccess={() => setSelectedNetworkId(null)}
                        />
                    </TabsContent>

                    <TabsContent value="wallets" className="p-6">
                        <OnChainEscrowWallet />
                    </TabsContent>

                    <TabsContent value="collections" className="p-6">
                        <OnChainCollection />
                    </TabsContent>

                    <TabsContent value="nfts" className="p-6">
                        <OnChainNFTManager />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
