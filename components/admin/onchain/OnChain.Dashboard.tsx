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
        <div className="space-y-6">
            <Tabs
                defaultValue="networks"
                value={activeTab}
                onValueChange={setActiveTab}
            >
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="networks">Networks</TabsTrigger>
                    <TabsTrigger value="wallets">Escrow Wallets</TabsTrigger>
                    <TabsTrigger value="contracts">
                        Factory Contracts
                    </TabsTrigger>
                    <TabsTrigger value="collections">
                        NFT Collections
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="networks" className="mt-6">
                    {/* Network Component */}
                    <OnChainNetwork onDeployClick={handleDeployClick} />
                </TabsContent>

                <TabsContent value="contracts" className="mt-6">
                    {/* Factory Component */}
                    <OnChainFactory
                        preSelectedNetworkId={selectedNetworkId || undefined}
                        onDeploySuccess={() => setSelectedNetworkId(null)}
                    />
                </TabsContent>

                <TabsContent value="wallets" className="mt-6">
                    {/* Escrow Wallets Component */}
                    <OnChainEscrowWallet />
                </TabsContent>

                <TabsContent value="collections" className="mt-6">
                    <OnChainCollection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
