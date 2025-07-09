/// components/admin/assets/Assets.Tutorial.Customization.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Palette,
    Type,
    Settings,
    Sparkles,
    RotateCcw,
    ChevronDown,
    ChevronRight,
    Eye,
    Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type {
    CustomizationPanelProps,
    ExtendedTutorialCustomization,
} from "./Assets.Tutorial.Types";
import type { CustomizationPreset } from "@/app/actions/assets/tutorial-actions";

// 🎨 색상 프리셋 (타입에서 가져오기)
const colorPresets = [
    { name: "Purple", primary: "#8B5CF6", secondary: "#A78BFA", bg: "#1E1B4B" },
    { name: "Blue", primary: "#3B82F6", secondary: "#60A5FA", bg: "#1E3A8A" },
    { name: "Green", primary: "#10B981", secondary: "#34D399", bg: "#064E3B" },
    { name: "Red", primary: "#EF4444", secondary: "#F87171", bg: "#7C2D12" },
    { name: "Orange", primary: "#F59E0B", secondary: "#FBBF24", bg: "#92400E" },
    { name: "Pink", primary: "#EC4899", secondary: "#F472B6", bg: "#831843" },
    { name: "Gray", primary: "#6B7280", secondary: "#9CA3AF", bg: "#111827" },
] as const;

// 🎨 프리셋 정보
const presetInfo = {
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

interface ColorSectionProps {
    customization: ExtendedTutorialCustomization;
    onChange: (updates: Partial<ExtendedTutorialCustomization>) => void;
}

function ColorSection({ customization, onChange }: ColorSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-400" />
                        색상 설정
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
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
                        <CardContent className="space-y-4">
                            {/* 프리셋 색상 */}
                            <div>
                                <Label className="text-slate-300 text-sm font-medium">
                                    빠른 색상 선택
                                </Label>
                                <div className="grid grid-cols-7 gap-2 mt-2">
                                    {colorPresets.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() =>
                                                onChange({
                                                    primaryColor:
                                                        preset.primary,
                                                    secondaryColor:
                                                        preset.secondary,
                                                    backgroundColor: preset.bg,
                                                })
                                            }
                                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-600 hover:border-slate-400 transition-all"
                                            style={{
                                                background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            <div className="absolute bottom-1 left-1 right-1">
                                                <div className="text-xs text-white font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {preset.name}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 개별 색상 설정 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        주요 색상
                                    </Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={
                                                customization.primaryColor ||
                                                "#8B5CF6"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    primaryColor:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-12 h-8 p-1 border-slate-600"
                                        />
                                        <Input
                                            value={
                                                customization.primaryColor ||
                                                "#8B5CF6"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    primaryColor:
                                                        e.target.value,
                                                })
                                            }
                                            className="flex-1 bg-slate-800 border-slate-600 text-white text-sm"
                                            placeholder="#8B5CF6"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        보조 색상
                                    </Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={
                                                customization.secondaryColor ||
                                                "#A78BFA"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    secondaryColor:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-12 h-8 p-1 border-slate-600"
                                        />
                                        <Input
                                            value={
                                                customization.secondaryColor ||
                                                "#A78BFA"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    secondaryColor:
                                                        e.target.value,
                                                })
                                            }
                                            className="flex-1 bg-slate-800 border-slate-600 text-white text-sm"
                                            placeholder="#A78BFA"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        배경 색상
                                    </Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={
                                                customization.backgroundColor ||
                                                "#1E1B4B"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    backgroundColor:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-12 h-8 p-1 border-slate-600"
                                        />
                                        <Input
                                            value={
                                                customization.backgroundColor ||
                                                "#1E1B4B"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    backgroundColor:
                                                        e.target.value,
                                                })
                                            }
                                            className="flex-1 bg-slate-800 border-slate-600 text-white text-sm"
                                            placeholder="#1E1B4B"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        강조 색상
                                    </Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={
                                                customization.accentColor ||
                                                "#C4B5FD"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    accentColor: e.target.value,
                                                })
                                            }
                                            className="w-12 h-8 p-1 border-slate-600"
                                        />
                                        <Input
                                            value={
                                                customization.accentColor ||
                                                "#C4B5FD"
                                            }
                                            onChange={(e) =>
                                                onChange({
                                                    accentColor: e.target.value,
                                                })
                                            }
                                            className="flex-1 bg-slate-800 border-slate-600 text-white text-sm"
                                            placeholder="#C4B5FD"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

interface TitleSectionProps {
    customization: ExtendedTutorialCustomization;
    onChange: (updates: Partial<ExtendedTutorialCustomization>) => void;
}

function TitleSection({ customization, onChange }: TitleSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-blue-400" />
                        제목 설정
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
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
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-slate-300 text-sm font-medium">
                                    메인 제목
                                </Label>
                                <Input
                                    value={customization.mainTitle || ""}
                                    onChange={(e) =>
                                        onChange({ mainTitle: e.target.value })
                                    }
                                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                                    placeholder="튜토리얼"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300 text-sm font-medium">
                                    부제목
                                </Label>
                                <Input
                                    value={customization.subtitle || ""}
                                    onChange={(e) =>
                                        onChange({ subtitle: e.target.value })
                                    }
                                    className="mt-1 bg-slate-800 border-slate-600 text-white"
                                    placeholder="새로운 기능을 배워보세요"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300 text-sm font-medium">
                                    메인 아이콘
                                </Label>
                                <Select
                                    value={
                                        customization.mainIcon ||
                                        "graduation-cap"
                                    }
                                    onValueChange={(value) =>
                                        onChange({ mainIcon: value })
                                    }
                                >
                                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="graduation-cap">
                                            🎓 졸업모자
                                        </SelectItem>
                                        <SelectItem value="sparkles">
                                            ✨ 반짝임
                                        </SelectItem>
                                        <SelectItem value="star">
                                            ⭐ 별
                                        </SelectItem>
                                        <SelectItem value="gift">
                                            🎁 선물
                                        </SelectItem>
                                        <SelectItem value="rocket">
                                            🚀 로켓
                                        </SelectItem>
                                        <SelectItem value="lightbulb">
                                            💡 전구
                                        </SelectItem>
                                        <SelectItem value="info">
                                            ℹ️ 정보
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

interface StyleSectionProps {
    customization: ExtendedTutorialCustomization;
    onChange: (updates: Partial<ExtendedTutorialCustomization>) => void;
}

function StyleSection({ customization, onChange }: StyleSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-green-400" />
                        스타일 설정
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
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
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        버튼 스타일
                                    </Label>
                                    <Select
                                        value={
                                            customization.buttonStyle ||
                                            "rounded"
                                        }
                                        onValueChange={(
                                            value: "rounded" | "square" | "pill"
                                        ) => onChange({ buttonStyle: value })}
                                    >
                                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rounded">
                                                둥근 모서리
                                            </SelectItem>
                                            <SelectItem value="square">
                                                사각형
                                            </SelectItem>
                                            <SelectItem value="pill">
                                                캡슐형
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        버튼 크기
                                    </Label>
                                    <Select
                                        value={
                                            customization.buttonSize || "medium"
                                        }
                                        onValueChange={(
                                            value: "small" | "medium" | "large"
                                        ) => onChange({ buttonSize: value })}
                                    >
                                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">
                                                작게
                                            </SelectItem>
                                            <SelectItem value="medium">
                                                보통
                                            </SelectItem>
                                            <SelectItem value="large">
                                                크게
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-slate-300 text-sm font-medium">
                                    레이아웃
                                </Label>
                                <Select
                                    value={customization.layout || "centered"}
                                    onValueChange={(
                                        value: "centered" | "left" | "right"
                                    ) => onChange({ layout: value })}
                                >
                                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="centered">
                                            중앙 정렬
                                        </SelectItem>
                                        <SelectItem value="left">
                                            왼쪽 정렬
                                        </SelectItem>
                                        <SelectItem value="right">
                                            오른쪽 정렬
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 text-sm font-medium">
                                        진행률 표시
                                    </Label>
                                    <Switch
                                        checked={
                                            customization.showProgressBar ??
                                            true
                                        }
                                        onCheckedChange={(checked) =>
                                            onChange({
                                                showProgressBar: checked,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 text-sm font-medium">
                                        단계 번호 표시
                                    </Label>
                                    <Switch
                                        checked={
                                            customization.showStepNumbers ??
                                            true
                                        }
                                        onCheckedChange={(checked) =>
                                            onChange({
                                                showStepNumbers: checked,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

interface AnimationSectionProps {
    customization: ExtendedTutorialCustomization;
    onChange: (updates: Partial<ExtendedTutorialCustomization>) => void;
}

function AnimationSection({ customization, onChange }: AnimationSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        애니메이션
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
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
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-sm font-medium">
                                    애니메이션 활성화
                                </Label>
                                <Switch
                                    checked={
                                        customization.enableAnimations ?? true
                                    }
                                    onCheckedChange={(checked) =>
                                        onChange({ enableAnimations: checked })
                                    }
                                />
                            </div>

                            {customization.enableAnimations && (
                                <div>
                                    <Label className="text-slate-300 text-sm font-medium">
                                        애니메이션 속도
                                    </Label>
                                    <Select
                                        value={
                                            customization.animationSpeed ||
                                            "normal"
                                        }
                                        onValueChange={(
                                            value: "slow" | "normal" | "fast"
                                        ) =>
                                            onChange({ animationSpeed: value })
                                        }
                                    >
                                        <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="slow">
                                                느리게
                                            </SelectItem>
                                            <SelectItem value="normal">
                                                보통
                                            </SelectItem>
                                            <SelectItem value="fast">
                                                빠르게
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

export default function TutorialCustomizationPanel({
    customization,
    onChange,
    onApplyPreset,
    isLoading = false,
}: CustomizationPanelProps) {
    return (
        <div className="space-y-4">
            {/* 프리셋 선택 */}
            <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Wand2 className="w-5 h-5 text-pink-400" />
                        빠른 시작 프리셋
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        {(Object.keys(presetInfo) as CustomizationPreset[]).map(
                            (preset) => (
                                <button
                                    key={preset}
                                    onClick={() => onApplyPreset(preset)}
                                    disabled={isLoading}
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 transition-all text-left disabled:opacity-50"
                                >
                                    <div>
                                        <div className="font-medium text-white">
                                            {presetInfo[preset].name}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            {presetInfo[preset].description}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {presetInfo[preset].preview}
                                        </div>
                                    </div>
                                    <Eye className="w-4 h-4 text-slate-400" />
                                </button>
                            )
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 상세 커스터마이제이션 */}
            <div className="space-y-3">
                <ColorSection
                    customization={customization}
                    onChange={onChange}
                />
                <TitleSection
                    customization={customization}
                    onChange={onChange}
                />
                <StyleSection
                    customization={customization}
                    onChange={onChange}
                />
                <AnimationSection
                    customization={customization}
                    onChange={onChange}
                />
            </div>

            {/* 리셋 버튼 */}
            <Button
                variant="outline"
                onClick={() => onApplyPreset("default")}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                disabled={isLoading}
            >
                <RotateCcw className="w-4 h-4 mr-2" />
                기본값으로 리셋
            </Button>
        </div>
    );
}
