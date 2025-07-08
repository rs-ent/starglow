/// components/admin/quests/Admin.Quest.Create.General.tsx

"use client";

import React from "react";
import {
    Settings,
    Image as ImageIcon,
    Users,
    Gift,
    Target,
} from "lucide-react";

import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import CollectionCard from "@/components/nfts/NFTs.CollectionCard";
import PartialLoading from "@/components/atoms/PartialLoading";
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

export function GeneralQuestForm({
    formData,
    artists,
    assets,
    getSPGsData,
    getSPGIsLoading,
    isLoadingAssets,
    onChange,
    onSubmit,
    isValid,
    isCreating,
    createError,
    mode,
    registeredTypes,
    test,
}: QuestFormProps) {
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
                        <Label className="mb-2 block">
                            퀘스트 클릭 시 이동할 링크
                        </Label>
                        <Input
                            value={formData.url || ""}
                            onChange={(e) => onChange("url", e.target.value)}
                            placeholder="https://example.com"
                            type="url"
                            className="w-full border-2 border-primary/60"
                        />
                        {formData.url &&
                            !formData.url?.startsWith("https://") &&
                            formData.url?.length > 0 && (
                                <div className="text-xs text-red-500 mt-1">
                                    링크는 반드시 <b>https://</b>로 시작해야
                                    합니다.
                                </div>
                            )}
                        <div className="text-xs text-muted-foreground mt-1">
                            사용자가 퀘스트를 클릭하면 이 링크로 이동합니다.
                        </div>
                    </div>
                    <div className="mb-8">
                        <Label className="mb-2 block">설명</Label>
                        <Textarea
                            value={formData.description || ""}
                            onChange={(e) =>
                                onChange("description", e.target.value)
                            }
                            className="w-full"
                        />
                    </div>
                </Section>

                <Divider />

                <Section title="아티스트" icon={<Users className="w-5 h-5" />}>
                    <div className="mb-8">
                        <Label className="mb-2 block">아티스트</Label>
                        <div className="flex gap-4 overflow-x-auto py-2 w-full">
                            <div
                                onClick={() => onChange("artistId", "")}
                                className={`cursor-pointer w-[150px] h-[80px] flex flex-col items-center justify-center border rounded
                                            ${
                                                formData.artistId === ""
                                                    ? "ring-2 ring-primary"
                                                    : ""
                                            }`}
                            >
                                <span className="text-sm text-muted-foreground">
                                    선택 안함
                                </span>
                            </div>
                            {artists?.map((artist: any) => (
                                <div
                                    key={artist.id}
                                    onClick={() =>
                                        onChange("artistId", artist.id)
                                    }
                                    className={`p-4 cursor-pointer w-[150px] h-[80px] flex flex-col items-center justify-center border rounded
                                                ${
                                                    formData.artistId ===
                                                    artist.id
                                                        ? "ring-2 ring-primary"
                                                        : ""
                                                }`}
                                >
                                    {artist.logoUrl ? (
                                        <img
                                            src={artist.logoUrl}
                                            alt={artist.name}
                                            width={30}
                                            height={30}
                                            className="mb-1"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center mb-1">
                                            <span className="text-xs text-gray-400">
                                                No Image
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-sm">
                                        {artist.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                <Divider />

                <Section title="보상" icon={<Gift className="w-5 h-5" />}>
                    <div className="mb-8">
                        <Label className="mb-2 block">보상 에셋</Label>
                        <Select
                            value={formData.rewardAssetId || ""}
                            onValueChange={(value) => {
                                if (value === "none") {
                                    onChange("rewardAssetId", "");
                                    onChange("rewardAmount", null);
                                } else {
                                    onChange("rewardAssetId", value);
                                }
                            }}
                            disabled={isLoadingAssets}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="보상을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* 보상 없음 옵션 추가 */}
                                <SelectItem value="none">
                                    <div className="flex items-center gap-2">
                                        <span>보상 없음</span>
                                    </div>
                                </SelectItem>

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
                    title="참여 제한"
                    icon={<Target className="w-5 h-5" />}
                >
                    <div className="flex gap-2 mb-2">
                        <Button
                            type="button"
                            variant={
                                !formData.needToken ? "default" : "outline"
                            }
                            onClick={() => {
                                onChange("needToken", false);
                                onChange("needTokenAddress", undefined);
                            }}
                        >
                            Public (누구나 참여)
                        </Button>
                        <Button
                            type="button"
                            variant={formData.needToken ? "default" : "outline"}
                            onClick={() => onChange("needToken", true)}
                        >
                            Private (토큰게이팅)
                        </Button>
                    </div>
                    {formData.needToken && (
                        <div>
                            <Label>토큰게이팅 컬렉션</Label>
                            <div className="space-y-4">
                                <Input
                                    value={formData.needTokenAddress || ""}
                                    onChange={(e) =>
                                        onChange(
                                            "needTokenAddress",
                                            e.target.value
                                        )
                                    }
                                    placeholder="토큰 컨트랙트 주소를 입력하세요"
                                    className="mb-2"
                                />
                                {/* 컬렉션 선택 UI */}
                                <div className="flex gap-4 overflow-auto">
                                    {getSPGIsLoading ? (
                                        <PartialLoading text="Loading SPGs..." />
                                    ) : (
                                        getSPGsData?.map((spg) => (
                                            <div
                                                key={spg.address}
                                                onClick={() =>
                                                    onChange(
                                                        "needTokenAddress",
                                                        spg.address
                                                    )
                                                }
                                                className={`cursor-pointer w-[300px] h-[150px] ${
                                                    formData.needTokenAddress ===
                                                    spg.address
                                                        ? "ring-2 ring-primary"
                                                        : ""
                                                }`}
                                            >
                                                <CollectionCard
                                                    spg={spg}
                                                    showPrice={false}
                                                    showSharePercentage={false}
                                                    showCirculation={false}
                                                    isLinked={false}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
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
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                                {registeredTypes.length > 0 ? (
                                    registeredTypes
                                        .filter((type) => type !== "")
                                        .map((type) => (
                                            <Button
                                                key={type}
                                                type="button"
                                                variant={
                                                    formData.type === type
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    onChange("type", type)
                                                }
                                                className="flex-1 min-w-[100px]"
                                            >
                                                {type}
                                            </Button>
                                        ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        등록된 타입이 없습니다
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.type || ""}
                                    onChange={(e) =>
                                        onChange("type", e.target.value)
                                    }
                                    placeholder="새로운 타입 입력"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onChange("type", null)}
                                    className="whitespace-nowrap"
                                >
                                    초기화
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            기존 타입을 선택하거나 새로운 타입을 입력할 수
                            있습니다.
                        </div>
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
                                    !formData.repeatable &&
                                    !formData.multiClaimable
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => {
                                    onChange("repeatable", false);
                                    onChange("multiClaimable", false);
                                }}
                            >
                                1회성 퀘스트
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    formData.repeatable &&
                                    !formData.multiClaimable
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => {
                                    onChange("repeatable", true);
                                    onChange("multiClaimable", false);
                                }}
                            >
                                누적 퀘스트
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                variant={
                                    !formData.repeatable &&
                                    formData.multiClaimable
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => {
                                    onChange("repeatable", false);
                                    onChange("multiClaimable", true);
                                }}
                            >
                                반복 퀘스트
                            </Button>
                        </div>
                    </div>

                    {formData.repeatable && (
                        <div className="w-full mb-8 flex flex-col gap-4">
                            <div>
                                <Label className="mb-2 block">
                                    누적 수행 횟수
                                </Label>
                                <Input
                                    type="number"
                                    value={formData.repeatableCount ?? ""}
                                    onChange={(e) =>
                                        onChange(
                                            "repeatableCount",
                                            Number(e.target.value)
                                        )
                                    }
                                    min={2}
                                    placeholder="횟수"
                                    className="w-40"
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    누적 횟수만큼 퀘스트 수행 시 퀘스트가
                                    완료됩니다.
                                </div>
                            </div>
                            <div>
                                <Label className="mb-2 block">반복 간격</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalDays}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalDays",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>일</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalHours}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalHours",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>시간</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalMinutes}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalMinutes",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>분</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalSeconds}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalSeconds",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>초</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    반복 간격을 입력하세요 (예: 1일 2시간 30분
                                    10초)
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.multiClaimable && (
                        <div className="w-full mb-8 flex flex-col gap-4">
                            <div>
                                <Label className="mb-2 block">
                                    최대 클레임 횟수
                                </Label>
                                <Input
                                    type="number"
                                    value={formData.multiClaimLimit ?? ""}
                                    onChange={(e) =>
                                        onChange(
                                            "multiClaimLimit",
                                            Number(e.target.value)
                                        )
                                    }
                                    min={0}
                                    placeholder="횟수"
                                    className="w-40"
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    최대 반복 횟수입니다. 0은 무제한입니다.
                                </div>
                            </div>
                            <div>
                                <Label className="mb-2 block">반복 간격</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalDays}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalDays",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>일</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalHours}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalHours",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>시간</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalMinutes}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalMinutes",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>분</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.intervalSeconds}
                                        onChange={(e) =>
                                            onChange(
                                                "intervalSeconds",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-20"
                                        placeholder="0"
                                    />
                                    <span>초</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    반복 간격을 입력하세요 (예: 1일 2시간 30분
                                    10초)
                                </div>
                            </div>
                            <div>
                                <Label className="mb-2 block">회차별 URL</Label>
                                <div className="flex flex-col gap-2">
                                    {Array.from({
                                        length: formData.multiClaimLimit || 1,
                                    }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="flex gap-2 items-center w-full"
                                        >
                                            <span className="flex-shrink-0 text-sm">
                                                {idx + 1}회차 URL:{" "}
                                            </span>
                                            <Input
                                                key={idx}
                                                value={
                                                    formData.urls?.[idx] ||
                                                    formData.url ||
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const newUrls = [
                                                        ...(formData.urls ||
                                                            []),
                                                    ];
                                                    newUrls[idx] =
                                                        e.target.value || "";
                                                    onChange("urls", newUrls);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
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
