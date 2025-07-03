/// components/admin/polls/Admin.Poll.Create.Settings.tsx

"use client";

import React from "react";
import { Target, Eye, Clock, Gift } from "lucide-react";
import { PollCategory } from "@prisma/client";
import Image from "next/image";

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
import DateTimePicker from "@/components/atoms/DateTimePicker";

import { Section } from "./shared-components";
import type { PollFormProps } from "./types";

export function SettingsTab({
    formData,
    onChange,
    artists,
    assets,
}: PollFormProps) {
    return (
        <div className="space-y-6">
            {/* 카테고리 & 아티스트 */}
            <Section
                title="카테고리 & 아티스트"
                icon={<Target className="w-5 h-5" />}
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <Label className="mb-3 block text-slate-200">
                            카테고리
                        </Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={
                                    formData.category === PollCategory.PUBLIC
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => {
                                    onChange("category", PollCategory.PUBLIC);
                                    onChange("needToken", false);
                                    onChange("needTokenAddress", undefined);
                                }}
                                className="flex-1"
                            >
                                PUBLIC
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    formData.category === PollCategory.PRIVATE
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    onChange("category", PollCategory.PRIVATE)
                                }
                                className="flex-1"
                            >
                                PRIVATE (토큰게이팅)
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label className="mb-3 block text-slate-200">
                            아티스트
                        </Label>
                        <div className="flex gap-2 overflow-x-auto">
                            <div
                                onClick={() => onChange("artistId", "")}
                                className={`cursor-pointer w-20 h-16 flex flex-col items-center justify-center border rounded ${
                                    !formData.artistId
                                        ? "border-purple-500 bg-purple-500/20"
                                        : "border-slate-600"
                                }`}
                            >
                                <span className="text-xs text-slate-400">
                                    없음
                                </span>
                            </div>
                            {artists?.map((artist: any) => (
                                <div
                                    key={artist.id}
                                    onClick={() =>
                                        onChange("artistId", artist.id)
                                    }
                                    className={`cursor-pointer w-20 h-16 flex flex-col items-center justify-center border rounded ${
                                        formData.artistId === artist.id
                                            ? "border-purple-500 bg-purple-500/20"
                                            : "border-slate-600"
                                    }`}
                                >
                                    {artist.logoUrl ? (
                                        <Image
                                            src={artist.logoUrl}
                                            alt={artist.name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-400">
                                            {artist.name.slice(0, 2)}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-300">
                                        {artist.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* 표시 설정 */}
            <Section title="표시 설정" icon={<Eye className="w-5 h-5" />}>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label className="mb-3 block text-slate-200">
                            폴 페이지 표시
                        </Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={
                                    formData.showOnPollPage
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => onChange("showOnPollPage", true)}
                                className="flex-1"
                            >
                                표시
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    !formData.showOnPollPage
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    onChange("showOnPollPage", false)
                                }
                                className="flex-1"
                            >
                                숨김
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label className="mb-3 block text-slate-200">
                            스타 페이지 표시
                        </Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={
                                    formData.showOnStarPage
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => onChange("showOnStarPage", true)}
                                className="flex-1"
                            >
                                표시
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    !formData.showOnStarPage
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    onChange("showOnStarPage", false)
                                }
                                className="flex-1"
                            >
                                숨김
                            </Button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 일정 및 참여 설정 */}
            <Section
                title="일정 및 참여 설정"
                icon={<Clock className="w-5 h-5" />}
            >
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <DateTimePicker
                            value={formData.startDate || new Date()}
                            onChange={(value) => onChange("startDate", value)}
                            label="시작일"
                            required
                            showTime={true}
                        />
                    </div>
                    <div>
                        <DateTimePicker
                            value={formData.endDate || new Date()}
                            onChange={(value) => {
                                onChange("endDate", value);
                                onChange("answerAnnouncementDate", value);
                            }}
                            label="종료일"
                            required
                            showTime={true}
                        />
                    </div>
                    <div>
                        <Label className="mb-3 block text-slate-200">
                            중복 투표 허용
                        </Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={
                                    formData.allowMultipleVote
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    onChange("allowMultipleVote", true)
                                }
                                className="flex-1"
                            >
                                허용
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    !formData.allowMultipleVote
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    onChange("allowMultipleVote", false)
                                }
                                className="flex-1"
                            >
                                불가
                            </Button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 참여 보상 및 소모 */}
            <Section
                title="참여 보상 및 소모"
                icon={<Gift className="w-5 h-5" />}
            >
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label className="mb-2 block text-slate-200">
                            보상 에셋
                        </Label>
                        <Select
                            value={formData.participationRewardAssetId || ""}
                            onValueChange={(value) => {
                                if (value === "none") {
                                    onChange(
                                        "participationRewardAssetId",
                                        undefined
                                    );
                                    onChange(
                                        "participationRewardAmount",
                                        undefined
                                    );
                                } else {
                                    onChange(
                                        "participationRewardAssetId",
                                        value
                                    );
                                }
                            }}
                        >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="보상 에셋을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">보상 없음</SelectItem>
                                {assets?.assets?.map((asset: any) => (
                                    <SelectItem key={asset.id} value={asset.id}>
                                        <div className="flex items-center gap-2">
                                            {asset.iconUrl && (
                                                <Image
                                                    src={asset.iconUrl}
                                                    alt={asset.name}
                                                    width={20}
                                                    height={20}
                                                />
                                            )}
                                            <span>
                                                {asset.name} ({asset.symbol})
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block text-slate-200">
                            보상 수량
                        </Label>
                        <Input
                            type="number"
                            value={
                                formData.participationRewardAmount?.toString() ||
                                ""
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                onChange(
                                    "participationRewardAmount",
                                    value === "" ? undefined : Number(value)
                                );
                            }}
                            placeholder="보상 수량"
                            disabled={!formData.participationRewardAssetId}
                            className="bg-slate-700/50 border-slate-600 text-white"
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block text-slate-200">
                            소모 에셋
                        </Label>
                        <Select
                            value={formData.participationConsumeAssetId || ""}
                            onValueChange={(value) => {
                                if (value === "none") {
                                    onChange(
                                        "participationConsumeAssetId",
                                        undefined
                                    );
                                    onChange(
                                        "participationConsumeAmount",
                                        undefined
                                    );
                                } else {
                                    onChange(
                                        "participationConsumeAssetId",
                                        value
                                    );
                                }
                            }}
                        >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="참여 시 소모할 에셋을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">소모 없음</SelectItem>
                                {assets?.assets?.map((asset: any) => (
                                    <SelectItem key={asset.id} value={asset.id}>
                                        <div className="flex items-center gap-2">
                                            {asset.iconUrl && (
                                                <Image
                                                    src={asset.iconUrl}
                                                    alt={asset.name}
                                                    width={20}
                                                    height={20}
                                                />
                                            )}
                                            <span>
                                                {asset.name} ({asset.symbol})
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block text-slate-200">
                            소모 수량
                        </Label>
                        <Input
                            type="number"
                            value={
                                formData.participationConsumeAmount?.toString() ||
                                ""
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                onChange(
                                    "participationConsumeAmount",
                                    value === "" ? undefined : Number(value)
                                );
                            }}
                            placeholder="소모 수량"
                            disabled={!formData.participationConsumeAssetId}
                            className="bg-slate-700/50 border-slate-600 text-white"
                        />
                    </div>
                </div>
            </Section>
        </div>
    );
}
