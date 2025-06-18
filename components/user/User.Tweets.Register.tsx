/// components/user/User.Tweets.Register.tsx

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player, TweetAuthor } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import TwitterIntegration from "../atoms/TwitterIntegration";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UserPlus,
    CheckCircle2,
    Send,
    Sparkles,
    Zap,
    Rocket,
    AlertCircle,
    RefreshCcw,
} from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Confetti } from "@/components/magicui/confetti";

interface UserTweetsRegisterProps {
    user: User | null;
    player: Player | null;
    tweetAuthor?: TweetAuthor | null;
    onXAuthSuccess?: () => void;
}

const tweetText = `@StarglowP
        
🌟 Glow and Grow with Starglow! 🌟
#Starglow #Web3 #Kpop

Join us on Starglow!
https://starglow.io
`;

const steps = ["login", "validate", "post", "confirm", "complete"];

export default function UserTweetsRegister({
    user,
    player,
    tweetAuthor,
    onXAuthSuccess,
}: UserTweetsRegisterProps) {
    const [tweetAuthorId, setTweetAuthorId] = useState<string | null>(null);
    const [validateFailed, setValidateFailed] = useState<boolean>(false);
    const [step, setStep] = useState<
        "login" | "validate" | "post" | "confirm" | "complete"
    >("login");
    const [hasConnectedAccount, setHasConnectedAccount] =
        useState<boolean>(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const toast = useToast();
    const {
        validateRegisterXAuthor,
        validateRegisterXAuthorAsync,
        isValidateRegisterXAuthorPending,
        isValidateRegisterXAuthorError,
        validateRegisterXAuthorError,

        checkIsActiveXAuthor,
        checkIsActiveXAuthorAsync,
        isCheckIsActiveXAuthorPending,
        isCheckIsActiveXAuthorError,
        checkIsActiveXAuthorError,

        confirmRegisterXAuthor,
        confirmRegisterXAuthorAsync,
        isConfirmRegisterXAuthorPending,
        isConfirmRegisterXAuthorError,
        confirmRegisterXAuthorError,
    } = useTweets();

    const { currentStepIndex, progressPercentage } = useMemo(() => {
        const currentStepIndex = steps.indexOf(step);
        const progressPercentage =
            ((currentStepIndex + 1) / steps.length) * 100;
        return { currentStepIndex, progressPercentage };
    }, [step]);

    useEffect(() => {
        if (hasConnectedAccount) {
            setStep("validate");
            return;
        }

        if (!tweetAuthor) {
            console.log("!tweetAuthor", !tweetAuthor);
            setStep("login");
        } else {
            setTweetAuthorId(tweetAuthor.authorId);
            if (tweetAuthor.registered) {
                console.log("tweetAuthor.registered", tweetAuthor.registered);
                setStep("complete");
            } else if (tweetAuthor.validated && !tweetAuthor.registered) {
                console.log(
                    "tweetAuthor.validated && !tweetAuthor.registered",
                    tweetAuthor.validated && !tweetAuthor.registered
                );
                setStep("confirm");
            }
        }
    }, [tweetAuthor, hasConnectedAccount]);

    const createXPostIntent = (): string => {
        const params = new URLSearchParams();

        params.append("text", tweetText);

        return `https://twitter.com/intent/tweet?${params.toString()}`;
    };

    const handleValidateRegisterXAuthor = async () => {
        if (!tweetAuthorId || !player?.id) {
            toast.error(
                "Invalid input. Please try again. If the problem persists, please contact support."
            );
            return;
        }

        const validateResult = await validateRegisterXAuthorAsync({
            playerId: player?.id || "",
            tweetAuthorId: tweetAuthorId || "",
        });

        if (validateResult.isValid) {
            toast.success("Successfully validated your X Account!");
            setValidateFailed(false);
            setStep("post");
            console.log("validateResult.isValid", validateResult.isValid);
        } else {
            toast.error(
                validateResult.message ||
                    "Invalid input. Please try again. If the problem persists, please contact support."
            );
            setValidateFailed(true);
        }
    };

    const handleIntentXPost = () => {
        window.open(createXPostIntent(), "_blank");
    };

    const handleCheckIsActiveXAuthor = async () => {
        if (!tweetAuthorId || !player?.id) {
            toast.error(
                "Invalid input. Please try again. If the problem persists, please contact support."
            );
            return;
        }

        if (step !== "post") {
            toast.error("Please complete previous steps first.");
            return;
        }

        const checkResult = await checkIsActiveXAuthorAsync({
            tweetAuthorId: tweetAuthorId || "",
        });

        if (checkResult.isActive) {
            toast.success("Successfully found your tweet from your X Account!");
            setStep("confirm");
        } else {
            toast.error(
                "We couldn't find any recent tweets mentioning @StarglowP. Please try again."
            );
        }
    };

    const handleConfirmRegisterXAuthor = async () => {
        try {
            if (!tweetAuthorId || !player?.id) {
                toast.error(
                    "Invalid input. Please try again. If the problem persists, please contact support."
                );
                return;
            }

            if (step !== "confirm") {
                toast.error("Please complete previous steps first.");
                return;
            }

            const confirmResult = await confirmRegisterXAuthorAsync({
                playerId: player.id,
                tweetAuthorId: tweetAuthorId,
            });

            if (confirmResult.success) {
                toast.success("X Account Registration Complete!");
                setShowConfetti(true);
                setStep("complete");
            } else {
                toast.error(
                    confirmResult.message ||
                        "Error occurred while confirming X Account Registration. Please try again. If the problem persists, please contact support."
                );
            }
        } catch (error) {
            console.error(error);
            toast.error(
                "Error occurred while confirming X Account Registration. Please try again. If the problem persists, please contact support."
            );
        }
    };

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center",
                "w-full max-w-[600px] mx-auto mb-[100px]",
                getResponsiveClass(20).paddingClass
            )}
        >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>

            {/* Step Indicators */}
            <div
                className={cn(
                    "flex justify-between w-full mt-[30px] mb-[20px]",
                    getResponsiveClass(15).paddingClass
                )}
            >
                {steps.map((s, index) => (
                    <motion.div
                        key={s}
                        className={cn(
                            "flex flex-col items-center",
                            getResponsiveClass(5).textClass
                        )}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div
                            className={cn(
                                "rounded-full flex items-center justify-center",
                                "transition-all duration-300",
                                getResponsiveClass(40).frameClass,
                                index <= currentStepIndex
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                    : "bg-gray-700 text-gray-400"
                            )}
                        >
                            {index < currentStepIndex ? "✓" : index + 1}
                        </div>
                        <span
                            className={cn(
                                "mt-1",
                                index <= currentStepIndex
                                    ? "text-purple-300"
                                    : "text-gray-500"
                            )}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    {/* Step 1: X 계정 연결 */}
                    {step === "login" && (
                        <div
                            className={cn(
                                "bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20",
                                "backdrop-blur-lg border border-purple-500/30",
                                "rounded-2xl p-[15px] text-center shadow-2xl"
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="mb-6"
                            >
                                <UserPlus
                                    className={cn(
                                        "mx-auto text-purple-400",
                                        getResponsiveClass(50).frameClass
                                    )}
                                />
                            </motion.div>

                            <h3
                                className={cn(
                                    "font-bold text-white mb-2",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                🔗 Connect Your X Account
                            </h3>
                            <p
                                className={cn(
                                    "text-gray-400 mb-6",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Link your X account to start earning rewards!
                            </p>

                            <div className="w-full flex justify-center items-center">
                                <TwitterIntegration
                                    onSuccess={(authorId, userData) => {
                                        setTweetAuthorId(authorId);
                                        setHasConnectedAccount(true);
                                        toast.success(
                                            `@${userData.username} account connected!`
                                        );
                                        setStep("validate");
                                    }}
                                    onError={(error) => {
                                        toast.error(error);
                                    }}
                                    playerId={player?.id || ""}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: 계정 검증 */}
                    {step === "validate" && (
                        <div
                            className={cn(
                                "bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-teal-900/20",
                                "backdrop-blur-lg border border-blue-500/30",
                                "rounded-2xl p-8 text-center shadow-2xl"
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="mb-6"
                            >
                                <CheckCircle2
                                    className={cn(
                                        "mx-auto text-blue-400",
                                        getResponsiveClass(60).frameClass
                                    )}
                                />
                            </motion.div>

                            <h3
                                className={cn(
                                    "font-bold text-white mb-2",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                ✅ Validate Your Account
                            </h3>
                            <p
                                className={cn(
                                    "text-gray-400 mb-6",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Verify your X account ownership to continue
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleValidateRegisterXAuthor}
                                disabled={isValidateRegisterXAuthorPending}
                                className={cn(
                                    "bg-gradient-to-r from-blue-500 to-cyan-500",
                                    "text-white font-bold rounded-full",
                                    "hover:from-blue-600 hover:to-cyan-600",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all duration-300 shadow-lg",
                                    getResponsiveClass(20).paddingClass
                                )}
                            >
                                {isValidateRegisterXAuthorPending ? (
                                    <span
                                        className={cn(
                                            "flex items-center gap-2",
                                            getResponsiveClass(20).textClass,
                                            getResponsiveClass(20).paddingClass
                                        )}
                                    >
                                        <RefreshCcw
                                            className={cn(
                                                getResponsiveClass(30)
                                                    .frameClass
                                            )}
                                        />
                                        Validating...
                                    </span>
                                ) : (
                                    <span
                                        className={cn(
                                            "flex items-center gap-2",
                                            getResponsiveClass(20).textClass,
                                            getResponsiveClass(20).paddingClass
                                        )}
                                    >
                                        <Zap
                                            className={cn(
                                                getResponsiveClass(30)
                                                    .frameClass
                                            )}
                                        />
                                        Validate Account
                                    </span>
                                )}
                            </motion.button>

                            {validateFailed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                                    <p className="text-red-300 mb-3">
                                        Please try again or sign in with your
                                        other X account.
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setStep("login");
                                            setValidateFailed(false);
                                        }}
                                        className={cn(
                                            "bg-gradient-to-r from-purple-500 to-pink-500",
                                            "text-white font-bold rounded-full px-6 py-2",
                                            "hover:from-purple-600 hover:to-pink-600",
                                            "transition-all duration-300",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        Try Another Account
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Step 3: 트윗 게시 */}
                    {step === "post" && (
                        <div
                            className={cn(
                                "bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20",
                                "backdrop-blur-lg border border-pink-500/30",
                                "rounded-2xl p-8 text-center shadow-2xl"
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="mb-6"
                            >
                                <Send
                                    className={cn(
                                        "mx-auto text-pink-400",
                                        getResponsiveClass(60).frameClass
                                    )}
                                />
                            </motion.div>

                            <h3
                                className={cn(
                                    "font-bold text-white mb-2",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                📢 Share the Love!
                            </h3>
                            <p
                                className={cn(
                                    "text-gray-400 mb-6",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Post a tweet mentioning @StarglowP to verify
                                your account
                            </p>

                            <div
                                className={cn(
                                    "bg-black/30 border border-gray-700 rounded-xl p-4 mb-6"
                                )}
                            >
                                <p
                                    className={cn(
                                        "text-gray-300 whitespace-pre-line text-left cursor-pointer",
                                        getResponsiveClass(10).textClass
                                    )}
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            tweetText
                                        );
                                        toast.success("Copied to clipboard");
                                    }}
                                >
                                    {tweetText}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleIntentXPost}
                                    className={cn(
                                        "w-full bg-black text-white font-bold rounded-full",
                                        "hover:bg-gray-900 transition-all duration-300 shadow-lg",
                                        "flex items-center justify-center gap-2",
                                        getResponsiveClass(20).paddingClass,
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    <Twitter
                                        className={cn(
                                            getResponsiveClass(25).frameClass
                                        )}
                                    />
                                    Post on X
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCheckIsActiveXAuthor}
                                    disabled={isCheckIsActiveXAuthorPending}
                                    className={cn(
                                        "w-full bg-gradient-to-r from-purple-500 to-pink-500",
                                        "text-white font-bold rounded-full",
                                        "hover:from-purple-600 hover:to-pink-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "transition-all duration-300 shadow-lg",
                                        getResponsiveClass(20).paddingClass
                                    )}
                                >
                                    {isCheckIsActiveXAuthorPending ? (
                                        <span
                                            className={cn(
                                                "flex items-center justify-center gap-2",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            <RefreshCcw
                                                className={cn(
                                                    getResponsiveClass(25)
                                                        .frameClass
                                                )}
                                            />
                                            Checking...
                                        </span>
                                    ) : (
                                        <span
                                            className={cn(
                                                "flex items-center justify-center gap-2",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            <Sparkles
                                                className={cn(
                                                    getResponsiveClass(25)
                                                        .frameClass
                                                )}
                                            />
                                            Verify Tweet
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: 최종 확인 */}
                    {step === "confirm" && (
                        <div
                            className={cn(
                                "bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/20",
                                "backdrop-blur-lg border border-green-500/30",
                                "rounded-2xl p-8 text-center shadow-2xl"
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="mb-6"
                            >
                                <Rocket
                                    className={cn(
                                        "mx-auto text-green-400",
                                        getResponsiveClass(60).frameClass
                                    )}
                                />
                            </motion.div>

                            <h3
                                className={cn(
                                    "font-bold text-white mb-2",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                🚀 Almost There!
                            </h3>
                            <p
                                className={cn(
                                    "text-gray-400 mb-6",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                One final step to complete your registration
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConfirmRegisterXAuthor}
                                disabled={isConfirmRegisterXAuthorPending}
                                className={cn(
                                    "bg-gradient-to-r from-green-500 to-emerald-500",
                                    "text-white font-bold rounded-full",
                                    "hover:from-green-600 hover:to-emerald-600",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all duration-300 shadow-lg",
                                    getResponsiveClass(20).paddingClass,
                                    getResponsiveClass(18).textClass
                                )}
                            >
                                {isConfirmRegisterXAuthorPending ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCcw className="w-4 h-4 animate-spin" />
                                        Confirming...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete Registration
                                    </span>
                                )}
                            </motion.button>
                        </div>
                    )}

                    {/* 완료 상태 */}
                    {step === "complete" && (
                        <div
                            className={cn(
                                "bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-yellow-900/20",
                                "backdrop-blur-lg border border-purple-500/30",
                                "rounded-2xl p-8 text-center shadow-2xl"
                            )}
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 10,
                                }}
                                className={cn(
                                    "mb-6",
                                    getResponsiveClass(80).textClass
                                )}
                            >
                                🎉
                            </motion.div>

                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={cn(
                                    "font-bold text-transparent bg-clip-text",
                                    "bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400",
                                    "mb-4",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                Welcome to the Club!
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className={cn(
                                    "text-gray-300 mb-8",
                                    getResponsiveClass(18).textClass
                                )}
                            >
                                Your X account has been successfully connected
                                to Starglow.
                                <br />
                                Start earning rewards with every tweet!
                            </motion.p>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    onXAuthSuccess?.();
                                }}
                                className={cn(
                                    "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500",
                                    "text-white font-bold rounded-full",
                                    "hover:from-purple-600 hover:via-pink-600 hover:to-yellow-600",
                                    "transition-all duration-300 shadow-lg",
                                    "transform hover:shadow-2xl",
                                    getResponsiveClass(25).paddingClass,
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <Rocket className="w-5 h-5" />
                                    Start Earning!
                                </span>
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {showConfetti && <Confetti />}
        </div>
    );
}

// Twitter Icon Component
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
