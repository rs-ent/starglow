/// components\admin\onchain\OnChain.Factory.tsx
/// Blockchain Factory Component Manager

"use client";

import { useState } from "react";
import FactoryList from "./OnChain.FactoryList";
import FactoryDeploy from "./OnChain.FactoryDeploy";
import { Card } from "@/components/ui/card";

export interface CreateCollectionResult {
    success: boolean;
    collectionAddress?: string;
    transactionHash?: string;
    name?: string;
    symbol?: string;
    error?: string;
}

export interface DeployedCollection {
    id?: string;
    name: string;
    symbol: string;
    address: string;
    factoryAddress: string;
    networkId: string;
    transactionHash?: string;
    deployedAt?: Date;
    ownerId?: string;
    baseURI?: string;
    contractURI?: string;
}

export interface FactoryContract {
    id: string;
    address: string;
    networkId: string;
    name?: string;
    version?: string;
    ownerId?: string;
    deployedAt?: Date;
    verified?: boolean;
}

interface OnChainFactoryProps {
    preSelectedNetworkId?: string;
    onDeploySuccess?: (result: {
        address: string;
        transactionHash: string;
        networkId: string;
        owner?: string;
    }) => void;
}

export default function OnChainFactory({
    preSelectedNetworkId,
    onDeploySuccess,
}: OnChainFactoryProps) {
    const [showDeployForm, setShowDeployForm] = useState(
        preSelectedNetworkId ? true : false
    );

    function handleDeployClick() {
        setShowDeployForm(true);
    }

    function handleDeploySuccess(result: {
        address: string;
        transactionHash: string;
        networkId: string;
        owner?: string;
    }) {
        setShowDeployForm(false);
        if (onDeploySuccess) {
            onDeploySuccess(result);
        }
    }

    function handleDeployCancel() {
        setShowDeployForm(false);
    }

    return (
        <div className="space-y-8">
            {/* Factory Manager Container */}
            <div className="bg-muted/5 rounded-xl border shadow-sm">
                {showDeployForm ? (
                    // Deploy Form Mode
                    <div className="p-6">
                        <FactoryDeploy
                            preSelectedNetworkId={preSelectedNetworkId}
                            onCancel={handleDeployCancel}
                            onDeploySuccess={handleDeploySuccess}
                        />
                    </div>
                ) : (
                    // List Mode
                    <div className="p-6">
                        <FactoryList onDeployClick={handleDeployClick} />
                    </div>
                )}
            </div>

            {/* Optional: Info Card */}
            {!showDeployForm && (
                <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                    <p className="text-sm text-blue-500">
                        Deploy new factory contracts or manage existing ones.
                        Factory contracts allow you to create and manage NFT
                        collections.
                    </p>
                </Card>
            )}
        </div>
    );
}
