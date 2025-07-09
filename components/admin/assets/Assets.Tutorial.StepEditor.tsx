/// components/admin/assets/Assets.Tutorial.StepEditor.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    GripVertical,
    ImageIcon,
    Video,
    ExternalLink,
    MessageSquare,
    ListOrdered,
    Megaphone,
    ChevronDown,
    ChevronRight,
    Upload,
    Check,
    Image,
    Palette,
    Sparkles,
    BookOpen,
    Zap,
    CheckCircle,
    Info,
    Heart,
    Star,
    Gift,
    Crown,
    Trophy,
    Target,
    Rocket,
    Flame,
    Music,
    Camera,
    Mic,
    Headphones,
    Bell,
    Mail,
    Phone,
    Settings,
    User,
    Users,
    Globe,
    Lock,
    Key,
    Calendar,
    Clock,
    Map,
    Compass,
    Flag,
    Tag,
    Folder,
    File,
    Download,
    Share,
    Copy,
    Edit,
    Trash,
    Minus,
    X,
    Sliders,
    RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type {
    StepEditorProps,
    ExtendedTutorialStep,
    OrderItem,
    StepIcon,
    IconType,
    ResponsiveSizes,
} from "./Assets.Tutorial.Types";
import {
    POPULAR_LUCIDE_ICONS,
    getDefaultResponsiveSizes,
} from "./Assets.Tutorial.Types";
import { createNewOrderItem } from "./Assets.Tutorial.Types";
import { cn } from "@/lib/utils/tailwind";
import FileUploader from "@/components/atoms/FileUploader";

// 🎨 단계 타입 옵션
const stepTypeOptions = [
    {
        value: "text",
        label: "텍스트",
        icon: MessageSquare,
        iconName: "MessageSquare",
        description: "일반 텍스트 콘텐츠",
    },
    {
        value: "action",
        label: "액션",
        icon: ExternalLink,
        iconName: "ExternalLink",
        description: "사용자 행동이 필요한 단계",
    },
    {
        value: "image",
        label: "이미지",
        icon: ImageIcon,
        iconName: "ImageIcon",
        description: "이미지가 포함된 단계",
    },
    {
        value: "video",
        label: "비디오",
        icon: Video,
        iconName: "Video",
        description: "비디오가 포함된 단계",
    },
    {
        value: "success",
        label: "성공",
        icon: Check,
        iconName: "Check",
        description: "완료/성공 메시지",
    },
    {
        value: "info",
        label: "정보",
        icon: MessageSquare,
        iconName: "MessageSquare",
        description: "추가 정보 제공",
    },
    {
        value: "bulletin",
        label: "공지",
        icon: Megaphone,
        iconName: "Megaphone",
        description: "중요한 공지사항",
    },
    {
        value: "order",
        label: "순서",
        icon: ListOrdered,
        iconName: "ListOrdered",
        description: "순차적 단계 목록",
    },
] as const;

// 🎨 액션 타입 옵션
const actionTypeOptions = [
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

interface OrderItemEditorProps {
    items: OrderItem[];
    onChange: (items: OrderItem[]) => void;
}

function OrderItemEditor({ items, onChange }: OrderItemEditorProps) {
    const addItem = useCallback(() => {
        const newItem = createNewOrderItem();
        onChange([...items, newItem]);
    }, [items, onChange]);

    const updateItem = useCallback(
        (index: number, updates: Partial<OrderItem>) => {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], ...updates };
            onChange(newItems);
        },
        [items, onChange]
    );

    const deleteItem = useCallback(
        (index: number) => {
            const newItems = items.filter((_, i) => i !== index);
            onChange(newItems);
        },
        [items, onChange]
    );

    const moveItem = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (toIndex < 0 || toIndex >= items.length) return;

            const newItems = [...items];
            const [moved] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, moved);
            onChange(newItems);
        },
        [items, onChange]
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm font-medium">
                    순서 목록
                </Label>
                <Button
                    onClick={addItem}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    항목 추가
                </Button>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50"
                    >
                        <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div className="flex flex-col gap-1 pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveItem(index, index - 1)}
                                    disabled={index === 0}
                                    className="w-6 h-6 p-0 text-slate-400 hover:text-white"
                                >
                                    <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                                </Button>
                                <GripVertical className="w-4 h-4 text-slate-500" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveItem(index, index + 1)}
                                    disabled={index === items.length - 1}
                                    className="w-6 h-6 p-0 text-slate-400 hover:text-white"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-purple-500/30 text-purple-300"
                                    >
                                        {index + 1}
                                    </Badge>
                                    <Input
                                        value={item.title}
                                        onChange={(e) =>
                                            updateItem(index, {
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder="순서 제목"
                                        className="bg-slate-800 border-slate-600 text-white text-sm"
                                    />
                                </div>

                                <Input
                                    value={item.description || ""}
                                    onChange={(e) =>
                                        updateItem(index, {
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="설명 (선택사항)"
                                    className="bg-slate-800 border-slate-600 text-white text-sm"
                                />
                            </div>

                            {/* Delete Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItem(index)}
                                className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
                        <ListOrdered className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-sm">순서 항목을 추가해보세요</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface BulletinItemEditorProps {
    items: string[];
    onChange: (items: string[]) => void;
}

function BulletinItemEditor({ items, onChange }: BulletinItemEditorProps) {
    const addItem = useCallback(() => {
        onChange([...items, ""]);
    }, [items, onChange]);

    const updateItem = useCallback(
        (index: number, value: string) => {
            const newItems = [...items];
            newItems[index] = value;
            onChange(newItems);
        },
        [items, onChange]
    );

    const deleteItem = useCallback(
        (index: number) => {
            const newItems = items.filter((_, i) => i !== index);
            onChange(newItems);
        },
        [items, onChange]
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm font-medium">
                    공지 목록
                </Label>
                <Button
                    onClick={addItem}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    항목 추가
                </Button>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center gap-2"
                    >
                        <Badge
                            variant="outline"
                            className="border-orange-500/30 text-orange-300"
                        >
                            {index + 1}
                        </Badge>
                        <Input
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder="공지 내용을 입력하세요"
                            className="flex-1 bg-slate-800 border-slate-600 text-white"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(index)}
                            className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </motion.div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
                        <Megaphone className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-sm">공지 항목을 추가해보세요</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// 🎨 반응형 크기 조절 컴포넌트
interface ResponsiveSizeEditorProps {
    sizes: ResponsiveSizes;
    onChange: (sizes: ResponsiveSizes) => void;
}

function ResponsiveSizeEditor({ sizes, onChange }: ResponsiveSizeEditorProps) {
    const sizeConfigs = useMemo(
        () => [
            {
                key: "titleSize" as keyof ResponsiveSizes,
                label: "제목 크기",
                min: 15,
                max: 70,
                step: 5,
                default: 25,
                description: "단계 제목의 텍스트 크기",
            },
            {
                key: "contentSize" as keyof ResponsiveSizes,
                label: "내용 크기",
                min: 10,
                max: 50,
                step: 5,
                default: 15,
                description: "단계 내용의 텍스트 크기",
            },
            {
                key: "iconSize" as keyof ResponsiveSizes,
                label: "아이콘 크기",
                min: 20,
                max: 70,
                step: 5,
                default: 40,
                description: "아이콘의 크기",
            },
            {
                key: "containerSize" as keyof ResponsiveSizes,
                label: "컨테이너 크기",
                min: 40,
                max: 100,
                step: 5,
                default: 60,
                description: "아이콘 컨테이너의 크기",
            },
            {
                key: "imageSize" as keyof ResponsiveSizes,
                label: "이미지 크기",
                min: 30,
                max: 70,
                step: 5,
                default: 50,
                description: "이미지의 크기",
            },
            {
                key: "buttonSize" as keyof ResponsiveSizes,
                label: "버튼 크기",
                min: 15,
                max: 40,
                step: 5,
                default: 20,
                description: "버튼의 크기",
            },
        ],
        []
    );

    const handleSizeChange = useCallback(
        (key: keyof ResponsiveSizes, value: number) => {
            onChange({
                ...sizes,
                [key]: value,
            });
        },
        [sizes, onChange]
    );

    const resetToDefault = useCallback(() => {
        onChange(getDefaultResponsiveSizes());
    }, [onChange]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <Label className="text-slate-300 text-sm font-medium">
                        반응형 크기 설정
                    </Label>
                </div>
                <Button
                    onClick={resetToDefault}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    초기화
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {sizeConfigs.map((config) => {
                    const currentValue = sizes[config.key] ?? config.default;

                    return (
                        <div key={config.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        {config.label}
                                    </Label>
                                    <p className="text-xs text-slate-500">
                                        {config.description}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-blue-500/30 text-blue-300"
                                >
                                    {currentValue}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-6">
                                    {config.min}
                                </span>
                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min={config.min}
                                        max={config.max}
                                        step={config.step}
                                        value={currentValue}
                                        onChange={(e) =>
                                            handleSizeChange(
                                                config.key,
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
                                                 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0
                                                 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                                                 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                                    />
                                </div>
                                <span className="text-xs text-slate-500 w-6">
                                    {config.max}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 🎨 아이콘 선택 컴포넌트
interface IconSelectorProps {
    stepIcon: StepIcon;
    onChange: (icon: StepIcon) => void;
    stepType: ExtendedTutorialStep["type"];
}

function IconSelector({ stepIcon, onChange, stepType }: IconSelectorProps) {
    // 🚨 activeTab을 useMemo로 메모이제이션하여 불필요한 재계산 방지
    const activeTab = useMemo(() => {
        return stepIcon?.type || "default";
    }, [stepIcon?.type]);

    // 기본 아이콘 (단계 타입별)
    const defaultIcon = useMemo(
        () =>
            stepTypeOptions.find((opt) => opt.value === stepType)?.iconName ||
            "MessageSquare",
        [stepType]
    );

    const LucideIcon = useMemo(() => {
        const IconComponent = ({ iconName }: { iconName: string }) => {
            const icons = {
                BookOpen,
                Zap,
                ImageIcon,
                Video,
                CheckCircle,
                Info,
                Megaphone,
                ListOrdered,
                Heart,
                Star,
                Gift,
                Sparkles,
                Crown,
                Trophy,
                Target,
                Rocket,
                Flame,
                Music,
                Camera,
                Mic,
                Headphones,
                Bell,
                Mail,
                Phone,
                Settings,
                User,
                Users,
                Globe,
                Lock,
                Key,
                Calendar,
                Clock,
                Map,
                Compass,
                Flag,
                Tag,
                Folder,
                File,
                Download,
                Upload,
                Share,
                Copy,
                Edit,
                Trash,
                Plus,
                Minus,
                X,
                Check,
                MessageSquare,
                ExternalLink,
            };

            const IconComponent =
                icons[iconName as keyof typeof icons] || MessageSquare;
            return <IconComponent className="w-5 h-5" />;
        };

        IconComponent.displayName = "LucideIcon";
        return IconComponent;
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <Label className="text-slate-300 text-sm font-medium">
                    아이콘 설정
                </Label>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex gap-1 p-1 bg-slate-700/50 rounded-lg">
                {[
                    { key: "default", label: "기본", icon: Check },
                    { key: "lucide", label: "Lucide", icon: Sparkles },
                    { key: "custom", label: "커스텀", icon: Image },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            // 🚨 같은 탭을 클릭했을 때는 onChange 호출하지 않음 (무한 루프 방지)
                            if (tab.key !== activeTab) {
                                onChange({ type: tab.key as IconType });
                            }
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === tab.key
                                ? "bg-purple-600 text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-600/50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 탭 컨텐츠 */}
            <div className="min-h-[200px] bg-slate-700/30 rounded-lg p-4">
                {activeTab === "default" && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30">
                            <LucideIcon iconName={defaultIcon} />
                        </div>
                        <div>
                            <p className="text-white font-medium">
                                기본 아이콘
                            </p>
                            <p className="text-slate-400 text-sm">
                                단계 타입에 따른 기본 아이콘
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                // ✅ 수정: 이미 default가 아닐 때만 변경
                                if (stepIcon.type !== "default") {
                                    onChange({ type: "default" });
                                }
                            }}
                            variant={
                                stepIcon.type === "default"
                                    ? "default"
                                    : "outline"
                            }
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={stepIcon.type === "default"} // ✅ 추가: 이미 선택된 경우 비활성화
                        >
                            기본 아이콘 사용
                        </Button>
                    </div>
                )}

                {activeTab === "lucide" && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h4 className="text-white font-medium mb-2">
                                Lucide 아이콘 선택
                            </h4>
                            <p className="text-slate-400 text-sm">
                                인기 있는 아이콘들에서 선택하세요
                            </p>
                        </div>

                        <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto">
                            {POPULAR_LUCIDE_ICONS.map((iconName) => (
                                <button
                                    key={iconName}
                                    onClick={() => {
                                        // ✅ 수정: 이미 선택된 아이콘이 아닐 때만 변경
                                        if (
                                            !(
                                                stepIcon.type === "lucide" &&
                                                stepIcon.value === iconName
                                            )
                                        ) {
                                            onChange({
                                                type: "lucide",
                                                value: iconName,
                                            });
                                        }
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
                                        "hover:bg-slate-600/50",
                                        stepIcon.type === "lucide" &&
                                            stepIcon.value === iconName
                                            ? "bg-purple-600 text-white"
                                            : "bg-slate-600/30 text-slate-400 hover:text-white"
                                    )}
                                    title={iconName}
                                >
                                    <LucideIcon iconName={iconName} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "custom" && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h4 className="text-white font-medium mb-2">
                                커스텀 아이콘 업로드
                            </h4>
                            <p className="text-slate-400 text-sm">
                                PNG, JPG, SVG 형식 (권장: 64x64px)
                            </p>
                        </div>

                        {stepIcon.type === "custom" && stepIcon.url && (
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 mx-auto bg-slate-600/30 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img
                                        src={stepIcon.url}
                                        alt="Custom icon"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <Button
                                    onClick={() =>
                                        onChange({
                                            type: "custom",
                                            url: undefined,
                                        })
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    제거
                                </Button>
                            </div>
                        )}

                        <FileUploader
                            purpose="tutorial-icon"
                            bucket="tutorial-assets"
                            accept={{
                                "image/*": [".png", ".jpg", ".jpeg", ".svg"],
                            }}
                            maxSize={2 * 1024 * 1024} // 2MB
                            multiple={false}
                            onComplete={(files) => {
                                if (files.length > 0) {
                                    onChange({
                                        type: "custom",
                                        value: files[0].url,
                                        url: files[0].url,
                                    });
                                }
                            }}
                            className="h-32"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TutorialStepEditor({
    step,
    stepIndex,
    onChange,
    onDelete,
}: StepEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const selectedStepType = stepTypeOptions.find(
        (option) => option.value === step.type
    );

    // ✅ 메모이제이션된 핸들러들
    const handleIconChange = useCallback(
        (icon: StepIcon) => {
            onChange({ stepIcon: icon });
        },
        [onChange]
    );

    const handleSizeChange = useCallback(
        (sizes: ResponsiveSizes) => {
            onChange({ responsiveSizes: sizes });
        },
        [onChange]
    );

    // ✅ 컴포넌트가 완전히 초기화되지 않았으면 렌더링 지연
    if (
        !step.stepIcon ||
        !step.responsiveSizes ||
        (!step.actionType && step.type === "action")
    ) {
        return null; // 또는 로딩 스피너
    }

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <Badge
                            variant="outline"
                            className="border-purple-500/30 text-purple-300"
                        >
                            {stepIndex + 1}
                        </Badge>

                        <div className="flex items-center gap-2">
                            {selectedStepType && (
                                <selectedStepType.icon className="w-5 h-5 text-purple-400" />
                            )}
                            <span className="font-medium">{step.title}</span>
                        </div>

                        <Badge
                            variant="secondary"
                            className="bg-slate-700/50 text-slate-300 border-slate-600"
                        >
                            {selectedStepType?.label}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </div>
                </CardTitle>
            </CardHeader>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CardContent className="space-y-6">
                            {/* 기본 정보 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        제목
                                    </Label>
                                    <Input
                                        value={step.title}
                                        onChange={(e) =>
                                            onChange({ title: e.target.value })
                                        }
                                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                                        placeholder="단계 제목을 입력하세요"
                                    />
                                </div>

                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        단계 타입
                                    </Label>
                                    <Select
                                        value={step.type}
                                        onValueChange={(
                                            value: ExtendedTutorialStep["type"]
                                        ) => onChange({ type: value })}
                                    >
                                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stepTypeOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <option.icon className="w-4 h-4" />
                                                        <div>
                                                            <div className="font-medium">
                                                                {option.label}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {
                                                                    option.description
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-slate-300 text-sm font-medium">
                                    내용
                                </Label>
                                <Textarea
                                    value={step.content}
                                    onChange={(e) =>
                                        onChange({ content: e.target.value })
                                    }
                                    className="mt-1 bg-slate-800 border-slate-600 text-white min-h-[120px]"
                                    placeholder="단계 내용을 입력하세요"
                                />
                            </div>

                            {/* 🎨 아이콘 선택 섹션 */}
                            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                                <IconSelector
                                    stepIcon={step.stepIcon}
                                    onChange={handleIconChange}
                                    stepType={step.type}
                                />
                            </div>

                            {/* 🎨 반응형 크기 조절 섹션 */}
                            <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-500/30">
                                <ResponsiveSizeEditor
                                    sizes={step.responsiveSizes}
                                    onChange={handleSizeChange}
                                />
                            </div>

                            {/* 타입별 특화 섹션 */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step.type}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {/* Order 타입 - 사용자 특별 요청 */}
                                    {step.type === "order" && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-purple-500/30">
                                            <div className="flex items-center gap-2 mb-4">
                                                <ListOrdered className="w-5 h-5 text-purple-400" />
                                                <h4 className="font-medium text-white">
                                                    순차적 단계 설정
                                                </h4>
                                            </div>
                                            <OrderItemEditor
                                                items={step.orderItems || []}
                                                onChange={(items) =>
                                                    onChange({
                                                        orderItems: items,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Bulletin 타입 */}
                                    {step.type === "bulletin" && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-orange-500/30">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Megaphone className="w-5 h-5 text-orange-400" />
                                                <h4 className="font-medium text-white">
                                                    공지사항 설정
                                                </h4>
                                            </div>
                                            <BulletinItemEditor
                                                items={step.bulletinItems || []}
                                                onChange={(items) =>
                                                    onChange({
                                                        bulletinItems: items,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* 이미지 타입 */}
                                    {step.type === "image" && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-500/30">
                                            <Label className="text-slate-300 text-sm font-medium">
                                                이미지 URL
                                            </Label>
                                            <div className="flex gap-2 mt-1">
                                                <Input
                                                    value={step.imageUrl || ""}
                                                    onChange={(e) =>
                                                        onChange({
                                                            imageUrl:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="flex-1 bg-slate-800 border-slate-600 text-white"
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-600 text-slate-300"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 비디오 타입 */}
                                    {step.type === "video" && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-500/30">
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-slate-300 text-sm font-medium">
                                                        비디오 URL
                                                    </Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            value={
                                                                step.videoUrl ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                onChange({
                                                                    videoUrl:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="flex-1 bg-slate-800 border-slate-600 text-white"
                                                            placeholder="https://example.com/video.mp4"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-slate-600 text-slate-300"
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-slate-300 text-sm font-medium">
                                                        썸네일 URL (선택)
                                                    </Label>
                                                    <Input
                                                        value={
                                                            step.imageUrl || ""
                                                        }
                                                        onChange={(e) =>
                                                            onChange({
                                                                imageUrl:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                                                        placeholder="https://example.com/thumbnail.jpg"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 액션 타입 */}
                                    {step.type === "action" && (
                                        <div className="bg-slate-700/30 rounded-lg p-4 border border-green-500/30">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-slate-300 text-sm font-medium">
                                                        액션 타입
                                                    </Label>
                                                    <Select
                                                        value={
                                                            step.actionType ||
                                                            "external_link"
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            onChange({
                                                                actionType:
                                                                    value as ExtendedTutorialStep["actionType"],
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {actionTypeOptions.map(
                                                                (option) => (
                                                                    <SelectItem
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {
                                                                                    option.label
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-slate-500">
                                                                                {
                                                                                    option.description
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {step.actionType ===
                                                    "external_link" && (
                                                    <div>
                                                        <Label className="text-slate-300 text-sm font-medium">
                                                            액션 URL
                                                        </Label>
                                                        <Input
                                                            value={
                                                                step.actionUrl ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                onChange({
                                                                    actionUrl:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="mt-1 bg-slate-800 border-slate-600 text-white"
                                                            placeholder="https://example.com"
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <Label className="text-slate-300 text-sm font-medium">
                                                        버튼 텍스트
                                                    </Label>
                                                    <Input
                                                        value={
                                                            step.buttonText ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            onChange({
                                                                buttonText:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="mt-1 bg-slate-800 border-slate-600 text-white"
                                                        placeholder="클릭하기"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
