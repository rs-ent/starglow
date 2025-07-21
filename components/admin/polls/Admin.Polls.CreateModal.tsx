"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
    Settings,
    Image as ImageIcon,
    Users,
    Target,
    BarChart3,
    Network,
    Server,
    ChevronRight,
} from "lucide-react";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useLoading } from "@/app/hooks/useLoading";
import { usePollsGet } from "@/app/hooks/usePolls";
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { getOnchainPollContracts } from "@/app/actions/polls/onchain/actions-admin";
import { createPoll, updatePoll } from "@/app/actions/polls";

// Import refactored components
import { BasicInfoTab } from "./Admin.Poll.Create.Basic";
import { MediaTab } from "./Admin.Poll.Create.Media";
import { SettingsTab } from "./Admin.Poll.Create.Settings";
import { BettingTab } from "./Admin.Poll.Create.Betting";
import { OptionsTab } from "./Admin.Poll.Create.Options";
import { TabNavigation } from "./shared-components";
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
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Step management state
    const [currentStep, setCurrentStep] = useState(mode === "edit" ? 4 : 1);

    // Onchain selection state
    const [isOnchain, setIsOnchain] = useState<boolean | null>(
        mode === "edit" && initialData?.isOnchain !== undefined
            ? initialData.isOnchain
            : null
    );
    const [selectedContractId, setSelectedContractId] = useState<string>(
        mode === "edit" && initialData?.onchainContractId
            ? initialData.onchainContractId
            : ""
    );
    const [onchainContracts, setOnchainContracts] = useState<any[]>([]);

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

    // Load onchain contracts when component mounts
    useEffect(() => {
        if (open) {
            loadOnchainContracts().catch((err) => {
                console.error("Failed to load onchain contracts:", err);
            });
        }
    }, [open]);

    const loadOnchainContracts = async () => {
        try {
            const result = await getOnchainPollContracts();
            if (result.success && result.contracts) {
                setOnchainContracts(result.contracts.filter((c) => c.isActive));
            }
        } catch (error) {
            console.error("Failed to load onchain contracts:", error);
        }
    };

    // Update step when edit mode
    useEffect(() => {
        if (mode === "edit" && initialData) {
            setCurrentStep(4); // Skip to form when editing
        }
    }, [mode, initialData]);

    // Update bettingMode when pollType changes
    useEffect(() => {
        if (pollType !== null) {
            setFormData((prev: Partial<CreatePollInput>) => ({
                ...prev,
                bettingMode: pollType === "BETTING",
            }));
        }
    }, [pollType]);

    // Update onchain data when selections change
    useEffect(() => {
        if (isOnchain !== null && selectedContractId) {
            setFormData((prev: Partial<CreatePollInput>) => ({
                ...prev,
                isOnchain: isOnchain,
                onchainContractId: isOnchain ? selectedContractId : undefined,
            }));
        }
    }, [isOnchain, selectedContractId]);

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
            setIsLoading(true);
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
            setIsLoading(false);
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

    // Step navigation functions
    const handleOnchainSelection = (onchain: boolean) => {
        setIsOnchain(onchain);
        if (onchain && onchainContracts.length > 0) {
            setCurrentStep(2); // Go to contract selection
        } else {
            setCurrentStep(3); // Go to poll type selection
        }
    };

    const handleContractSelection = (contractId: string) => {
        setSelectedContractId(contractId);
        setCurrentStep(3); // Go to poll type selection
    };

    const handlePollTypeSelection = (type: "REGULAR" | "BETTING") => {
        setPollType(type);
        setCurrentStep(4); // Go to form
    };

    // Step components
    const OnchainSelectionStep = () => (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white">
                        폴 생성 방식 선택
                    </h2>
                    <p className="text-slate-400 text-lg">
                        어떤 방식으로 폴을 생성하시겠습니까?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => handleOnchainSelection(false)}
                        className="group p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl transition-all duration-200"
                    >
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                                <Settings className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">
                                오프체인 폴
                            </h3>
                            <p className="text-slate-400 text-sm">
                                일반적인 폴 생성 방식
                                <br />
                                빠르고 간편하게 폴을 만들 수 있습니다
                            </p>
                            <Badge
                                variant="secondary"
                                className="bg-blue-600/20 text-blue-400 border-blue-600/50"
                            >
                                권장
                            </Badge>
                        </div>
                    </button>

                    <button
                        onClick={() => handleOnchainSelection(true)}
                        className="group p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl transition-all duration-200"
                    >
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                                <Network className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">
                                온체인 폴
                            </h3>
                            <p className="text-slate-400 text-sm">
                                블록체인에 영구 저장
                                <br />
                                투명하고 변경 불가능한 기록
                            </p>
                            <Badge
                                variant="outline"
                                className="text-purple-400 border-purple-400/50"
                            >
                                고급
                            </Badge>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    const ContractSelectionStep = () => (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-purple-400">
                        <Network className="w-6 h-6" />
                        <span className="text-sm font-medium">
                            온체인 폴 생성
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                        컨트랙트 선택
                    </h2>
                    <p className="text-slate-400 text-lg">
                        폴을 생성할 온체인 컨트랙트를 선택해주세요
                    </p>
                </div>

                {onchainContracts.length === 0 ? (
                    <div className="p-8 bg-slate-800 border border-slate-700 rounded-xl">
                        <Server className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-lg font-medium text-white mb-2">
                            사용 가능한 컨트랙트가 없습니다
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            온체인 관리 탭에서 먼저 컨트랙트를 배포해주세요
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                            뒤로 가기
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Select
                            value={selectedContractId}
                            onValueChange={setSelectedContractId}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="컨트랙트 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {onchainContracts.map((contract) => (
                                    <SelectItem
                                        key={contract.id}
                                        value={contract.id}
                                        className="text-white hover:bg-slate-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span>{contract.networkName}</span>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {contract.pollsCount}개 폴
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(1)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                뒤로 가기
                            </Button>
                            <Button
                                onClick={() =>
                                    handleContractSelection(selectedContractId)
                                }
                                disabled={!selectedContractId}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                다음 단계
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const PollTypeSelectionStep = () => (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-purple-400">
                        {isOnchain ? (
                            <>
                                <Network className="w-6 h-6" />
                                <span className="text-sm font-medium">
                                    온체인 폴 생성
                                </span>
                            </>
                        ) : (
                            <>
                                <Settings className="w-6 h-6" />
                                <span className="text-sm font-medium">
                                    오프체인 폴 생성
                                </span>
                            </>
                        )}
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                        폴 타입 선택
                    </h2>
                    <p className="text-slate-400 text-lg">
                        어떤 타입의 폴을 만드시겠습니까?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => handlePollTypeSelection("REGULAR")}
                        className="group p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl transition-all duration-200"
                    >
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                                <Target className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">
                                일반 폴
                            </h3>
                            <p className="text-slate-400 text-sm">
                                일반적인 투표 폴<br />
                                팬들의 의견을 수집합니다
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => handlePollTypeSelection("BETTING")}
                        className="group p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500 rounded-xl transition-all duration-200"
                    >
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-orange-600/20 rounded-full flex items-center justify-center group-hover:bg-orange-600/30 transition-colors">
                                <BarChart3 className="w-8 h-8 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">
                                베팅 폴
                            </h3>
                            <p className="text-slate-400 text-sm">
                                베팅 기능이 있는 폴<br />
                                포인트를 걸고 예측할 수 있습니다
                            </p>
                            <Badge
                                variant="outline"
                                className="text-orange-400 border-orange-400/50"
                            >
                                🎰 베팅
                            </Badge>
                        </div>
                    </button>
                </div>

                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(isOnchain ? 2 : 1)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        뒤로 가기
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create" ? (
                            <>
                                신규 폴 생성기
                                {currentStep < 4 && (
                                    <span className="ml-3 text-sm text-slate-400 font-normal">
                                        단계 {currentStep}/3
                                    </span>
                                )}
                                {isOnchain && currentStep >= 3 && (
                                    <span className="ml-2 text-purple-400 text-sm">
                                        🔗 온체인
                                    </span>
                                )}
                                {pollType === "BETTING" && currentStep >= 4 && (
                                    <span className="ml-2 text-orange-400 text-sm">
                                        🎰 베팅
                                    </span>
                                )}
                            </>
                        ) : (
                            `${initialData?.id} 수정하기`
                        )}
                    </DialogTitle>

                    <div className="flex flex-row gap-5 items-center justify-between">
                        {/* Form controls - only show in final step or edit mode */}
                        {(currentStep === 4 || mode === "edit") && (
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
                                                handleFormChange(
                                                    "isActive",
                                                    true
                                                )
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
                                                handleFormChange(
                                                    "isActive",
                                                    false
                                                )
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
                                        handleSubmit(e as any).catch(
                                            console.error
                                        );
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
                        )}

                        {/* Step indicator for creation steps */}
                        {mode === "create" && currentStep < 4 && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>진행률:</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map((step) => (
                                        <div
                                            key={step}
                                            className={`w-2 h-2 rounded-full ${
                                                step <= currentStep
                                                    ? "bg-purple-400"
                                                    : "bg-slate-600"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

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

                {/* Step-based creation flow for create mode */}
                {mode === "create" && currentStep === 1 && (
                    <OnchainSelectionStep />
                )}
                {mode === "create" && currentStep === 2 && (
                    <ContractSelectionStep />
                )}
                {mode === "create" && currentStep === 3 && (
                    <PollTypeSelectionStep />
                )}

                {/* Form content when all steps are completed or in edit mode */}
                {(currentStep === 4 || mode === "edit") && (
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
