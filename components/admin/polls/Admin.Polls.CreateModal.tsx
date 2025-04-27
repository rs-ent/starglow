/// app/admin/polls/Admin.Polls.CreateModal.tsx

"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePollInput, PollOption } from "@/app/actions/polls";
import { PollCategory, PollStatus, RewardCurrency } from "@prisma/client";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
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

const pollSchemaShape = z.object({
    id: z
        .string()
        .regex(/^p\d+$/, "ID는 'p'로 시작하고 숫자가 와야 합니다")
        .optional(), // optional로 변경
    title: z
        .string()
        .min(1, "제목을 입력해주세요")
        .max(200, "제목은 200자를 넘을 수 없습니다"),
    titleShorten: z
        .string()
        .max(20, "제목 줄임말은 20자를 넘을 수 없습니다")
        .optional(),
    description: z
        .string()
        .max(400, "설명은 400자를 넘을 수 없습니다")
        .optional(),
    category: z.nativeEnum(PollCategory),
    status: z.nativeEnum(PollStatus),
    options: z.array(
        z.object({
            optionId: z.string(),
            option: z.string().min(1, "옵션 내용을 입력해주세요"),
            optionShorten: z.string().optional(),
            description: z.string().optional(),
            imgUrl: z.string().optional(),
            youtubeUrl: z.string().optional(),
        })
    ),
    imgUrl: z.string().url("이미지 URL이 올바르지 않습니다").optional(),
    youtubeUrl: z.string().url("유튜브 URL이 올바르지 않습니다").optional(),
    startDate: z.date(),
    endDate: z.date(),
    exposeInScheduleTab: z.boolean(),
    needToken: z.boolean(),
    needTokenAddress: z.string().optional(),
    bettingMode: z.boolean().optional(),
    minimumBet: z.number().min(0).optional(),
    maximumBet: z.number().min(0).optional(),
    allowMultipleVote: z.boolean().optional(),
    participationRewards: z.number().min(0).optional(),
    rewardCurrency: z.nativeEnum(RewardCurrency).optional(),
    minimumPoints: z.number().min(0).optional(),
    minimumSGP: z.number().min(0).optional(),
    minimumSGT: z.number().min(0).optional(),
    requiredQuests: z.array(z.string()).optional(),
});

type FormErrors = {
    [K in keyof z.infer<typeof pollSchemaShape>]?: string;
};

interface PollCreateModalProps {
    open: boolean;
    onClose: () => void;
}

export default function PollCreateModal({
    open,
    onClose,
}: PollCreateModalProps) {
    const { polls, isLoading, error } = usePollsGet();
    const { createPoll } = usePollsSet();
    const { everyCollections, isLoading: isLoadingEveryCollections } =
        useFactoryGet({});
    console.log(everyCollections);
    const newPollId = `p${((polls?.length ?? 0) + 1)
        .toString()
        .padStart(4, "0")}`;

    const {
        control,
        handleSubmit,
        formState: { errors: formErrors },
        watch,
    } = useForm<z.infer<typeof pollSchemaShape>>({
        resolver: zodResolver(pollSchemaShape),
        defaultValues: {
            id: newPollId,
            title: "",
            titleShorten: "",
            category: PollCategory.GENERAL,
            status: PollStatus.ACTIVE,
            options: [],
            startDate: new Date(),
            endDate: new Date(),
            exposeInScheduleTab: false,
            needToken: false,
        },
    });

    const onSubmit = (data: z.infer<typeof pollSchemaShape>) => {
        createPoll(data as CreatePollInput);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        신규 폴 생성기
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" aria-label="닫기">
                            ✕
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 min-h-0 w-full flex justify-center items-start"
                >
                    <div className="w-full h-full px-8 py-12 overflow-y-auto space-y-8 text-lg">
                        {/* id */}
                        <Controller
                            name="id"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="ID"
                                    required
                                    error={formErrors.id?.message}
                                >
                                    <Input {...field} className="py-3" />
                                </FormField>
                            )}
                        />

                        {/* title */}
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="제목"
                                    required
                                    error={formErrors.title?.message}
                                >
                                    <Input
                                        {...field}
                                        maxLength={100}
                                        className="py-3"
                                        placeholder="제목을 입력하세요"
                                    />
                                </FormField>
                            )}
                        />

                        {/* titleShorten */}
                        <Controller
                            name="titleShorten"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="짧은 제목"
                                    error={formErrors.titleShorten?.message}
                                >
                                    <Input
                                        {...field}
                                        maxLength={20}
                                        className="py-3"
                                        placeholder="짧은 제목을 입력하세요"
                                    />
                                </FormField>
                            )}
                        />

                        {/* description */}
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="설명"
                                    error={formErrors.description?.message}
                                >
                                    <Textarea
                                        {...field}
                                        maxLength={200}
                                        className="py-3"
                                        placeholder="설명을 입력하세요"
                                    />
                                </FormField>
                            )}
                        />

                        {/* category */}
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="카테고리"
                                    required
                                    error={formErrors.category?.message}
                                >
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                field.value ===
                                                PollCategory.GENERAL
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                field.onChange(
                                                    PollCategory.GENERAL
                                                )
                                            }
                                            className="flex-1"
                                        >
                                            일반
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={
                                                field.value === PollCategory.NFT
                                                    ? "default"
                                                    : "outline"
                                            }
                                            onClick={() =>
                                                field.onChange(PollCategory.NFT)
                                            }
                                            className="flex-1"
                                        >
                                            NFT
                                        </Button>
                                    </div>
                                </FormField>
                            )}
                        />

                        {/* Submit 버튼 수정 */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={Object.keys(formErrors).length > 0}
                                className="px-8"
                            >
                                저장
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

function FormField({
    label,
    required = false,
    error,
    children,
}: FormFieldProps) {
    return (
        <div className="space-y-2">
            <label className="block font-semibold">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
    );
}
