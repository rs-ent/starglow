/// components/admin/staking/Admin.Staking.Reward.Create.tsx

"use client";

import { useState } from "react";
import { useStakingSet } from "@/app/hooks/useStaking";
import { useAssetsGet } from "@/app/hooks/useAssets";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import { Asset, CollectionContract, StakeReward } from "@prisma/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import CollectionCard from "@/components/nfts/NFTs.CollectionCard";
import { useToast } from "@/app/hooks/useToast";

interface AdminStakingRewardCreateProps {
    onClose: () => void;
    mode?: "create" | "edit";
    reward?: StakeReward & {
        asset: Asset;
        collection: CollectionContract;
    };
}

interface DurationInput {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function Section({
    title,
    children,
    bgColor = "bg-muted/40",
}: {
    title: string;
    children: React.ReactNode;
    bgColor?: string;
}) {
    return (
        <div className={`mb-10 rounded-lg px-6 py-6 ${bgColor}`}>
            <div className="text-lg font-semibold mb-3 mt-2">{title}</div>
            {children}
        </div>
    );
}

function Divider() {
    return <div className="border-b border-muted-foreground/20 my-6" />;
}

export default function AdminStakingRewardCreate({
    onClose,
    mode = "create",
    reward,
}: AdminStakingRewardCreateProps) {
    const { createStakeReward, updateStakeReward, isLoading, error } =
        useStakingSet();
    const { assets, isLoading: isLoadingAssets } = useAssetsGet({
        getAssetsInput: { isActive: true },
    });
    const { everyCollections, isLoading: isLoadingCollections } = useFactoryGet(
        {}
    );

    console.log("everyCollections", everyCollections);
    const toast = useToast();

    const [formData, setFormData] = useState({
        assetId: reward?.assetId || "",
        amount: reward?.amount || 0,
        duration: reward
            ? {
                  years: Number(
                      reward.stakeDuration / BigInt(365 * 24 * 60 * 60 * 1000)
                  ),
                  months: Number(
                      (reward.stakeDuration %
                          BigInt(365 * 24 * 60 * 60 * 1000)) /
                          BigInt(30 * 24 * 60 * 60 * 1000)
                  ),
                  days: Number(
                      (reward.stakeDuration %
                          BigInt(30 * 24 * 60 * 60 * 1000)) /
                          BigInt(24 * 60 * 60 * 1000)
                  ),
                  hours: Number(
                      (reward.stakeDuration % BigInt(24 * 60 * 60 * 1000)) /
                          BigInt(60 * 60 * 1000)
                  ),
                  minutes: Number(
                      (reward.stakeDuration % BigInt(60 * 60 * 1000)) /
                          BigInt(60 * 1000)
                  ),
                  seconds: Number(
                      (reward.stakeDuration % BigInt(60 * 1000)) / BigInt(1000)
                  ),
              }
            : {
                  years: 0,
                  months: 0,
                  days: 0,
                  hours: 0,
                  minutes: 0,
                  seconds: 0,
              },
        collectionAddress: reward?.collectionAddress || "",
    });

    const convertDurationToMs = (duration: DurationInput): bigint => {
        const { years, months, days, hours, minutes, seconds } = duration;

        // 소수점을 제거하고 정수로 변환 (30.44 -> 3044)
        const daysInMonth = BigInt(3044); // 30.44 * 100
        const daysInYear = BigInt(36525); // 365.25 * 100

        // 100으로 나누어 원래 값으로 복원
        const totalDays =
            (BigInt(years) * daysInYear +
                BigInt(months) * daysInMonth +
                BigInt(days) * BigInt(100)) /
            BigInt(100);

        const totalMs =
            totalDays * BigInt(24 * 60 * 60 * 1000) +
            BigInt(hours) * BigInt(60 * 60 * 1000) +
            BigInt(minutes) * BigInt(60 * 1000) +
            BigInt(seconds) * BigInt(1000);

        return totalMs;
    };

    const handleDurationChange = (
        field: keyof DurationInput,
        value: string
    ) => {
        const numValue = value === "" ? 0 : Number(value);
        setFormData((prev) => ({
            ...prev,
            duration: {
                ...prev.duration,
                [field]: numValue,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (
                !formData.assetId ||
                !formData.amount ||
                !formData.collectionAddress
            ) {
                toast.error("모든 필드를 입력해주세요.");
                return;
            }

            const stakeDuration = convertDurationToMs(formData.duration);
            if (stakeDuration <= BigInt(0)) {
                toast.error("스테이킹 기간을 입력해주세요.");
                return;
            }

            if (mode === "create") {
                const result = await createStakeReward({
                    asset: assets?.assets?.find(
                        (a) => a.id === formData.assetId
                    ) as Asset,
                    amount: formData.amount,
                    stakeDuration: stakeDuration,
                    collectionAddress: formData.collectionAddress,
                });

                if (result) {
                    toast.success(
                        "스테이킹 리워드가 성공적으로 생성되었습니다."
                    );
                    onClose();
                }
            } else {
                const result = await updateStakeReward({
                    stakeRewardId: reward!.id,
                    assetId: formData.assetId,
                    amount: formData.amount,
                    stakeDuration: stakeDuration,
                    collectionAddress: formData.collectionAddress,
                });

                if (result) {
                    toast.success(
                        "스테이킹 리워드가 성공적으로 수정되었습니다."
                    );
                    onClose();
                }
            }
        } catch (error) {
            console.error(
                `Error ${
                    mode === "create" ? "creating" : "updating"
                } stake reward:`,
                error
            );
            toast.error(
                `스테이킹 리워드 ${
                    mode === "create" ? "생성" : "수정"
                } 중 오류가 발생했습니다.`
            );
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create"
                            ? "새로운 스테이킹 리워드 생성"
                            : "스테이킹 리워드 수정"}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label="닫기">
                            ✕
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 min-h-0 w-full flex justify-center items-start"
                >
                    <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                        <Section title="기본 정보">
                            <div className="grid grid-cols-2 gap-8">
                                {/* 보상 에셋 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        보상 에셋{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.assetId}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                assetId: value,
                                            }))
                                        }
                                        disabled={isLoadingAssets}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="보상 에셋을 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assets?.assets?.map((asset) => (
                                                <SelectItem
                                                    key={asset.id}
                                                    value={asset.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {asset.iconUrl && (
                                                            <img
                                                                src={
                                                                    asset.iconUrl
                                                                }
                                                                alt={asset.name}
                                                                width={24}
                                                                height={24}
                                                            />
                                                        )}
                                                        <span>
                                                            {asset.name}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            ({asset.symbol})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 보상 수량 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        보상 수량{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                amount: Number(e.target.value),
                                            }))
                                        }
                                        min={1}
                                        required
                                    />
                                </div>

                                {/* 스테이킹 기간 */}
                                <div className="mb-8 col-span-2">
                                    <Label className="mb-2 block">
                                        스테이킹 기간{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex flex-row gap-4">
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">
                                                년
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.duration.years}
                                                onChange={(e) =>
                                                    handleDurationChange(
                                                        "years",
                                                        e.target.value
                                                    )
                                                }
                                                min={0}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">
                                                개월
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.duration.months}
                                                onChange={(e) =>
                                                    handleDurationChange(
                                                        "months",
                                                        e.target.value
                                                    )
                                                }
                                                min={0}
                                                max={11}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">
                                                일
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.duration.days}
                                                onChange={(e) =>
                                                    handleDurationChange(
                                                        "days",
                                                        e.target.value
                                                    )
                                                }
                                                min={0}
                                                max={30}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">
                                                시간
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.duration.hours}
                                                onChange={(e) =>
                                                    handleDurationChange(
                                                        "hours",
                                                        e.target.value
                                                    )
                                                }
                                                min={0}
                                                max={23}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">
                                                분
                                            </Label>
                                            <Input
                                                type="number"
                                                value={
                                                    formData.duration.minutes
                                                }
                                                onChange={(e) =>
                                                    handleDurationChange(
                                                        "minutes",
                                                        e.target.value
                                                    )
                                                }
                                                min={0}
                                                max={59}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">
                                                초
                                            </Label>
                                            <Input
                                                type="number"
                                                value={
                                                    formData.duration.seconds
                                                }
                                                onChange={(e) =>
                                                    handleDurationChange(
                                                        "seconds",
                                                        e.target.value
                                                    )
                                                }
                                                min={0}
                                                max={59}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex justify-between">
                                        <div className="text-xs text-muted-foreground mt-2">
                                            * 최소 하나 이상의 시간 단위를
                                            입력해주세요.
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            계산된 스테이킹 기간:{" "}
                                            {convertDurationToMs(
                                                formData.duration
                                            ).toString()}
                                            ms
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Divider />

                        <Section title="연관 컬렉션">
                            <div className="mb-8">
                                <Label className="mb-2 block">
                                    컬렉션 선택{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="space-y-4">
                                    <Input
                                        value={formData.collectionAddress}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                collectionAddress:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="컬렉션 주소를 입력하거나 아래에서 선택하세요"
                                        className="mb-2"
                                    />
                                    <div className="flex gap-4 overflow-auto">
                                        {everyCollections?.map((collection) => (
                                            <div
                                                key={collection.address}
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        collectionAddress:
                                                            collection.address,
                                                    }))
                                                }
                                                className={`cursor-pointer w-[300px] h-[150px] ${
                                                    formData.collectionAddress ===
                                                    collection.address
                                                        ? "ring-2 ring-primary"
                                                        : ""
                                                }`}
                                            >
                                                <CollectionCard
                                                    collection={collection}
                                                    showPrice={false}
                                                    showSharePercentage={false}
                                                    showCirculation={false}
                                                    isLinked={false}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? mode === "create"
                                        ? "생성 중..."
                                        : "수정 중..."
                                    : mode === "create"
                                    ? "리워드 생성"
                                    : "리워드 수정"}
                            </Button>
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm">
                                {error.message}
                            </div>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
