/// components\admin\onchain\OnChain.Dashboard.tsx
/// Blockchain Dashboard Component

"use client";

import { useState } from "react";
import OnChainNetwork from "./OnChain.Network";
import OnChainFactory, { FactoryContract } from "./OnChain.Factory";
import OnChainEscrowWallet from "./OnChain.EscrowWallet";
import OnChainCollection from "./OnChain.Collection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Factory, Wallet, Layers, Image } from "lucide-react";
import OnChainNFTManager from "./OnChain.NFT";
import { CollectionContract } from "@prisma/client";

export default function OnChainDashboard() {
    const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
        null
    );
    const [selectedFactory, setSelectedFactory] =
        useState<FactoryContract | null>(null);
    const [selectedCollection, setSelectedCollection] =
        useState<CollectionContract | null>(null);
    const [activeTab, setActiveTab] = useState("networks");

    const handleDeployClick = (networkId: string) => {
        setSelectedNetworkId(networkId);
        setActiveTab("contracts");
    };

    const handleSelectFactory = (factory: FactoryContract) => {
        setSelectedFactory(factory);
        setActiveTab("collections");
    };

    const handleViewCollectionNFTs = (collection: CollectionContract) => {
        setSelectedCollection(collection);
        setActiveTab("nfts");
    };

    return (
        <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
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
                        <span>네트워크</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="wallets"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Wallet className="h-4 w-4" />
                        <span>에스크로 지갑</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="contracts"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Factory className="h-4 w-4" />
                        <span>팩토리</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="collections"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Layers className="h-4 w-4" />
                        <span>컬렉션</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="nfts"
                        className="data-[state=active]:bg-background flex items-center gap-2 py-3 rounded-lg transition-all"
                    >
                        <Image className="h-4 w-4" />
                        <span>NFT</span>
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
                            onSelectFactory={handleSelectFactory}
                        />
                    </TabsContent>

                    <TabsContent value="wallets" className="p-6">
                        <OnChainEscrowWallet />
                    </TabsContent>

                    <TabsContent value="collections" className="p-6">
                        {selectedFactory ? (
                            <OnChainCollection
                                networkId={selectedFactory.networkId}
                                factoryId={selectedFactory.id}
                                onViewNFTs={handleViewCollectionNFTs}
                            />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <p>팩토리를 선택해주세요.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="nfts" className="p-6">
                        {selectedCollection ? (
                            <OnChainNFTManager
                                selectedCollection={selectedCollection}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Image className="h-12 w-12 text-muted-foreground/40 mb-4" />
                                <p className="text-muted-foreground">
                                    컬렉션을 선택해주세요.
                                </p>
                                <p className="text-sm text-muted-foreground/60 max-w-md mt-2">
                                    컬렉션 탭에서 원하는 컬렉션을 선택한 후 "NFT
                                    목록" 버튼을 클릭하면 이 곳에서 해당
                                    컬렉션의 NFT 목록을 볼 수 있습니다.
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
