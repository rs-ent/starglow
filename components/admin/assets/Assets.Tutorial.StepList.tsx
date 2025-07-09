/// components/admin/assets/Assets.Tutorial.StepList.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    BookOpen,
    MessageSquare,
    ImageIcon,
    Video,
    Check,
    Info,
    Megaphone,
    ListOrdered,
    GripVertical,
    Copy,
    Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/tailwind";

import type {
    StepListProps,
    ExtendedTutorialStep,
} from "./Assets.Tutorial.Types";

// 🎨 단계 타입 아이콘 매핑
const stepTypeIcons = {
    text: MessageSquare,
    action: Zap,
    image: ImageIcon,
    video: Video,
    success: Check,
    info: Info,
    bulletin: Megaphone,
    order: ListOrdered,
} as const;

// 🎨 단계 타입 색상 매핑
const stepTypeColors = {
    text: "border-blue-500/30 text-blue-300",
    action: "border-green-500/30 text-green-300",
    image: "border-purple-500/30 text-purple-300",
    video: "border-indigo-500/30 text-indigo-300",
    success: "border-emerald-500/30 text-emerald-300",
    info: "border-cyan-500/30 text-cyan-300",
    bulletin: "border-orange-500/30 text-orange-300",
    order: "border-pink-500/30 text-pink-300",
} as const;

// 🎨 단계 타입 배경 색상 매핑
const stepTypeBgColors = {
    text: "bg-blue-900/20",
    action: "bg-green-900/20",
    image: "bg-purple-900/20",
    video: "bg-indigo-900/20",
    success: "bg-emerald-900/20",
    info: "bg-cyan-900/20",
    bulletin: "bg-orange-900/20",
    order: "bg-pink-900/20",
} as const;

interface StepItemProps {
    step: ExtendedTutorialStep;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

function StepItem({
    step,
    index,
    isSelected,
    onSelect,
    onMoveUp,
    onMoveDown,
    onDelete,
    onDuplicate,
    canMoveUp,
    canMoveDown,
}: StepItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const IconComponent = stepTypeIcons[step.type] || MessageSquare;
    const colorClass = stepTypeColors[step.type] || stepTypeColors.text;
    const bgColorClass = stepTypeBgColors[step.type] || stepTypeBgColors.text;

    // 단계 요약 정보 생성
    const getStepSummary = () => {
        switch (step.type) {
            case "order":
                return `${step.orderItems?.length || 0}개 순서`;
            case "bulletin":
                return `${step.bulletinItems?.length || 0}개 공지`;
            case "action":
                return step.actionType === "discord_auth"
                    ? "Discord 인증"
                    : step.actionType === "external_link"
                    ? "외부 링크"
                    : "커스텀 액션";
            case "image":
                return step.imageUrl ? "이미지 설정됨" : "이미지 없음";
            case "video":
                return step.videoUrl ? "비디오 설정됨" : "비디오 없음";
            default:
                return step.content.length > 50
                    ? `${step.content.substring(0, 50)}...`
                    : step.content;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "relative rounded-lg border transition-all cursor-pointer",
                isSelected
                    ? "bg-purple-900/30 border-purple-500/50 shadow-lg"
                    : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-800/80",
                bgColorClass
            )}
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 선택 표시 */}
            {isSelected && (
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg" />
            )}

            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* 단계 번호 */}
                        <Badge
                            variant="outline"
                            className={cn(
                                "flex-shrink-0 font-medium",
                                colorClass
                            )}
                        >
                            {index + 1}
                        </Badge>

                        {/* 아이콘 */}
                        <div className="flex-shrink-0 mt-0.5">
                            <IconComponent
                                className={cn(
                                    "w-5 h-5",
                                    colorClass.split(" ")[1]
                                )}
                            />
                        </div>

                        {/* 콘텐츠 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white truncate">
                                    {step.title}
                                </h4>
                                <Badge
                                    variant="secondary"
                                    className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs"
                                >
                                    {step.type}
                                </Badge>
                            </div>

                            <p className="text-sm text-slate-400 line-clamp-2">
                                {getStepSummary()}
                            </p>
                        </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div
                        className={cn(
                            "flex items-center gap-1 transition-opacity",
                            isHovered || isSelected
                                ? "opacity-100"
                                : "opacity-0"
                        )}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-slate-400 hover:text-white"
                                >
                                    <GripVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveUp();
                                    }}
                                    disabled={!canMoveUp}
                                >
                                    <ArrowUp className="w-4 h-4 mr-2" />
                                    위로 이동
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveDown();
                                    }}
                                    disabled={!canMoveDown}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    아래로 이동
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate();
                                    }}
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    복사
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    삭제
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function TutorialStepList({
    steps,
    selectedIndex,
    onSelectStep,
    onAddStep,
    onMoveStep,
    onDeleteStep,
}: StepListProps) {
    const handleAddStep = () => {
        onAddStep();
    };

    const handleDuplicateStep = (index: number) => {
        const stepToDuplicate = steps[index];
        const duplicatedStep = {
            ...stepToDuplicate,
            id: `step-${Date.now()}`,
            title: `${stepToDuplicate.title} (복사)`,
            order: steps.length,
        };
        // 복사 로직은 부모 컴포넌트에서 처리 - TODO: 실제 복사 기능 구현 필요
        void duplicatedStep;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    튜토리얼 단계 ({steps.length})
                </h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                    {steps.map((step, index) => (
                        <StepItem
                            key={step.id}
                            step={step}
                            index={index}
                            isSelected={selectedIndex === index}
                            onSelect={() => onSelectStep(index)}
                            onMoveUp={() => onMoveStep(index, index - 1)}
                            onMoveDown={() => onMoveStep(index, index + 1)}
                            onDelete={() => onDeleteStep(index)}
                            onDuplicate={() => handleDuplicateStep(index)}
                            canMoveUp={index > 0}
                            canMoveDown={index < steps.length - 1}
                        />
                    ))}
                </AnimatePresence>

                {steps.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <div className="text-xl font-semibold text-slate-300 mb-2">
                                단계가 없습니다
                            </div>
                            <div className="text-slate-400 mb-6">
                                첫 번째 단계를 추가하여 튜토리얼을 시작하세요
                            </div>
                            <Button
                                onClick={handleAddStep}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />첫 번째 단계
                                추가하기
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 단계 추가 버튼 - 단계들이 있을 때 */}
            {steps.length > 0 && (
                <Button
                    onClick={handleAddStep}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white border-dashed"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    단계 추가
                </Button>
            )}

            {/* 단계 요약 정보 */}
            {steps.length > 0 && (
                <Card className="bg-slate-800/30 border-slate-700/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-300">
                            단계 요약
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">총 단계:</span>
                                <span className="text-white font-medium">
                                    {steps.length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">선택됨:</span>
                                <span className="text-white font-medium">
                                    {selectedIndex + 1}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">텍스트:</span>
                                <span className="text-white font-medium">
                                    {
                                        steps.filter((s) => s.type === "text")
                                            .length
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">액션:</span>
                                <span className="text-white font-medium">
                                    {
                                        steps.filter((s) => s.type === "action")
                                            .length
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">순서:</span>
                                <span className="text-white font-medium">
                                    {
                                        steps.filter((s) => s.type === "order")
                                            .length
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">공지:</span>
                                <span className="text-white font-medium">
                                    {
                                        steps.filter(
                                            (s) => s.type === "bulletin"
                                        ).length
                                    }
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
