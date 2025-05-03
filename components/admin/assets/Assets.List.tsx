// components/admin/assets/Assets.List.tsx
"use client";

import { useAssetsGet, useAssetsSet } from "@/app/hooks/useAssets";
import { Asset } from "@prisma/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AssetsCreate from "./Assets.Create";

interface AssetsListProps {
    contractAddress: string;
}

export default function AssetsList({ contractAddress }: AssetsListProps) {
    // contractAddress를 기준으로 에셋 조회
    const { assets, isLoading, error } = useAssetsGet({
        getAssetsInput: {
            contractAddress, // 선택된 컨트랙트의 에셋만 조회
        },
    });

    const {
        deactivateAsset,
        activateAsset,
        isDeactivateAssetPending,
        isActivateAssetPending,
    } = useAssetsSet();

    if (isLoading) {
        return (
            <Card className="bg-card">
                <CardContent className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">
                        에셋 로드중...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="bg-card border-destructive">
                <CardContent className="flex items-center justify-center h-32">
                    <div className="text-destructive">
                        에셋 로드 실패
                    </div>
                </CardContent>
            </Card>
        );
    }

    const assetsList = assets?.assets || [];

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
                            <TableRow className="bg-muted/50">
                                <TableHead>이름</TableHead>
                                <TableHead>심볼</TableHead>
                                <TableHead>유형</TableHead>
                                <TableHead>컨트랙트</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead className="text-right">
                                    작업
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assetsList.map((asset: Asset) => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
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
                                    <TableCell>{asset.symbol}</TableCell>
                                    <TableCell>
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
                                    <TableCell>
                                        <span className="font-mono text-xs">
                                            {asset.contractAddress}
                                        </span>
                                    </TableCell>
                                    <TableCell>
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
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
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
