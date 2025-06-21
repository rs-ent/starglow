/// components\admin\onchain\OnChain.Factory.tsx
/// Blockchain Factory Component Manager

"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";

import FactoryDeploy from "./OnChain.FactoryDeploy";
import FactoryList from "./OnChain.FactoryList";

import type { DeployFactoryResult } from "@/app/actions/factoryContracts";

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
    onDeploySuccess?: (result: DeployFactoryResult) => void;
    onSelectFactory?: (factory: FactoryContract) => void;
}

export default function OnChainFactory({
    preSelectedNetworkId,
    onDeploySuccess,
    onSelectFactory,
}: OnChainFactoryProps) {
    const [showDeployForm, setShowDeployForm] = useState(false);

    function handleDeployClick() {
        setShowDeployForm(true);
    }

    function handleDeploySuccess(result: DeployFactoryResult) {
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
                ) : // List Mode
                preSelectedNetworkId ? (
                    <div className="p-6">
                        <FactoryList
                            networkId={preSelectedNetworkId}
                            onDeployClick={handleDeployClick}
                            onSelectFactory={(factory) =>
                                onSelectFactory?.(factory)
                            }
                        />
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <p>네트워크를 선택해주세요.</p>
                    </div>
                )}
            </div>

            {/* Optional: Info Card */}
            {!showDeployForm && (
                <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                    <p className="text-sm text-blue-500">
                        새로운 팩토리 컨트랙트를 배포하거나 기존 팩토리
                        컨트랙트를 관리하세요. 팩토리 컨트랙트는 NFT 컬렉션을
                        생성하고 관리할 수 있습니다.
                    </p>
                </Card>
            )}
        </div>
    );
}
