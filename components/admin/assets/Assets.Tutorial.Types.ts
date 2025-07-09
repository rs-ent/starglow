/// components/admin/assets/Assets.Tutorial.Types.ts

import type { Asset } from "@prisma/client";
import type {
    TutorialCustomization,
    TutorialStep,
    CustomizationPreset,
} from "@/app/actions/assets/tutorial-actions";

// 🎨 아이콘 타입 정의
export type IconType = "default" | "lucide" | "custom";

export interface StepIcon {
    type: IconType;
    value?: string; // lucide 아이콘 이름 또는 이미지 URL
    url?: string; // 커스텀 이미지 URL
}

// 🎨 반응형 크기 설정
export interface ResponsiveSizes {
    titleSize?: number; // 제목 크기 (기본: 25)
    contentSize?: number; // 내용 크기 (기본: 15)
    iconSize?: number; // 아이콘 크기 (기본: 40)
    containerSize?: number; // 컨테이너 크기 (기본: 60)
    imageSize?: number; // 이미지 크기 (기본: 300px 상당)
    buttonSize?: number; // 버튼 크기 (기본: 20)
}

// 🎨 확장된 튜토리얼 단계 타입
export interface ExtendedTutorialStep
    extends Omit<TutorialStep, "bulletinItems" | "orderItems"> {
    // 🎯 아이콘 관련 필드들 (새로 추가)
    stepIcon?: StepIcon; // 새로운 아이콘 시스템

    // 🎯 반응형 크기 설정 (새로 추가)
    responsiveSizes?: ResponsiveSizes;

    // 🎯 타입 오버라이드 (선택적으로 변경)
    bulletinItems?: string[];
    orderItems?: OrderItem[];
}

// 🎯 Order 아이템 타입
export interface OrderItem {
    id: string;
    title: string;
    description?: string;
    isCompleted?: boolean;
}

// 🎨 확장된 커스터마이제이션 타입
export interface ExtendedTutorialCustomization extends TutorialCustomization {
    // 색상 설정
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;

    // 제목 설정
    mainTitle?: string;
    subtitle?: string;

    // 아이콘 설정
    mainIcon?: string;

    // 애니메이션 설정
    enableAnimations?: boolean;
    animationSpeed?: "slow" | "normal" | "fast";

    // 버튼 설정
    buttonStyle?: "rounded" | "square" | "pill";
    buttonSize?: "small" | "medium" | "large";

    // 레이아웃 설정
    layout?: "centered" | "left" | "right";
    showProgressBar?: boolean;
    showStepNumbers?: boolean;
}

// 🎨 단계 타입 옵션
export const STEP_TYPE_OPTIONS = [
    {
        value: "text",
        label: "텍스트",
        icon: "BookOpen",
        description: "일반 텍스트 콘텐츠",
    },
    {
        value: "action",
        label: "액션",
        icon: "Zap",
        description: "사용자 행동이 필요한 단계",
    },
    {
        value: "image",
        label: "이미지",
        icon: "ImageIcon",
        description: "이미지가 포함된 단계",
    },
    {
        value: "video",
        label: "비디오",
        icon: "Video",
        description: "비디오가 포함된 단계",
    },
    {
        value: "success",
        label: "성공",
        icon: "CheckCircle",
        description: "완료/성공 메시지",
    },
    {
        value: "info",
        label: "정보",
        icon: "Info",
        description: "추가 정보 제공",
    },
    {
        value: "bulletin",
        label: "공지",
        icon: "Megaphone",
        description: "중요한 공지사항",
    },
    {
        value: "order",
        label: "순서",
        icon: "ListOrdered",
        description: "순차적 단계 목록",
    },
] as const;

// 🎨 액션 타입 옵션
export const ACTION_TYPE_OPTIONS = [
    {
        value: "discord_auth",
        label: "Discord 인증",
        description: "Discord 채널 인증",
    },
    {
        value: "external_link",
        label: "외부 링크",
        description: "외부 웹사이트로 이동",
    },
    { value: "custom", label: "커스텀", description: "사용자 정의 액션" },
] as const;

// 🎨 커스터마이제이션 프리셋 정보
export const PRESET_INFO: Record<
    CustomizationPreset,
    { name: string; description: string; preview: string }
> = {
    default: {
        name: "기본",
        description: "깔끔하고 전문적인 스타일",
        preview: "보라색 그라데이션, 중간 크기 버튼",
    },
    minimal: {
        name: "미니멀",
        description: "심플하고 빠른 로딩",
        preview: "회색 톤, 작은 버튼, 애니메이션 없음",
    },
    vibrant: {
        name: "생동감",
        description: "화려하고 역동적인 스타일",
        preview: "빨간색 그라데이션, 큰 버튼, 느린 애니메이션",
    },
};

// 🎨 색상 프리셋
export const COLOR_PRESETS = [
    { name: "Purple", primary: "#8B5CF6", secondary: "#A78BFA", bg: "#1E1B4B" },
    { name: "Blue", primary: "#3B82F6", secondary: "#60A5FA", bg: "#1E3A8A" },
    { name: "Green", primary: "#10B981", secondary: "#34D399", bg: "#064E3B" },
    { name: "Red", primary: "#EF4444", secondary: "#F87171", bg: "#7C2D12" },
    { name: "Orange", primary: "#F59E0B", secondary: "#FBBF24", bg: "#92400E" },
    { name: "Pink", primary: "#EC4899", secondary: "#F472B6", bg: "#831843" },
    { name: "Gray", primary: "#6B7280", secondary: "#9CA3AF", bg: "#111827" },
] as const;

// 📝 에디터 상태 타입
export interface TutorialEditorState {
    steps: ExtendedTutorialStep[];
    selectedStepIndex: number;
    customization: ExtendedTutorialCustomization;
    isPreviewOpen: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    showCustomizationPanel: boolean;
}

// 📝 에디터 액션 타입
export type TutorialEditorAction =
    | { type: "SET_STEPS"; payload: ExtendedTutorialStep[] }
    | { type: "ADD_STEP"; payload: ExtendedTutorialStep }
    | {
          type: "UPDATE_STEP";
          payload: { index: number; step: Partial<ExtendedTutorialStep> };
      }
    | { type: "DELETE_STEP"; payload: number }
    | { type: "MOVE_STEP"; payload: { fromIndex: number; toIndex: number } }
    | { type: "SET_SELECTED_STEP"; payload: number }
    | {
          type: "SET_CUSTOMIZATION";
          payload: Partial<ExtendedTutorialCustomization>;
      }
    | { type: "APPLY_PRESET"; payload: CustomizationPreset }
    | { type: "SET_PREVIEW_OPEN"; payload: boolean }
    | { type: "SET_SAVING"; payload: boolean }
    | { type: "SET_UNSAVED_CHANGES"; payload: boolean }
    | { type: "TOGGLE_CUSTOMIZATION_PANEL" }
    | { type: "RESET_EDITOR" };

// 📝 컴포넌트 Props 타입들
export interface TutorialEditorProps {
    asset: Asset;
    isOpen: boolean;
    onClose: () => void;
    editMode?: boolean;
    initialData?: {
        steps: ExtendedTutorialStep[];
        customization: ExtendedTutorialCustomization;
    };
}

export interface CustomizationPanelProps {
    customization: ExtendedTutorialCustomization;
    onChange: (customization: Partial<ExtendedTutorialCustomization>) => void;
    onApplyPreset: (preset: CustomizationPreset) => void;
    isLoading?: boolean;
}

export interface StepEditorProps {
    step: ExtendedTutorialStep;
    stepIndex: number;
    onChange: (updates: Partial<ExtendedTutorialStep>) => void;
    onDelete: () => void;
}

export interface StepListProps {
    steps: ExtendedTutorialStep[];
    selectedIndex: number;
    onSelectStep: (index: number) => void;
    onAddStep: () => void;
    onMoveStep: (fromIndex: number, toIndex: number) => void;
    onDeleteStep: (index: number) => void;
}

export interface TutorialPreviewProps {
    steps: ExtendedTutorialStep[];
    customization: ExtendedTutorialCustomization;
    asset: Asset;
    isOpen: boolean;
    onClose: () => void;
}

// 🎨 인기 Lucide 아이콘 목록
export const POPULAR_LUCIDE_ICONS = [
    "BookOpen",
    "Zap",
    "ImageIcon",
    "Video",
    "CheckCircle",
    "Info",
    "Megaphone",
    "ListOrdered",
    "Heart",
    "Star",
    "Gift",
    "Sparkles",
    "Crown",
    "Trophy",
    "Target",
    "Rocket",
    "Flame",
    "Music",
    "Camera",
    "Mic",
    "Headphones",
    "Bell",
    "Mail",
    "Phone",
    "Settings",
    "User",
    "Users",
    "Globe",
    "Lock",
    "Key",
    "Calendar",
    "Clock",
    "Map",
    "Compass",
    "Flag",
    "Tag",
    "Folder",
    "File",
    "Download",
    "Upload",
    "Share",
    "Copy",
    "Edit",
    "Trash",
    "Plus",
    "Minus",
    "X",
    "Check",
] as const;

// 🎯 기본 반응형 크기 (메모이제이션용 상수)
const DEFAULT_RESPONSIVE_SIZES: ResponsiveSizes = {
    titleSize: 25,
    contentSize: 15,
    iconSize: 40,
    containerSize: 60,
    imageSize: 50, // responsiveClass 50에 해당하는 크기
    buttonSize: 20,
};

// 🎯 기본 반응형 크기 (객체 참조 재사용)
export function getDefaultResponsiveSizes(): ResponsiveSizes {
    return DEFAULT_RESPONSIVE_SIZES;
}

// 🎯 기본 단계 아이콘 (메모이제이션용 상수)
export const DEFAULT_STEP_ICON: StepIcon = {
    type: "default",
};

// 🎯 Utility Functions
export function createNewStep(order: number = 0): ExtendedTutorialStep {
    return {
        id: `step-${Date.now()}`,
        title: "새로운 단계",
        content: "여기에 설명을 입력하세요.",
        type: "text",
        order,
        // TutorialStep의 선택적 필드들 초기화
        imageUrl: undefined,
        videoUrl: undefined,
        actionType: "external_link", // 기본 액션 타입
        actionUrl: undefined,
        buttonText: undefined,
        icon: undefined,
        bulletinItems: [],
        orderItems: [],
        // ExtendedTutorialStep의 새로운 필드들
        stepIcon: DEFAULT_STEP_ICON,
        responsiveSizes: getDefaultResponsiveSizes(),
    };
}

export function createNewOrderItem(): OrderItem {
    return {
        id: `order-${Date.now()}`,
        title: "새로운 순서",
        description: "설명을 입력하세요",
        isCompleted: false,
    };
}

// 🎯 기본 커스터마이제이션 (메모이제이션용 상수)
const DEFAULT_CUSTOMIZATION: ExtendedTutorialCustomization = {
    primaryColor: "#8B5CF6",
    secondaryColor: "#A78BFA",
    backgroundColor: "#1E1B4B",
    textColor: "#F8FAFC",
    accentColor: "#C4B5FD",
    mainTitle: "튜토리얼",
    subtitle: "새로운 기능을 배워보세요",
    mainIcon: "graduation-cap",
    enableAnimations: true,
    animationSpeed: "normal",
    buttonStyle: "rounded",
    buttonSize: "medium",
    layout: "centered",
    showProgressBar: true,
    showStepNumbers: true,
};

export function getDefaultCustomization(): ExtendedTutorialCustomization {
    return DEFAULT_CUSTOMIZATION;
}
