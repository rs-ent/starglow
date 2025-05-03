// components/admin/assets/Assets.Create.tsx
"use client";

import { useAssetsSet } from "@/app/hooks/useAssets";
import { useForm } from "react-hook-form";
import { CreateAssetInput } from "@/app/actions/assets";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Plus } from "lucide-react";
import FileUploader from "@/components/atoms/FileUploader";
import Image from "next/image";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { useToast } from "@/app/hooks/useToast";
import { Badge } from "@/components/ui/badge";

interface AssetsCreateProps {
    contractAddress: string;
}

export default function AssetsCreate({ contractAddress }: AssetsCreateProps) {
    const [open, setOpen] = useState(false);
    const { createAsset, isCreateAssetPending } = useAssetsSet();
    const toast = useToast();

    const {
        wallets,
        isLoading: isLoadingWallets,
        error: walletsError,
    } = useEscrowWalletManager();

    const form = useForm<CreateAssetInput>({
        defaultValues: {
            assetType: "OFFCHAIN",
            name: "",
            symbol: "",
            description: "",
            iconUrl: "",
            imageUrl: "",
            metadata: {},
            assetsContractAddress: contractAddress,
            createdBy: "",
        },
    });

    const assetType = form.watch("assetType");
    const iconUrl = form.watch("iconUrl");
    const imageUrl = form.watch("imageUrl");

    const onSubmit = async (data: CreateAssetInput) => {
        try {
            if (!data.createdBy) {
                throw new Error("에스크로 지갑을 선택해주세요");
            }

            const result = await createAsset(data);
            toast.success(`에셋 ${result.name}이(가) 생성되었습니다`);
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error("Failed to create asset:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "에셋 생성에 실패했습니다"
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />새 에셋 생성
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>새 에셋 생성</DialogTitle>
                    <DialogDescription>
                        컨트랙트 {contractAddress}에 새로운 에셋을 생성합니다
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="createdBy"
                            rules={{ required: "에스크로 지갑을 선택해주세요" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        에스크로 지갑 (관리자)
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoadingWallets}
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
                                                                {wallet.address}
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

                        <FormField
                            control={form.control}
                            name="assetType"
                            rules={{ required: "에셋 유형을 선택하세요" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>에셋 유형</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="에셋 유형 선택" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="OFFCHAIN">
                                                오프체인 에셋
                                            </SelectItem>
                                            <SelectItem value="ONCHAIN">
                                                온체인 에셋 (준비중)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                rules={{ required: "이름을 입력하세요" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>이름</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="경험치"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="symbol"
                                rules={{ required: "심볼을 입력하세요" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>심볼</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="XP"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>설명</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="에셋 설명..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="iconUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>아이콘</FormLabel>
                                        <div className="space-y-2">
                                            <FileUploader
                                                purpose="asset-icon"
                                                bucket="assets"
                                                multiple={false}
                                                maxSize={2 * 1024 * 1024} // 2MB
                                                onComplete={(files) => {
                                                    if (files[0]) {
                                                        field.onChange(
                                                            files[0].url
                                                        );
                                                    }
                                                }}
                                            />
                                            {iconUrl && (
                                                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                                                    <Image
                                                        src={iconUrl}
                                                        alt="Icon preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>이미지</FormLabel>
                                        <div className="space-y-2">
                                            <FileUploader
                                                purpose="asset-image"
                                                bucket="assets"
                                                multiple={false}
                                                maxSize={5 * 1024 * 1024} // 5MB
                                                onComplete={(files) => {
                                                    if (files[0]) {
                                                        field.onChange(
                                                            files[0].url
                                                        );
                                                    }
                                                }}
                                            />
                                            {imageUrl && (
                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                                    <Image
                                                        src={imageUrl}
                                                        alt="Image preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {assetType === "ONCHAIN" && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    온체인 에셋 기능은 준비 중입니다.
                                </p>
                            </div>
                        )}

                        <input
                            type="hidden"
                            {...form.register("assetsContractAddress")}
                            value={contractAddress}
                        />

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreateAssetPending}
                            >
                                {isCreateAssetPending
                                    ? "생성 중..."
                                    : "에셋 생성"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
