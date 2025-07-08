/// components/admin/quests/Admin.Quest.Create.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Settings,
    Image as ImageIcon,
    Users,
    Clock,
    Gift,
    Target,
} from "lucide-react";

import { QuestType } from "@prisma/client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useQuestSet } from "@/app/hooks/useQuest";
import { useToast } from "@/app/hooks/useToast";
import { useSPG } from "@/app/story/spg/hooks";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

// Import refactored components
import { GeneralQuestForm } from "./Admin.Quest.Create.General";
import { ReferralQuestForm } from "./Admin.Quest.Create.Referral";
import { TabNavigation, QuestTypeSelection } from "./shared-components";
import {
    type AdminQuestCreateProps,
    type QuestFormData,
    type SubmitQuestData,
    getIntervalMsFromFields,
} from "./types";

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
    const { getSPGsData, getSPGIsLoading } = useSPG({
        getSPGsInput: {},
    });
    const toast = useToast();

    // Tab state management
    const [activeTab, setActiveTab] = useState("basic");

    // Quest type
    const [questType, setQuestType] = useState<QuestType | null>(
        initialData?.questType || null
    );

    // Tab configuration
    const tabs = [
        {
            id: "basic",
            label: "기본 정보",
            icon: <Settings className="w-4 h-4" />,
        },
        {
            id: "artist",
            label: "아티스트",
            icon: <Users className="w-4 h-4" />,
        },
        {
            id: "reward",
            label: "보상",
            icon: <Gift className="w-4 h-4" />,
        },
        {
            id: "access",
            label: "참여 제한",
            icon: <Target className="w-4 h-4" />,
        },
        {
            id: "media",
            label: "미디어",
            icon: <ImageIcon className="w-4 h-4" />,
        },
        {
            id: "settings",
            label: "설정",
            icon: <Clock className="w-4 h-4" />,
        },
    ];

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
        urls: [],
        multiClaimable: false,
        multiClaimLimit: null,
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
        test: false,
    });

    // Memoize onChange function to prevent infinite loops
    const handleFormChange = useCallback(
        (field: keyof QuestFormData, value: any) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        },
        []
    );

    // Update questType in formData when questType changes
    useEffect(() => {
        if (questType) {
            setFormData((prev) => ({
                ...prev,
                questType,
                isReferral: questType === QuestType.REFERRAL,
            }));
        }
    }, [questType]);

    const isValid: boolean = useMemo(() => {
        const common = formData.title.trim().length > 0;
        const urlForm = !formData.url || formData.url.startsWith("https://");
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

        const interval = getIntervalMsFromFields(
            intervalDays,
            intervalHours,
            intervalMinutes,
            intervalSeconds
        );

        const filteredUrls =
            restFormData.urls?.filter((url) => url !== undefined) || [];

        const submitData: SubmitQuestData = {
            ...restFormData,
            urls: filteredUrls,
            repeatableInterval: formData.repeatable ? interval : undefined,
            multiClaimInterval: formData.multiClaimable ? interval : undefined,
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
            const { id, repeatableInterval, multiClaimInterval, ...rest } =
                initialData;

            const intervalDays = Math.floor(
                (repeatableInterval || multiClaimInterval || 0) /
                    (24 * 60 * 60 * 1000)
            );
            const intervalHours = Math.floor(
                ((repeatableInterval || multiClaimInterval || 0) %
                    (24 * 60 * 60 * 1000)) /
                    (60 * 60 * 1000)
            );
            const intervalMinutes = Math.floor(
                ((repeatableInterval || multiClaimInterval || 0) %
                    (60 * 60 * 1000)) /
                    (60 * 1000)
            );
            const intervalSeconds = Math.floor(
                ((repeatableInterval || multiClaimInterval || 0) %
                    (60 * 1000)) /
                    1000
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

    const renderQuestForm = (selectedQuestType: QuestType) => {
        const commonProps = {
            formData,
            artists,
            assets,
            getSPGsData,
            getSPGIsLoading,
            isLoadingAssets,
            onChange: handleFormChange,
            onSubmit: handleSubmit,
            isValid,
            isCreating: isCreating || isUpdating,
            createError: createError || updateError,
            mode,
            registeredTypes,
            test: formData.test ?? false,
        };

        if (selectedQuestType === QuestType.URL) {
            return <GeneralQuestForm {...commonProps} />;
        }

        if (selectedQuestType === QuestType.REFERRAL) {
            return <ReferralQuestForm {...commonProps} />;
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

                {questType && (
                    <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
                        {/* Tab navigation */}
                        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                            <TabNavigation
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                        </div>

                        {/* Form content */}
                        {renderQuestForm(questType)}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
