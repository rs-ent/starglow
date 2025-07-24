/// components/admin/polls/types.ts

import type { Poll } from "@prisma/client";
import type {
    CreatePollInput,
    UpdatePollInput,
    PollOption,
    PollListData,
} from "@/app/actions/polls";

// Export types for use in other components
export type { PollOption, CreatePollInput, UpdatePollInput };

// Main component props
export interface PollCreateModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: Poll | null;
    mode?: "create" | "edit";
}

// Form props interface for sub-components
export interface PollFormProps {
    formData: Partial<CreatePollInput>;
    onChange: (field: keyof CreatePollInput, value: any) => void;
    mode: "create" | "edit";
    artists?: any[];
    assets?: any;
    polls?: Poll[] | PollListData[];
    newPollId?: string;
}

// Tab configuration interface
export interface TabProps {
    tabs: { id: string; label: string; icon: React.ReactNode }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

// Option management props
export interface OptionManagementProps extends PollFormProps {
    selectedOption: PollOption | null;
    setSelectedOption: (option: PollOption | null) => void;
    showOptionCard: boolean;
    setShowOptionCard: (show: boolean) => void;
    onAddOption: () => void;
    onDeleteOption: (id: string) => void;
    onUpdateOption: (option: PollOption) => void;
}

// Option card props
export interface OptionCardProps {
    option: PollOption;
    editing: boolean;
    onSave: (option: PollOption) => void;
}

// Sortable option props
export interface SortableOptionProps {
    id: string;
    children: React.ReactNode;
}

// Section component props
export interface SectionProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    bgColor?: string;
}

// Poll type selection props
export interface PollTypeSelectionProps {
    onSelect: (type: "REGULAR" | "BETTING") => void;
}

// Utility types
export type PollFormField = keyof CreatePollInput;
export type PollMode = "create" | "edit";
export type PollTabId = "basic" | "media" | "settings" | "betting" | "options";

// Constants
export const POLL_FORM_VALIDATION = {
    MIN_OPTIONS: 2,
    MAX_TITLE_LENGTH: 100,
    MAX_SHORT_TITLE_LENGTH: 20,
    MAX_DESCRIPTION_LENGTH: 200,
    DEFAULT_COMMISSION_RATE: 0.05,
    DEFAULT_MIN_BET: 1000,
    DEFAULT_MAX_BET: 10000,
} as const;

// Utility functions
export const createDefaultPollData = (
    initialData?: Poll | null,
    newPollId?: string
): Partial<CreatePollInput> => {
    if (initialData) {
        return {
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
            hasAnswerAnnouncement: initialData.hasAnswerAnnouncement || false,
            answerOptionIds: initialData.answerOptionIds || [],
            answerAnnouncementDate:
                initialData.answerAnnouncementDate || undefined,
            showOnPollPage: initialData.showOnPollPage ?? true,
            showOnStarPage: initialData.showOnStarPage ?? true,
            participationConsumeAssetId:
                initialData.participationConsumeAssetId || undefined,
            participationConsumeAmount:
                initialData.participationConsumeAmount || undefined,
        };
    }

    // Default values for new poll
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(17, 0, 0, 0);

    return {
        id: newPollId,
        title: "",
        titleShorten: "",
        description: undefined,
        category: "PUBLIC" as any,
        status: "ACTIVE" as any,
        options: [],
        imgUrl: undefined,
        youtubeUrl: undefined,
        startDate: tomorrow,
        endDate: sevenDaysLater,
        exposeInScheduleTab: false,
        needToken: false,
        needTokenAddress: undefined,
        bettingMode: false,
        bettingAssetId: undefined,
        minimumBet: POLL_FORM_VALIDATION.DEFAULT_MIN_BET,
        maximumBet: POLL_FORM_VALIDATION.DEFAULT_MAX_BET,
        allowMultipleVote: false,
        participationRewardAssetId: undefined,
        participationRewardAmount: undefined,
        minimumPoints: 0,
        minimumSGP: 0,
        minimumSGT: 0,
        requiredQuests: [],
        artistId: undefined,
        isActive: true,
        hasAnswer: false,
        hasAnswerAnnouncement: false,
        answerOptionIds: [],
        answerAnnouncementDate: undefined,
        showOnPollPage: true,
        showOnStarPage: true,
        participationConsumeAssetId: undefined,
        participationConsumeAmount: undefined,
    };
};

export const generateNewPollId = (polls?: Poll[]): string => {
    const sortedPolls = polls
        ?.slice()
        .sort(
            (a: Poll, b: Poll) =>
                Number(b.id.replace("p", "")) - Number(a.id.replace("p", ""))
        );

    const maxId =
        sortedPolls && sortedPolls.length > 0
            ? Number(sortedPolls[0].id.replace("p", ""))
            : 0;

    return `p${(maxId + 1).toString().padStart(4, "0")}`;
};

export const createNewOption = (): PollOption => {
    const newId = `option${new Date().getTime()}`;
    return {
        optionId: newId,
        name: "",
        shorten: "",
        description: "",
        imgUrl: "",
        youtubeUrl: "",
    };
};
