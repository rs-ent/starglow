// components/admin/assets/Assets.Create.tsx
"use client";

import { useState, useEffect } from "react";

import {
    Plus,
    Edit,
    Settings,
    Image as ImageIcon,
    Coins,
    Sparkles,
    Info,
    Upload,
    Eye,
    Shield,
    ChevronRight,
    Wallet,
    Database,
} from "lucide-react";
import { TbTopologyStar3 } from "react-icons/tb";
import Image from "next/image";
import { useForm } from "react-hook-form";

import { useAssetsSet } from "@/app/actions/assets/hooks";
import { useUpdateAsset } from "@/app/actions/assets/mutations";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

import type {
    CreateAssetInput,
    UpdateAssetInput,
} from "@/app/actions/assets/actions";
import type { Asset } from "@prisma/client";

// 폼에서 사용할 통합 타입
type AssetFormData = CreateAssetInput & Partial<Pick<UpdateAssetInput, "id">>;

interface AssetsCreateProps {
    contractAddress: string;
    editAsset?: Asset | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

// 섹션 컴포넌트
const Section = ({
    title,
    icon,
    children,
    bgColor = "bg-slate-800/50",
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    bgColor?: string;
}) => (
    <div
        className={`${bgColor} rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm`}
    >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            {icon}
            {title}
        </h2>
        {children}
    </div>
);

const Divider = () => (
    <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
        <Sparkles className="text-slate-400 w-4 h-4" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
    </div>
);

export default function AssetsCreate({
    contractAddress,
    editAsset,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
}: AssetsCreateProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { createAsset, isCreateAssetPending } = useAssetsSet();
    const { mutateAsync: updateAsset, isPending: isUpdateAssetPending } =
        useUpdateAsset();
    const toast = useToast();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled
        ? controlledOnOpenChange || (() => {})
        : setInternalOpen;

    const { wallets, isLoading: isLoadingWallets } = useEscrowWalletManager();

    const isEditMode = !!editAsset;
    const isPending = isCreateAssetPending || isUpdateAssetPending;

    const form = useForm<AssetFormData>({
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
            hasInstance: false,
        },
    });

    // 수정 모드일 때 폼 데이터 설정
    useEffect(() => {
        if (isEditMode && editAsset) {
            form.reset({
                id: editAsset.id,
                assetType: editAsset.assetType,
                name: editAsset.name,
                symbol: editAsset.symbol,
                description: editAsset.description || "",
                iconUrl: editAsset.iconUrl || "",
                imageUrl: editAsset.imageUrl || "",
                metadata: editAsset.metadata || {},
                assetsContractAddress:
                    editAsset.assetsContractAddress || contractAddress,
                hasInstance: editAsset.hasInstance || false,
            });
        } else {
            form.reset({
                assetType: "OFFCHAIN",
                name: "",
                symbol: "",
                description: "",
                iconUrl: "",
                imageUrl: "",
                metadata: {},
                assetsContractAddress: contractAddress,
                createdBy: "",
                hasInstance: false,
            });
        }
    }, [isEditMode, editAsset, contractAddress, form]);

    const assetType = form.watch("assetType");
    const iconUrl = form.watch("iconUrl");
    const imageUrl = form.watch("imageUrl");
    const hasInstance = form.watch("hasInstance");

    const onSubmit = async (data: AssetFormData) => {
        try {
            if (isEditMode) {
                // 수정 모드
                const updateData: UpdateAssetInput = {
                    id: data.id!,
                    name: data.name,
                    symbol: data.symbol,
                    description: data.description,
                    iconUrl: data.iconUrl,
                    imageUrl: data.imageUrl,
                    metadata: data.metadata,
                    hasInstance: data.hasInstance,
                };
                const result = await updateAsset(updateData);
                toast.success(`✨ 에셋 ${result.name}이(가) 수정되었습니다`);
            } else {
                // 생성 모드
                if (!data.createdBy) {
                    throw new Error("에스크로 지갑을 선택해주세요");
                }
                const createData: CreateAssetInput = {
                    assetType: data.assetType,
                    name: data.name,
                    symbol: data.symbol,
                    description: data.description,
                    iconUrl: data.iconUrl,
                    imageUrl: data.imageUrl,
                    metadata: data.metadata,
                    assetsContractAddress: data.assetsContractAddress,
                    createdBy: data.createdBy,
                    hasInstance: data.hasInstance,
                };
                const result = await createAsset(createData);
                toast.success(`🎉 에셋 ${result.name}이(가) 생성되었습니다`);
            }

            form.reset();
            setOpen(false);
        } catch (error) {
            console.error(
                `Failed to ${isEditMode ? "update" : "create"} asset:`,
                error
            );
            toast.error(
                error instanceof Error
                    ? error.message
                    : `에셋 ${isEditMode ? "수정" : "생성"}에 실패했습니다`
            );
        }
    };

    const triggerButton = trigger || (
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold">
            {isEditMode ? (
                <>
                    <Edit className="w-4 h-4 mr-2" />
                    에셋 수정
                </>
            ) : (
                <>
                    <Plus className="w-4 h-4 mr-2" />새 에셋 생성
                </>
            )}
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-2xl flex flex-col p-0 bg-background shadow-2xl overflow-hidden">
                <DialogHeader className="flex-none min-h-[8vh] px-8 py-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <Database className="text-purple-400" />
                        {isEditMode ? (
                            <>
                                Edit{" "}
                                <span className="text-purple-400">Asset</span>
                            </>
                        ) : (
                            <>
                                Create New{" "}
                                <span className="text-purple-400">Asset</span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 text-base">
                        {isEditMode
                            ? `에셋 ${editAsset?.name}을(를) 수정합니다`
                            : `컨트랙트 ${contractAddress}에 새로운 에셋을 생성합니다`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                    {/* Background decoration */}
                    <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />

                    <div className="h-full overflow-y-auto p-8">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-8"
                            >
                                {/* 기본 정보 */}
                                <Section
                                    title="기본 정보"
                                    icon={
                                        <Settings className="text-blue-400" />
                                    }
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                rules={{
                                                    required:
                                                        "이름을 입력하세요",
                                                }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-300 font-medium">
                                                            에셋 이름
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="경험치"
                                                                {...field}
                                                                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="symbol"
                                                rules={{
                                                    required:
                                                        "심볼을 입력하세요",
                                                }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-300 font-medium">
                                                            심볼
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="XP"
                                                                {...field}
                                                                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500"
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
                                                    <FormLabel className="text-slate-300 font-medium">
                                                        설명
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="에셋에 대한 자세한 설명을 입력하세요..."
                                                            {...field}
                                                            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500 min-h-[120px]"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </Section>

                                <Divider />

                                {/* 에셋 설정 */}
                                <Section
                                    title="에셋 설정"
                                    icon={<Coins className="text-yellow-400" />}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            {!isEditMode && (
                                                <FormField
                                                    control={form.control}
                                                    name="createdBy"
                                                    rules={{
                                                        required:
                                                            "에스크로 지갑을 선택해주세요",
                                                    }}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                                                                <Wallet className="w-4 h-4 text-green-400" />
                                                                에스크로 지갑
                                                                (관리자)
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                defaultValue={
                                                                    field.value
                                                                }
                                                                disabled={
                                                                    isLoadingWallets
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500">
                                                                        <SelectValue placeholder="에스크로 지갑 선택" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {wallets
                                                                        ?.filter(
                                                                            (
                                                                                w
                                                                            ) =>
                                                                                w.isActive
                                                                        )
                                                                        .map(
                                                                            (
                                                                                wallet
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        wallet.id
                                                                                    }
                                                                                    value={
                                                                                        wallet.id
                                                                                    }
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-mono text-sm truncate">
                                                                                            {
                                                                                                wallet.address
                                                                                            }
                                                                                        </span>
                                                                                        <Badge
                                                                                            variant="default"
                                                                                            className="bg-green-500/10 text-green-400 border-green-500/20"
                                                                                        >
                                                                                            활성화
                                                                                        </Badge>
                                                                                    </div>
                                                                                </SelectItem>
                                                                            )
                                                                        )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            <FormField
                                                control={form.control}
                                                name="assetType"
                                                rules={{
                                                    required:
                                                        "에셋 유형을 선택하세요",
                                                }}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-300 font-medium">
                                                            에셋 유형
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value
                                                            }
                                                            disabled={
                                                                isEditMode
                                                            } // 수정 시에는 유형 변경 불가
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500">
                                                                    <SelectValue placeholder="에셋 유형 선택" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="OFFCHAIN">
                                                                    <div className="flex items-center gap-2">
                                                                        <Database className="w-4 h-4 text-blue-400" />
                                                                        오프체인
                                                                        에셋
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="ONCHAIN">
                                                                    <div className="flex items-center gap-2">
                                                                        <Shield className="w-4 h-4 text-purple-400" />
                                                                        온체인
                                                                        에셋
                                                                        (준비중)
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="hasInstance"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-600/50 p-6 bg-slate-800/30">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                                className="border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-slate-200 font-medium">
                                                                개별 인스턴스
                                                                지원
                                                            </FormLabel>
                                                            <p className="text-sm text-slate-400">
                                                                티켓, 쿠폰,
                                                                수집품 등 개별
                                                                추적이 필요한
                                                                경우 활성화
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

                                            {hasInstance && (
                                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-200">
                                                                개별 인스턴스
                                                                모드
                                                            </p>
                                                            <p className="text-xs text-blue-300 mt-1">
                                                                각 개별 아이템이
                                                                고유한 시리얼
                                                                번호와 코드를
                                                                가지며, 상태별로
                                                                관리됩니다.
                                                                (PENDING →
                                                                RECEIVED →
                                                                USED/EXPIRED)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Section>

                                <Divider />

                                {/* 이미지/미디어 */}
                                <Section
                                    title="이미지 & 미디어"
                                    icon={
                                        <ImageIcon className="text-green-400" />
                                    }
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="iconUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                                                        <Upload className="w-4 h-4 text-blue-400" />
                                                        아이콘 이미지
                                                    </FormLabel>
                                                    <div className="space-y-4">
                                                        <FileUploader
                                                            purpose="asset-icon"
                                                            bucket="assets"
                                                            multiple={false}
                                                            maxSize={
                                                                2 * 1024 * 1024
                                                            } // 2MB
                                                            onComplete={(
                                                                files
                                                            ) => {
                                                                if (files[0]) {
                                                                    field.onChange(
                                                                        files[0]
                                                                            .url
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        {iconUrl && (
                                                            <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                                                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/30">
                                                                    <Image
                                                                        src={
                                                                            iconUrl
                                                                        }
                                                                        alt="Icon preview"
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                        <Eye className="w-4 h-4" />
                                                                        아이콘
                                                                        미리보기
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 mt-1">
                                                                        64x64
                                                                        픽셀
                                                                        권장
                                                                    </p>
                                                                </div>
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
                                                    <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                                                        <Upload className="w-4 h-4 text-green-400" />
                                                        대표 이미지
                                                    </FormLabel>
                                                    <div className="space-y-4">
                                                        <FileUploader
                                                            purpose="asset-image"
                                                            bucket="assets"
                                                            multiple={false}
                                                            maxSize={
                                                                5 * 1024 * 1024
                                                            } // 5MB
                                                            onComplete={(
                                                                files
                                                            ) => {
                                                                if (files[0]) {
                                                                    field.onChange(
                                                                        files[0]
                                                                            .url
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        {imageUrl && (
                                                            <div className="space-y-2">
                                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-purple-500/30">
                                                                    <Image
                                                                        src={
                                                                            imageUrl
                                                                        }
                                                                        alt="Image preview"
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                    <Eye className="w-4 h-4" />
                                                                    이미지
                                                                    미리보기
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </Section>

                                <Divider />

                                {/* 고급 설정 */}
                                <Section
                                    title="고급 설정"
                                    icon={
                                        <Shield className="text-purple-400" />
                                    }
                                    bgColor="bg-purple-900/20"
                                >
                                    {assetType === "ONCHAIN" && (
                                        <div className="p-6 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Info className="w-5 h-5 text-yellow-400" />
                                                <span className="text-slate-200 font-medium">
                                                    온체인 에셋 준비중
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                블록체인 기반 에셋 기능은 현재
                                                개발 중입니다. 곧 스마트
                                                컨트랙트 배포 및 온체인 관리
                                                기능이 추가될 예정입니다.
                                            </p>
                                        </div>
                                    )}

                                    <input
                                        type="hidden"
                                        {...form.register(
                                            "assetsContractAddress"
                                        )}
                                        value={contractAddress}
                                    />

                                    <div className="mt-6 p-4 bg-slate-800/30 border border-slate-600/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                                            <Database className="w-4 h-4" />
                                            컨트랙트 정보
                                        </div>
                                        <div className="font-mono text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                                            {contractAddress}
                                        </div>
                                    </div>
                                </Section>

                                <Divider />

                                {/* 제출 버튼 */}
                                <div className="flex justify-end gap-4 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpen(false)}
                                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        {isPending ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                {isEditMode
                                                    ? "수정 중..."
                                                    : "생성 중..."}
                                            </>
                                        ) : (
                                            <>
                                                {isEditMode ? (
                                                    <Edit className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <Plus className="w-4 h-4 mr-2" />
                                                )}
                                                에셋{" "}
                                                {isEditMode ? "수정" : "생성"}
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
