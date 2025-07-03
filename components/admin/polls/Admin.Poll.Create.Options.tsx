/// components/admin/polls/Admin.Poll.Create.Options.tsx

"use client";

import React, { useState } from "react";
import { Users, ChevronDown, GripVertical } from "lucide-react";
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
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import { useToast } from "@/app/hooks/useToast";
import { getYoutubeVideoId } from "@/lib/utils/youtube";

import { Section } from "./shared-components";
import {
    type OptionManagementProps,
    type OptionCardProps,
    type SortableOptionProps,
    type PollOption,
} from "./types";

export function OptionsTab({
    formData,
    onChange,
    selectedOption,
    setSelectedOption,
    showOptionCard,
    setShowOptionCard,
    onAddOption,
    onDeleteOption,
    onUpdateOption,
}: OptionManagementProps) {
    // DnD sensors setup
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
            onChange("options", newOptions);
        }
    };

    return (
        <Section title="폴 옵션" icon={<Users className="w-5 h-5" />}>
            <div className="space-y-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={formData.hasAnswer}
                                onCheckedChange={(checked) => {
                                    if (!checked) {
                                        onChange("hasAnswer", false);
                                        onChange("answerOptionIds", []);
                                    } else {
                                        onChange("hasAnswer", true);
                                        onChange(
                                            "hasAnswerAnnouncement",
                                            false
                                        );
                                        onChange(
                                            "answerAnnouncementDate",
                                            undefined
                                        );
                                    }
                                }}
                            />
                            <Label className="text-slate-200">
                                정답이 있는 폴
                            </Label>
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={formData.hasAnswerAnnouncement}
                                onCheckedChange={(checked) => {
                                    if (!checked) {
                                        onChange(
                                            "hasAnswerAnnouncement",
                                            false
                                        );
                                        onChange("answerOptionIds", []);
                                    } else {
                                        onChange("hasAnswerAnnouncement", true);
                                        onChange(
                                            "answerAnnouncementDate",
                                            formData.answerAnnouncementDate ||
                                                formData.endDate ||
                                                new Date()
                                        );
                                        onChange("hasAnswer", false);
                                        onChange("answerOptionIds", []);
                                    }
                                }}
                            />
                            <Label className="text-slate-200">
                                나중에 정답이 정해지는 폴
                            </Label>
                        </div>
                        <Button
                            type="button"
                            onClick={onAddOption}
                            variant="outline"
                            className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                        >
                            + 옵션 추가
                        </Button>
                    </div>

                    {formData.hasAnswerAnnouncement && (
                        <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-600/50 space-y-4">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={formData.hasAnswerAnnouncement}
                                    onCheckedChange={(checked) => {
                                        onChange(
                                            "hasAnswerAnnouncement",
                                            checked
                                        );
                                        if (!checked) {
                                            onChange(
                                                "answerAnnouncementDate",
                                                undefined
                                            );
                                        }
                                    }}
                                />
                                <Label className="text-slate-200">
                                    정답 발표 예약
                                </Label>
                            </div>
                            {formData.hasAnswerAnnouncement && (
                                <div>
                                    <DateTimePicker
                                        value={
                                            formData.answerAnnouncementDate ||
                                            formData.endDate ||
                                            new Date()
                                        }
                                        onChange={(value) =>
                                            onChange(
                                                "answerAnnouncementDate",
                                                value
                                            )
                                        }
                                        label="정답 발표 일시"
                                        showTime={true}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={(formData.options || []).map(
                            (option) => option.optionId
                        )}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {(formData.options || []).map((option) => (
                                <div
                                    key={option.optionId}
                                    className="space-y-2"
                                >
                                    <SortableOption id={option.optionId}>
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
                                                                if (checked) {
                                                                    newIds = [
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
                                                                onChange(
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
                                                            onDeleteOption(
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
                                                option={option}
                                                editing={true}
                                                onSave={onUpdateOption}
                                            />
                                        )}
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </Section>
    );
}

// Sortable Option Component
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

// Option Card Component
function OptionCard({ option, editing = false, onSave }: OptionCardProps) {
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
