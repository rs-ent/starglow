// components/admin/assets/Assets.List.tsx
"use client";

import { useMemo } from "react";
import {
    Edit,
    Database,
    Shield,
    CheckCircle,
    XCircle,
    Star,
    StarOff,
    Loader2,
    AlertCircle,
    Coins,
    Package,
    Settings,
    Power,
    PowerOff,
} from "lucide-react";
import { TbTopologyStar3 } from "react-icons/tb";

import { useAssetsGet, useAssetsSet } from "@/app/actions/assets/hooks";
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
            <div className="min-h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden rounded-2xl">
                <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-2xl">
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                            <div className="text-slate-300 text-lg font-medium">
                                에셋 로드중...
                            </div>
                            <div className="text-slate-400 text-sm">
                                잠시만 기다려주세요
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden rounded-2xl">
                <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />
                <Card className="bg-red-950/30 border-red-800/50 backdrop-blur-sm shadow-2xl">
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-4">
                            <AlertCircle className="w-12 h-12 text-red-400" />
                            <div className="text-red-300 text-lg font-medium">
                                에셋 로드 실패
                            </div>
                            <div className="text-red-400/70 text-sm">
                                다시 시도해주세요
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden rounded-2xl shadow-2xl border border-slate-700/50">
            {/* Background decoration */}
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />

            <div className="relative z-10 p-8 space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                            <Database className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                Asset{" "}
                                <span className="text-purple-400">
                                    Management
                                </span>
                            </h1>
                            <p className="text-slate-300 mt-1">
                                컨트랙트{" "}
                                <span className="font-mono text-purple-300">
                                    {contractAddress}
                                </span>
                                의 에셋 관리
                            </p>
                        </div>
                    </div>

                    {/* Create Asset Button */}
                    <AssetsCreate contractAddress={contractAddress} />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {filteredAssets.length}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        총 에셋
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {
                                            filteredAssets.filter(
                                                (asset) => asset.isActive
                                            ).length
                                        }
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        활성 에셋
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {
                                            filteredAssets.filter(
                                                (asset) => asset.isDefault
                                            ).length
                                        }
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        기본 에셋
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-purple-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {
                                            filteredAssets.filter(
                                                (asset) => asset.hasInstance
                                            ).length
                                        }
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        인스턴스 지원
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assets Table */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <Coins className="w-6 h-6 text-yellow-400" />
                            <div>
                                <CardTitle className="text-xl text-white">
                                    에셋 목록
                                </CardTitle>
                                <CardDescription className="text-slate-300">
                                    에셋 생성, 수정, 활성화/비활성화 관리
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70">
                                        <TableHead className="text-center text-slate-300 font-semibold">
                                            에셋 정보
                                        </TableHead>
                                        <TableHead className="text-center text-slate-300 font-semibold">
                                            유형 & 특성
                                        </TableHead>
                                        <TableHead className="text-center text-slate-300 font-semibold">
                                            컨트랙트
                                        </TableHead>
                                        <TableHead className="text-center text-slate-300 font-semibold">
                                            상태
                                        </TableHead>
                                        <TableHead className="text-center text-slate-300 font-semibold">
                                            기본 설정
                                        </TableHead>
                                        <TableHead className="text-center text-slate-300 font-semibold">
                                            작업
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssets.map((asset: Asset) => (
                                        <TableRow
                                            key={asset.id}
                                            className="border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                                        >
                                            {/* 에셋 정보 */}
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        {asset.iconUrl ? (
                                                            <img
                                                                src={
                                                                    asset.iconUrl
                                                                }
                                                                alt={asset.name}
                                                                className="w-12 h-12 rounded-xl border-2 border-slate-600/50 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-slate-700/50 border-2 border-slate-600/50 flex items-center justify-center">
                                                                <Package className="w-6 h-6 text-slate-400" />
                                                            </div>
                                                        )}
                                                        {asset.isDefault && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                                                <Star className="w-2 h-2 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white text-lg">
                                                            {asset.name}
                                                        </div>
                                                        <div className="text-slate-400 font-mono text-sm">
                                                            {asset.symbol}
                                                        </div>
                                                        {asset.description && (
                                                            <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">
                                                                {
                                                                    asset.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* 유형 & 특성 */}
                                            <TableCell className="text-center p-4">
                                                <div className="space-y-2">
                                                    <Badge
                                                        variant={
                                                            asset.assetType ===
                                                            "ONCHAIN"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className={`font-medium ${
                                                            asset.assetType ===
                                                            "ONCHAIN"
                                                                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                                                : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                                        }`}
                                                    >
                                                        {asset.assetType ===
                                                        "ONCHAIN" ? (
                                                            <>
                                                                <Shield className="w-3 h-3 mr-1" />
                                                                온체인
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Database className="w-3 h-3 mr-1" />
                                                                오프체인
                                                            </>
                                                        )}
                                                    </Badge>

                                                    {asset.hasInstance && (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                                                <Settings className="w-3 h-3 mr-1" />
                                                                인스턴스 지원
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* 컨트랙트 */}
                                            <TableCell className="text-center p-4">
                                                <div className="font-mono text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                                                    {asset.contractAddress ||
                                                        "N/A"}
                                                </div>
                                            </TableCell>

                                            {/* 상태 */}
                                            <TableCell className="text-center p-4">
                                                <Badge
                                                    variant={
                                                        asset.isActive
                                                            ? "default"
                                                            : "destructive"
                                                    }
                                                    className={`font-medium ${
                                                        asset.isActive
                                                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                                                            : "bg-red-500/20 text-red-300 border-red-500/30"
                                                    }`}
                                                >
                                                    {asset.isActive ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            활성
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            비활성
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>

                                            {/* 기본 설정 */}
                                            <TableCell className="text-center p-4">
                                                {asset.isDefault ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                                            <Star className="w-3 h-3 mr-1" />
                                                            기본 에셋
                                                        </Badge>
                                                        <span className="text-xs text-slate-400">
                                                            회원가입 시 자동
                                                            지급
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-slate-600 text-slate-400"
                                                        >
                                                            <StarOff className="w-3 h-3 mr-1" />
                                                            일반 에셋
                                                        </Badge>
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* 작업 */}
                                            <TableCell className="p-4">
                                                <div className="flex justify-center gap-2 flex-wrap">
                                                    {/* 수정 버튼 */}
                                                    <AssetsCreate
                                                        contractAddress={
                                                            contractAddress
                                                        }
                                                        editAsset={asset}
                                                        trigger={
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                                수정
                                                            </Button>
                                                        }
                                                    />

                                                    {/* 활성화/비활성화 버튼 */}
                                                    {asset.isActive ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                deactivateAsset(
                                                                    {
                                                                        id: asset.id,
                                                                    }
                                                                )
                                                            }
                                                            disabled={
                                                                isDeactivateAssetPending
                                                            }
                                                            className="gap-1 border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
                                                        >
                                                            {isDeactivateAssetPending ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <PowerOff className="w-3 h-3" />
                                                            )}
                                                            비활성화
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                activateAsset({
                                                                    id: asset.id,
                                                                })
                                                            }
                                                            disabled={
                                                                isActivateAssetPending
                                                            }
                                                            className="gap-1 border-green-500/30 text-green-300 hover:bg-green-500/10 hover:border-green-500/50"
                                                        >
                                                            {isActivateAssetPending ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Power className="w-3 h-3" />
                                                            )}
                                                            활성화
                                                        </Button>
                                                    )}

                                                    {/* 기본 설정 버튼 */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDefaultAsset({
                                                                assetId:
                                                                    asset.id,
                                                                isDefault:
                                                                    !asset.isDefault,
                                                            })
                                                        }
                                                        disabled={
                                                            isSetDefaultAssetPending
                                                        }
                                                        className={`gap-1 ${
                                                            asset.isDefault
                                                                ? "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 hover:border-yellow-500/50"
                                                                : "border-slate-500/30 text-slate-300 hover:bg-slate-500/10 hover:border-slate-500/50"
                                                        }`}
                                                    >
                                                        {isSetDefaultAssetPending ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : asset.isDefault ? (
                                                            <StarOff className="w-3 h-3" />
                                                        ) : (
                                                            <Star className="w-3 h-3" />
                                                        )}
                                                        {asset.isDefault
                                                            ? "기본 해제"
                                                            : "기본 설정"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredAssets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <div className="text-xl font-semibold text-slate-300 text-center mb-2">
                                        에셋이 없습니다
                                    </div>
                                    <div className="text-slate-400 text-center mb-6">
                                        첫 번째 에셋을 생성해보세요
                                    </div>
                                    <div className="flex justify-center">
                                        <AssetsCreate
                                            contractAddress={contractAddress}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
