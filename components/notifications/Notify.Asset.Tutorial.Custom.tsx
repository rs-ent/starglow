/// components/notifications/Notify.Asset.Tutorial.Custom.tsx

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Play,
    Image as ImageIcon,
    ExternalLink,
    Sparkles,
    Star,
    Gift,
    Zap,
    MessageSquare,
    ListOrdered,
    Megaphone,
    Video,
    Check,
    Info,
    GraduationCap,
    Heart,
    Crown,
    Trophy,
    Target,
    Rocket,
    Flame,
    Music,
    Camera,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import type { Asset, AssetTutorial } from "@prisma/client";

interface NotifyAssetTutorialCustomProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    asset: Asset;
    tutorial: AssetTutorial;
}

interface ResponsiveSizes {
    titleSize?: number;
    contentSize?: number;
    iconSize?: number;
    containerSize?: number;
    imageSize?: number;
    buttonSize?: number;
}

interface TutorialStep {
    id: string;
    title: string;
    content: string;
    type:
        | "text"
        | "action"
        | "image"
        | "video"
        | "success"
        | "info"
        | "bulletin"
        | "order";
    order: number;
    imageUrl?: string;
    videoUrl?: string;
    actionType?: "discord_auth" | "external_link" | "custom";
    actionUrl?: string;
    buttonText?: string;
    icon?: string;
    bulletinItems?: string[];
    orderItems?: {
        id: string;
        title: string;
        description?: string;
        isCompleted?: boolean;
    }[];
    stepIcon?: {
        type: "default" | "lucide" | "custom";
        value?: string;
        url?: string;
    };
    responsiveSizes?: ResponsiveSizes;
}

interface TutorialCustomization {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    mainTitle?: string;
    subtitle?: string;
    mainIcon?: string;
    enableAnimations?: boolean;
    animationSpeed?: "slow" | "normal" | "fast";
    buttonStyle?: "rounded" | "square" | "pill";
    buttonSize?: "small" | "medium" | "large";
    layout?: "centered" | "left" | "right";
    showProgressBar?: boolean;
    showStepNumbers?: boolean;
}

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

// 🎨 애니메이션 속도 매핑
const animationSpeeds = {
    slow: { duration: 0.8 },
    normal: { duration: 0.4 },
    fast: { duration: 0.2 },
} as const;

// 🎨 버튼 스타일 매핑
const buttonStyles = {
    rounded: "rounded-lg",
    square: "rounded-none",
    pill: "rounded-full",
} as const;

// 🎯 기본 반응형 크기
const getDefaultSizes = (): ResponsiveSizes => ({
    titleSize: 25,
    contentSize: 15,
    iconSize: 40,
    containerSize: 60,
    imageSize: 50,
    buttonSize: 20,
});

// 🎯 단계별 크기 가져오기
const getStepSizes = (step: TutorialStep): ResponsiveSizes => {
    return {
        ...getDefaultSizes(),
        ...step.responsiveSizes,
    };
};

// 🎨 아이콘 렌더링 함수
const renderStepIcon = (step: TutorialStep) => {
    const sizes = getStepSizes(step);
    const iconClasses = getResponsiveClass(sizes.iconSize || 40).frameClass;

    // stepIcon이 있으면 새로운 시스템 사용
    if (step.stepIcon) {
        switch (step.stepIcon.type) {
            case "custom":
                if (step.stepIcon.url) {
                    return (
                        <img
                            src={step.stepIcon.url}
                            alt={step.title}
                            className={cn(iconClasses, "object-cover")}
                        />
                    );
                }
                break;

            case "lucide":
                if (step.stepIcon.value) {
                    return (
                        <LucideIcon
                            iconName={step.stepIcon.value}
                            iconSize={sizes.iconSize || 40}
                        />
                    );
                }
                break;

            case "default":
            default:
                // 기본 아이콘 사용
                break;
        }
    }

    // 기본 아이콘 시스템 (기존 호환성)
    const IconComponent = stepTypeIcons[step.type] || MessageSquare;
    return <IconComponent className={iconClasses} />;
};

// 🎨 Lucide 아이콘 동적 렌더링
const LucideIcon = ({
    iconName,
    iconSize = 40,
}: {
    iconName: string;
    iconSize?: number;
}) => {
    const icons = {
        BookOpen,
        Zap,
        ImageIcon,
        Video,
        Check,
        Info,
        Megaphone,
        ListOrdered,
        MessageSquare,
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
        // 기본 아이콘들도 포함
        CheckCircle,
        Play,
        ExternalLink,
        GraduationCap,
    };

    const IconComponent =
        icons[iconName as keyof typeof icons] || MessageSquare;
    const iconClasses = getResponsiveClass(iconSize).frameClass;
    return <IconComponent className={iconClasses} />;
};

export default function NotifyAssetTutorialCustom({
    isOpen,
    onClose,
    onComplete,
    asset,
    tutorial,
}: NotifyAssetTutorialCustomProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(
        new Set()
    );
    const [isCompleting, setIsCompleting] = useState(false);

    // 🎯 Tutorial steps와 customization 파싱
    const { steps, customization } = useMemo(() => {
        try {
            const stepsData = tutorial.steps as unknown as {
                steps: TutorialStep[];
                customization: TutorialCustomization;
            };

            const parsedSteps =
                stepsData.steps?.sort((a, b) => a.order - b.order) || [];
            const parsedCustomization: TutorialCustomization = {
                // 기본값 설정
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
                // 실제 저장된 커스터마이제이션으로 덮어쓰기
                ...stepsData.customization,
            };

            return {
                steps: parsedSteps,
                customization: parsedCustomization,
            };
        } catch (error) {
            console.error("Failed to parse tutorial data:", error);
            return {
                steps: [],
                customization: {
                    primaryColor: "#8B5CF6",
                    secondaryColor: "#A78BFA",
                    backgroundColor: "#1E1B4B",
                    textColor: "#F8FAFC",
                    accentColor: "#C4B5FD",
                    mainTitle: "튜토리얼",
                    subtitle: "새로운 기능을 배워보세요",
                    mainIcon: "graduation-cap",
                    enableAnimations: true,
                    animationSpeed: "normal" as const,
                    buttonStyle: "rounded" as const,
                    buttonSize: "medium" as const,
                    layout: "centered" as const,
                    showProgressBar: true,
                    showStepNumbers: true,
                },
            };
        }
    }, [tutorial.steps]);

    // 🎨 애니메이션 설정
    const animationSpeed =
        animationSpeeds[customization.animationSpeed || "normal"];
    const buttonStyle = buttonStyles[customization.buttonStyle || "rounded"];

    // 🔄 Step 액션 처리
    const handleStepAction = async (step: TutorialStep, stepIndex: number) => {
        switch (step.actionType) {
            case "discord_auth":
                // Discord 인증 로직
                window.open("/user/discord", "_blank");
                break;
            case "external_link":
                if (step.actionUrl) {
                    window.open(step.actionUrl, "_blank");
                }
                break;
            case "custom":
                // 커스텀 액션 로직
                break;
        }

        // 단계 완료 처리
        setCompletedSteps((prev) => new Set([...prev, stepIndex]));
    };

    // 🎯 다음 단계로 이동
    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTutorial().catch((error) => {
                console.error("Failed to complete tutorial:", error);
            });
        }
    };

    // 🔙 이전 단계로 이동
    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // ✅ 튜토리얼 완료
    const completeTutorial = async () => {
        setIsCompleting(true);

        // 완료 처리 로직 (필요시 서버 호출)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onComplete?.();
        onClose();
        setIsCompleting(false);
    };

    // 🎬 Step 타입별 렌더링
    const renderStepContent = (step: TutorialStep, stepIndex: number) => {
        const isCompleted = completedSteps.has(stepIndex);
        const iconElement = renderStepIcon(step);
        const sizes = getStepSizes(step);

        // 반응형 클래스 생성
        const titleClasses = getResponsiveClass(
            sizes.titleSize || 25
        ).textClass;
        const contentClasses = getResponsiveClass(
            sizes.contentSize || 15
        ).textClass;
        const containerClasses = getResponsiveClass(
            sizes.containerSize || 60
        ).frameClass;
        const buttonPaddingClasses = getResponsiveClass(
            sizes.buttonSize || 20
        ).paddingClass;
        const buttonIconClasses = getResponsiveClass(
            Math.max((sizes.iconSize || 40) - 15, 15)
        ).frameClass;

        switch (step.type) {
            case "text":
                return (
                    <div className="text-center space-y-4">
                        <div
                            className={cn(
                                "mx-auto rounded-full flex items-center justify-center border backdrop-blur-sm",
                                containerClasses
                            )}
                            style={{
                                backgroundColor:
                                    customization.primaryColor + "20",
                                borderColor: customization.primaryColor + "50",
                            }}
                        >
                            <div style={{ color: customization.primaryColor }}>
                                {iconElement}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3
                                className={cn("font-bold", titleClasses)}
                                style={{ color: customization.textColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>
                    </div>
                );

            case "action":
                return (
                    <div className="text-center space-y-6">
                        <div
                            className={cn(
                                "mx-auto rounded-full flex items-center justify-center border backdrop-blur-sm",
                                containerClasses
                            )}
                            style={{
                                backgroundColor:
                                    customization.primaryColor + "20",
                                borderColor: customization.primaryColor + "50",
                            }}
                        >
                            <div style={{ color: customization.primaryColor }}>
                                {iconElement}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3
                                className={cn("font-bold", titleClasses)}
                                style={{ color: customization.textColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>

                        <motion.button
                            whileHover={
                                customization.enableAnimations
                                    ? { scale: 1.05 }
                                    : {}
                            }
                            whileTap={
                                customization.enableAnimations
                                    ? { scale: 0.95 }
                                    : {}
                            }
                            onClick={() => handleStepAction(step, stepIndex)}
                            className={cn(
                                "font-semibold transition-all duration-200",
                                "flex items-center gap-2 mx-auto",
                                buttonStyle,
                                buttonPaddingClasses,
                                contentClasses
                            )}
                            style={{
                                backgroundColor: customization.primaryColor,
                                color: customization.backgroundColor,
                            }}
                        >
                            {isCompleted ? (
                                <>
                                    <CheckCircle
                                        className={buttonIconClasses}
                                    />
                                    완료됨!
                                </>
                            ) : (
                                <>
                                    <ExternalLink
                                        className={buttonIconClasses}
                                    />
                                    {step.buttonText || "액션 실행"}
                                </>
                            )}
                        </motion.button>
                    </div>
                );

            case "order":
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div
                                className={cn(
                                    "mx-auto rounded-full flex items-center justify-center border backdrop-blur-sm mb-4",
                                    containerClasses
                                )}
                                style={{
                                    backgroundColor:
                                        customization.primaryColor + "20",
                                    borderColor:
                                        customization.primaryColor + "50",
                                }}
                            >
                                <div
                                    style={{
                                        color: customization.primaryColor,
                                    }}
                                >
                                    {iconElement}
                                </div>
                            </div>
                            <h3
                                className={cn("font-bold mb-2", titleClasses)}
                                style={{ color: customization.textColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed mb-4",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>

                        {step.orderItems && (
                            <div className="space-y-3">
                                {step.orderItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={
                                            customization.enableAnimations
                                                ? { opacity: 0, x: -20 }
                                                : {}
                                        }
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={
                                            customization.enableAnimations
                                                ? {
                                                      ...animationSpeed,
                                                      delay: index * 0.1,
                                                  }
                                                : {}
                                        }
                                        className="flex items-start gap-3 p-3 rounded-lg border"
                                        style={{
                                            backgroundColor:
                                                customization.secondaryColor +
                                                "20",
                                            borderColor:
                                                customization.secondaryColor +
                                                "30",
                                        }}
                                    >
                                        <Badge
                                            className="flex-shrink-0 mt-0.5"
                                            style={{
                                                backgroundColor:
                                                    customization.primaryColor,
                                                color: customization.backgroundColor,
                                            }}
                                        >
                                            {index + 1}
                                        </Badge>
                                        <div className="space-y-1">
                                            <div
                                                className="font-medium"
                                                style={{
                                                    color: customization.textColor,
                                                }}
                                            >
                                                {item.title}
                                            </div>
                                            {item.description && (
                                                <div
                                                    className="text-sm"
                                                    style={{
                                                        color:
                                                            customization.textColor +
                                                            "B3",
                                                    }}
                                                >
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "bulletin":
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div
                                className={cn(
                                    "mx-auto rounded-full flex items-center justify-center border backdrop-blur-sm mb-4",
                                    containerClasses
                                )}
                                style={{
                                    backgroundColor:
                                        customization.primaryColor + "20",
                                    borderColor:
                                        customization.primaryColor + "50",
                                }}
                            >
                                <div
                                    style={{
                                        color: customization.primaryColor,
                                    }}
                                >
                                    {iconElement}
                                </div>
                            </div>
                            <h3
                                className={cn("font-bold mb-2", titleClasses)}
                                style={{ color: customization.textColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed mb-4",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>

                        {step.bulletinItems && (
                            <div className="space-y-2">
                                {step.bulletinItems.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={
                                            customization.enableAnimations
                                                ? { opacity: 0, scale: 0.9 }
                                                : {}
                                        }
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={
                                            customization.enableAnimations
                                                ? {
                                                      ...animationSpeed,
                                                      delay: index * 0.1,
                                                  }
                                                : {}
                                        }
                                        className="p-3 rounded-lg border-l-4"
                                        style={{
                                            backgroundColor:
                                                customization.accentColor +
                                                "20",
                                            borderLeftColor:
                                                customization.accentColor,
                                        }}
                                    >
                                        <div
                                            className="font-medium"
                                            style={{
                                                color: customization.textColor,
                                            }}
                                        >
                                            • {item}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "image":
                const imageMaxHeight = `max-h-[${Math.min(
                    Math.max((sizes.imageSize || 50) * 4, 200),
                    400
                )}px]`;

                return (
                    <div className="text-center space-y-4">
                        <div className="space-y-2">
                            <h3
                                className={cn("font-bold", titleClasses)}
                                style={{ color: customization.textColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>

                        {step.imageUrl && (
                            <div className="relative rounded-xl overflow-hidden border border-gray-600/50">
                                <img
                                    src={step.imageUrl}
                                    alt={step.title}
                                    className={cn(
                                        "w-full h-auto object-cover",
                                        imageMaxHeight
                                    )}
                                />
                            </div>
                        )}
                    </div>
                );

            case "video":
                const videoMaxHeight = `max-h-[${Math.min(
                    Math.max((sizes.imageSize || 50) * 4, 200),
                    400
                )}px]`;

                return (
                    <div className="text-center space-y-4">
                        <div className="space-y-2">
                            <h3
                                className={cn("font-bold", titleClasses)}
                                style={{ color: customization.textColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>

                        {step.videoUrl && (
                            <div className="relative rounded-xl overflow-hidden border border-gray-600/50">
                                <video
                                    src={step.videoUrl}
                                    controls
                                    className={cn(
                                        "w-full h-auto",
                                        videoMaxHeight
                                    )}
                                    poster={step.imageUrl}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                    </div>
                );

            case "success":
                const successContainerClasses = getResponsiveClass(
                    Math.min((sizes.containerSize || 60) + 10, 80)
                ).frameClass;
                const successIconClasses = getResponsiveClass(
                    Math.min((sizes.iconSize || 40) + 5, 50)
                ).frameClass;

                return (
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={
                                customization.enableAnimations
                                    ? { scale: 0 }
                                    : {}
                            }
                            animate={{ scale: 1 }}
                            transition={
                                customization.enableAnimations
                                    ? {
                                          type: "spring",
                                          stiffness: 200,
                                          damping: 15,
                                      }
                                    : {}
                            }
                            className={cn(
                                "mx-auto rounded-full flex items-center justify-center",
                                successContainerClasses
                            )}
                            style={{
                                background: `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`,
                            }}
                        >
                            <CheckCircle
                                className={cn(successIconClasses, "text-white")}
                            />
                        </motion.div>

                        <div className="space-y-2">
                            <h3
                                className={cn("font-bold", titleClasses)}
                                style={{ color: customization.primaryColor }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={cn(
                                    "leading-relaxed",
                                    contentClasses
                                )}
                                style={{
                                    color: customization.textColor + "E6",
                                }}
                            >
                                {step.content}
                            </p>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center space-y-4">
                        <p
                            className={cn(contentClasses)}
                            style={{ color: customization.textColor + "E6" }}
                        >
                            {step.content}
                        </p>
                    </div>
                );
        }
    };

    // 빈 steps 처리
    if (steps.length === 0) {
        const emptyStateSizes = getDefaultSizes();
        const emptyTitleClasses = getResponsiveClass(
            emptyStateSizes.titleSize || 25
        ).textClass;
        const emptyContentClasses = getResponsiveClass(
            emptyStateSizes.contentSize || 15
        ).textClass;
        const emptyButtonClasses = getResponsiveClass(
            emptyStateSizes.buttonSize || 20
        ).paddingClass;

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogTitle> </DialogTitle>
                <DialogContent
                    className="sm:max-w-[500px] border-gray-700 p-6"
                    style={{
                        backgroundColor: customization.backgroundColor + "F5",
                        borderColor: customization.accentColor + "50",
                    }}
                >
                    <div className="text-center space-y-4">
                        <h2
                            className={cn("font-bold", emptyTitleClasses)}
                            style={{ color: customization.textColor }}
                        >
                            Tutorial Not Available
                        </h2>
                        <p
                            className={cn(emptyContentClasses)}
                            style={{ color: customization.textColor + "B3" }}
                        >
                            No tutorial steps have been configured for this
                            asset yet.
                        </p>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className={cn(
                                emptyButtonClasses,
                                emptyContentClasses
                            )}
                            style={{
                                borderColor: customization.primaryColor,
                                color: customization.primaryColor,
                            }}
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // 헤더 크기는 첫 번째 단계의 크기를 기준으로 함
    const headerSizes =
        steps.length > 0 ? getStepSizes(steps[0]) : getDefaultSizes();
    const headerTitleClasses = getResponsiveClass(
        Math.min((headerSizes.titleSize || 25) - 5, 20)
    ).textClass;
    const headerSubtitleClasses = getResponsiveClass(
        headerSizes.contentSize || 15
    ).textClass;
    const headerStepClasses = getResponsiveClass(
        Math.max((headerSizes.contentSize || 15) - 1, 10)
    ).textClass;
    const headerIconClasses = getResponsiveClass(
        Math.max((headerSizes.iconSize || 40) - 15, 25)
    ).frameClass;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent
                className="sm:max-w-[600px] border-gray-700 p-0 overflow-hidden backdrop-blur-xl [&>button]:z-20"
                style={{
                    backgroundColor: customization.backgroundColor + "F5",
                    borderColor: customization.accentColor + "50",
                }}
            >
                <div className="relative">
                    {/* 배경 그라데이션 */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `linear-gradient(135deg, ${customization.backgroundColor}80, ${customization.secondaryColor}20)`,
                        }}
                    />

                    {/* 별 배경 효과 */}
                    {customization.enableAnimations && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(10)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                    className="absolute w-1 h-1 rounded-full"
                                    style={{
                                        backgroundColor:
                                            customization.accentColor,
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* 진행 바 */}
                    {customization.showProgressBar && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800/50 z-10">
                            <motion.div
                                className="h-full"
                                style={{
                                    background: `linear-gradient(90deg, ${customization.primaryColor}, ${customization.secondaryColor})`,
                                }}
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${
                                        ((currentStep + 1) / steps.length) * 100
                                    }%`,
                                }}
                                transition={
                                    customization.enableAnimations
                                        ? { duration: 0.3 }
                                        : { duration: 0 }
                                }
                            />
                        </div>
                    )}

                    {/* 메인 콘텐츠 */}
                    <div className="relative z-10 p-8 space-y-6">
                        {/* 헤더 */}
                        <motion.div
                            initial={
                                customization.enableAnimations
                                    ? { opacity: 0, y: -20 }
                                    : {}
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                                customization.enableAnimations
                                    ? { delay: 0.2 }
                                    : {}
                            }
                            className="text-center space-y-2"
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <GraduationCap
                                    className={headerIconClasses}
                                    style={{
                                        color: customization.primaryColor,
                                    }}
                                />
                                <h1
                                    className={cn(
                                        "font-bold",
                                        headerTitleClasses
                                    )}
                                    style={{ color: customization.textColor }}
                                >
                                    {customization.mainTitle ||
                                        asset.name + " Tutorial"}
                                </h1>
                            </div>
                            <p
                                className={cn(headerSubtitleClasses)}
                                style={{
                                    color: customization.textColor + "B3",
                                }}
                            >
                                {customization.subtitle ||
                                    "새로운 기능을 배워보세요"}
                            </p>
                            {customization.showStepNumbers && (
                                <p
                                    className={cn(headerStepClasses)}
                                    style={{
                                        color: customization.textColor + "80",
                                    }}
                                >
                                    Step {currentStep + 1} of {steps.length}
                                </p>
                            )}
                        </motion.div>

                        {/* 단계 콘텐츠 */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={
                                    customization.enableAnimations
                                        ? { opacity: 0, x: 20 }
                                        : {}
                                }
                                animate={{ opacity: 1, x: 0 }}
                                exit={
                                    customization.enableAnimations
                                        ? { opacity: 0, x: -20 }
                                        : {}
                                }
                                transition={
                                    customization.enableAnimations
                                        ? animationSpeed
                                        : { duration: 0 }
                                }
                                className="min-h-[300px] flex items-center justify-center"
                            >
                                <div
                                    className="w-full max-w-md mx-auto p-6 rounded-xl border backdrop-blur-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${customization.backgroundColor}80, ${customization.secondaryColor}20)`,
                                        borderColor:
                                            customization.accentColor + "50",
                                    }}
                                >
                                    {renderStepContent(
                                        steps[currentStep],
                                        currentStep
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* 네비게이션 버튼 */}
                        <motion.div
                            initial={
                                customization.enableAnimations
                                    ? { opacity: 0, y: 20 }
                                    : {}
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                                customization.enableAnimations
                                    ? { delay: 0.5 }
                                    : {}
                            }
                            className="flex justify-between items-center"
                        >
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={cn(
                                    "font-medium transition-all",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "flex items-center gap-2",
                                    buttonStyle,
                                    getResponsiveClass(
                                        headerSizes.buttonSize || 20
                                    ).paddingClass,
                                    headerSubtitleClasses
                                )}
                                style={{
                                    backgroundColor:
                                        customization.secondaryColor + "80",
                                    color: customization.backgroundColor,
                                }}
                            >
                                <ArrowLeft
                                    className={
                                        getResponsiveClass(
                                            Math.max(
                                                (headerSizes.buttonSize || 20) -
                                                    5,
                                                15
                                            )
                                        ).frameClass
                                    }
                                />
                                Previous
                            </button>

                            <div className="flex gap-2">
                                {steps.map((_, index) => {
                                    const dotSize = Math.max(
                                        (headerSizes.buttonSize || 20) / 10,
                                        2
                                    );
                                    const activeDotWidth = Math.max(
                                        dotSize * 3,
                                        6
                                    );
                                    return (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setCurrentStep(index)
                                            }
                                            className={cn(
                                                "rounded-full transition-all",
                                                index === currentStep
                                                    ? ""
                                                    : "opacity-50 hover:opacity-75"
                                            )}
                                            style={{
                                                width:
                                                    index === currentStep
                                                        ? `${activeDotWidth}px`
                                                        : `${dotSize}px`,
                                                height: `${dotSize}px`,
                                                backgroundColor:
                                                    index === currentStep
                                                        ? customization.primaryColor
                                                        : customization.textColor +
                                                          "60",
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            <button
                                onClick={nextStep}
                                disabled={isCompleting}
                                className={cn(
                                    "font-medium transition-all",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "flex items-center gap-2",
                                    buttonStyle,
                                    getResponsiveClass(
                                        headerSizes.buttonSize || 20
                                    ).paddingClass,
                                    headerSubtitleClasses
                                )}
                                style={{
                                    backgroundColor: customization.primaryColor,
                                    color: customization.backgroundColor,
                                }}
                            >
                                {isCompleting ? (
                                    <motion.div
                                        animate={
                                            customization.enableAnimations
                                                ? { rotate: 360 }
                                                : {}
                                        }
                                        transition={
                                            customization.enableAnimations
                                                ? {
                                                      duration: 1,
                                                      repeat: Infinity,
                                                      ease: "linear",
                                                  }
                                                : {}
                                        }
                                        className={cn(
                                            "border-2 border-white border-t-transparent rounded-full",
                                            getResponsiveClass(
                                                Math.max(
                                                    (headerSizes.buttonSize ||
                                                        20) - 5,
                                                    15
                                                )
                                            ).frameClass
                                        )}
                                    />
                                ) : (
                                    <>
                                        {currentStep === steps.length - 1
                                            ? "Complete"
                                            : "Next"}
                                        <ArrowRight
                                            className={
                                                getResponsiveClass(
                                                    Math.max(
                                                        (headerSizes.buttonSize ||
                                                            20) - 5,
                                                        15
                                                    )
                                                ).frameClass
                                            }
                                        />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
