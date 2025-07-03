"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
    Settings,
    Image as ImageIcon,
    Users,
    Target,
    BarChart3,
} from "lucide-react";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useAssetsGet } from "@/app/hooks/useAssets";
import { useLoading } from "@/app/hooks/useLoading";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Import refactored components
import { BasicInfoTab } from "./Admin.Poll.Create.Basic";
import { MediaTab } from "./Admin.Poll.Create.Media";
import { SettingsTab } from "./Admin.Poll.Create.Settings";
import { BettingTab } from "./Admin.Poll.Create.Betting";
import { OptionsTab } from "./Admin.Poll.Create.Options";
import { TabNavigation, PollTypeSelection } from "./shared-components";
import {
    type PollCreateModalProps,
    type CreatePollInput,
    type UpdatePollInput,
    type PollOption,
    createDefaultPollData,
    createNewOption,
    POLL_FORM_VALIDATION,
} from "./types";

export default function AdminPollsCreateModal({
    open,
    onClose,
    initialData,
    mode = "create",
}: PollCreateModalProps) {
    const { startLoading, endLoading } = useLoading();
    const toast = useToast();

    // Poll type selection state
    const [pollType, setPollType] = useState<"REGULAR" | "BETTING" | null>(
        mode === "edit" && initialData
            ? initialData.bettingMode
                ? "BETTING"
                : "REGULAR"
            : null
    );

    // Tab state management
    const [activeTab, setActiveTab] = useState("basic");

    // Polls data for ID generation
    const { pollsList } = usePollsGet({});
    const { polls, newPollId } = useMemo(() => {
        const sortedPolls = pollsList?.items
            ?.slice()
            .sort(
                (a: any, b: any) =>
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
    const { assets } = useAssetsGet({ getAssetsInput: { isActive: true } });
    const { artists } = useArtistsGet({});

    // Form data state
    const [formData, setFormData] = useState<Partial<CreatePollInput>>(
        createDefaultPollData(initialData, newPollId)
    );

    // Option management state
    const [selectedOption, setSelectedOption] = useState<PollOption | null>(
        null
    );
    const [showOptionCard, setShowOptionCard] = useState(false);

    // Tab configuration
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

    // Update bettingMode when pollType changes
    useEffect(() => {
        if (pollType !== null) {
            setFormData((prev: Partial<CreatePollInput>) => ({
                ...prev,
                bettingMode: pollType === "BETTING",
            }));
        }
    }, [pollType]);

    // Update form data when initial data changes
    useEffect(() => {
        if (open && initialData) {
            setFormData(createDefaultPollData(initialData));
            // Update pollType based on initialData.bettingMode
            setPollType(initialData.bettingMode ? "BETTING" : "REGULAR");
        }
    }, [open, initialData]);

    // Memoized form change handler
    const handleFormChange = useCallback(
        (field: keyof CreatePollInput, value: any) => {
            setFormData((prev: Partial<CreatePollInput>) => ({
                ...prev,
                [field]: value,
            }));

            // Special handling for category field
            if (field === "category") {
                const isPrivate = value === "PRIVATE";
                setFormData((prev: Partial<CreatePollInput>) => ({
                    ...prev,
                    needToken: isPrivate,
                    needTokenAddress: isPrivate
                        ? prev.needTokenAddress
                        : undefined,
                }));
            }
        },
        []
    );

    // Option management functions
    const addNewOption = useCallback(() => {
        const newOption = createNewOption();
        const newOptions = [...(formData.options || []), newOption];
        handleFormChange("options", newOptions);
        toast.info("새 옵션이 추가되었습니다.");
    }, [formData.options, handleFormChange, toast]);

    const deleteOption = useCallback(
        (id: string) => {
            const newOptions = (formData.options || []).filter(
                (option: PollOption) => option.optionId !== id
            );
            handleFormChange("options", newOptions);
            toast.warning("옵션이 삭제되었습니다.");
        },
        [formData.options, handleFormChange, toast]
    );

    const updateOption = useCallback(
        (updatedOption: PollOption) => {
            const newOptions = (formData.options || []).map((opt: PollOption) =>
                opt.optionId === updatedOption.optionId ? updatedOption : opt
            );
            handleFormChange("options", newOptions);
            toast.success("옵션이 저장되었습니다.");
        },
        [formData.options, handleFormChange, toast]
    );

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

        if (
            !formData.options ||
            formData.options.length < POLL_FORM_VALIDATION.MIN_OPTIONS
        ) {
            toast.error("최소 2개 이상의 옵션을 입력해주세요.");
            return false;
        }

        const invalidOption = formData.options.find(
            (option: PollOption) => !option.name
        );
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

        return true;
    };

    // Form submission
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

    // Common props for all tab components
    const tabProps = {
        formData,
        onChange: handleFormChange,
        mode,
        artists,
        assets,
        polls,
        newPollId,
    };

    // Option management props
    const optionProps = {
        ...tabProps,
        selectedOption,
        setSelectedOption,
        showOptionCard,
        setShowOptionCard,
        onAddOption: addNewOption,
        onDeleteOption: deleteOption,
        onUpdateOption: updateOption,
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create"
                            ? "신규 폴 생성기"
                            : `${initialData?.id} 수정하기`}
                        {pollType === "BETTING" && (
                            <span className="ml-2 text-orange-400 text-sm">
                                🎰 BETTING MODE
                            </span>
                        )}
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
                                    handleSubmit(e as any).catch(console.error);
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

                {/* Poll type selection for create mode */}
                {pollType === null && mode === "create" && (
                    <PollTypeSelection onSelect={setPollType} />
                )}

                {/* Form content when type is selected or in edit mode */}
                {(pollType !== null || mode === "edit") && (
                    <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
                        {/* Tab navigation */}
                        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                            <TabNavigation
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                        </div>

                        {/* Tab content */}
                        <form onSubmit={handleSubmit} className="h-full">
                            <div className="h-full flex flex-col">
                                <div className="flex-1 p-6">
                                    <div className="max-w-6xl mx-auto space-y-6">
                                        {activeTab === "basic" && (
                                            <BasicInfoTab {...tabProps} />
                                        )}
                                        {activeTab === "media" && (
                                            <MediaTab {...tabProps} />
                                        )}
                                        {activeTab === "settings" && (
                                            <SettingsTab {...tabProps} />
                                        )}
                                        {activeTab === "betting" &&
                                            pollType === "BETTING" && (
                                                <BettingTab {...tabProps} />
                                            )}
                                        {activeTab === "options" && (
                                            <OptionsTab {...optionProps} />
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
