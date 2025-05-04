/// components/admin/quests/Admin.Quest.Create.tsx

"use client";

import { useQuestSet } from "@/app/hooks/useQuest";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAssetsGet } from "@/app/hooks/useAssets";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import CollectionCard from "@/components/molecules/NFTs.CollectionCard";
import { Quest } from "@prisma/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { getYoutubeVideoId } from "@/lib/utils/youtube";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import DateTimePicker from "@/components/atoms/DateTimePicker";

const QUEST_ICON_PRESETS = [
    "/icons/quests/gitbook.svg",
    "/icons/quests/instagram.svg",
    "/icons/quests/link.svg",
    "/icons/quests/spotify.svg",
    "/icons/quests/telegram.svg",
    "/icons/quests/social.svg",
    "/icons/quests/x.svg",
    "/icons/quests/youtube.svg",
    "/icons/quests/starglow.svg",
];

interface AdminQuestCreateProps {
    mode: "create" | "edit";
    open: boolean;
    initialData?: Quest | null;
    onClose: () => void;
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

export default function AdminQuestCreate({
    mode,
    open,
    initialData,
    onClose,
}: AdminQuestCreateProps) {
    const { artists } = useArtistsGet({});
    const { createQuest, isCreating, createError } = useQuestSet();
    const { assets, isLoading: isLoadingAssets } = useAssetsGet({
        getAssetsInput: { isActive: true },
    });
    const { everyCollections, isLoading: isLoadingCollections } = useFactoryGet(
        {}
    );
    const toast = useToast();

    // 폼 상태
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [artistId, setArtistId] = useState("");
    const [rewardAssetId, setRewardAssetId] = useState("");
    const [rewardAmount, setRewardAmount] = useState<number>(0);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [repeatable, setRepeatable] = useState(false);
    const [repeatableCount, setRepeatableCount] = useState<
        number | undefined
    >();
    const [intervalDays, setIntervalDays] = useState<number>(0);
    const [intervalHours, setIntervalHours] = useState<number>(0);
    const [intervalMinutes, setIntervalMinutes] = useState<number>(0);
    const [intervalSeconds, setIntervalSeconds] = useState<number>(0);
    const [needToken, setNeedToken] = useState(false);
    const [needTokenAddress, setNeedTokenAddress] = useState("");
    const [icon, setIcon] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [permanent, setPermanent] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [order, setOrder] = useState<number>(0);
    const [effects, setEffects] = useState("");
    const [type, setType] = useState("");
    const [url, setUrl] = useState("");

    const isValid =
        title.trim().length > 0 &&
        rewardAssetId &&
        rewardAmount > 0 &&
        url.startsWith("https://");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        const repeatableIntervalMs = repeatable
            ? getIntervalMsFromFields(
                  intervalDays,
                  intervalHours,
                  intervalMinutes,
                  intervalSeconds
              )
            : undefined;
        const createQuestResult = await createQuest({
            title,
            description,
            artistId: artistId || undefined,
            rewardAssetId,
            rewardAmount,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
            repeatable,
            repeatableCount,
            repeatableInterval: repeatableIntervalMs,
            needToken,
            needTokenAddress: needToken ? needTokenAddress : undefined,
            icon,
            imgUrl,
            youtubeUrl,
            permanent,
            isActive,
            order,
            effects,
            type,
            url,
        });
        if (createQuestResult) {
            toast.success(
                `퀘스트가 성공적으로 ${
                    mode === "create" ? "생성" : "수정"
                }되었습니다.\n(${createQuestResult.title})`
            );
            onClose();
        }
    };

    useEffect(() => {
        if (open && initialData) {
            setTitle(initialData.title ?? "");
            setDescription(initialData.description ?? "");
            setArtistId(initialData.artistId ?? "");
            setRewardAssetId(initialData.rewardAssetId ?? "");
            setRewardAmount(initialData.rewardAmount ?? 0);
            setStartDate(
                initialData.startDate ? new Date(initialData.startDate) : null
            );
            setEndDate(
                initialData.endDate ? new Date(initialData.endDate) : null
            );
            setRepeatable(initialData.repeatable ?? false);
            setRepeatableCount(initialData.repeatableCount ?? undefined);
            setIntervalDays(
                initialData.repeatableInterval
                    ? Math.floor(
                          initialData.repeatableInterval / (24 * 60 * 60 * 1000)
                      )
                    : 0
            );
            setIntervalHours(
                initialData.repeatableInterval
                    ? Math.floor(
                          (initialData.repeatableInterval %
                              (24 * 60 * 60 * 1000)) /
                              (60 * 60 * 1000)
                      )
                    : 0
            );
            setIntervalMinutes(
                initialData.repeatableInterval
                    ? Math.floor(
                          (initialData.repeatableInterval % (60 * 60 * 1000)) /
                              (60 * 1000)
                      )
                    : 0
            );
            setIntervalSeconds(
                initialData.repeatableInterval
                    ? Math.floor(
                          (initialData.repeatableInterval % (60 * 1000)) / 1000
                      )
                    : 0
            );
            setNeedToken(initialData.needToken ?? false);
            setNeedTokenAddress(initialData.needTokenAddress ?? "");
            setIcon(initialData.icon ?? "");
            setImgUrl(initialData.imgUrl ?? "");
            setYoutubeUrl(initialData.youtubeUrl ?? "");
            setPermanent(initialData.permanent ?? false);
            setIsActive(initialData.isActive ?? true);
            setOrder(initialData.order ?? 0);
            setEffects(initialData.effects ?? "");
            setType(initialData.type ?? "");
            setUrl(initialData.url ?? "");
        }
        // 폼이 닫힐 때 초기화도 고려 가능
    }, [open, initialData]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create"
                            ? "신규 퀘스트 생성기"
                            : `${initialData?.id} 수정하기`}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label="닫기">
                            ✕
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 min-h-0 w-full flex flex-col items-center"
                >
                    <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                        <Section title="기본 정보" bgColor="bg-muted/40">
                            <div className="mb-8">
                                <Label className="mb-2 block">
                                    퀘스트 제목
                                </Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div className="mb-8">
                                <Label className="mb-2 block">
                                    퀘스트 클릭 시 이동할 링크 (필수)
                                    <span className="text-red-500 ml-1">*</span>
                                </Label>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    type="url"
                                    required
                                    className="w-full border-2 border-primary/60"
                                />
                                {!url.startsWith("https://") &&
                                    url.length > 0 && (
                                        <div className="text-xs text-red-500 mt-1">
                                            링크는 반드시 <b>https://</b>로
                                            시작해야 합니다.
                                        </div>
                                    )}
                                <div className="text-xs text-muted-foreground mt-1">
                                    사용자가 퀘스트를 클릭하면 이 링크로
                                    이동합니다.
                                </div>
                            </div>
                            <div className="mb-8">
                                <Label className="mb-2 block">설명</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    className="w-full"
                                />
                            </div>
                        </Section>
                        <Divider />
                        <Section title="아티스트" bgColor="bg-muted/30">
                            <div className="mb-8">
                                <Label className="mb-2 block">아티스트</Label>
                                <div className="flex gap-4 overflow-x-auto py-2 w-full">
                                    <div
                                        onClick={() => setArtistId("")}
                                        className={`cursor-pointer w-[150px] h-[80px] flex flex-col items-center justify-center border rounded
                                            ${
                                                artistId === ""
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
                                                setArtistId(artist.id)
                                            }
                                            className={`p-4 cursor-pointer w-[150px] h-[80px] flex flex-col items-center justify-center border rounded
                                                ${
                                                    artistId === artist.id
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
                        <Section title="보상" bgColor="bg-muted/40">
                            <div className="mb-8">
                                <Label className="mb-2 block">보상 자산</Label>
                                <Select
                                    value={rewardAssetId}
                                    onValueChange={setRewardAssetId}
                                    disabled={isLoadingAssets}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="보상 자산을 선택하세요" />
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
                                    value={rewardAmount}
                                    onChange={(e) =>
                                        setRewardAmount(Number(e.target.value))
                                    }
                                    min={1}
                                    required
                                />
                            </div>
                        </Section>
                        <Divider />
                        <Section title="참여 제한" bgColor="bg-muted/30">
                            <div className="flex gap-2 mb-2">
                                <Button
                                    type="button"
                                    variant={!needToken ? "default" : "outline"}
                                    onClick={() => {
                                        setNeedToken(false);
                                        setNeedTokenAddress("");
                                    }}
                                >
                                    Public (누구나 참여)
                                </Button>
                                <Button
                                    type="button"
                                    variant={needToken ? "default" : "outline"}
                                    onClick={() => setNeedToken(true)}
                                >
                                    Private (토큰게이팅)
                                </Button>
                            </div>
                            {needToken && (
                                <div>
                                    <Label>토큰게이팅 컬렉션</Label>
                                    <div className="space-y-4">
                                        <Input
                                            value={needTokenAddress}
                                            onChange={(e) =>
                                                setNeedTokenAddress(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="토큰 컨트랙트 주소를 입력하세요"
                                            className="mb-2"
                                        />
                                        <div className="flex gap-4 overflow-auto">
                                            {everyCollections?.map(
                                                (collection: any) => (
                                                    <div
                                                        key={collection.address}
                                                        onClick={() =>
                                                            setNeedTokenAddress(
                                                                collection.address
                                                            )
                                                        }
                                                        className={`cursor-pointer w-[300px] h-[150px] ${
                                                            needTokenAddress ===
                                                            collection.address
                                                                ? "ring-2 ring-primary"
                                                                : ""
                                                        }`}
                                                    >
                                                        <CollectionCard
                                                            collection={
                                                                collection
                                                            }
                                                            isLinked={false}
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Section>
                        <Divider />
                        <Section title="이미지/미디어" bgColor="bg-muted/40">
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
                                                icon === preset
                                                    ? "border-primary"
                                                    : "border-transparent"
                                            }`}
                                            onClick={() => setIcon(preset)}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    {icon && (
                                        <img
                                            src={icon}
                                            alt="아이콘"
                                            width={48}
                                            height={48}
                                        />
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            value={icon}
                                            onChange={(e) =>
                                                setIcon(e.target.value)
                                            }
                                            placeholder="아이콘 이미지 URL을 입력하거나 아래에서 업로드"
                                        />
                                        <FileUploader
                                            purpose="quest-icon"
                                            bucket="images"
                                            onComplete={(files) => {
                                                if (files && files.length > 0)
                                                    setIcon(files[0].url);
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
                                    {imgUrl && (
                                        <img
                                            src={imgUrl}
                                            alt="대표 이미지"
                                            width={170}
                                            height={170}
                                            className="rounded"
                                        />
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            value={imgUrl}
                                            onChange={(e) =>
                                                setImgUrl(e.target.value)
                                            }
                                            placeholder="대표 이미지 URL을 입력하거나 아래에서 업로드"
                                        />
                                        <FileUploader
                                            purpose="quest-img"
                                            bucket="images"
                                            onComplete={(files) => {
                                                if (files && files.length > 0)
                                                    setImgUrl(files[0].url);
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
                                        value={youtubeUrl}
                                        onChange={(e) =>
                                            setYoutubeUrl(e.target.value)
                                        }
                                        placeholder="유튜브 영상 URL을 입력하세요"
                                    />
                                    {youtubeUrl && (
                                        <div className="mt-2 w-[350px]">
                                            <YoutubeViewer
                                                videoId={
                                                    getYoutubeVideoId(
                                                        youtubeUrl
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
                                <Label className="mb-2 block">
                                    상시 퀘스트 여부
                                </Label>
                                <div className="flex gap-2 w-full">
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        variant={
                                            permanent ? "default" : "outline"
                                        }
                                        onClick={() => setPermanent(true)}
                                    >
                                        상시 퀘스트
                                    </Button>
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        variant={
                                            !permanent ? "default" : "outline"
                                        }
                                        onClick={() => setPermanent(false)}
                                    >
                                        기간 한정
                                    </Button>
                                </div>
                            </div>

                            {/* 기간 한정일 때만 날짜 입력란 노출 */}
                            {!permanent && (
                                <div className="w-full mb-8">
                                    <Label className="mb-2 block">
                                        퀘스트 시작/종료일
                                    </Label>
                                    <div className="flex gap-4 w-full">
                                        <DateTimePicker
                                            value={startDate || new Date()}
                                            onChange={setStartDate}
                                            label="시작일"
                                            required={false}
                                            showTime={true}
                                            className="flex-1"
                                        />
                                        <DateTimePicker
                                            value={endDate || new Date()}
                                            onChange={setEndDate}
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
                                <Label className="mb-2 block">
                                    활성화 상태
                                </Label>
                                <div className="flex gap-2 w-full">
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        variant={
                                            isActive ? "default" : "outline"
                                        }
                                        onClick={() => setIsActive(true)}
                                    >
                                        활성화
                                    </Button>
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        variant={
                                            !isActive ? "default" : "outline"
                                        }
                                        onClick={() => setIsActive(false)}
                                    >
                                        비활성화
                                    </Button>
                                </div>
                            </div>

                            <div className="mb-8">
                                <Label className="mb-2 block">
                                    타입/카테고리
                                </Label>
                                <Input
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    placeholder="타입별로 폴더링됨"
                                />
                            </div>

                            <div className="mb-8">
                                <Label className="mb-2 block">
                                    효과/특이사항
                                </Label>
                                <Textarea
                                    value={effects}
                                    onChange={(e) => setEffects(e.target.value)}
                                    placeholder="효과, 특이사항 등"
                                />
                            </div>

                            <div className="w-full mb-8">
                                <Label className="mb-2 block">
                                    반복 퀘스트 여부
                                </Label>
                                <div className="flex gap-2 w-full">
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        variant={
                                            !repeatable ? "default" : "outline"
                                        }
                                        onClick={() => setRepeatable(false)}
                                    >
                                        1회성 퀘스트
                                    </Button>
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        variant={
                                            repeatable ? "default" : "outline"
                                        }
                                        onClick={() => setRepeatable(true)}
                                    >
                                        반복 퀘스트
                                    </Button>
                                </div>
                            </div>

                            {repeatable && (
                                <div className="w-full mb-8 flex flex-col gap-4">
                                    <div>
                                        <Label className="mb-2 block">
                                            최대 반복 횟수
                                        </Label>
                                        <Input
                                            type="number"
                                            value={repeatableCount ?? ""}
                                            onChange={(e) =>
                                                setRepeatableCount(
                                                    Number(e.target.value)
                                                )
                                            }
                                            min={-1}
                                            placeholder="-1 입력 시 무제한"
                                            className="w-40"
                                        />
                                        <div className="text-xs text-muted-foreground mt-1">
                                            -1 입력 시 반복 횟수 제한 없음
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="mb-2 block">
                                            반복 간격
                                        </Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={intervalDays}
                                                onChange={(e) =>
                                                    setIntervalDays(
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
                                                value={intervalHours}
                                                onChange={(e) =>
                                                    setIntervalHours(
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
                                                value={intervalMinutes}
                                                onChange={(e) =>
                                                    setIntervalMinutes(
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
                                                value={intervalSeconds}
                                                onChange={(e) =>
                                                    setIntervalSeconds(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-20"
                                                placeholder="0"
                                            />
                                            <span>초</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            반복 간격을 입력하세요 (예: 1일
                                            2시간 30분 10초)
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Section>
                        <Divider />
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={!isValid || isCreating}
                            >
                                {isCreating ? "생성 중..." : "퀘스트 생성"}
                            </Button>
                        </div>
                        {createError && (
                            <div className="text-red-500 text-sm">
                                {createError.message}
                            </div>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function getIntervalMsFromFields(
    days: number,
    hours: number,
    minutes: number,
    seconds: number
) {
    return (
        (days || 0) * 24 * 60 * 60 * 1000 +
        (hours || 0) * 60 * 60 * 1000 +
        (minutes || 0) * 60 * 1000 +
        (seconds || 0) * 1000
    );
}
