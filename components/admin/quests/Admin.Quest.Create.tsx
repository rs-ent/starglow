/// components/admin/quests/Admin.Quest.Create.tsx

"use client";

import { useQuestSet } from "@/app/hooks/useQuest";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { useState, useEffect, useMemo } from "react";
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
import CollectionCard from "@/components/nfts/NFTs.CollectionCard";
import {
    Quest,
    Artist,
    Asset,
    CollectionContract,
    QuestType,
} from "@prisma/client";
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

type QuestCreateInput = Omit<Quest, "id" | "createdAt" | "updatedAt">;
type QuestUpdateInput = Partial<QuestCreateInput> & { id: string };
interface QuestFormData extends Omit<QuestCreateInput, "repeatableInterval"> {
    intervalDays: number;
    intervalHours: number;
    intervalMinutes: number;
    intervalSeconds: number;
}
type SubmitQuestData = Omit<
    QuestFormData,
    "intervalDays" | "intervalHours" | "intervalMinutes" | "intervalSeconds"
> & {
    repeatableInterval?: number;
};

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
    registeredTypes: string[];
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
    registeredTypes,
    onClose,
}: AdminQuestCreateProps) {
    const { artists } = useArtistsGet({});
    const {
        createQuest,
        updateQuest,
        isCreating,
        isUpdating,
        createError,
        updateError,
    } = useQuestSet();
    const { assets, isLoading: isLoadingAssets } = useAssetsGet({
        getAssetsInput: { isActive: true },
    });
    const { everyCollections, isLoading: isLoadingCollections } = useFactoryGet(
        {}
    );
    const toast = useToast();

    // 퀘스트 타입
    const [questType, setQuestType] = useState<QuestType | null>(
        initialData?.questType || null
    );

    const [formData, setFormData] = useState<QuestFormData>({
        title: initialData?.title || "",
        questType: initialData?.questType || QuestType.URL,
        description: null,
        url: null,
        icon: null,
        imgUrl: null,
        youtubeUrl: null,
        rewardAssetId: null,
        rewardAmount: null,
        startDate: null,
        endDate: null,
        needToken: false,
        needTokenAddress: null,
        repeatable: false,
        repeatableCount: null,
        isReferral: false,
        referralCount: null,
        permanent: true,
        isActive: true,
        order: 0,
        effects: null,
        type: null,
        artistId: null,
        intervalDays: 0,
        intervalHours: 0,
        intervalMinutes: 0,
        intervalSeconds: 0,
    });

    const isValid: boolean = useMemo(() => {
        const common = formData.title.trim().length > 0;
        const urlForm = Boolean(
            formData.url && formData.url.startsWith("https://")
        );
        const referralForm = Boolean(
            formData.isReferral && formData.referralCount
        );

        if (questType === "URL") {
            return common && urlForm;
        } else if (questType === "REFERRAL") {
            return common && referralForm;
        }
        return false;
    }, [formData, questType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        const {
            intervalDays,
            intervalHours,
            intervalMinutes,
            intervalSeconds,
            ...restFormData
        } = formData;

        const submitData: SubmitQuestData = {
            ...restFormData,
            repeatableInterval: formData.repeatable
                ? getIntervalMsFromFields(
                      intervalDays,
                      intervalHours,
                      intervalMinutes,
                      intervalSeconds
                  )
                : undefined,
        };

        const result =
            mode === "edit" && initialData
                ? await updateQuest({
                      ...submitData,
                      id: initialData.id,
                  })
                : await createQuest(submitData);

        if (result) {
            toast.success(
                `퀘스트가 성공적으로 ${
                    mode === "create" ? "생성" : "수정"
                }되었습니다.\n(${result.title})`
            );
            onClose();
        }
    };

    useEffect(() => {
        if (open && initialData) {
            const { id, repeatableInterval, ...rest } = initialData;

            const intervalDays = Math.floor(
                (repeatableInterval || 0) / (24 * 60 * 60 * 1000)
            );
            const intervalHours = Math.floor(
                ((repeatableInterval || 0) % (24 * 60 * 60 * 1000)) /
                    (60 * 60 * 1000)
            );
            const intervalMinutes = Math.floor(
                ((repeatableInterval || 0) % (60 * 60 * 1000)) / (60 * 1000)
            );
            const intervalSeconds = Math.floor(
                ((repeatableInterval || 0) % (60 * 1000)) / 1000
            );

            setFormData({
                ...rest,
                intervalDays,
                intervalHours,
                intervalMinutes,
                intervalSeconds,
                ...(mode === "edit" ? { id } : {}),
            });
        }
    }, [open, initialData, mode]);

    const handleFormChange = (field: keyof QuestFormData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    function QuestTypeSelection({
        onSelect,
    }: {
        onSelect: (type: "URL" | "REFERRAL") => void;
    }) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold mb-8">
                    퀘스트 타입을 선택해주세요
                </h2>
                <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                    <button
                        onClick={() => onSelect("URL")}
                        className="flex flex-col items-center p-6 border rounded-lg hover:border-primary transition-colors"
                    >
                        <img
                            src="/icons/quests/link.svg"
                            alt="URL 퀘스트"
                            className="w-16 h-16 mb-4"
                        />
                        <h3 className="text-lg font-semibold mb-2">
                            URL 퀘스트
                        </h3>
                        <p className="text-sm text-muted-foreground text-center">
                            사용자가 특정 URL을 방문하면 보상을 받는 퀘스트
                        </p>
                    </button>

                    <button
                        onClick={() => onSelect("REFERRAL")}
                        className="flex flex-col items-center p-6 border rounded-lg hover:border-primary transition-colors"
                    >
                        <img
                            src="/icons/quests/social.svg"
                            alt="초대 퀘스트"
                            className="w-16 h-16 mb-4"
                        />
                        <h3 className="text-lg font-semibold mb-2">
                            초대 퀘스트
                        </h3>
                        <p className="text-sm text-muted-foreground text-center">
                            친구를 초대하고 보상을 받는 퀘스트
                        </p>
                    </button>
                </div>
            </div>
        );
    }

    const renderQuestForm = (selectedQuestType: QuestType) => {
        if (selectedQuestType === QuestType.URL) {
            formData.questType = QuestType.URL;
            return (
                <URLQuestForm
                    formData={formData}
                    artists={artists}
                    assets={assets}
                    everyCollections={everyCollections}
                    isLoadingAssets={isLoadingAssets}
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                    isValid={isValid}
                    isCreating={isCreating || isUpdating}
                    createError={createError || updateError}
                    mode={mode}
                    registeredTypes={registeredTypes}
                />
            );
        }

        if (selectedQuestType === QuestType.REFERRAL) {
            formData.questType = QuestType.REFERRAL;
            formData.isReferral = true;
            return (
                <ReferralQuestForm
                    formData={formData}
                    artists={artists}
                    assets={assets}
                    everyCollections={everyCollections}
                    isLoadingAssets={isLoadingAssets}
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                    isValid={isValid}
                    isCreating={isCreating || isUpdating}
                    createError={createError || updateError}
                    mode={mode}
                    registeredTypes={registeredTypes}
                />
            );
        }

        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create"
                            ? "신규 퀘스트 생성기"
                            : `『${initialData?.title}』 수정하기`}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label="닫기">
                            ✕
                        </Button>
                    </DialogClose>
                </DialogHeader>

                {questType === null && (
                    <QuestTypeSelection onSelect={setQuestType} />
                )}

                {questType && renderQuestForm(questType)}
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

interface QuestFormProps {
    formData: QuestFormData;
    artists: Array<Artist> | undefined;
    assets:
        | {
              assets: Array<Asset> | undefined;
          }
        | undefined;
    everyCollections: Array<CollectionContract> | undefined;
    isLoadingAssets: boolean;
    onChange: (field: keyof QuestFormData, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    isValid: boolean;
    isCreating: boolean;
    createError: any;
    mode: "create" | "edit";
    registeredTypes: string[];
}

function URLQuestForm({
    formData,
    artists,
    assets,
    everyCollections,
    isLoadingAssets,
    onChange,
    onSubmit,
    isValid,
    isCreating,
    createError,
    mode,
    registeredTypes,
}: QuestFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="flex-1 min-h-0 w-full flex flex-col items-center"
        >
            <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                <Section title="기본 정보" bgColor="bg-muted/40">
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
                            퀘스트 클릭 시 이동할 링크 (필수)
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                            value={formData.url || ""}
                            onChange={(e) => onChange("url", e.target.value)}
                            placeholder="https://example.com"
                            type="url"
                            required
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
                <Section title="아티스트" bgColor="bg-muted/30">
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
                <Section title="보상" bgColor="bg-muted/40">
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
                <Section title="참여 제한" bgColor="bg-muted/30">
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
                                <div className="flex gap-4 overflow-auto">
                                    {everyCollections?.map(
                                        (collection: any) => (
                                            <div
                                                key={collection.address}
                                                onClick={() =>
                                                    onChange(
                                                        "needTokenAddress",
                                                        collection.address
                                                    )
                                                }
                                                className={`cursor-pointer w-[300px] h-[150px] ${
                                                    formData.needTokenAddress ===
                                                    collection.address
                                                        ? "ring-2 ring-primary"
                                                        : ""
                                                }`}
                                            >
                                                <CollectionCard
                                                    collection={collection}
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
                    </div>

                    {formData.repeatable && (
                        <div className="w-full mb-8 flex flex-col gap-4">
                            <div>
                                <Label className="mb-2 block">수행 횟수</Label>
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
                                    횟수만큼 퀘스트 수행 시 퀘스트가 완료됩니다.
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

function ReferralQuestForm({
    formData,
    artists,
    assets,
    everyCollections,
    isLoadingAssets,
    onChange,
    onSubmit,
    isValid,
    isCreating,
    createError,
    mode,
    registeredTypes,
}: QuestFormProps) {
    useEffect(() => {
        onChange("isReferral", true);
    }, []);

    return (
        <form
            onSubmit={onSubmit}
            className="flex-1 min-h-0 w-full flex flex-col items-center"
        >
            <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                <Section title="기본 정보" bgColor="bg-muted/40">
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
                <Section title="보상" bgColor="bg-muted/40">
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
                <Section title="보상 기준" bgColor="bg-muted/30">
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
