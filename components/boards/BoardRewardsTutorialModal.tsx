/// components/boards/BoardRewardsTutorialModal.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    TrendingUp,
    Award,
    ArrowRight,
    Heart,
    Star,
    Zap,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface BoardRewardsTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    artistName: string;
}

export default function BoardRewardsTutorialModal({
    isOpen,
    onClose,
    onComplete,
    artistName,
}: BoardRewardsTutorialModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: <Award className="w-16 h-16 text-yellow-400" />,
            title: "💎 EARN TOKENS",
            subtitle: `Support ${artistName} and Get Rewarded!`,
            content: (
                <div className="space-y-4">
                    <div
                        className={cn(
                            "bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30"
                        )}
                    >
                        <p
                            className={cn(
                                "text-purple-300",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            💰 <strong>Post content</strong> and earn tokens
                            instantly
                        </p>
                        <p
                            className={cn(
                                "text-purple-300 mt-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            🔥 <strong>Popular posts</strong> get bonus rewards
                        </p>
                        <p
                            className={cn(
                                "text-purple-300 mt-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            💬 <strong>Engage with community</strong> to
                            maximize earnings
                        </p>
                    </div>
                </div>
            ),
        },
        {
            icon: <MessageCircle className="w-16 h-16 text-blue-400" />,
            title: "📝 POST TO EARN",
            subtitle: "Every Post Counts!",
            content: (
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-4 rounded-xl border border-blue-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                📝
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-blue-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Create Quality Posts
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Share your thoughts, photos, or videos about{" "}
                                    {artistName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 rounded-xl border border-green-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                💰
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-green-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Instant Token Rewards
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Receive SGP tokens immediately after posting
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                📁
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-purple-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Add Media for Impact
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Images and videos get more engagement and
                                    higher rewards
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: <TrendingUp className="w-16 h-16 text-green-400" />,
            title: "🔥 VIRAL = BONUS",
            subtitle: "Popular Posts Get Extra Rewards!",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 p-4 rounded-xl border border-red-500/30">
                            <div className="flex items-center gap-2">
                                <Heart
                                    className={cn(
                                        "text-red-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-red-300 flex-1 break-words",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Get Likes
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                More likes = bigger rewards
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-2">
                                <TrendingUp
                                    className={cn(
                                        "text-blue-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-blue-300 flex-1 break-words",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Hyped
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Get featured for bonus tokens
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                            <div className="flex items-center gap-2">
                                <MessageCircle
                                    className={cn(
                                        "text-purple-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-purple-300 flex-1 break-words",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Comments
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Active discussions boost rewards
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 p-4 rounded-xl border border-yellow-500/30">
                            <div className="flex items-center gap-2">
                                <Star
                                    className={cn(
                                        "text-yellow-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-yellow-300 flex-1 break-words",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Quality Posts
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                AI detects and rewards quality
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: <Zap className="w-16 h-16 text-purple-400" />,
            title: "💬 ENGAGE TO EARN",
            subtitle: "Comments and Reactions Count Too!",
            content: (
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-4 rounded-xl border border-indigo-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                💬
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-indigo-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Write Thoughtful Comments
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Meaningful comments earn tokens too
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-pink-900/20 to-red-900/20 p-4 rounded-xl border border-pink-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                ❤️
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-pink-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Like and React
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Support other fans and get rewarded
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 p-4 rounded-xl border border-cyan-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                🌟
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-cyan-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Build Community
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Active community members get bonus rewards
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "🚀 START EARNING NOW!",
            content: (
                <div className="space-y-6 text-center">
                    <div className="relative">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop",
                            }}
                            className={cn(
                                "mx-auto",
                                getResponsiveClass(70).textClass
                            )}
                        >
                            💎
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h3
                            className={cn(
                                "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            Support {artistName}
                            <br />
                            Build Community
                            <br />
                            Earn Rewards
                        </h3>
                    </div>

                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                        className={cn(
                            "bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg inline-block cursor-pointer hover:scale-105 transition-transform",
                            getResponsiveClass(15).textClass
                        )}
                        onClick={() => {
                            onComplete?.();
                            onClose();
                        }}
                    >
                        Start Posting Now! 💫
                    </motion.div>
                </div>
            ),
        },
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-800 p-0 overflow-hidden">
                    <div className="relative">
                        {/* Progress bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${
                                        ((currentStep + 1) / steps.length) * 100
                                    }%`,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className={cn("p-3 sm:p-5 md:p-8 pt-6")}
                            >
                                <div className="text-center mb-3">
                                    {steps[currentStep].icon && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 15,
                                            }}
                                            className={cn("inline-block mb-2")}
                                        >
                                            {steps[currentStep].icon}
                                        </motion.div>
                                    )}
                                    <h2
                                        className={cn(
                                            "font-bold text-white mb-2",
                                            getResponsiveClass(30).textClass
                                        )}
                                    >
                                        {steps[currentStep].title}
                                    </h2>
                                    <p
                                        className={cn(
                                            "text-gray-400",
                                            "font-semibold",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        {steps[currentStep].subtitle}
                                    </p>
                                </div>

                                <div
                                    className={cn(
                                        "mt-6",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {steps[currentStep].content}
                                </div>

                                {/* Navigation */}
                                {currentStep < steps.length - 1 && (
                                    <div className="flex justify-between mt-[20px]">
                                        <button
                                            onClick={prevStep}
                                            className={cn(
                                                "rounded-lg text-gray-400 hover:text-white transition-colors",
                                                getResponsiveClass(15)
                                                    .paddingClass,
                                                getResponsiveClass(15)
                                                    .textClass,
                                                currentStep === 0 && "invisible"
                                            )}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            className={cn(
                                                "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2",
                                                getResponsiveClass(20)
                                                    .textClass,
                                                getResponsiveClass(25)
                                                    .paddingClass
                                            )}
                                        >
                                            Next
                                            <ArrowRight
                                                className={cn(
                                                    getResponsiveClass(20)
                                                        .frameClass
                                                )}
                                            />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Step indicators */}
                        <div className="flex justify-center gap-2 pb-6">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all",
                                        index === currentStep
                                            ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500"
                                            : "bg-gray-600 hover:bg-gray-500"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
