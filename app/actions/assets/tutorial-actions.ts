/// app/actions/assets/tutorial-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/app/auth/authSettings";
import { prisma } from "@/lib/prisma/client";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

const TutorialStepSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    type: z.enum([
        "text",
        "action",
        "image",
        "video",
        "success",
        "info",
        "bulletin",
        "order",
    ]),
    order: z.number().min(0),
    imageUrl: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    actionType: z.enum(["discord_auth", "external_link", "custom"]).optional(),
    actionUrl: z.string().optional().nullable(),
    buttonText: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    // 🎯 Order 타입을 위한 추가 필드
    bulletinItems: z.array(z.string()).optional().default([]),
    orderItems: z
        .array(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional().nullable(),
                isCompleted: z.boolean().optional().default(false),
            })
        )
        .optional()
        .default([]),
    // 🎨 새로운 필드들 (선택적으로 처리)
    stepIcon: z
        .object({
            type: z.enum(["default", "lucide", "custom"]),
            value: z.string().optional().nullable(),
            url: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
    responsiveSizes: z
        .object({
            titleSize: z.number().optional(),
            contentSize: z.number().optional(),
            iconSize: z.number().optional(),
            containerSize: z.number().optional(),
            imageSize: z.number().optional(),
            buttonSize: z.number().optional(),
        })
        .optional()
        .nullable(),
});

const TutorialCustomizationSchema = z.object({
    // 🎨 색상 설정
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    accentColor: z.string().optional(),

    // 📝 제목 설정
    mainTitle: z.string().optional(),
    subtitle: z.string().optional(),

    // 🎭 아이콘 설정
    mainIcon: z.string().optional(),

    // 🎬 애니메이션 설정
    enableAnimations: z.boolean().optional(),
    animationSpeed: z.enum(["slow", "normal", "fast"]).optional(),

    // 🎯 버튼 설정
    buttonStyle: z.enum(["rounded", "square", "pill"]).optional(),
    buttonSize: z.enum(["small", "medium", "large"]).optional(),

    // 🖼️ 레이아웃 설정
    layout: z.enum(["centered", "left", "right"]).optional(),
    showProgressBar: z.boolean().optional(),
    showStepNumbers: z.boolean().optional(),
});

const CreateTutorialSchema = z.object({
    assetId: z.string().cuid(),
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional().default(true),
    triggerCondition: z.string().optional().default("ON_FIRST_RECEIVE"),
    steps: z.array(TutorialStepSchema).min(1, "At least one step is required"),
    customization: TutorialCustomizationSchema.optional(),
});

const UpdateTutorialSchema = z.object({
    id: z.string().cuid(),
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    triggerCondition: z.string().optional(),
    steps: z
        .array(TutorialStepSchema)
        .min(1, "At least one step is required")
        .optional(),
    customization: TutorialCustomizationSchema.optional(),
});

async function checkAdminPermission() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Authentication required" };
    }

    // Check if user is admin (you might need to adjust this based on your user role system)
    const user = await prisma.user.findUnique({
        cacheStrategy: getCacheStrategy("oneMinute"),
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== "admin") {
        return { success: false, error: "Admin permission required" };
    }

    return { success: true, userId: session.user.id };
}

export type CreateAssetTutorialInput = z.infer<typeof CreateTutorialSchema>;

export async function createAssetTutorial(input: CreateAssetTutorialInput) {
    try {
        // 권한 확인
        const authCheck = await checkAdminPermission();
        if (!authCheck.success) {
            return { success: false, message: authCheck.error };
        }

        // 데이터 유효성 검사 및 기본값 적용
        const validatedData = CreateTutorialSchema.parse({
            ...input,
            isActive: input.isActive ?? true,
            triggerCondition: input.triggerCondition ?? "ON_FIRST_RECEIVE",
        });

        // Asset 존재 확인
        const asset = await prisma.asset.findUnique({
            cacheStrategy: getCacheStrategy("oneMinute"),
            where: { id: validatedData.assetId },
            select: { id: true, name: true },
        });

        if (!asset) {
            return { success: false, message: "Asset not found" };
        }

        // 이미 Tutorial이 있는지 확인
        const existingTutorial = await prisma.assetTutorial.findUnique({
            cacheStrategy: getCacheStrategy("oneMinute"),
            where: { assetId: validatedData.assetId },
        });

        if (existingTutorial) {
            return {
                success: false,
                message: "Tutorial already exists for this asset",
            };
        }

        // Tutorial 생성
        const tutorial = await prisma.assetTutorial.create({
            data: {
                assetId: validatedData.assetId,
                steps: {
                    steps: validatedData.steps,
                    customization: validatedData.customization || {},
                },
            },
            include: {
                asset: {
                    select: { id: true, name: true, symbol: true },
                },
            },
        });

        // Asset의 needTutorial 플래그 업데이트
        await prisma.asset.update({
            where: { id: validatedData.assetId },
            data: { needTutorial: true },
        });

        revalidatePath("/admin/assets");

        return {
            success: true,
            message: `Tutorial created for ${asset.name}`,
            data: tutorial,
        };
    } catch (error) {
        console.error("Failed to create asset tutorial:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: "Invalid data format",
                errors: error.errors,
            };
        }

        return {
            success: false,
            message: "Failed to create tutorial",
        };
    }
}

export interface GetAssetTutorialInput {
    assetId: string;
}

export async function getAssetTutorial(input?: GetAssetTutorialInput) {
    if (!input) {
        return null;
    }
    try {
        const tutorial = await prisma.assetTutorial.findUnique({
            cacheStrategy: getCacheStrategy("thirtyMinutes"),
            where: { assetId: input.assetId },
            include: {
                asset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                        imageUrl: true,
                    },
                },
            },
        });

        if (!tutorial) {
            return {
                success: false,
                message: "Tutorial not found",
            };
        }

        return {
            success: true,
            data: tutorial,
        };
    } catch (error) {
        console.error("Failed to get asset tutorial:", error);
        return {
            success: false,
            message: "Failed to get tutorial",
        };
    }
}

export async function getAssetTutorials() {
    try {
        const tutorials = await prisma.assetTutorial.findMany({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            include: {
                asset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                        imageUrl: true,
                        needTutorial: true,
                    },
                },
            },
            orderBy: [{ createdAt: "desc" }],
        });

        return {
            success: true,
            data: tutorials,
        };
    } catch (error) {
        console.error("Failed to get asset tutorials:", error);
        return {
            success: false,
            message: "Failed to get tutorials",
        };
    }
}

export type UpdateAssetTutorialInput = z.infer<typeof UpdateTutorialSchema>;

export async function updateAssetTutorial(input: UpdateAssetTutorialInput) {
    try {
        // 권한 확인
        const authCheck = await checkAdminPermission();
        if (!authCheck.success) {
            return { success: false, message: authCheck.error };
        }

        // 데이터 유효성 검사
        const validatedData = UpdateTutorialSchema.parse(input);

        // Tutorial 존재 확인
        const existingTutorial = await prisma.assetTutorial.findUnique({
            cacheStrategy: getCacheStrategy("oneMinute"),
            where: { id: validatedData.id },
            include: {
                asset: { select: { id: true, name: true } },
            },
        });

        if (!existingTutorial) {
            return { success: false, message: "Tutorial not found" };
        }

        // 업데이트할 데이터 준비
        const updateData: any = {};

        if (validatedData.steps || validatedData.customization) {
            const existingSteps = (existingTutorial.steps as any)?.steps || [];
            const existingCustomization =
                (existingTutorial.steps as any)?.customization || {};

            updateData.steps = {
                steps: validatedData.steps || existingSteps,
                customization:
                    validatedData.customization || existingCustomization,
            };
        }

        // Tutorial 업데이트
        const updatedTutorial = await prisma.assetTutorial.update({
            where: { id: validatedData.id },
            data: updateData,
            include: {
                asset: {
                    select: { id: true, name: true, symbol: true },
                },
            },
        });

        revalidatePath("/admin/assets");

        return {
            success: true,
            message: `Tutorial updated for ${existingTutorial.asset.name}`,
            data: updatedTutorial,
        };
    } catch (error) {
        console.error("Failed to update asset tutorial:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: "Invalid data format",
                errors: error.errors,
            };
        }

        return {
            success: false,
            message: "Failed to update tutorial",
        };
    }
}

export interface DeleteAssetTutorialInput {
    tutorialId: string;
    assetId: string;
}

export async function deleteAssetTutorial(input?: DeleteAssetTutorialInput) {
    if (!input) {
        return null;
    }
    try {
        // 권한 확인
        const authCheck = await checkAdminPermission();
        if (!authCheck.success) {
            return { success: false, message: authCheck.error };
        }

        // Tutorial 존재 확인
        const existingTutorial = await prisma.assetTutorial.findUnique({
            cacheStrategy: getCacheStrategy("oneMinute"),
            where: { id: input.tutorialId },
            include: {
                asset: { select: { id: true, name: true } },
            },
        });

        if (!existingTutorial) {
            return { success: false, message: "Tutorial not found" };
        }

        // Tutorial 삭제
        await prisma.assetTutorial.delete({
            where: { id: input.tutorialId, assetId: input.assetId },
        });

        // Asset의 needTutorial 플래그 업데이트
        await prisma.asset.update({
            where: { id: input.assetId },
            data: { needTutorial: false },
        });

        revalidatePath("/admin/assets");

        return {
            success: true,
            message: `Tutorial deleted for ${existingTutorial.asset.name}`,
        };
    } catch (error) {
        console.error("Failed to delete asset tutorial:", error);
        return {
            success: false,
            message: "Failed to delete tutorial",
        };
    }
}

export interface CheckAssetHasTutorialInput {
    assetId: string;
}

export async function checkAssetHasTutorial(
    input?: CheckAssetHasTutorialInput
) {
    if (!input) {
        return null;
    }
    try {
        const tutorial = await prisma.assetTutorial.findUnique({
            cacheStrategy: getCacheStrategy("oneMinute"),
            where: { assetId: input.assetId },
            select: { id: true, assetId: true },
        });

        return {
            success: true,
            hasTutorial: !!tutorial,
            tutorialId: tutorial?.id,
        };
    } catch (error) {
        console.error("Failed to check asset tutorial:", error);
        return {
            success: false,
            message: "Failed to check tutorial",
            hasTutorial: false,
        };
    }
}

export interface ValidateTutorialStepsInput {
    steps: any[];
}

export async function validateTutorialSteps(
    input?: ValidateTutorialStepsInput
) {
    if (!input) {
        return null;
    }
    try {
        const validatedSteps = z.array(TutorialStepSchema).parse(input.steps);

        // Order 중복 확인
        const orders = validatedSteps.map((step) => step.order);
        const uniqueOrders = new Set(orders);

        if (orders.length !== uniqueOrders.size) {
            return {
                success: false,
                message: "Duplicate step orders found",
            };
        }

        // ID 중복 확인
        const ids = validatedSteps.map((step) => step.id);
        const uniqueIds = new Set(ids);

        if (ids.length !== uniqueIds.size) {
            return {
                success: false,
                message: "Duplicate step IDs found",
            };
        }

        return {
            success: true,
            validatedSteps,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: "Invalid step format",
                errors: error.errors,
            };
        }

        return {
            success: false,
            message: "Failed to validate steps",
        };
    }
}

export interface GetTutorialAnalyticsInput {
    assetId?: string;
}

const DEFAULT_CUSTOMIZATION_PRESETS = {
    default: {
        primaryColor: "#8B5CF6",
        secondaryColor: "#A78BFA",
        backgroundColor: "#1E1B4B",
        textColor: "#F8FAFC",
        accentColor: "#C4B5FD",
        mainTitle: "Tutorial",
        subtitle: "Learn how to use this feature",
        mainIcon: "graduation-cap",
        enableAnimations: true,
        animationSpeed: "normal" as const,
        buttonStyle: "rounded" as const,
        buttonSize: "medium" as const,
        layout: "centered" as const,
        showProgressBar: true,
        showStepNumbers: true,
    },
    minimal: {
        primaryColor: "#6B7280",
        secondaryColor: "#9CA3AF",
        backgroundColor: "#111827",
        textColor: "#F9FAFB",
        accentColor: "#D1D5DB",
        mainTitle: "Guide",
        subtitle: "Quick walkthrough",
        mainIcon: "info",
        enableAnimations: false,
        animationSpeed: "fast" as const,
        buttonStyle: "square" as const,
        buttonSize: "small" as const,
        layout: "left" as const,
        showProgressBar: false,
        showStepNumbers: true,
    },
    vibrant: {
        primaryColor: "#EF4444",
        secondaryColor: "#F87171",
        backgroundColor: "#7C2D12",
        textColor: "#FEF2F2",
        accentColor: "#FCA5A5",
        mainTitle: "Amazing Tutorial",
        subtitle: "Let's explore together!",
        mainIcon: "sparkles",
        enableAnimations: true,
        animationSpeed: "slow" as const,
        buttonStyle: "pill" as const,
        buttonSize: "large" as const,
        layout: "centered" as const,
        showProgressBar: true,
        showStepNumbers: true,
    },
} as const;

export async function getTutorialAnalytics(input?: GetTutorialAnalyticsInput) {
    try {
        // 권한 확인
        const authCheck = await checkAdminPermission();
        if (!authCheck.success) {
            return { success: false, message: authCheck.error };
        }

        const whereClause = input?.assetId ? { assetId: input.assetId } : {};

        const stats = await prisma.assetTutorial.findMany({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: whereClause,
            select: {
                id: true,
                assetId: true,
                createdAt: true,
                updatedAt: true,
                asset: {
                    select: {
                        name: true,
                        symbol: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: {
                totalTutorials: stats.length,
                tutorials: stats,
            },
        };
    } catch (error) {
        console.error("Failed to get tutorial analytics:", error);
        return {
            success: false,
            message: "Failed to get analytics",
        };
    }
}

export async function getTutorialCustomizationPresets() {
    return {
        success: true,
        data: DEFAULT_CUSTOMIZATION_PRESETS,
    };
}

export interface ApplyCustomizationPresetInput {
    preset: keyof typeof DEFAULT_CUSTOMIZATION_PRESETS;
    overrides?: Partial<z.infer<typeof TutorialCustomizationSchema>>;
}

export async function applyCustomizationPreset(
    input?: ApplyCustomizationPresetInput
) {
    if (!input) {
        return null;
    }

    try {
        const basePreset = DEFAULT_CUSTOMIZATION_PRESETS[input.preset];
        if (!basePreset) {
            return {
                success: false,
                message: "Invalid preset name",
            };
        }

        const appliedCustomization = {
            ...basePreset,
            ...input.overrides,
        };

        return {
            success: true,
            data: appliedCustomization,
        };
    } catch (error) {
        console.error("Failed to apply customization preset:", error);
        return {
            success: false,
            message: "Failed to apply preset",
        };
    }
}

import { DEFAULT_STEP_TEMPLATES } from "./tutorial-hooks";

export async function getStepTemplates() {
    return {
        success: true,
        data: DEFAULT_STEP_TEMPLATES,
    };
}

export type TutorialCustomization = z.infer<typeof TutorialCustomizationSchema>;
export type TutorialStep = z.infer<typeof TutorialStepSchema>;
export type CustomizationPreset = keyof typeof DEFAULT_CUSTOMIZATION_PRESETS;
