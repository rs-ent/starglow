/// components/admin/assets/Assets.Dashboard.tsx

"use client";

import { useState } from "react";

import { useAssetsGet } from "@/app/hooks/useAssets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AssetsDeploy from "./Assets.Deploy";
import AssetsList from "./Assets.List";

// 에어드롭, 함수 기능 추가 필요!

export default function AssetsDashboard() {
    // 선택된 컨트랙트 상태 관리
    const [selectedContractAddress, setSelectedContractAddress] =
        useState<string>("");

    // 컨트랙트 목록 조회
    const { assetsContracts, isAssetsContractsLoading } = useAssetsGet({
        getAssetsContractsInput: {},
    });

    console.log("assetsContracts", assetsContracts);

    // 컨트랙트가 선택되지 않은 경우
    if (!selectedContractAddress) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>에셋 컨트랙트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Select
                            onValueChange={setSelectedContractAddress}
                            disabled={isAssetsContractsLoading}
                        >
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="컨트랙트 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {assetsContracts?.contracts.map((contract) => (
                                    <SelectItem
                                        key={contract.address}
                                        value={contract.address}
                                    >
                                        {contract.address} ({contract.version})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">or</span>
                        <AssetsDeploy />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 컨트랙트가 선택된 경우 하위 탭 표시
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">
                            에셋 컨트랙트: {selectedContractAddress}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedContractAddress("")}
                        >
                            에셋 컨트랙트 변경
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="assets">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="assets">에셋</TabsTrigger>
                    <TabsTrigger value="airdrop">에어드랍</TabsTrigger>
                    <TabsTrigger value="functions">에셋 함수</TabsTrigger>
                </TabsList>
                <TabsContent value="assets" className="mt-6">
                    <AssetsList contractAddress={selectedContractAddress} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
