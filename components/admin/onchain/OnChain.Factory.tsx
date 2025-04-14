/// components\admin\onchain\OnChain.Factory.tsx
/// Blockchain Factory Component Manager

"use client";

import { useState } from "react";
import FactoryList from "./OnChain.FactoryList";
import FactoryDeploy from "./OnChain.FactoryDeploy";

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
    // 배포 폼 표시 여부
    const [showDeployForm, setShowDeployForm] = useState(
        preSelectedNetworkId ? true : false
    );

    // Factory 배포 다이얼로그 열기
    function handleDeployClick() {
        setShowDeployForm(true);
    }

    // Factory 배포 성공/취소 핸들러
    function handleDeploySuccess(result: {
        address: string;
        transactionHash: string;
        networkId: string;
        owner?: string;
    }) {
        // 배포 폼 닫기
        setShowDeployForm(false);

        // 상위 컴포넌트 콜백 실행 (있을 경우)
        if (onDeploySuccess) {
            onDeploySuccess(result);
        }
    }

    function handleDeployCancel() {
        setShowDeployForm(false);
    }

    return (
        <div className="space-y-6">
            {/* Factory 배포 폼 - 배포 모드일 때만 표시 */}
            {showDeployForm ? (
                <FactoryDeploy
                    preSelectedNetworkId={preSelectedNetworkId}
                    onCancel={handleDeployCancel}
                    onDeploySuccess={handleDeploySuccess}
                />
            ) : (
                <FactoryList onDeployClick={handleDeployClick} />
            )}
        </div>
    );
}
