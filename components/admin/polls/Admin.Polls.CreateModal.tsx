"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    CreatePollInput,
    PollOption,
    UpdatePollInput,
} from "@/app/actions/polls";
import { Poll, PollCategory, PollStatus } from "@prisma/client";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import { useAssetsGet } from "@/app/hooks/useAssets";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CollectionCard from "@/components/molecules/NFTs.CollectionCard";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import Image from "next/image";
import { useLoading } from "@/app/hooks/useLoading";
import { useToast } from "@/app/hooks/useToast";
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/utils/youtube";
import { useArtistsGet } from "@/app/hooks/useArtists";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown } from "lucide-react";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import { Label } from "@/components/ui/label";

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

interface PollCreateModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: Poll | null;
    mode?: "create" | "edit";
}

export default function AdminPollsCreateModal({
    open,
    onClose,
    initialData,
    mode = "create",
}: PollCreateModalProps) {
    const { startLoading, endLoading } = useLoading();
    const toast = useToast();
    const {
        pollsList,
        isLoading: isLoadingPolls,
        error: errorPolls,
    } = usePollsGet({});
    const { polls, newPollId } = useMemo(() => {
        const sortedPolls = pollsList?.items
            ?.slice()
            .sort(
                (a: Poll, b: Poll) =>
                    Number(b.id.replace("p", "")) -
                    Number(a.id.replace("p", ""))
            );

        const maxId =
            sortedPolls && sortedPolls.length > 0
                ? Number(sortedPolls[0].id.replace("p", ""))
                : 0;

        return {
            polls: sortedPolls,
            newPollId: `p${(maxId + 1).toString().padStart(4, "0")}`,
        };
    }, [pollsList]);
    const { createPoll, updatePoll, isLoading, error } = usePollsSet();
    const { everyCollections, isLoading: isLoadingEveryCollections } =
        useFactoryGet({});

    const { assets, isLoading: isLoadingAssets } = useAssetsGet({
        getAssetsInput: {
            isActive: true,
        },
    });

    const { artists, isLoading: isLoadingArtists } = useArtistsGet({});

    // Form data state
    const [formData, setFormData] = useState<Partial<CreatePollInput>>({
        id: initialData?.id || newPollId,
        title: initialData?.title || "",
        titleShorten: initialData?.titleShorten || "",
        description: initialData?.description || undefined,
        category: initialData?.category || PollCategory.PUBLIC,
        status: initialData?.status || PollStatus.ACTIVE,
        options: (initialData?.options as unknown as PollOption[]) || [],
        imgUrl: initialData?.imgUrl || undefined,
        youtubeUrl: initialData?.youtubeUrl || undefined,
        startDate:
            initialData?.startDate ||
            (() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(17, 0, 0, 0);
                return tomorrow;
            })(),
        endDate:
            initialData?.endDate ||
            (() => {
                const sevenDaysLater = new Date();
                sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
                sevenDaysLater.setHours(17, 0, 0, 0);
                return sevenDaysLater;
            })(),
        exposeInScheduleTab: initialData?.exposeInScheduleTab || false,
        needToken: initialData?.needToken || false,
        needTokenAddress: initialData?.needTokenAddress || undefined,
        bettingMode: initialData?.bettingMode || false,
        bettingAssetId: initialData?.bettingAssetId || undefined,
        minimumBet: initialData?.minimumBet || 0,
        maximumBet: initialData?.maximumBet || 0,
        allowMultipleVote: initialData?.allowMultipleVote || false,
        participationRewardAssetId:
            initialData?.participationRewardAssetId || undefined,
        participationRewardAmount:
            initialData?.participationRewardAmount || undefined,
        minimumPoints: initialData?.minimumPoints || 0,
        minimumSGP: initialData?.minimumSGP || 0,
        minimumSGT: initialData?.minimumSGT || 0,
        requiredQuests: initialData?.requiredQuests || [],
        artistId: initialData?.artistId || undefined,
    });

    // Update form data when initial data changes
    useEffect(() => {
        if (open && initialData) {
            setFormData({
                id: initialData.id,
                title: initialData.title,
                titleShorten: initialData.titleShorten || undefined,
                description: initialData.description || undefined,
                category: initialData.category,
                status: initialData.status,
                options: initialData.options as unknown as PollOption[],
                imgUrl: initialData.imgUrl || undefined,
                youtubeUrl: initialData.youtubeUrl || undefined,
                startDate: initialData.startDate,
                endDate: initialData.endDate,
                exposeInScheduleTab: initialData.exposeInScheduleTab,
                needToken: initialData.needToken,
                needTokenAddress: initialData.needTokenAddress || undefined,
                bettingMode: initialData.bettingMode || false,
                bettingAssetId: initialData.bettingAssetId || undefined,
                minimumBet: initialData.minimumBet || 0,
                maximumBet: initialData.maximumBet || 0,
                allowMultipleVote: initialData.allowMultipleVote || false,
                participationRewardAssetId:
                    initialData.participationRewardAssetId || undefined,
                participationRewardAmount:
                    initialData.participationRewardAmount || undefined,
                minimumPoints: initialData.minimumPoints || 0,
                minimumSGP: initialData.minimumSGP || 0,
                minimumSGT: initialData.minimumSGT || 0,
                requiredQuests: initialData.requiredQuests || [],
                artistId: initialData.artistId || undefined,
            });
        }
    }, [open, initialData]);

    // Handle form field changes
    const handleFormChange = (field: keyof CreatePollInput, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Special handling for category field
        if (field === "category") {
            const isPrivate = value === PollCategory.PRIVATE;
            setFormData((prev) => ({
                ...prev,
                needToken: isPrivate,
                needTokenAddress: isPrivate ? prev.needTokenAddress : undefined,
            }));
        }
    };

    // Form validation
    const isFormValid = (): boolean => {
        if (polls?.find((poll) => poll.id === formData.id)) {
            toast.error("이미 존재하는 ID입니다.");
            return false;
        }

        if (!formData.title || formData.title.trim().length === 0) {
            toast.error("제목을 입력해주세요.");
            return false;
        }

        if (!formData.options || formData.options.length < 2) {
            toast.error("최소 2개 이상의 옵션을 입력해주세요.");
            return false;
        }

        const invalidOption = formData.options.find((option) => !option.name);
        if (invalidOption) {
            toast.error(
                `${invalidOption.optionId} 옵션의 이름을 입력해주세요.`
            );
            return false;
        }

        if (!formData.imgUrl && !formData.youtubeUrl) {
            toast.error("이미지 또는 유튜브 URL을 입력해주세요.");
            return false;
        }

        if (
            formData.startDate &&
            formData.endDate &&
            formData.startDate > formData.endDate
        ) {
            toast.error("시작일이 종료일보다 이전이어야 합니다.");
            return false;
        }

        if (
            formData.category === PollCategory.PRIVATE &&
            !formData.needTokenAddress
        ) {
            toast.error("토큰게이팅을 위한 컨트랙트 주소를 입력해주세요.");
            return false;
        }

        if (
            formData.participationRewardAmount &&
            !formData.participationRewardAssetId
        ) {
            toast.error("보상 수량을 설정할 때는 보상 에셋을 선택해주세요.");
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            startLoading();

            if (!isFormValid()) {
                return;
            }

            if (mode === "edit" && initialData) {
                await updatePoll({
                    ...formData,
                    id: initialData.id,
                } as UpdatePollInput);
                toast.success(
                    `${initialData.id} 폴이 성공적으로 수정되었습니다.`
                );
            } else {
                await createPoll(formData as CreatePollInput);
                toast.success("새 폴이 성공적으로 생성되었습니다.");
            }
            onClose();
        } catch (error) {
            console.error("Error saving poll:", error);
            toast.error(
                mode === "edit"
                    ? "폴 수정 중 오류가 발생했습니다."
                    : "폴 생성 중 오류가 발생했습니다."
            );
        } finally {
            endLoading();
        }
    };

    // Manage poll options
    const [selectedOption, setSelectedOption] = useState<PollOption | null>(
        null
    );
    const [showOptionCard, setShowOptionCard] = useState(false);

    const addNewOption = () => {
        const newId = `option${new Date().getTime()}`;
        const newOptions = [
            ...(formData.options || []),
            {
                optionId: newId,
                name: "",
                shorten: "",
                description: "",
                imgUrl: "",
                youtubeUrl: "",
            },
        ];

        handleFormChange("options", newOptions);
        toast.info("새 옵션이 추가되었습니다.");
    };

    const deleteOption = (id: string) => {
        const newOptions = (formData.options || []).filter(
            (option) => option.optionId !== id
        );
        handleFormChange("options", newOptions);
        toast.warning("옵션이 삭제되었습니다.");
    };

    const updateOption = (updatedOption: PollOption) => {
        const newOptions = (formData.options || []).map((opt) =>
            opt.optionId === updatedOption.optionId ? updatedOption : opt
        );
        handleFormChange("options", newOptions);
        toast.success("옵션이 저장되었습니다.");
    };

    // DnD sensors setup for options reordering
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        setShowOptionCard(false);
        setSelectedOption(
            (formData.options || []).find(
                (option) => option.optionId === active.id
            ) || null
        );
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const options = [...(formData.options || [])];
            const oldIndex = options.findIndex(
                (item) => item.optionId === active.id
            );
            const newIndex = options.findIndex(
                (item) => item.optionId === over.id
            );

            const newOptions = arrayMove(options, oldIndex, newIndex);
            handleFormChange("options", newOptions);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create"
                            ? "신규 폴 생성기"
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
                    className="flex-1 min-h-0 w-full flex justify-center items-start"
                >
                    <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                        <Section title="기본 정보">
                            <div className="grid grid-cols-2 gap-8">
                                {/* ID */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">ID</Label>
                                    <Input
                                        value={formData.id || ""}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "id",
                                                e.target.value
                                            )
                                        }
                                        className="py-3"
                                    />
                                </div>

                                {/* 제목 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        제목{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.title || ""}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "title",
                                                e.target.value
                                            )
                                        }
                                        maxLength={100}
                                        className="py-3"
                                        placeholder="제목을 입력하세요"
                                    />
                                </div>

                                {/* 짧은 제목 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        짧은 제목
                                    </Label>
                                    <Input
                                        value={formData.titleShorten || ""}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "titleShorten",
                                                e.target.value
                                            )
                                        }
                                        maxLength={20}
                                        className="py-3"
                                        placeholder="짧은 제목을 입력하세요"
                                    />
                                </div>

                                {/* 설명 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">설명</Label>
                                    <Textarea
                                        value={formData.description || ""}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        maxLength={200}
                                        className="py-3"
                                        placeholder="설명을 입력하세요"
                                    />
                                </div>
                            </div>
                        </Section>

                        <Divider />

                        <Section title="미디어">
                            <div className="grid grid-cols-2 gap-8">
                                {/* 이미지 URL */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">이미지</Label>
                                    <div className="flex gap-2">
                                        {formData.imgUrl && (
                                            <Image
                                                src={formData.imgUrl}
                                                alt="이미지"
                                                width={170}
                                                height={170}
                                                className="object-cover rounded-md"
                                            />
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                value={formData.imgUrl || ""}
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "imgUrl",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="이미지 URL을 입력하거나 아래에서 업로드하세요"
                                            />
                                            <FileUploader
                                                purpose="poll-option"
                                                bucket="images"
                                                onComplete={(files) => {
                                                    if (
                                                        files &&
                                                        files.length > 0
                                                    ) {
                                                        handleFormChange(
                                                            "imgUrl",
                                                            files[0].url
                                                        );
                                                        toast.success(
                                                            "이미지가 성공적으로 업로드되었습니다."
                                                        );
                                                    }
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

                                {/* 유튜브 URL */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        유튜브 URL
                                    </Label>
                                    <div className="flex flex-col gap-2">
                                        {formData.youtubeUrl && (
                                            <div className="w-[350px]">
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
                                        <Input
                                            value={formData.youtubeUrl || ""}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "youtubeUrl",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="유튜브 URL을 입력하세요"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Divider />

                        <Section title="카테고리 & 아티스트">
                            <div className="grid grid-cols-2 gap-8">
                                {/* 카테고리 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        카테고리{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                formData.category ===
                                                PollCategory.PUBLIC
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() => {
                                                handleFormChange(
                                                    "category",
                                                    PollCategory.PUBLIC
                                                );
                                                handleFormChange(
                                                    "needToken",
                                                    false
                                                );
                                                handleFormChange(
                                                    "needTokenAddress",
                                                    undefined
                                                );
                                            }}
                                            className="flex-1"
                                        >
                                            PUBLIC
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={
                                                formData.category ===
                                                PollCategory.PRIVATE
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                handleFormChange(
                                                    "category",
                                                    PollCategory.PRIVATE
                                                )
                                            }
                                            className="flex-1"
                                        >
                                            PRIVATE (토큰게이팅)
                                        </Button>
                                    </div>
                                </div>

                                {/* 토큰게이팅 주소 */}
                                {formData.category === PollCategory.PRIVATE && (
                                    <div className="mb-8">
                                        <Label className="mb-2 block">
                                            토큰 컨트랙트 주소{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="space-y-4">
                                            <Input
                                                value={
                                                    formData.needTokenAddress ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "needTokenAddress",
                                                        e.target.value
                                                    )
                                                }
                                                className="py-3"
                                                placeholder="토큰 컨트랙트 주소를 입력하세요"
                                            />

                                            {/* 컬렉션 선택 UI */}
                                            <div className="flex gap-4 overflow-auto">
                                                {everyCollections?.map(
                                                    (collection) => (
                                                        <div
                                                            key={
                                                                collection.address
                                                            }
                                                            onClick={() =>
                                                                handleFormChange(
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
                                                                collection={
                                                                    collection
                                                                }
                                                                showPrice={
                                                                    false
                                                                }
                                                                showSharePercentage={
                                                                    false
                                                                }
                                                                showCirculation={
                                                                    false
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

                                {/* 아티스트 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        아티스트
                                    </Label>
                                    <div className="flex gap-4 overflow-x-auto py-2 w-full">
                                        {/* "선택 안함" 버튼 */}
                                        <div
                                            onClick={() =>
                                                handleFormChange("artistId", "")
                                            }
                                            className={`cursor-pointer w-[150px] h-[80px] flex flex-col items-center justify-center border rounded
                                                            ${
                                                                !formData.artistId
                                                                    ? "bg-[rgba(109,40,217,0.8)]"
                                                                    : ""
                                                            }`}
                                        >
                                            <span className="text-sm text-muted-foreground">
                                                선택 안함
                                            </span>
                                        </div>
                                        {/* 아티스트 목록 */}
                                        {artists?.map((artist: any) => (
                                            <div
                                                key={artist.id}
                                                onClick={() =>
                                                    handleFormChange(
                                                        "artistId",
                                                        artist.id
                                                    )
                                                }
                                                className={`p-4 cursor-pointer w-[150px] h-[80px] flex flex-col items-center justify-center border rounded
                                                ${
                                                    formData.artistId ===
                                                    artist.id
                                                        ? "bg-[rgba(109,40,217,0.8)]"
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
                            </div>
                        </Section>

                        <Divider />

                        <Section title="일정 및 참여 방식">
                            <div className="grid grid-cols-2 gap-8">
                                {/* 날짜 선택 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        시작일{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <DateTimePicker
                                        value={formData.startDate || new Date()}
                                        onChange={(value) =>
                                            handleFormChange("startDate", value)
                                        }
                                        label="시작일"
                                        required
                                        showTime={true}
                                        disabled={false}
                                    />
                                </div>

                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        종료일{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <DateTimePicker
                                        value={formData.endDate || new Date()}
                                        onChange={(value) =>
                                            handleFormChange("endDate", value)
                                        }
                                        label="종료일"
                                        required
                                        showTime={true}
                                    />
                                </div>

                                {/* 중복 투표 허용 여부 */}
                                <div className="mb-8">
                                    <Label className="mb-2 block">
                                        중복 투표 허용 여부
                                    </Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                formData.allowMultipleVote ===
                                                true
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                handleFormChange(
                                                    "allowMultipleVote",
                                                    true
                                                )
                                            }
                                            className="flex-1"
                                        >
                                            중복 투표 허용
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={
                                                formData.allowMultipleVote ===
                                                false
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                handleFormChange(
                                                    "allowMultipleVote",
                                                    false
                                                )
                                            }
                                            className="flex-1"
                                        >
                                            중복 투표 불가
                                        </Button>
                                    </div>
                                </div>

                                <Divider />

                                <Section title="참여 보상">
                                    <div className="flex flex-row gap-4 w-full">
                                        {/* 참여 보상 에셋 */}
                                        <div className="mb-8 flex-1">
                                            <Label className="mb-2 block">
                                                참여 보상 에셋
                                            </Label>
                                            <Select
                                                value={
                                                    formData.participationRewardAssetId ||
                                                    ""
                                                }
                                                onValueChange={(value) => {
                                                    if (value === "none") {
                                                        handleFormChange(
                                                            "participationRewardAssetId",
                                                            undefined
                                                        );
                                                        handleFormChange(
                                                            "participationRewardAmount",
                                                            undefined
                                                        );
                                                    } else {
                                                        handleFormChange(
                                                            "participationRewardAssetId",
                                                            value
                                                        );
                                                    }
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="보상 에셋을 선택하세요" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* 보상 없음 옵션 추가 */}
                                                    <SelectItem value="none">
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                보상 없음
                                                            </span>
                                                        </div>
                                                    </SelectItem>

                                                    {isLoadingAssets ? (
                                                        <SelectItem
                                                            value="none"
                                                            disabled
                                                        >
                                                            로딩 중...
                                                        </SelectItem>
                                                    ) : (
                                                        assets?.assets?.map(
                                                            (asset) => (
                                                                <SelectItem
                                                                    key={
                                                                        asset.id
                                                                    }
                                                                    value={
                                                                        asset.id
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {asset.iconUrl && (
                                                                            <Image
                                                                                src={
                                                                                    asset.iconUrl
                                                                                }
                                                                                alt={
                                                                                    asset.name
                                                                                }
                                                                                width={
                                                                                    24
                                                                                }
                                                                                height={
                                                                                    24
                                                                                }
                                                                                className="rounded-full"
                                                                            />
                                                                        )}
                                                                        <span>
                                                                            {
                                                                                asset.name
                                                                            }
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            (
                                                                            {
                                                                                asset.symbol
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* 보상 수량 */}
                                        <div className="mb-8 flex-1">
                                            <Label className="mb-2 block">
                                                보상 수량
                                            </Label>
                                            <Input
                                                type="number"
                                                value={
                                                    formData.participationRewardAmount?.toString() ||
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    if (
                                                        value === "" ||
                                                        /^\d+$/.test(value)
                                                    ) {
                                                        handleFormChange(
                                                            "participationRewardAmount",
                                                            value === ""
                                                                ? undefined
                                                                : Number(value)
                                                        );
                                                    }
                                                }}
                                                className="w-full py-3"
                                                placeholder="보상 수량을 입력하세요"
                                                disabled={
                                                    !formData.participationRewardAssetId
                                                }
                                            />
                                        </div>
                                    </div>
                                </Section>

                                <Divider />

                                <Section title="폴 옵션">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-lg font-semibold">
                                                폴 옵션
                                            </h2>
                                            <Button
                                                type="button"
                                                onClick={addNewOption}
                                                variant="outline"
                                                className="h-8"
                                            >
                                                + 옵션 추가
                                            </Button>
                                        </div>

                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={(
                                                    formData.options || []
                                                ).map(
                                                    (option) => option.optionId
                                                )}
                                                strategy={
                                                    verticalListSortingStrategy
                                                }
                                            >
                                                <div className="space-y-2">
                                                    {(
                                                        formData.options || []
                                                    ).map((option) => (
                                                        <div
                                                            key={
                                                                option.optionId
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <SortableOption
                                                                    id={
                                                                        option.optionId
                                                                    }
                                                                >
                                                                    <div className="p-4 bg-background border rounded-lg shadow-sm">
                                                                        {option.name ||
                                                                            option.optionId}
                                                                    </div>
                                                                </SortableOption>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 cursor-pointer flex-shrink-0"
                                                                    onClick={() => {
                                                                        if (
                                                                            option.optionId ===
                                                                            selectedOption?.optionId
                                                                        ) {
                                                                            setShowOptionCard(
                                                                                !showOptionCard
                                                                            );
                                                                        } else {
                                                                            setShowOptionCard(
                                                                                true
                                                                            );
                                                                        }
                                                                        setSelectedOption(
                                                                            option
                                                                        );
                                                                    }}
                                                                >
                                                                    <ChevronDown
                                                                        className={`${
                                                                            showOptionCard &&
                                                                            selectedOption?.optionId ===
                                                                                option.optionId
                                                                                ? "rotate-180"
                                                                                : ""
                                                                        } transition-transform duration-300`}
                                                                    />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        deleteOption(
                                                                            option.optionId
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 cursor-pointer flex-shrink-0"
                                                                >
                                                                    ✕
                                                                </Button>
                                                            </div>
                                                            {showOptionCard &&
                                                                selectedOption?.optionId ===
                                                                    option.optionId && (
                                                                    <OptionCard
                                                                        option={
                                                                            option
                                                                        }
                                                                        editing={
                                                                            true
                                                                        }
                                                                        onSave={
                                                                            updateOption
                                                                        }
                                                                    />
                                                                )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                </Section>

                                <Divider />

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={!isFormValid() || isLoading}
                                        className="px-8"
                                    >
                                        {isLoading
                                            ? mode === "edit"
                                                ? "수정 중..."
                                                : "생성 중..."
                                            : mode === "edit"
                                            ? "수정"
                                            : "생성"}
                                    </Button>
                                </div>
                            </div>
                        </Section>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface SortableOptionProps {
    id: string;
    children: React.ReactNode;
}

function SortableOption({ id, children }: SortableOptionProps) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex-1">
            <div {...attributes} {...listeners} className="w-full cursor-move">
                {children}
            </div>
        </div>
    );
}

function OptionCard({
    option,
    editing = false,
    onSave,
}: {
    option: PollOption;
    editing: boolean;
    onSave: (option: PollOption) => void;
}) {
    const toast = useToast();
    const [editedOption, setEditedOption] = useState<PollOption>(option);
    const [isEditing, setIsEditing] = useState(editing);

    const handleSave = () => {
        onSave(editedOption);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedOption(option);
        setIsEditing(false);
        toast.info("변경사항이 취소되었습니다.");
    };

    return (
        <div className="p-4 bg-card rounded-lg shadow-sm mt-2 space-y-2">
            <div className="space-y-8">
                <div className="space-y-2">
                    <Label className="block font-semibold">
                        선택지 내용 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={editedOption.name}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                name: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold">
                        짧은 선택지 내용
                    </Label>
                    <Input
                        value={editedOption.shorten || ""}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                shorten: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold">설명</Label>
                    <Textarea
                        value={editedOption.description || ""}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                description: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold">이미지 URL</Label>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {editedOption.imgUrl && (
                                <Image
                                    src={
                                        editedOption.imgUrl ||
                                        "/default-image.jpg"
                                    }
                                    alt="이미지"
                                    width={170}
                                    height={170}
                                    className="object-cover rounded-md"
                                />
                            )}
                            {isEditing && (
                                <div className="flex flex-col gap-2">
                                    <Input
                                        value={editedOption.imgUrl || ""}
                                        onChange={(e) =>
                                            setEditedOption({
                                                ...editedOption,
                                                imgUrl: e.target.value,
                                            })
                                        }
                                        disabled={!isEditing}
                                        placeholder="이미지 URL을 입력하거나 아래에서 업로드하세요"
                                    />
                                    <FileUploader
                                        purpose="poll-option"
                                        bucket="images"
                                        onComplete={(files) => {
                                            if (files && files.length > 0) {
                                                setEditedOption({
                                                    ...editedOption,
                                                    imgUrl: files[0].url,
                                                });
                                                toast.success(
                                                    "이미지가 성공적으로 업로드되었습니다."
                                                );
                                            }
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
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold">유튜브 URL</Label>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {editedOption.youtubeUrl && (
                                <div className="w-[350px]">
                                    <YoutubeViewer
                                        videoId={
                                            getYoutubeVideoId(
                                                editedOption.youtubeUrl
                                            ) || undefined
                                        }
                                        autoPlay={false}
                                        framePadding={0}
                                    />
                                </div>
                            )}
                            {isEditing && (
                                <div className="flex flex-col gap-2">
                                    <Input
                                        value={editedOption.youtubeUrl || ""}
                                        onChange={(e) =>
                                            setEditedOption({
                                                ...editedOption,
                                                youtubeUrl: e.target.value,
                                            })
                                        }
                                        disabled={!isEditing}
                                        placeholder="유튜브 URL을 입력하세요"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            취소
                        </Button>
                        <Button type="button" onClick={handleSave}>
                            저장
                        </Button>
                    </>
                ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                        편집
                    </Button>
                )}
            </div>
        </div>
    );
}
