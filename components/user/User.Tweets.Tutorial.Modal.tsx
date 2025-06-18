import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, TrendingUp, Award, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Confetti } from "@/components/magicui/confetti";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface UserTweetsTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export default function UserTweetsTutorialModal({
    isOpen,
    onClose,
    onComplete,
}: UserTweetsTutorialModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const steps = [
        {
            icon: <Twitter className="w-16 h-16" />,
            title: "🚀 TWEET TO EARN",
            subtitle: "Turn Your Social Power into Real Rewards!",
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
                            💎 <strong>Post tweets</strong> about STARGLOW or
                            your favorite K-pop stars
                        </p>
                        <p
                            className={cn(
                                "text-purple-300 mt-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            🎯 <strong>Earn rewards</strong> based on engagement
                            & quality
                        </p>
                        <p
                            className={cn(
                                "text-purple-300 mt-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            🌟 <strong>Support your artists</strong> while
                            growing your influence
                        </p>
                    </div>
                </div>
            ),
        },
        {
            icon: <Zap className="w-16 h-16 text-yellow-400" />,
            title: "⚡ HOW IT WORKS",
            subtitle: "Simple Rules, Massive Rewards",
            content: (
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-4 rounded-xl border border-blue-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                1️⃣
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-blue-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Tag @StarglowP (Required)
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Every tweet must mention @StarglowP to
                                    qualify
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                2️⃣
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-purple-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Tag Artists for Bonus
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Include Starglow artists' Twitter handles
                                    for extra rewards
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 rounded-xl border border-green-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                3️⃣
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-green-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    AI-Powered Rewards
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Our AI analyzes engagement, quality & impact
                                    to determine your rewards
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: <TrendingUp className="w-16 h-16 text-green-400" />,
            title: "📈 MAXIMIZE YOUR EARNINGS",
            subtitle: "Pro Tips from Top Earners",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 p-4 rounded-xl border border-orange-500/30">
                            <div className="flex items-center gap-2">
                                <Award
                                    className={cn(
                                        "text-orange-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-orange-300 flex-1 break-words",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Quality Content
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Thoughtful posts earn more than spam
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-2">
                                <Twitter
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
                                    High Engmt.
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Likes, RTs & replies boost rewards
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                            <div className="flex items-center gap-2">
                                <Zap
                                    className={cn(
                                        "text-purple-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-blue-300 flex-1 break-words",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Trending Topics
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Join conversations that matter
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 p-4 rounded-xl border border-green-500/30">
                            <div className="flex items-center gap-2">
                                <TrendingUp
                                    className={cn(
                                        "text-green-400 flex-shrink-0",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-green-300 flex-1 break-all",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Consistency
                                </p>
                            </div>
                            <p
                                className={cn(
                                    "text-gray-400 mt-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Regular posting = steady income
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "🌟 LET'S GET HYPED!",
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
                            🚀
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h3
                            className={cn(
                                "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            Be Creative
                            <br />
                            Be Viral
                            <br />
                            Be Rewarded
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
                            setShowConfetti(true);
                            setTimeout(() => {
                                onComplete?.();
                                onClose();
                            }, 1000);
                        }}
                    >
                        Start Earning Now! 💎
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
                                    <div className="flex justify-between mt-8">
                                        <button
                                            onClick={prevStep}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors",
                                                currentStep === 0 && "invisible"
                                            )}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                                        >
                                            Next
                                            <ArrowRight className="w-4 h-4" />
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

            {showConfetti && <Confetti />}
        </>
    );
}

const Twitter = ({ className }: { className: string }) => {
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                fill="currentColor"
            />
        </svg>
    );
};
