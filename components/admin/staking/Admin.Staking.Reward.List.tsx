/// components/admin/staking/Admin.Staking.Reward.List.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useStakingGet } from "@/app/hooks/useStaking";
import AdminStakingRewardCreate from "./Admin.Staking.Reward.Create";
import { StakeReward, Asset, CollectionContract } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

export default function AdminStakingRewardList() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [filteredRewards, setFilteredRewards] = useState<
        (StakeReward & {
            asset: Asset;
            collection: CollectionContract;
        })[]
    >([]);
    const [rewardFilter, setRewardFilter] = useState({
        collectionAddress: "",
    });
    const [editingReward, setEditingReward] = useState<
        | (StakeReward & {
              asset: Asset;
              collection: CollectionContract;
          })
        | null
    >(null);

    const { stakeRewards, isStakeRewardsLoading, stakeRewardsError } =
        useStakingGet({
            getStakeRewardInput: {},
        });

    // 중복 제거된 컬렉션 목록 생성
    const uniqueCollections = useMemo(() => {
        if (!stakeRewards) return [];

        // Set을 사용하여 중복 제거
        const uniqueAddresses = new Set(
            stakeRewards.map((reward) => reward.collectionAddress)
        );

        // 중복 제거된 주소를 사용하여 컬렉션 정보 가져오기
        return Array.from(uniqueAddresses).map((address) => {
            const reward = stakeRewards.find(
                (r) => r.collectionAddress === address
            );
            return {
                address,
                name: reward?.collection?.name || "",
            };
        });
    }, [stakeRewards]);

    // 필터링 함수
    const filteringRewards = () => {
        if (!stakeRewards) return;

        const filtered = stakeRewards.filter((reward) => {
            if (!rewardFilter.collectionAddress) return true;
            return reward.collectionAddress === rewardFilter.collectionAddress;
        });

        setFilteredRewards(filtered);
    };

    // 필터 변경 시 리스트 업데이트
    useEffect(() => {
        filteringRewards();
    }, [rewardFilter, stakeRewards]);

    const formatDuration = (ms: bigint) => {
        const seconds = ms / BigInt(1000);
        const minutes = seconds / BigInt(60);
        const hours = minutes / BigInt(60);
        const days = hours / BigInt(24);

        // 소수점을 제거하고 정수로 변환
        const months = (days * BigInt(100)) / BigInt(3044); // 30.44 * 100
        const years = months / BigInt(12);

        const remainingMonths = months % BigInt(12);
        const remainingDays =
            ((days * BigInt(100)) % BigInt(3044)) / BigInt(100);
        const remainingHours = hours % BigInt(24);
        const remainingMinutes = minutes % BigInt(60);
        const remainingSeconds = seconds % BigInt(60);

        const parts = [];
        if (years > BigInt(0)) parts.push(`${years}년`);
        if (remainingMonths > BigInt(0)) parts.push(`${remainingMonths}개월`);
        if (remainingDays > BigInt(0)) parts.push(`${remainingDays}일`);
        if (remainingHours > BigInt(0)) parts.push(`${remainingHours}시간`);
        if (remainingMinutes > BigInt(0)) parts.push(`${remainingMinutes}분`);
        if (remainingSeconds > BigInt(0)) parts.push(`${remainingSeconds}초`);

        return parts.join(" ") || "0초";
    };

    if (isStakeRewardsLoading) {
        return <div>Loading...</div>;
    }

    if (stakeRewardsError) {
        return <div>Error: {stakeRewardsError.message}</div>;
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">스테이킹 리워드 목록</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    새로운 리워드 생성
                </button>
            </div>

            {/* 컬렉션 필터 */}
            <div className="flex gap-2 mb-4">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[300px] justify-between"
                        >
                            {rewardFilter.collectionAddress
                                ? uniqueCollections.find(
                                      (collection) =>
                                          collection.address ===
                                          rewardFilter.collectionAddress
                                  )?.name
                                : "컬렉션 선택..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="컬렉션 검색..." />
                            <CommandEmpty>
                                컬렉션을 찾을 수 없습니다.
                            </CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="all"
                                    onSelect={() => {
                                        setRewardFilter({
                                            collectionAddress: "",
                                        });
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !rewardFilter.collectionAddress
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    전체 컬렉션
                                </CommandItem>
                                {uniqueCollections.map((collection) => (
                                    <CommandItem
                                        key={collection.address}
                                        value={collection.name}
                                        onSelect={() => {
                                            setRewardFilter({
                                                collectionAddress:
                                                    collection.address,
                                            });
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                rewardFilter.collectionAddress ===
                                                    collection.address
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {collection.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* 리워드 목록 테이블 */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.3)]">
                    <thead>
                        <tr className="bg-[rgba(255,255,255,0.1)] divide-x divide-[rgba(255,255,255,0.1)] border-b border-[rgba(255,255,255,0.3)]">
                            <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                                에셋
                            </th>
                            <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                                수량
                            </th>
                            <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                                기간
                            </th>
                            <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                                연관 컬렉션
                            </th>
                            <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                                작업
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                        {filteredRewards?.map(
                            (
                                reward: StakeReward & {
                                    asset: Asset;
                                    collection: CollectionContract;
                                },
                                index: number
                            ) => (
                                <tr
                                    key={reward.id}
                                    className={`text-xs divide-x divide-[rgba(255,255,255,0.1)] ${
                                        index % 2 === 1
                                            ? "bg-[rgba(255,255,255,0.03)]"
                                            : "bg-[rgba(255,255,255,0.01)]"
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                        {reward.asset.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                        {reward.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                        <div className="flex flex-col">
                                            <span>
                                                {formatDuration(
                                                    reward.stakeDuration
                                                )}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                (
                                                {reward.stakeDuration.toLocaleString()}
                                                ms)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                        <div className="flex flex-col">
                                            <span>
                                                {reward.collection.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ({reward.collection.address})
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-row gap-2 justify-center items-center">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setEditingReward(reward)
                                                }
                                            >
                                                수정
                                            </Button>
                                            <Button variant="outline">
                                                삭제
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {(isCreateModalOpen || editingReward) && (
                <AdminStakingRewardCreate
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingReward(null);
                    }}
                    mode={editingReward ? "edit" : "create"}
                    reward={editingReward || undefined}
                />
            )}
        </div>
    );
}
