/// components/admin/quests/Admin.Quest.Create.Referral.tsx

"use client";

import React, { useEffect } from "react";
import { Settings, Image as ImageIcon, Gift, Target } from "lucide-react";

import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getYoutubeVideoId } from "@/lib/utils/youtube";

import { Section, Divider } from "./shared-components";
import { QUEST_ICON_PRESETS, type QuestFormProps } from "./types";
import { Switch } from "@/components/ui/switch";

export function ReferralQuestForm({
    formData,
    assets,
    isLoadingAssets,
    onChange,
    onSubmit,
    isValid,
    isCreating,
    createError,
    mode,
    test,
}: QuestFormProps) {
    useEffect(() => {
        onChange("isReferral", true);
    }, [onChange]);

    return (
        <form
            onSubmit={onSubmit}
            className="flex-1 min-h-0 w-full flex flex-col items-center"
        >
            <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                <Section
                    title="기본 정보"
                    icon={<Settings className="w-5 h-5" />}
                >
                    <div className="flex gap-2">
                        <Label className="mb-2 block text-slate-200">
                            테스트 모드 활성화
                        </Label>
                        <Switch
                            checked={test ?? false}
                            onCheckedChange={(checked) =>
                                onChange("test", checked)
                            }
                        />
                    </div>
                    <div className="mb-8">
                        <Label className="mb-2 block">퀘스트 제목</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => onChange("title", e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>
                    <div className="mb-8">
                        <Label className="mb-2 block">설명</Label>
                        <Textarea
                            value={formData.description || ""}
                            onChange={(e) =>
                                onChange("description", e.target.value)
                            }
                            className="w-full"
                            placeholder="초대 퀘스트에 대한 설명을 입력하세요"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                            친구를 초대하고 보상을 받는 퀘스트입니다. 초대
                            횟수를 설정하여 보상을 지급할 수 있습니다.
                        </div>
                    </div>
                </Section>

                <Divider />

                <Section title="보상" icon={<Gift className="w-5 h-5" />}>
                    <div className="mb-8">
                        <Label className="mb-2 block">보상</Label>
                        <Select
                            value={formData.rewardAssetId || ""}
                            onValueChange={(value) =>
                                onChange("rewardAssetId", value)
                            }
                            disabled={isLoadingAssets}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="보상을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {assets?.assets?.map((asset) => (
                                    <SelectItem key={asset.id} value={asset.id}>
                                        <div className="flex items-center gap-2">
                                            {asset.iconUrl && (
                                                <img
                                                    src={asset.iconUrl}
                                                    alt={asset.name}
                                                    width={24}
                                                    height={24}
                                                />
                                            )}
                                            <span>{asset.name}</span>
                                            <span className="text-muted-foreground">
                                                ({asset.symbol})
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mb-8">
                        <Label className="mb-2 block">보상 수량</Label>
                        <Input
                            type="number"
                            value={formData.rewardAmount || ""}
                            onChange={(e) =>
                                onChange("rewardAmount", Number(e.target.value))
                            }
                            min={1}
                            required
                        />
                    </div>
                </Section>

                <Divider />

                <Section
                    title="보상 기준"
                    icon={<Target className="w-5 h-5" />}
                >
                    <div className="mb-8">
                        <Label className="mb-2 block">
                            보상을 위한 친구 초대 횟수
                        </Label>
                        <Input
                            type="number"
                            value={formData.referralCount || ""}
                            onChange={(e) =>
                                onChange(
                                    "referralCount",
                                    Number(e.target.value)
                                )
                            }
                            min={1}
                            required
                        />
                    </div>
                </Section>

                <Divider />

                <Section
                    title="이미지/미디어"
                    icon={<ImageIcon className="w-5 h-5" />}
                >
                    <div className="mt-8 space-y-4">
                        <Label>아이콘 이미지</Label>
                        {/* 프리셋 아이콘 리스트 */}
                        <div className="flex flex-wrap gap-3 mb-4">
                            {QUEST_ICON_PRESETS.map((preset) => (
                                <img
                                    key={preset}
                                    src={preset}
                                    alt="프리셋 아이콘"
                                    width={40}
                                    height={40}
                                    className={`rounded cursor-pointer border-2 ${
                                        formData.icon === preset
                                            ? "border-primary"
                                            : "border-transparent"
                                    }`}
                                    onClick={() => onChange("icon", preset)}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {formData.icon && (
                                <img
                                    src={formData.icon}
                                    alt="아이콘"
                                    width={48}
                                    height={48}
                                />
                            )}
                            <div className="flex flex-col gap-2">
                                <Input
                                    value={formData.icon || ""}
                                    onChange={(e) =>
                                        onChange("icon", e.target.value)
                                    }
                                    placeholder="아이콘 이미지 URL을 입력하거나 아래에서 업로드"
                                />
                                <FileUploader
                                    purpose="quest-icon"
                                    bucket="images"
                                    onComplete={(files) => {
                                        if (files && files.length > 0)
                                            onChange("icon", files[0].url);
                                    }}
                                    accept={{
                                        "image/*": [
                                            ".png",
                                            ".jpg",
                                            ".jpeg",
                                            ".gif",
                                            ".webp",
                                        ],
                                    }}
                                    maxSize={5 * 1024 * 1024}
                                    multiple={false}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 space-y-4">
                        <Label>대표 이미지</Label>
                        <div className="flex gap-2">
                            {formData.imgUrl && (
                                <img
                                    src={formData.imgUrl}
                                    alt="대표 이미지"
                                    width={170}
                                    height={170}
                                    className="rounded"
                                />
                            )}
                            <div className="flex flex-col gap-2">
                                <Input
                                    value={formData.imgUrl || ""}
                                    onChange={(e) =>
                                        onChange("imgUrl", e.target.value)
                                    }
                                    placeholder="대표 이미지 URL을 입력하거나 아래에서 업로드"
                                />
                                <FileUploader
                                    purpose="quest-img"
                                    bucket="images"
                                    onComplete={(files) => {
                                        if (files && files.length > 0)
                                            onChange("imgUrl", files[0].url);
                                    }}
                                    accept={{
                                        "image/*": [
                                            ".png",
                                            ".jpg",
                                            ".jpeg",
                                            ".gif",
                                            ".webp",
                                        ],
                                    }}
                                    maxSize={5 * 1024 * 1024}
                                    multiple={false}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 space-y-4">
                        <Label>유튜브 영상 URL</Label>
                        <div className="flex flex-col gap-2">
                            <Input
                                value={formData.youtubeUrl || ""}
                                onChange={(e) =>
                                    onChange("youtubeUrl", e.target.value)
                                }
                                placeholder="유튜브 영상 URL을 입력하세요"
                            />
                            {formData.youtubeUrl && (
                                <div className="mt-2 w-[350px]">
                                    <YoutubeViewer
                                        videoId={
                                            getYoutubeVideoId(
                                                formData.youtubeUrl
                                            ) || undefined
                                        }
                                        autoPlay={false}
                                        framePadding={0}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                <Divider />

                <Section title="기타 설정" bgColor="bg-muted/30">
                    {/* 상시 퀘스트 여부 */}
                    <div className="w-full mb-8">
                        <Label className="mb-2 block">상시 퀘스트 여부</Label>
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    formData.permanent ? "default" : "outline"
                                }
                                onClick={() => onChange("permanent", true)}
                            >
                                상시 퀘스트
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    !formData.permanent ? "default" : "outline"
                                }
                                onClick={() => onChange("permanent", false)}
                            >
                                기간 한정
                            </Button>
                        </div>
                    </div>

                    {/* 기간 한정일 때만 날짜 입력란 노출 */}
                    {!formData.permanent && (
                        <div className="w-full mb-8">
                            <Label className="mb-2 block">
                                퀘스트 시작/종료일
                            </Label>
                            <div className="flex gap-4 w-full">
                                <DateTimePicker
                                    value={formData.startDate || new Date()}
                                    onChange={(value) =>
                                        onChange("startDate", value)
                                    }
                                    label="시작일"
                                    required={false}
                                    showTime={true}
                                    className="flex-1"
                                />
                                <DateTimePicker
                                    value={formData.endDate || new Date()}
                                    onChange={(value) =>
                                        onChange("endDate", value)
                                    }
                                    label="종료일"
                                    required={false}
                                    showTime={true}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* 활성화 상태 */}
                    <div className="w-full mb-8">
                        <Label className="mb-2 block">활성화 상태</Label>
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    formData.isActive ? "default" : "outline"
                                }
                                onClick={() => onChange("isActive", true)}
                            >
                                활성화
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    !formData.isActive ? "default" : "outline"
                                }
                                onClick={() => onChange("isActive", false)}
                            >
                                비활성화
                            </Button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <Label className="mb-2 block">타입/카테고리</Label>
                        <Input
                            value={formData.type || ""}
                            onChange={(e) => onChange("type", e.target.value)}
                            placeholder="타입별로 폴더링됨"
                        />
                    </div>

                    <div className="mb-8">
                        <Label className="mb-2 block">효과/특이사항</Label>
                        <Textarea
                            value={formData.effects || ""}
                            onChange={(e) =>
                                onChange("effects", e.target.value)
                            }
                            placeholder="효과, 특이사항 등"
                        />
                    </div>

                    <div className="w-full mb-8">
                        <Label className="mb-2 block">반복 퀘스트 여부</Label>
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    !formData.repeatable ? "default" : "outline"
                                }
                                onClick={() => onChange("repeatable", false)}
                            >
                                1회성 퀘스트
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    formData.repeatable ? "default" : "outline"
                                }
                                onClick={() => onChange("repeatable", true)}
                            >
                                반복 퀘스트
                            </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            1회성 퀘스트는 초대 횟수를 채우면 완료되며 클레임 후
                            다시 보상을 받을 수 없습니다.
                            <br />
                            반복 퀘스트는 초대 횟수를 채울 때마다 보상을 받을 수
                            있습니다.
                        </span>
                    </div>
                </Section>

                <Divider />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={!isValid || isCreating}>
                        {isCreating
                            ? mode === "create"
                                ? "생성 중..."
                                : "수정 중..."
                            : mode === "create"
                            ? "퀘스트 생성"
                            : "퀘스트 수정"}
                    </Button>
                </div>
                {createError && (
                    <div className="text-red-500 text-sm">
                        {createError.message}
                    </div>
                )}
            </div>
        </form>
    );
}
