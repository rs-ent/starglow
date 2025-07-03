/// components/admin/quests/types.ts

import type { Quest, Artist, Asset } from "@prisma/client";
import type { SPG } from "@/app/story/spg/actions";

// Quest form input types
export type QuestCreateInput = Omit<Quest, "id" | "createdAt" | "updatedAt">;

export interface QuestFormData
    extends Omit<
        QuestCreateInput,
        "repeatableInterval" | "multiClaimInterval"
    > {
    intervalDays: number;
    intervalHours: number;
    intervalMinutes: number;
    intervalSeconds: number;
}

export type SubmitQuestData = Omit<
    QuestFormData,
    "intervalDays" | "intervalHours" | "intervalMinutes" | "intervalSeconds"
> & {
    repeatableInterval?: number;
    multiClaimInterval?: number;
};

// Component props interfaces
export interface AdminQuestCreateProps {
    mode: "create" | "edit";
    open: boolean;
    initialData?: Quest | null;
    registeredTypes: string[];
    onClose: () => void;
}

export interface QuestFormProps {
    formData: QuestFormData;
    artists: Array<Artist> | undefined;
    assets:
        | {
              assets: Array<Asset> | undefined;
          }
        | undefined;
    getSPGsData: Array<SPG> | undefined;
    getSPGIsLoading: boolean;
    isLoadingAssets: boolean;
    onChange: (field: keyof QuestFormData, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    isValid: boolean;
    isCreating: boolean;
    createError: any;
    mode: "create" | "edit";
    registeredTypes: string[];
}

// Tab configuration
export interface TabProps {
    tabs: { id: string; label: string; icon: React.ReactNode }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

// Constants
export const QUEST_ICON_PRESETS = [
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

// Utility functions
export function getIntervalMsFromFields(
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
