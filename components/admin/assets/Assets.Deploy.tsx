// components/admin/assets/Assets.Deploy.tsx
"use client";

import React from "react";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { useAssetsSet } from "@/app/hooks/useAssets";
import {
    useBlockchainNetworksManager,
    useEscrowWalletManager,
} from "@/app/hooks/useBlockchain";
import { useToast } from "@/app/hooks/useToast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DeployAssetsContractForm {
    walletId: string;
    networkId: string;
    version: string;
    description?: string;
}

export default function AssetsDeploy() {
    const toast = useToast();
    const { deployAssetsContract, isDeployAssetsContractPending } =
        useAssetsSet();
    const {
        networks,
        isLoading: isLoadingNetworks,
        error: networksError,
    } = useBlockchainNetworksManager();
    const {
        wallets,
        isLoading: isLoadingWallets,
        error: walletsError,
    } = useEscrowWalletManager();

    const form = useForm<DeployAssetsContractForm>({
        defaultValues: {
            networkId: "",
            walletId: "",
            version: "1.0.0",
            description: "",
        },
    });

    const [open, setOpen] = React.useState(false);

    const onSubmit = async (data: DeployAssetsContractForm) => {
        const confirmed = window.confirm(
            "⚠️ 중요 안내\n\n" +
                "새로운 에셋 컨트랙트 배포를 진행하시겠습니까?\n\n" +
                "- 관리자와 상의하셨나요?\n" +
                "- 새로운 배포가 필요한 이유가 명확한가요?\n" +
                "- 기존 컨트랙트와의 호환성을 검토하셨나요?\n\n" +
                "진행하시려면 '확인'을 눌러주세요."
        );

        if (!confirmed) {
            return;
        }

        try {
            const result = await deployAssetsContract({
                walletId: data.walletId,
                networkId: data.networkId,
                version: data.version,
                description: data.description,
            });

            if (result.success && result.data) {
                toast.success(
                    `Contract deployed successfully: ${result.data.address}`
                );
                form.reset();
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to deploy contract");
            }
        } catch (error) {
            console.error("Failed to deploy contract:", error);
            toast.error("Failed to deploy contract");
        }
    };

    if (isLoadingNetworks || isLoadingWallets) {
        return (
            <Card className="bg-card">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground">
                            Loading...
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (networksError || walletsError) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    {networksError instanceof Error
                        ? networksError.message
                        : walletsError instanceof Error
                        ? walletsError.message
                        : "Failed to load required data"}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">새로운 에셋 컨트랙트 배포</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>새로운 에셋 컨트랙트 배포</DialogTitle>
                    <DialogDescription>
                        새로운 에셋 컨트랙트를 배포하여 온체인 및 오프체인
                        자산을 관리합니다. 컨트랙트를 수정하였을 경우, 새로운
                        배포를 요구합니다. 그 외에는 테크니컬 서포트를
                        요청하세요.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingNetworks || isLoadingWallets ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-muted-foreground">
                                로딩중...
                            </span>
                        </div>
                    </div>
                ) : networksError || walletsError ? (
                    <Alert variant="destructive">
                        <AlertDescription>
                            필요한 데이터를 로딩하는데 실패했습니다.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="networkId"
                                rules={{ required: "네트워크가 필요합니다." }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>네트워크</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="네트워크 선택" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {networks?.map((network) => (
                                                    <SelectItem
                                                        key={network.id}
                                                        value={network.id}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {network.name}
                                                            </span>
                                                            {network.isTestnet && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    Testnet
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="walletId"
                                rules={{
                                    required: "에스크로 지갑이 필요합니다.",
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            에스크로 지갑 (관리자 역할)
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="에스크로 지갑 선택" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {wallets
                                                    ?.filter((w) => w.isActive)
                                                    .map((wallet) => (
                                                        <SelectItem
                                                            key={wallet.id}
                                                            value={wallet.id}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm truncate">
                                                                    {
                                                                        wallet.address
                                                                    }
                                                                </span>
                                                                <Badge
                                                                    variant="default"
                                                                    className="bg-green-500/10 text-green-500"
                                                                >
                                                                    활성화
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isDeployAssetsContractPending}
                            >
                                {isDeployAssetsContractPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>배포중...</span>
                                    </div>
                                ) : (
                                    "배포"
                                )}
                            </Button>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
