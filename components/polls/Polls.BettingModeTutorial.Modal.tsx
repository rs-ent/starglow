/// components/polls/Polls.BettingModeTutorial.Modal.tsx

"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
    FlameIcon,
    TrendingUp,
    Award,
    ArrowRight,
    AlertTriangle,
    Target,
    Coins,
    Trophy,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface PollsBettingModeTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export default function PollsBettingModeTutorialModal({
    isOpen,
    onClose,
    onComplete,
}: PollsBettingModeTutorialModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: (
                <FlameIcon
                    className={cn(
                        "text-orange-400",
                        getResponsiveClass(50).frameClass
                    )}
                />
            ),
            title: "🎰 BETTING MODE",
            subtitle: "Predict the Future, Win Real Rewards!",
            content: (
                <div className="space-y-2">
                    <div
                        className={cn(
                            "bg-gradient-to-r from-orange-900/20 to-red-900/20 p-4 rounded-xl border border-orange-500/30"
                        )}
                    >
                        <p
                            className={cn(
                                "text-orange-300",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            🔥 <strong>Real stake, real rewards</strong> - Use
                            your tokens to bet on outcomes
                        </p>
                        <p
                            className={cn(
                                "text-orange-300 mt-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            💰 <strong>Win big payouts</strong> when you predict
                            correctly
                        </p>
                        <p
                            className={cn(
                                "text-orange-300 mt-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            ⚡ <strong>High risk, high reward</strong> -
                            Different from regular polls
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-xl border border-blue-500/30">
                        <h4
                            className={cn(
                                "text-blue-300 font-bold mb-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            🆚 Regular Poll vs Betting Mode
                        </h4>
                        <div
                            className={cn(
                                "grid grid-cols-2 gap-3",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            <div>
                                <p className="text-green-400 font-semibold">
                                    Regular Poll
                                </p>
                                <p className="text-gray-400">
                                    • Free to participate
                                </p>
                                <p className="text-gray-400">
                                    • Always get rewards
                                </p>
                                <p className="text-gray-400">• No risk</p>
                            </div>
                            <div>
                                <p className="text-orange-400 font-semibold">
                                    Betting Mode
                                </p>
                                <p className="text-gray-400">
                                    • Costs tokens to bet
                                </p>
                                <p className="text-gray-400">
                                    • Win only if correct
                                </p>
                                <p className="text-gray-400">
                                    • Lose bet if wrong
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: (
                <Coins
                    className={cn(
                        "text-yellow-400",
                        getResponsiveClass(50).frameClass
                    )}
                />
            ),
            title: "💰 HOW TO BET",
            subtitle: "Place Your Bets Wisely!",
            content: (
                <div className="space-y-2">
                    <div className="space-y-1">
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
                                    Choose Your Option
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Select the outcome you think will win
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
                                    Set Bet Amount
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Decide how many tokens to risk (within
                                    min/max limits)
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
                                    Submit Your Bet
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Tokens are deducted immediately from your
                                    balance
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: (
                <AlertTriangle
                    className={cn(
                        "text-red-400",
                        getResponsiveClass(50).frameClass
                    )}
                />
            ),
            title: "⚖️ RISKS & REWARDS",
            subtitle: "Understanding What's at Stake",
            content: (
                <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 p-2 rounded-xl border border-red-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle
                                    className={cn(
                                        "text-red-400 flex-shrink-0",
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-red-300",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Risks
                                </p>
                            </div>
                            <ul
                                className={cn(
                                    "text-gray-400 space-y-1 ml-2",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <li>• You lose your bet if you choose wrong</li>
                                <li>• No refunds for incorrect predictions</li>
                                <li>• Only bet what you can afford to lose</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-2 rounded-xl border border-green-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy
                                    className={cn(
                                        "text-green-400 flex-shrink-0",
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "font-bold text-green-300",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Rewards
                                </p>
                            </div>
                            <ul
                                className={cn(
                                    "text-gray-400 space-y-1 ml-2",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <li>• Win big payouts from the betting pool</li>
                                <li>
                                    • Share winnings with other correct
                                    predictors
                                </li>
                                <li>
                                    • Bigger bets = bigger potential payouts
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-2 rounded-xl border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Target
                                className={cn(
                                    "text-yellow-400 flex-shrink-0",
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                            <p
                                className={cn(
                                    "font-bold text-yellow-300",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                House Commission
                            </p>
                        </div>
                        <p
                            className={cn(
                                "text-gray-400 ml-2",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            The platform takes a tiny fee to maintain the
                            system.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            icon: (
                <TrendingUp
                    className={cn(
                        "text-purple-400",
                        getResponsiveClass(50).frameClass
                    )}
                />
            ),
            title: "🏁 SETTLEMENT",
            subtitle: "How Winners Get Paid",
            content: (
                <div className="space-y-2">
                    <div className="space-y-1">
                        <div className="flex items-start gap-3 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-2 rounded-xl border border-indigo-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                ⏰
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-indigo-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Poll Ends
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Betting closes when the poll ends
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-2 rounded-xl border border-blue-500/30">
                            <div
                                className={cn(getResponsiveClass(20).textClass)}
                            >
                                🎯
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "font-bold text-blue-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Answer Revealed
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Admins manually set the winning option(s)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-2 rounded-xl border border-green-500/30">
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
                                    Automatic Payout
                                </p>
                                <p
                                    className={cn(
                                        "text-gray-400 mt-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Winners automatically receive their share of
                                    the betting pool
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-2 rounded-xl border border-purple-500/30">
                        <h4
                            className={cn(
                                "text-purple-300 font-bold mb-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            💡 Payout Calculation
                        </h4>
                        <p
                            className={cn(
                                "text-gray-400",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Your payout = (Your bet ÷ Total winning bets) ×
                            Total betting pool (minus 5% commission)
                        </p>
                        <div
                            className={cn(
                                "mt-2 p-2 bg-black/20 rounded text-xs text-yellow-300",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            <strong>Example:</strong> You bet 100 tokens on the
                            winning option. Total winning bets: 1,000 tokens.
                            Total pool: 10,000 tokens. Your payout: (100÷1,000)
                            × 9,500 = 950 tokens!
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "🔥 READY TO BET?",
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
                            🎰
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h3
                            className={cn(
                                "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            Predict Smart
                            <br />
                            Bet Responsibly
                            <br />
                            Win Big
                        </h3>

                        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 p-4 rounded-xl border border-red-500/30 mt-4">
                            <p
                                className={cn(
                                    "text-red-300 font-semibold",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                ⚠️ Remember: Only bet what you can afford to
                                lose!
                            </p>
                        </div>
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
                            "bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-full font-bold text-lg inline-block cursor-pointer hover:scale-105 transition-transform",
                            getResponsiveClass(15).textClass
                        )}
                        onClick={() => {
                            onComplete?.();
                            onClose();
                        }}
                    >
                        Start Betting Now! 🚀
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
                <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-800 p-0 overflow-hidden [&>button]:z-20">
                    <div className="relative">
                        {/* Fire background for betting theme */}
                        <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
                            <img
                                src="/elements/fire-background.gif"
                                alt="Fire background"
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{
                                    mixBlendMode: "overlay",
                                    filter: "hue-rotate(10deg) saturate(1.3) brightness(1.1)",
                                }}
                            />
                        </div>

                        {/* Progress bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-10">
                            <motion.div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
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
                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn("p-1 sm:p-3 md:p-5 pt-4")}
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
                                                className={cn(
                                                    "inline-block mb-2"
                                                )}
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
                                                    currentStep === 0 &&
                                                        "invisible"
                                                )}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                className={cn(
                                                    "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2",
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
                                                ? "w-8 bg-gradient-to-r from-orange-500 to-red-500"
                                                : "bg-gray-600 hover:bg-gray-500"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

const BettingIcon = ({ className }: { className: string }) => {
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
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="currentColor"
            />
            <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.7" />
            <circle cx="16" cy="8" r="2" fill="currentColor" opacity="0.7" />
            <circle cx="12" cy="16" r="2" fill="currentColor" opacity="0.7" />
        </svg>
    );
};
