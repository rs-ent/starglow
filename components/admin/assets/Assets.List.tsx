// components/admin/assets/Assets.List.tsx
"use client";

import { useMemo } from "react";


import { useAssetsGet, useAssetsSet } from "@/app/hooks/useAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import AssetsCreate from "./Assets.Create";

import type { Asset } from "@prisma/client";


interface AssetsListProps {
    contractAddress: string;
}

export default function AssetsList({ contractAddress }: AssetsListProps) {
    const { assets, isLoading, error } = useAssetsGet({});
    const filteredAssets = useMemo(() => {
        return (
            assets?.assets.filter(
                (asset) => asset.assetsContractAddress === contractAddress
            ) || []
        );
    }, [assets, contractAddress]);

    const {
        deactivateAsset,
        activateAsset,
        setDefaultAsset,
        isDeactivateAssetPending,
        isActivateAssetPending,
        isSetDefaultAssetPending,
    } = useAssetsSet();

    if (isLoading) {
        return (
            <Card className="bg-card">
                <CardContent className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">에셋 로드중...</div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="bg-card border-destructive">
                <CardContent className="flex items-center justify-center h-32">
                    <div className="text-destructive">에셋 로드 실패</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Create Asset 버튼 추가 */}
            <div className="flex justify-end">
                <AssetsCreate contractAddress={contractAddress} />
            </div>

            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>에셋 목록</CardTitle>
                    <CardDescription>
                        컨트랙트 {contractAddress}의 에셋 관리
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 divide-x divide-border">
                                <TableHead className="text-center">
                                    이름
                                </TableHead>
                                <TableHead className="text-center">
                                    심볼
                                </TableHead>
                                <TableHead className="text-center">
                                    유형
                                </TableHead>
                                <TableHead className="text-center">
                                    컨트랙트
                                </TableHead>
                                <TableHead className="text-center">
                                    상태
                                </TableHead>
                                <TableHead className="text-center">
                                    디폴트 에셋
                                </TableHead>
                                <TableHead className="text-center">
                                    작업
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {filteredAssets.map((asset: Asset) => (
                                <TableRow
                                    key={asset.id}
                                    className="divide-x divide-border"
                                >
                                    <TableCell className="font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {asset.iconUrl && (
                                                <img
                                                    src={asset.iconUrl}
                                                    alt={asset.name}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                            )}
                                            {asset.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {asset.symbol}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                asset.assetType === "ONCHAIN"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className="font-normal"
                                        >
                                            {asset.assetType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-mono text-xs">
                                            {asset.contractAddress}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                asset.isActive
                                                    ? "default"
                                                    : "destructive"
                                            }
                                            className="font-normal"
                                        >
                                            {asset.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {asset.isDefault ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <p>디폴트 에셋</p>
                                                <p className="text-xs">
                                                    (회원가입 시 무조건 0만큼
                                                    지급)
                                                </p>
                                            </div>
                                        ) : (
                                            <p>디폴트 에셋 아님</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            {asset.isActive ? (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        deactivateAsset({
                                                            id: asset.id,
                                                        })
                                                    }
                                                    disabled={
                                                        isDeactivateAssetPending
                                                    }
                                                >
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() =>
                                                        activateAsset({
                                                            id: asset.id,
                                                        })
                                                    }
                                                    disabled={
                                                        isActivateAssetPending
                                                    }
                                                >
                                                    Activate
                                                </Button>
                                            )}

                                            {asset.isDefault ? (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDefaultAsset({
                                                            assetId: asset.id,
                                                            isDefault: false,
                                                        })
                                                    }
                                                >
                                                    Unset Default
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDefaultAsset({
                                                            assetId: asset.id,
                                                            isDefault: true,
                                                        })
                                                    }
                                                    disabled={
                                                        isSetDefaultAssetPending
                                                    }
                                                >
                                                    Set Default
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
