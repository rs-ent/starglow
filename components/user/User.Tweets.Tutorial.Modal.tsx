import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, TrendingUp, Award, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
                    <p className="text-lg text-gray-300">
                        Join the revolution where your voice matters and your
                        tweets earn!
                    </p>
                    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                        <p className="text-sm text-purple-300">
                            💎 Post tweets about your favorite K-pop stars
                        </p>
                        <p className="text-sm text-purple-300 mt-2">
                            🎯 Earn rewards based on engagement & quality
                        </p>
                        <p className="text-sm text-purple-300 mt-2">
                            🌟 Support artists while growing your influence
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
                            <div className="text-2xl">1️⃣</div>
                            <div>
                                <h4 className="font-bold text-blue-300">
                                    Tag @StarglowP (Required)
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                    Every tweet must mention @StarglowP to
                                    qualify
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                            <div className="text-2xl">2️⃣</div>
                            <div>
                                <h4 className="font-bold text-purple-300">
                                    Tag Artists for Bonus
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                    Include Starglow artists' Twitter handles
                                    for extra rewards
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 rounded-xl border border-green-500/30">
                            <div className="text-2xl">3️⃣</div>
                            <div>
                                <h4 className="font-bold text-green-300">
                                    AI-Powered Rewards
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
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
                            <Award className="w-8 h-8 text-orange-400 mb-2" />
                            <h4 className="font-bold text-orange-300">
                                Quality Content
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Thoughtful posts earn more than spam
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-xl border border-blue-500/30">
                            <Twitter className="w-8 h-8 text-blue-400 mb-2" />
                            <h4 className="font-bold text-blue-300">
                                High Engagement
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Likes, RTs & replies boost rewards
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-4 rounded-xl border border-purple-500/30">
                            <Zap className="w-8 h-8 text-purple-400 mb-2" />
                            <h4 className="font-bold text-purple-300">
                                Trending Topics
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Join conversations that matter
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 p-4 rounded-xl border border-green-500/30">
                            <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                            <h4 className="font-bold text-green-300">
                                Consistency
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Regular posting = steady income
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-400">
                            Top earners make up to
                        </p>
                        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                            <NumberTicker
                                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
                                value={1000}
                            />{" "}
                            $SGT/month
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: <div className="text-6xl">🎉</div>,
            title: "🌟 LET'S GET HYPED!",
            subtitle: "Your Journey Starts Now",
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
                            className="text-8xl mx-auto"
                        >
                            🚀
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400">
                            Be Creative. Be Viral. Be Rewarded.
                        </h3>
                        <p className="text-lg text-gray-300">
                            Join thousands of creators earning while supporting
                            their idols
                        </p>
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
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg inline-block cursor-pointer hover:scale-105 transition-transform"
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
                <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 p-0 overflow-hidden">
                    <div className="relative">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

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
                                className="p-8 pt-12"
                            >
                                <div className="text-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15,
                                        }}
                                        className="inline-block mb-4"
                                    >
                                        {steps[currentStep].icon}
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {steps[currentStep].title}
                                    </h2>
                                    <p className="text-gray-400">
                                        {steps[currentStep].subtitle}
                                    </p>
                                </div>

                                <div className="mt-6">
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
