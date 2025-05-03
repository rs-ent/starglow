/// app/admin/polls/Admin.Polls.CreateModal.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm, Controller, UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CreatePollInput,
    PollOption,
    UpdatePollInput,
} from "@/app/actions/polls";
import { PollCategory, PollStatus, RewardCurrency } from "@prisma/client";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import { useAssetsGet } from "@/app/hooks/useAssets";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CollectionCard from "@/components/molecules/NFTs.CollectionCard";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import Image from "next/image";
import { useLoading } from "@/app/hooks/useLoading";
import { useToast } from "@/app/hooks/useToast";
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/utils/youtube";

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
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    description: z
        .string()
        .max(400, "설명은 400자를 넘을 수 없습니다")
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    category: z.nativeEnum(PollCategory),
    status: z.nativeEnum(PollStatus),
    options: z.array(
        z.object({
            optionId: z.string(),
            name: z.string().min(1, "옵션 내용을 입력해주세요"),
            shorten: z
                .string()
                .transform((val) => (val === "" ? undefined : val))
                .optional(),
            description: z
                .string()
                .transform((val) => (val === "" ? undefined : val))
                .optional(),
            imgUrl: z
                .string()
                .transform((val) => (val === "" ? undefined : val))
                .optional(),
            youtubeUrl: z
                .string()
                .transform((val) => (val === "" ? undefined : val))
                .optional(),
        })
    ),
    optionsOrder: z.array(z.string()),
    imgUrl: z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    youtubeUrl: z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    startDate: z.date(),
    endDate: z.date(),
    exposeInScheduleTab: z.boolean(),
    needToken: z.boolean(),
    needTokenAddress: z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    participationRewardAssetId: z.string().optional(),
    participationRewardAmount: z.number().min(0).optional(),
    bettingMode: z.boolean().optional(),
    bettingAssetId: z.string().optional(),
    minimumBet: z.number().min(0).optional(),
    maximumBet: z.number().min(0).optional(),
    allowMultipleVote: z.boolean().optional(),
    minimumPoints: z.number().min(0).optional(),
    minimumSGP: z.number().min(0).optional(),
    minimumSGT: z.number().min(0).optional(),
    requiredQuests: z.array(z.string()).optional(),
});

interface PollCreateModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: z.infer<typeof pollSchemaShape>;
    mode?: "create" | "edit";
}

export default function PollCreateModal({
    open,
    onClose,
    initialData,
    mode = "create",
}: PollCreateModalProps) {
    const { startLoading, endLoading } = useLoading();
    const toast = useToast();
    const {
        pollsList,
        isLoading: isLoadingPolls,
        error: errorPolls,
    } = usePollsGet({});
    const polls = pollsList?.items;
    const { createPoll, updatePoll, isLoading, error } = usePollsSet();
    const { everyCollections, isLoading: isLoadingEveryCollections } =
        useFactoryGet({});
    const newPollId = `p${((polls?.length ?? 0) + 1)
        .toString()
        .padStart(4, "0")}`;

    const { assets, isLoading: isLoadingAssets } = useAssetsGet({
        getAssetsInput: {
            isActive: true,
        },
    });
    console.log(assets);

    const {
        control,
        handleSubmit,
        formState: { errors: formErrors },
        setValue,
        watch,
        reset,
    } = useForm<z.infer<typeof pollSchemaShape>>({
        resolver: zodResolver(pollSchemaShape),
        defaultValues: initialData || {
            id: newPollId,
            title: "",
            titleShorten: "",
            category: PollCategory.PUBLIC,
            status: PollStatus.ACTIVE,
            options: [],
            optionsOrder: [],
            imgUrl: "",
            youtubeUrl: "",
            startDate: (() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(17, 0, 0, 0);
                return tomorrow;
            })(),
            endDate: (() => {
                const sevenDaysLater = new Date();
                sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
                sevenDaysLater.setHours(17, 0, 0, 0);
                return sevenDaysLater;
            })(),
            exposeInScheduleTab: false,
            needToken: false,
            needTokenAddress: "",
            bettingMode: false,
            bettingAssetId: undefined,
            minimumBet: 0,
            maximumBet: 0,
            allowMultipleVote: false,
            participationRewardAssetId: undefined,
            participationRewardAmount: undefined,
            minimumPoints: 0,
            minimumSGP: 0,
            minimumSGT: 0,
            requiredQuests: [],
        },
    });

    useEffect(() => {
        if (open && initialData) {
            reset(initialData);
        }
    }, [open, initialData, reset]);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "category") {
                const isPrivate = value.category === PollCategory.PRIVATE;
                setValue("needToken", isPrivate);
                if (!isPrivate) {
                    setValue("needTokenAddress", "");
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, control]);

    const onSubmit = async (data: z.infer<typeof pollSchemaShape>) => {
        try {
            startLoading();

            if (!data.title) {
                toast.error("제목을 입력해주세요.");
                return;
            }

            if (!data.options || data.options.length < 2) {
                toast.error("최소 2개 이상의 옵션을 입력해주세요.");
                return;
            }

            const invalidOptions = data.options.filter((option) => {
                if (!option.name) {
                    toast.error("옵션 이름을 입력해주세요.");
                    return true;
                }
                return false;
            });

            if (invalidOptions.length > 0) {
                return;
            }

            if (!data.imgUrl && !data.youtubeUrl) {
                toast.error("이미지 또는 유튜브 URL을 입력해주세요.");
                return;
            }

            if (data.startDate >= data.endDate) {
                toast.error("시작일이 종료일보다 이전이어야 합니다.");
                return;
            }

            if (
                data.category === PollCategory.PRIVATE &&
                !data.needTokenAddress
            ) {
                toast.error("토큰게이팅을 위한 컨트랙트 주소를 입력해주세요.");
                return;
            }

            if (
                data.participationRewardAmount &&
                !data.participationRewardAssetId
            ) {
                toast.error(
                    "보상 수량을 설정할 때는 보상 에셋을 선택해주세요."
                );
                return;
            }

            if (mode === "edit" && initialData) {
                await updatePoll({
                    ...data,
                    id: initialData.id,
                } as UpdatePollInput);
                toast.success(
                    `${initialData.id} 폴이 성공적으로 수정되었습니다.`
                );
            } else {
                await createPoll(data as CreatePollInput);
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
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] h-[95%] !max-w-none !max-h-none rounded-md flex flex-col p-0 bg-background shadow-2xl">
                <DialogHeader className="flex-none min-h-[5vh] px-6 py-2 border-b flex flex-row items-center justify-between bg-background/80 z-10">
                    <DialogTitle className="text-xl font-bold">
                        {mode === "create"
                            ? "신규 폴 생성기"
                            : `${initialData?.id} 수정하기`}
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
                        <div className="grid grid-cols-2 gap-8">
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

                            {/* media : ImgUrl */}
                            <div className="flex flex-col gap-2">
                                <Controller
                                    name="imgUrl"
                                    control={control}
                                    render={({ field }) => (
                                        <FormField
                                            label="이미지"
                                            error={formErrors.imgUrl?.message}
                                        >
                                            <div className="flex gap-2">
                                                {field.value && (
                                                    <Image
                                                        src={field.value}
                                                        alt="이미지"
                                                        width={170}
                                                        height={170}
                                                        className="object-cover rounded-md"
                                                    />
                                                )}
                                                <div className="flex flex-col gap-2">
                                                    <Input
                                                        {...field}
                                                        placeholder="이미지 URL을 입력하거나 아래에서 업로드하세요"
                                                    />
                                                    <FileUploader
                                                        purpose="poll-option"
                                                        bucket="images"
                                                        onComplete={(files) => {
                                                            if (
                                                                files &&
                                                                files.length > 0
                                                            ) {
                                                                field.onChange(
                                                                    files[0].url
                                                                );
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
                                                        maxSize={
                                                            5 * 1024 * 1024
                                                        }
                                                        multiple={false}
                                                    />
                                                </div>
                                            </div>
                                        </FormField>
                                    )}
                                />
                            </div>

                            {/* media : YoutubeUrl */}
                            <Controller
                                name="youtubeUrl"
                                control={control}
                                render={({ field }) => {
                                    // youtubeUrl이 변경될 때마다 썸네일 URL 업데이트
                                    useEffect(() => {
                                        const updateThumbnail = async () => {
                                            if (
                                                field.value &&
                                                !watch("imgUrl")
                                            ) {
                                                const thumbnailUrl =
                                                    await getYoutubeThumbnailUrl(
                                                        field.value
                                                    );

                                                console.log(
                                                    "thumbnailUrl",
                                                    thumbnailUrl
                                                );
                                                if (thumbnailUrl) {
                                                    setValue(
                                                        "imgUrl",
                                                        thumbnailUrl
                                                    );
                                                }
                                            }
                                        };
                                        updateThumbnail();
                                    }, [field.value]);

                                    return (
                                        <FormField
                                            label="유튜브 URL"
                                            error={
                                                formErrors.youtubeUrl?.message
                                            }
                                        >
                                            <div className="flex flex-col gap-2">
                                                {field.value && (
                                                    <div className="w-[350px]">
                                                        <YoutubeViewer
                                                            videoId={
                                                                getYoutubeVideoId(
                                                                    field.value
                                                                ) || undefined
                                                            }
                                                            autoPlay={false}
                                                            framePadding={0}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-2">
                                                    <Input
                                                        {...field}
                                                        placeholder="유튜브 URL을 입력하세요"
                                                    />
                                                </div>
                                            </div>
                                        </FormField>
                                    );
                                }}
                            />

                            {/* category */}
                            <div className="flex flex-col gap-2">
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
                                                        PollCategory.PUBLIC
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    onClick={() =>
                                                        field.onChange(
                                                            PollCategory.PUBLIC
                                                        )
                                                    }
                                                    className="flex-1"
                                                >
                                                    PUBLIC
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        field.value ===
                                                        PollCategory.PRIVATE
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    onClick={() =>
                                                        field.onChange(
                                                            PollCategory.PRIVATE
                                                        )
                                                    }
                                                    className="flex-1"
                                                >
                                                    PRIVATE (토큰게이팅)
                                                </Button>
                                            </div>
                                        </FormField>
                                    )}
                                />

                                {/* needTokenAddress (PRIVATE 카테고리일 때만 표시) */}
                                {watch("category") === PollCategory.PRIVATE && (
                                    <Controller
                                        name="needTokenAddress"
                                        control={control}
                                        render={({ field }) => (
                                            <FormField
                                                label="토큰 컨트랙트 주소"
                                                required
                                                error={
                                                    formErrors.needTokenAddress
                                                        ?.message
                                                }
                                            >
                                                <div className="space-y-4">
                                                    <Input
                                                        {...field}
                                                        className="py-3"
                                                        placeholder="토큰 컨트랙트 주소를 입력하세요"
                                                    />

                                                    {/* 컬렉션 선택 UI */}
                                                    <div className="flex gap-4 overflow-auto">
                                                        {everyCollections?.map(
                                                            (collection) => (
                                                                <div
                                                                    key={
                                                                        collection.address
                                                                    }
                                                                    onClick={() =>
                                                                        field.onChange(
                                                                            collection.address
                                                                        )
                                                                    }
                                                                    className={`cursor-pointer w-[300px] h-[150px] ${
                                                                        field.value ===
                                                                        collection.address
                                                                            ? "ring-2 ring-primary"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <CollectionCard
                                                                        collection={
                                                                            collection
                                                                        }
                                                                        showPrice={
                                                                            false
                                                                        }
                                                                        showSharePercentage={
                                                                            false
                                                                        }
                                                                        showCirculation={
                                                                            false
                                                                        }
                                                                        isLinked={
                                                                            false
                                                                        }
                                                                    />
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </FormField>
                                        )}
                                    />
                                )}
                            </div>

                            <Controller
                                name="needToken"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="hidden"
                                        {...field}
                                        value={field.value ? "true" : "false"}
                                    />
                                )}
                            />

                            {/* 날짜 선택 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* 시작일 */}
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field }) => (
                                        <DateTimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            label="시작일"
                                            required
                                            error={
                                                formErrors.startDate?.message
                                            }
                                            showTime={true}
                                            disabled={false}
                                        />
                                    )}
                                />

                                {/* 종료일 */}
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field }) => (
                                        <DateTimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            label="종료일"
                                            required
                                            error={formErrors.endDate?.message}
                                        />
                                    )}
                                />
                            </div>

                            {/* 중복 투표 허용 여부 */}
                            <Controller
                                name="allowMultipleVote"
                                control={control}
                                render={({ field }) => (
                                    <FormField
                                        label="중복 투표 허용 여부"
                                        required
                                        error={
                                            formErrors.allowMultipleVote
                                                ?.message
                                        }
                                    >
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={
                                                    field.value === true
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    field.onChange(true)
                                                }
                                                className="flex-1"
                                            >
                                                중복 투표 허용
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={
                                                    field.value === false
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    field.onChange(false)
                                                }
                                                className="flex-1"
                                            >
                                                중복 투표 불가
                                            </Button>
                                        </div>
                                    </FormField>
                                )}
                            />

                            {/* Participation Rewards */}
                            <div className="flex flex-row gap-4 w-full">
                                <Controller
                                    name="participationRewardAssetId"
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <FormField
                                                label="참여 보상 에셋"
                                                error={
                                                    formErrors
                                                        .participationRewardAssetId
                                                        ?.message
                                                }
                                            >
                                                <div className="space-y-4">
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="보상 에셋을 선택하세요" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {isLoadingAssets ? (
                                                                <SelectItem value="">
                                                                    로딩 중...
                                                                </SelectItem>
                                                            ) : (
                                                                assets?.assets?.map(
                                                                    (asset) => (
                                                                        <SelectItem
                                                                            key={
                                                                                asset.id
                                                                            }
                                                                            value={
                                                                                asset.id
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                {asset.iconUrl && (
                                                                                    <Image
                                                                                        src={
                                                                                            asset.iconUrl
                                                                                        }
                                                                                        alt={
                                                                                            asset.name
                                                                                        }
                                                                                        width={
                                                                                            24
                                                                                        }
                                                                                        height={
                                                                                            24
                                                                                        }
                                                                                        className="rounded-full"
                                                                                    />
                                                                                )}
                                                                                <span>
                                                                                    {
                                                                                        asset.name
                                                                                    }
                                                                                </span>
                                                                                <span className="text-muted-foreground">
                                                                                    (
                                                                                    {
                                                                                        asset.symbol
                                                                                    }

                                                                                    )
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    )
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </FormField>
                                        );
                                    }}
                                />

                                <Controller
                                    name="participationRewardAmount"
                                    control={control}
                                    render={({ field }) => (
                                        <FormField
                                            label="보상 수량"
                                            error={
                                                formErrors
                                                    .participationRewardAmount
                                                    ?.message
                                            }
                                            className="flex-1"
                                        >
                                            <Input
                                                value={
                                                    field.value?.toString() ||
                                                    ""
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    if (
                                                        value === "" ||
                                                        /^\d+$/.test(value)
                                                    ) {
                                                        field.onChange(
                                                            value === ""
                                                                ? undefined
                                                                : Number(value)
                                                        );
                                                    }
                                                }}
                                                maxLength={20}
                                                className="w-full py-3"
                                                placeholder="보상 수량을 입력하세요"
                                                type="number"
                                                disabled={
                                                    !watch(
                                                        "participationRewardAssetId"
                                                    )
                                                }
                                            />
                                        </FormField>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Dotted Separator */}
                        <div className="w-full border-t border-dashed border-border/50 my-12" />

                        {/* options */}
                        <PollOptionsField
                            setValue={setValue}
                            initialOptions={initialData?.options}
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
    className?: string;
}

function FormField({
    label,
    required = false,
    error,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block font-semibold">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
    );
}

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
import { ChevronDown } from "lucide-react";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";

interface SortableOptionProps {
    id: string;
    children: React.ReactNode;
}

function SortableOption({ id, children }: SortableOptionProps) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex-1">
            <div {...attributes} {...listeners} className="w-full cursor-move">
                {children}
            </div>
        </div>
    );
}

function PollOptionsField({
    setValue,
    initialOptions,
}: {
    setValue: UseFormSetValue<z.infer<typeof pollSchemaShape>>;
    initialOptions?: PollOption[];
}) {
    const toast = useToast();

    const [options, setOptions] = useState<PollOption[]>(
        initialOptions || [
            {
                optionId: `option${new Date().getTime()}`,
                name: "",
                shorten: "",
                description: "",
                imgUrl: "",
                youtubeUrl: "",
            },
            {
                optionId: `option${new Date().getTime() + 1}`,
                name: "",
                shorten: "",
                description: "",
                imgUrl: "",
                youtubeUrl: "",
            },
        ]
    );
    const [selectedOption, setSelectedOption] = useState<PollOption | null>(
        null
    );
    const [showOptionCard, setShowOptionCard] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleSave = (updatedOption: PollOption) => {
        const newOptions = options.map((opt) =>
            opt.optionId === updatedOption.optionId ? updatedOption : opt
        );
        setOptions(newOptions);
        setValue("options", newOptions);
        setValue(
            "optionsOrder",
            newOptions.map((opt) => opt.optionId)
        );

        toast.success("옵션이 저장되었습니다.");
        console.log(options);
    };

    const handleDragStart = (event: any) => {
        const { active } = event;
        setShowOptionCard(false);
        setSelectedOption(
            options.find((option) => option.optionId === active.id) || null
        );
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setOptions((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.optionId === active.id
                );
                const newIndex = items.findIndex(
                    (item) => item.optionId === over.id
                );
                return arrayMove(items, oldIndex, newIndex);
            });
            setValue(
                "optionsOrder",
                options.map((opt) => opt.optionId)
            );
        }
    };

    const addNewOption = () => {
        const newId = `option${new Date().getTime()}`;
        setOptions([
            ...options,
            {
                optionId: newId,
                name: "",
                shorten: "",
                description: "",
                imgUrl: "",
                youtubeUrl: "",
            },
        ]);
        setValue("options", [
            ...options,
            {
                optionId: newId,
                name: "",
                shorten: "",
                description: "",
                imgUrl: "",
                youtubeUrl: "",
            },
        ]);
        setValue(
            "optionsOrder",
            options.map((opt) => opt.optionId)
        );

        toast.info("새 옵션이 추가되었습니다.");
    };

    const deleteOption = (id: string) => {
        const newOptions = options.filter((option) => option.optionId !== id);
        setOptions(newOptions);
        setValue("options", newOptions);
        setValue(
            "optionsOrder",
            newOptions.map((opt) => opt.optionId)
        );
        toast.warning("옵션이 삭제되었습니다.");
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">폴 옵션</h2>
                <Button
                    type="button"
                    onClick={addNewOption}
                    variant="outline"
                    className="h-8"
                >
                    + 옵션 추가
                </Button>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={options.map((option) => option.optionId)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {options.map((option) => (
                            <div key={option.optionId}>
                                <div className="flex items-center gap-2 w-full">
                                    <SortableOption id={option.optionId}>
                                        <div className="p-4 bg-background border rounded-lg shadow-sm">
                                            {option.name || option.optionId}
                                        </div>
                                    </SortableOption>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 cursor-pointer flex-shrink-0"
                                        onClick={() => {
                                            if (
                                                option.optionId ===
                                                selectedOption?.optionId
                                            ) {
                                                setShowOptionCard(
                                                    !showOptionCard
                                                );
                                            }
                                            setSelectedOption(option);
                                        }}
                                    >
                                        <ChevronDown
                                            className={`${
                                                showOptionCard &&
                                                selectedOption?.optionId ===
                                                    option.optionId
                                                    ? "rotate-180"
                                                    : ""
                                            } transition-transform duration-300`}
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            deleteOption(option.optionId)
                                        }
                                        className="h-8 w-8 cursor-pointer flex-shrink-0"
                                    >
                                        ✕
                                    </Button>
                                </div>
                                {showOptionCard &&
                                    selectedOption?.optionId ===
                                        option.optionId && (
                                        <OptionCard
                                            option={option}
                                            editing={true}
                                            onSave={handleSave}
                                        />
                                    )}
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

function OptionCard({
    option,
    editing = false,
    onSave,
}: {
    option: PollOption;
    editing: boolean;
    onSave: (option: PollOption) => void;
}) {
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
        <div className="p-4 bg-card rounded-lg shadow-sm mt-2 space-y-2">
            <div className="space-y-8">
                <FormField label="선택지 내용" required>
                    <Input
                        value={editedOption.name}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                name: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                    />
                </FormField>

                <FormField label="짧은 선택지 내용">
                    <Input
                        value={editedOption.shorten}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                shorten: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                    />
                </FormField>

                <FormField label="설명">
                    <Textarea
                        value={editedOption.description}
                        onChange={(e) =>
                            setEditedOption({
                                ...editedOption,
                                description: e.target.value,
                            })
                        }
                        disabled={!isEditing}
                    />
                </FormField>

                <FormField label="이미지 URL">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {editedOption.imgUrl && (
                                <Image
                                    src={
                                        editedOption.imgUrl ||
                                        "/default-image.jpg"
                                    }
                                    alt="이미지"
                                    width={170}
                                    height={170}
                                    className="object-cover rounded-md"
                                />
                            )}
                            {isEditing && (
                                <div className="flex flex-col gap-2">
                                    <Input
                                        value={editedOption.imgUrl}
                                        onChange={(e) =>
                                            setEditedOption({
                                                ...editedOption,
                                                imgUrl: e.target.value,
                                            })
                                        }
                                        disabled={!isEditing}
                                        placeholder="이미지 URL을 입력하거나 아래에서 업로드하세요"
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
                </FormField>

                <FormField label="유튜브 URL">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {editedOption.youtubeUrl && (
                                <div className="w-[350px]">
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
                                <div className="flex flex-col gap-2">
                                    <Input
                                        value={editedOption.youtubeUrl}
                                        onChange={(e) =>
                                            setEditedOption({
                                                ...editedOption,
                                                youtubeUrl: e.target.value,
                                            })
                                        }
                                        disabled={!isEditing}
                                        placeholder="유튜브 URL을 입력하세요"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </FormField>
            </div>

            <div className="flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            취소
                        </Button>
                        <Button type="button" onClick={handleSave}>
                            저장
                        </Button>
                    </>
                ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                        편집
                    </Button>
                )}
            </div>
        </div>
    );
}
