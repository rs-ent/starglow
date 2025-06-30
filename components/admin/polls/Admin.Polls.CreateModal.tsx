"use client";

import { useEffect, useMemo, useState } from "react";

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
import { PollCategory, PollStatus } from "@prisma/client";
import {
    ChevronDown,
    Settings,
    Image as ImageIcon,
    Users,
    Clock,
    Gift,
    Target,
    BarChart3,
    GripVertical,
} from "lucide-react";
import Image from "next/image";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useAssetsGet } from "@/app/hooks/useAssets";
import { useLoading } from "@/app/hooks/useLoading";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getYoutubeVideoId } from "@/lib/utils/youtube";

import type {
    CreatePollInput,
    PollOption,
    UpdatePollInput,
} from "@/app/actions/polls";
import type { Poll } from "@prisma/client";

import PollTypeSelection from "./PollTypeSelection";

function Section({
    title,
    children,
    icon,
    bgColor = "bg-slate-800/50",
}: {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    bgColor?: string;
}) {
    return (
        <div
            className={`rounded-xl border border-slate-700/50 ${bgColor} backdrop-blur-sm`}
        >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/50">
                {icon}
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// 탭 컴포넌트
interface TabProps {
    tabs: { id: string; label: string; icon: React.ReactNode }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

function TabNavigation({ tabs, activeTab, onTabChange }: TabProps) {
    return (
        <div className="flex space-x-1 bg-slate-800/60 p-1 rounded-lg backdrop-blur-sm border border-slate-700/50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                            ? "bg-slate-700 text-white shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
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

    // 폴 타입 선택 상태 (edit 모드에서는 기존 데이터로 초기화)
    const [pollType, setPollType] = useState<"REGULAR" | "BETTING" | null>(
        mode === "edit" && initialData
            ? initialData.bettingMode
                ? "BETTING"
                : "REGULAR"
            : null
    );

    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState("basic");

    // 탭 구성
    const tabs = [
        {
            id: "basic",
            label: "기본 정보",
            icon: <Settings className="w-4 h-4" />,
        },
        {
            id: "media",
            label: "미디어",
            icon: <ImageIcon className="w-4 h-4" />,
        },
        { id: "settings", label: "설정", icon: <Target className="w-4 h-4" /> },
        ...(pollType === "BETTING"
            ? [
                  {
                      id: "betting",
                      label: "베팅",
                      icon: <BarChart3 className="w-4 h-4" />,
                  },
              ]
            : []),
        { id: "options", label: "옵션", icon: <Users className="w-4 h-4" /> },
    ];
    const { pollsList } = usePollsGet({});
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
    const { createPoll, updatePoll, isLoading } = usePollsSet();

    const { assets } = useAssetsGet({
        getAssetsInput: {
            isActive: true,
        },
    });

    const { artists } = useArtistsGet({});

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
        bettingMode: pollType === "BETTING",
        bettingAssetId: initialData?.bettingAssetId || undefined,
        minimumBet: initialData?.minimumBet || 1000,
        maximumBet: initialData?.maximumBet || 10000,
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
        isActive: initialData?.isActive,
        hasAnswer: initialData?.hasAnswer || false,
        answerOptionIds: initialData?.answerOptionIds || [],
    });

    // pollType이 변경될 때마다 bettingMode 업데이트
    useEffect(() => {
        if (pollType !== null) {
            setFormData((prev) => ({
                ...prev,
                bettingMode: pollType === "BETTING",
            }));
        }
    }, [pollType]);

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
                isActive: initialData.isActive,
                hasAnswer: initialData.hasAnswer || false,
                answerOptionIds: initialData.answerOptionIds || [],
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
        if (!formData.id) {
            toast.error("ID를 입력해주세요.");
            return false;
        }

        if (
            mode === "create" &&
            polls?.find((poll) => poll.id === formData.id)
        ) {
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

        if (formData.hasAnswer) {
            if (
                !formData.answerOptionIds ||
                formData.answerOptionIds.length === 0
            ) {
                toast.error("정답 옵션을 선택해주세요.");
                return false;
            }
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

                    <div className="flex flex-row gap-5 items-center justify-between">
                        <div className="flex items-center justify-between mx-auto gap-10">
                            <div className="flex items-center gap-4">
                                <Label className="text-slate-200">
                                    활성화 상태:
                                </Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            formData.isActive
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            handleFormChange("isActive", true)
                                        }
                                        size="sm"
                                    >
                                        활성화
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            !formData.isActive
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            handleFormChange("isActive", false)
                                        }
                                        size="sm"
                                    >
                                        비활성화
                                    </Button>
                                </div>
                            </div>
                            <Button
                                type="button"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSubmit(e as any).catch((error) => {
                                        console.error(
                                            "Error saving poll:",
                                            error
                                        );
                                        toast.error(
                                            mode === "edit"
                                                ? "폴 수정 중 오류가 발생했습니다."
                                                : "폴 생성 중 오류가 발생했습니다."
                                        );
                                    });
                                }}
                                className="px-8 bg-purple-600 hover:bg-purple-700"
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

                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="닫기"
                            >
                                ✕
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* 타입이 선택되지 않았을 때 타입 선택 화면 표시 */}
                {pollType === null && mode === "create" && (
                    <PollTypeSelection onSelect={setPollType} />
                )}

                {/* 타입이 선택되었거나 편집 모드일 때 폼 표시 */}
                {(pollType !== null || mode === "edit") && (
                    <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
                        {/* 탭 네비게이션 */}
                        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                            <TabNavigation
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                        </div>

                        {/* 폼 컨텐츠 */}
                        <form onSubmit={handleSubmit} className="h-full">
                            <div className="h-full flex flex-col">
                                <div className="flex-1 p-6">
                                    <div className="max-w-6xl mx-auto space-y-6">
                                        {/* 기본 정보 탭 */}
                                        {activeTab === "basic" && (
                                            <Section
                                                title="기본 정보"
                                                icon={
                                                    <Settings className="w-5 h-5" />
                                                }
                                            >
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    <div>
                                                        <Label className="mb-2 block text-slate-200">
                                                            ID
                                                        </Label>
                                                        <Input
                                                            value={
                                                                formData.id ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleFormChange(
                                                                    "id",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="bg-slate-700/50 border-slate-600 text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="mb-2 block text-slate-200">
                                                            제목{" "}
                                                            <span className="text-red-400">
                                                                *
                                                            </span>
                                                        </Label>
                                                        <Input
                                                            value={
                                                                formData.title ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleFormChange(
                                                                    "title",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            maxLength={100}
                                                            placeholder="제목을 입력하세요"
                                                            className="bg-slate-700/50 border-slate-600 text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="mb-2 block text-slate-200">
                                                            짧은 제목
                                                        </Label>
                                                        <Input
                                                            value={
                                                                formData.titleShorten ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleFormChange(
                                                                    "titleShorten",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            maxLength={20}
                                                            placeholder="짧은 제목을 입력하세요"
                                                            className="bg-slate-700/50 border-slate-600 text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="mb-2 block text-slate-200">
                                                            설명
                                                        </Label>
                                                        <Textarea
                                                            value={
                                                                formData.description ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleFormChange(
                                                                    "description",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            maxLength={200}
                                                            placeholder="설명을 입력하세요"
                                                            className="bg-slate-700/50 border-slate-600 text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </Section>
                                        )}

                                        {/* 미디어 탭 */}
                                        {activeTab === "media" && (
                                            <Section
                                                title="미디어"
                                                icon={
                                                    <ImageIcon className="w-5 h-5" />
                                                }
                                            >
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <div>
                                                        <Label className="mb-3 block text-slate-200">
                                                            이미지
                                                        </Label>
                                                        <div className="space-y-4">
                                                            {formData.imgUrl && (
                                                                <div className="rounded-lg overflow-hidden border border-slate-600">
                                                                    <Image
                                                                        src={
                                                                            formData.imgUrl
                                                                        }
                                                                        alt="이미지"
                                                                        width={
                                                                            200
                                                                        }
                                                                        height={
                                                                            200
                                                                        }
                                                                        className="object-cover w-full h-48"
                                                                    />
                                                                </div>
                                                            )}
                                                            <Input
                                                                value={
                                                                    formData.imgUrl ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleFormChange(
                                                                        "imgUrl",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="이미지 URL을 입력하세요"
                                                                className="bg-slate-700/50 border-slate-600 text-white"
                                                            />
                                                            <FileUploader
                                                                purpose="poll-option"
                                                                bucket="images"
                                                                onComplete={(
                                                                    files
                                                                ) => {
                                                                    if (
                                                                        files &&
                                                                        files.length >
                                                                            0
                                                                    ) {
                                                                        handleFormChange(
                                                                            "imgUrl",
                                                                            files[0]
                                                                                .url
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
                                                                maxSize={
                                                                    5 *
                                                                    1024 *
                                                                    1024
                                                                }
                                                                multiple={false}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="mb-3 block text-slate-200">
                                                            유튜브 URL
                                                        </Label>
                                                        <div className="space-y-4">
                                                            {formData.youtubeUrl && (
                                                                <div className="rounded-lg overflow-hidden">
                                                                    <YoutubeViewer
                                                                        videoId={
                                                                            getYoutubeVideoId(
                                                                                formData.youtubeUrl
                                                                            ) ||
                                                                            undefined
                                                                        }
                                                                        autoPlay={
                                                                            false
                                                                        }
                                                                        framePadding={
                                                                            0
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                            <Input
                                                                value={
                                                                    formData.youtubeUrl ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleFormChange(
                                                                        "youtubeUrl",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="유튜브 URL을 입력하세요"
                                                                className="bg-slate-700/50 border-slate-600 text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Section>
                                        )}

                                        {/* 설정 탭 */}
                                        {activeTab === "settings" && (
                                            <div className="space-y-6">
                                                {/* 카테고리 & 아티스트 */}
                                                <Section
                                                    title="카테고리 & 아티스트"
                                                    icon={
                                                        <Target className="w-5 h-5" />
                                                    }
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
                                                                    PRIVATE
                                                                    (토큰게이팅)
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label className="mb-3 block text-slate-200">
                                                                아티스트
                                                            </Label>
                                                            <div className="flex gap-2 overflow-x-auto">
                                                                <div
                                                                    onClick={() =>
                                                                        handleFormChange(
                                                                            "artistId",
                                                                            ""
                                                                        )
                                                                    }
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
                                                                {artists?.map(
                                                                    (
                                                                        artist: any
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                artist.id
                                                                            }
                                                                            onClick={() =>
                                                                                handleFormChange(
                                                                                    "artistId",
                                                                                    artist.id
                                                                                )
                                                                            }
                                                                            className={`cursor-pointer w-20 h-16 flex flex-col items-center justify-center border rounded ${
                                                                                formData.artistId ===
                                                                                artist.id
                                                                                    ? "border-purple-500 bg-purple-500/20"
                                                                                    : "border-slate-600"
                                                                            }`}
                                                                        >
                                                                            {artist.logoUrl ? (
                                                                                <Image
                                                                                    src={
                                                                                        artist.logoUrl
                                                                                    }
                                                                                    alt={
                                                                                        artist.name
                                                                                    }
                                                                                    width={
                                                                                        32
                                                                                    }
                                                                                    height={
                                                                                        32
                                                                                    }
                                                                                    className="w-8 h-8 rounded object-contain"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-xs text-slate-400">
                                                                                    {artist.name.slice(
                                                                                        0,
                                                                                        2
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs text-slate-300">
                                                                                {
                                                                                    artist.name
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Section>

                                                {/* 일정 및 참여 설정 */}
                                                <Section
                                                    title="일정 및 참여 설정"
                                                    icon={
                                                        <Clock className="w-5 h-5" />
                                                    }
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div>
                                                            <Label className="mb-2 block text-slate-200">
                                                                시작일
                                                            </Label>
                                                            <DateTimePicker
                                                                value={
                                                                    formData.startDate ||
                                                                    new Date()
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) =>
                                                                    handleFormChange(
                                                                        "startDate",
                                                                        value
                                                                    )
                                                                }
                                                                label="시작일"
                                                                required
                                                                showTime={true}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-slate-200">
                                                                종료일
                                                            </Label>
                                                            <DateTimePicker
                                                                value={
                                                                    formData.endDate ||
                                                                    new Date()
                                                                }
                                                                onChange={(
                                                                    value
                                                                ) =>
                                                                    handleFormChange(
                                                                        "endDate",
                                                                        value
                                                                    )
                                                                }
                                                                label="종료일"
                                                                required
                                                                showTime={true}
                                                            />
                                                        </div>
                                                        <div className="lg:col-span-2">
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
                                                                        handleFormChange(
                                                                            "allowMultipleVote",
                                                                            true
                                                                        )
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
                                                                        handleFormChange(
                                                                            "allowMultipleVote",
                                                                            false
                                                                        )
                                                                    }
                                                                    className="flex-1"
                                                                >
                                                                    불가
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Section>

                                                {/* 참여 보상 */}
                                                <Section
                                                    title="참여 보상"
                                                    icon={
                                                        <Gift className="w-5 h-5" />
                                                    }
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div>
                                                            <Label className="mb-2 block text-slate-200">
                                                                보상 에셋
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    formData.participationRewardAssetId ||
                                                                    ""
                                                                }
                                                                onValueChange={(
                                                                    value
                                                                ) => {
                                                                    if (
                                                                        value ===
                                                                        "none"
                                                                    ) {
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
                                                                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                                                    <SelectValue placeholder="보상 에셋을 선택하세요" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">
                                                                        보상
                                                                        없음
                                                                    </SelectItem>
                                                                    {assets?.assets?.map(
                                                                        (
                                                                            asset
                                                                        ) => (
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
                                                                                                20
                                                                                            }
                                                                                            height={
                                                                                                20
                                                                                            }
                                                                                        />
                                                                                    )}
                                                                                    <span>
                                                                                        {
                                                                                            asset.name
                                                                                        }{" "}
                                                                                        (
                                                                                        {
                                                                                            asset.symbol
                                                                                        }

                                                                                        )
                                                                                    </span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        )
                                                                    )}
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
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const value =
                                                                        e.target
                                                                            .value;
                                                                    handleFormChange(
                                                                        "participationRewardAmount",
                                                                        value ===
                                                                            ""
                                                                            ? undefined
                                                                            : Number(
                                                                                  value
                                                                              )
                                                                    );
                                                                }}
                                                                placeholder="보상 수량"
                                                                disabled={
                                                                    !formData.participationRewardAssetId
                                                                }
                                                                className="bg-slate-700/50 border-slate-600 text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </Section>
                                            </div>
                                        )}

                                        {/* 베팅 설정 탭 */}
                                        {activeTab === "betting" &&
                                            pollType === "BETTING" && (
                                                <Section
                                                    title="베팅 설정"
                                                    icon={
                                                        <BarChart3 className="w-5 h-5" />
                                                    }
                                                    bgColor="bg-gradient-to-br from-orange-900/30 to-yellow-900/30"
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div>
                                                            <Label className="mb-2 block text-orange-200">
                                                                베팅 에셋{" "}
                                                                <span className="text-red-400">
                                                                    *
                                                                </span>
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    formData.bettingAssetId ||
                                                                    ""
                                                                }
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    handleFormChange(
                                                                        "bettingAssetId",
                                                                        value
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="bg-slate-700/50 border-orange-600/50 text-white">
                                                                    <SelectValue placeholder="베팅에 사용할 에셋을 선택하세요" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {assets?.assets?.map(
                                                                        (
                                                                            asset
                                                                        ) => (
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
                                                                                                20
                                                                                            }
                                                                                            height={
                                                                                                20
                                                                                            }
                                                                                        />
                                                                                    )}
                                                                                    <span>
                                                                                        {
                                                                                            asset.name
                                                                                        }{" "}
                                                                                        (
                                                                                        {
                                                                                            asset.symbol
                                                                                        }

                                                                                        )
                                                                                    </span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-orange-200">
                                                                수수료율 (%)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    (formData.houseCommissionRate ||
                                                                        0.05) *
                                                                    100
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const value =
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) / 100;
                                                                    handleFormChange(
                                                                        "houseCommissionRate",
                                                                        value
                                                                    );
                                                                }}
                                                                min={0}
                                                                max={50}
                                                                step={0.1}
                                                                placeholder="5.0"
                                                                className="bg-slate-700/50 border-orange-600/50 text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-orange-200">
                                                                최소 베팅 금액
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    formData.minimumBet ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleFormChange(
                                                                        "minimumBet",
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                min={1}
                                                                placeholder="1000"
                                                                className="bg-slate-700/50 border-orange-600/50 text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 block text-orange-200">
                                                                최대 베팅 금액
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    formData.maximumBet ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleFormChange(
                                                                        "maximumBet",
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                min={
                                                                    formData.minimumBet ||
                                                                    1
                                                                }
                                                                placeholder="10000"
                                                                className="bg-slate-700/50 border-orange-600/50 text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-6 p-4 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-600/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-orange-400">
                                                                💰
                                                            </span>
                                                            <span className="font-semibold text-orange-200">
                                                                베팅 모드 안내
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-orange-300/80">
                                                            • 사용자들이
                                                            선택지에 베팅할 수
                                                            있습니다
                                                            <br />
                                                            • 폴 종료 후
                                                            관리자가 수동으로
                                                            정답을 설정하고
                                                            정산해야 합니다
                                                            <br />• 승리자들은
                                                            베팅 풀을 나누어
                                                            배당을 받습니다
                                                        </div>
                                                    </div>
                                                </Section>
                                            )}

                                        {/* 옵션 탭 */}
                                        {activeTab === "options" && (
                                            <Section
                                                title="폴 옵션"
                                                icon={
                                                    <Users className="w-5 h-5" />
                                                }
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={
                                                                    formData.hasAnswer
                                                                }
                                                                onCheckedChange={(
                                                                    checked
                                                                ) => {
                                                                    if (
                                                                        !checked
                                                                    ) {
                                                                        handleFormChange(
                                                                            "hasAnswer",
                                                                            false
                                                                        );
                                                                        handleFormChange(
                                                                            "answerOptionIds",
                                                                            []
                                                                        );
                                                                    } else {
                                                                        handleFormChange(
                                                                            "hasAnswer",
                                                                            true
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <Label className="text-slate-200">
                                                                정답이 있는 폴
                                                            </Label>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={
                                                                addNewOption
                                                            }
                                                            variant="outline"
                                                            className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                        >
                                                            + 옵션 추가
                                                        </Button>
                                                    </div>

                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={
                                                            closestCenter
                                                        }
                                                        onDragStart={
                                                            handleDragStart
                                                        }
                                                        onDragEnd={
                                                            handleDragEnd
                                                        }
                                                    >
                                                        <SortableContext
                                                            items={(
                                                                formData.options ||
                                                                []
                                                            ).map(
                                                                (option) =>
                                                                    option.optionId
                                                            )}
                                                            strategy={
                                                                verticalListSortingStrategy
                                                            }
                                                        >
                                                            <div className="space-y-3">
                                                                {(
                                                                    formData.options ||
                                                                    []
                                                                ).map(
                                                                    (
                                                                        option
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                option.optionId
                                                                            }
                                                                            className="space-y-2"
                                                                        >
                                                                            <SortableOption
                                                                                id={
                                                                                    option.optionId
                                                                                }
                                                                            >
                                                                                <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-white">
                                                                                            {option.name ||
                                                                                                option.optionId}
                                                                                        </span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            {formData.hasAnswer && (
                                                                                                <Checkbox
                                                                                                    checked={formData.answerOptionIds?.includes(
                                                                                                        option.optionId
                                                                                                    )}
                                                                                                    onCheckedChange={(
                                                                                                        checked
                                                                                                    ) => {
                                                                                                        let newIds =
                                                                                                            formData.answerOptionIds ||
                                                                                                            [];
                                                                                                        if (
                                                                                                            checked
                                                                                                        ) {
                                                                                                            newIds =
                                                                                                                [
                                                                                                                    ...newIds,
                                                                                                                    option.optionId,
                                                                                                                ];
                                                                                                        } else {
                                                                                                            newIds =
                                                                                                                newIds.filter(
                                                                                                                    (
                                                                                                                        id
                                                                                                                    ) =>
                                                                                                                        id !==
                                                                                                                        option.optionId
                                                                                                                );
                                                                                                        }
                                                                                                        handleFormChange(
                                                                                                            "answerOptionIds",
                                                                                                            newIds
                                                                                                        );
                                                                                                    }}
                                                                                                />
                                                                                            )}
                                                                                            <button
                                                                                                type="button"
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
                                                                                                className="h-8 w-8 text-slate-400 hover:text-white"
                                                                                            >
                                                                                                <ChevronDown
                                                                                                    className={`w-4 h-4 transition-transform ${
                                                                                                        showOptionCard &&
                                                                                                        selectedOption?.optionId ===
                                                                                                            option.optionId
                                                                                                            ? "rotate-180"
                                                                                                            : ""
                                                                                                    }`}
                                                                                                />
                                                                                            </button>
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={() =>
                                                                                                    deleteOption(
                                                                                                        option.optionId
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                                                                            >
                                                                                                ✕
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </SortableOption>
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
                                                                    )
                                                                )}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            </Section>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
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
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-2 text-slate-400 hover:text-slate-200 transition-colors"
                title="드래그하여 순서 변경"
            >
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1">{children}</div>
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
        <div className="p-6 bg-slate-800/80 rounded-lg border border-slate-600/50 mt-2 space-y-2 backdrop-blur-sm">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="block font-semibold text-slate-200">
                        선택지 내용 <span className="text-red-400">*</span>
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
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold text-slate-200">
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
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold text-slate-200">
                        설명
                    </Label>
                    <Textarea
                        value={editedOption.description || ""}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                description: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="block font-semibold text-slate-200">
                        이미지 URL
                    </Label>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {editedOption.imgUrl && (
                                <div className="rounded-lg overflow-hidden border border-slate-600">
                                    <Image
                                        src={
                                            editedOption.imgUrl ||
                                            "/default-image.jpg"
                                        }
                                        alt="이미지"
                                        width={170}
                                        height={170}
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            {isEditing && (
                                <div className="flex flex-col gap-2 flex-1">
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
                                        className="bg-slate-700/50 border-slate-600 text-white"
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
                    <Label className="block font-semibold text-slate-200">
                        유튜브 URL
                    </Label>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {editedOption.youtubeUrl && (
                                <div className="w-[350px] rounded-lg overflow-hidden">
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
                                <div className="flex flex-col gap-2 flex-1">
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
                                        className="bg-slate-700/50 border-slate-600 text-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-600/50">
                {isEditing ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                        >
                            취소
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            저장
                        </Button>
                    </>
                ) : (
                    <Button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white"
                    >
                        편집
                    </Button>
                )}
            </div>
        </div>
    );
}
