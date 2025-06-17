/// components/user/User.Yapping.Register.tsx

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player, TweetAuthor } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import TwitterIntegration from "../atoms/TwitterIntegration";
import { useEffect, useState } from "react";

interface UserYappingRegisterProps {
    user: User | null;
    player: Player | null;
    tweetAuthor?: TweetAuthor | null;
    onXAuthSuccess?: () => void;
}

export default function UserYappingRegister({
    user,
    player,
    tweetAuthor,
    onXAuthSuccess,
}: UserYappingRegisterProps) {
    const [tweetAuthorId, setTweetAuthorId] = useState<string | null>(null);
    const [isValidated, setIsValidated] = useState<boolean>(false);
    const [isTweetChecked, setIsTweetChecked] = useState<boolean>(false);
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [step, setStep] = useState<
        "login" | "validate" | "post" | "confirm" | "complete"
    >("login");
    const [hasConnectedAccount, setHasConnectedAccount] =
        useState<boolean>(false);

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

    useEffect(() => {
        // 이미 계정을 연결한 상태라면 step을 강제로 변경하지 않음
        if (hasConnectedAccount) {
            return;
        }

        if (!tweetAuthor) {
            setStep("login");
        } else {
            setTweetAuthorId(tweetAuthor.authorId);
            if (tweetAuthor.registered) {
                setStep("complete");
            } else if (tweetAuthor.validated && !tweetAuthor.registered) {
                setStep("confirm");
            } else {
                setStep("validate");
            }
        }
    }, [tweetAuthor, hasConnectedAccount]);

    const createXPostIntent = (): string => {
        const params = new URLSearchParams();
        const text = `@StarglowP
        
🌟 Glow and Grow with Starglow! 🌟
#Starglow #Web3 #Kpop

Join us on Starglow!
https://starglow.io
`;

        params.append("text", text);

        return `https://twitter.com/intent/tweet?${params.toString()}`;
    };

    const handleValidateRegisterXAuthor = async () => {
        try {
            console.log("tweetAuthorId", tweetAuthorId);
            console.log("player", player);
            // 트위터 로그인 후 로그인한 account의 정보를 활용하여 setTweetAuthorId(author_id) 함수를 통해 값을 설정해야 함
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
                setIsValidated(true);
                // 검증 성공 시 부모 컴포넌트의 데이터 새로고침
                onXAuthSuccess?.();
                setTimeout(() => {
                    setStep("post");
                }, 1000);
            } else {
                toast.error(
                    validateResult.message ||
                        "Invalid input. Please try again. If the problem persists, please contact support."
                );
                setIsValidated(false);
            }
        } catch (error) {
            console.error(error);
            toast.error(
                "Error occurred while validating X Account. Please try again. If the problem persists, please contact support."
            );
        }
    };

    const handleIntentXPost = () => {
        window.open(createXPostIntent(), "_blank");
    };

    const handleCheckIsActiveXAuthor = async () => {
        try {
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

            console.log("checkResult", checkResult);

            if (checkResult.isActive) {
                setIsTweetChecked(true);
                setTimeout(() => {
                    setStep("confirm");
                }, 1000);
            } else {
                toast.error(
                    "We couldn't find any recent tweets mentioning @StarglowP. Please try again."
                );
                setIsTweetChecked(false);
            }
        } catch (error) {
            console.error(error);
            toast.error(
                "Error occurred while checking X Account Activity. Please try again. If the problem persists, please contact support."
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

            if (!player.id) {
                toast.error(
                    "Invalid input. Please try again. If the problem persists, please contact support."
                );
                return;
            }

            if (!tweetAuthorId) {
                toast.error(
                    "Invalid input. Please try again. If the problem persists, please contact support."
                );
                return;
            }

            const confirmResult = await confirmRegisterXAuthorAsync({
                playerId: player.id,
                tweetAuthorId: tweetAuthorId,
            });

            if (confirmResult.success) {
                setIsConfirmed(true);
                setStep("complete");
                // 등록 완료 후 부모 컴포넌트의 데이터 새로고침
                setTimeout(() => {
                    onXAuthSuccess?.();
                }, 1500);
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
        <div className="flex flex-col items-center justify-center h-full space-y-6 p-6">
            {/* Step 1: X 계정 연결 */}
            {step === "login" && (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">
                        Step 1: Connect your X Account
                    </h3>
                    <TwitterIntegration
                        onSuccess={(authorId, userData) => {
                            setTweetAuthorId(authorId);
                            setHasConnectedAccount(true);
                            toast.success(
                                `@${userData.username} account connected!`
                            );
                            // 자연스럽게 다음 단계로 진행
                            setTimeout(() => {
                                setStep("validate");
                            }, 1000);
                        }}
                        onError={(error) => {
                            toast.error(error);
                        }}
                        playerId={player?.id || ""}
                    />
                </div>
            )}

            {/* Step 2: 계정 검증 */}
            {step === "validate" && (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">
                        Step 2: Validate Account
                    </h3>
                    <button
                        onClick={handleValidateRegisterXAuthor}
                        disabled={isValidateRegisterXAuthorPending}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isValidateRegisterXAuthorPending
                            ? "Validating..."
                            : "Validate Account"}
                    </button>
                </div>
            )}

            {/* Step 3: 트윗 게시 */}
            {step === "post" && (
                <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">Step 3: Post on X</h3>
                    <p className="text-sm text-gray-600">
                        Post a tweet mentioning @StarglowP to verify your
                        account
                    </p>
                    <button
                        onClick={handleIntentXPost}
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center gap-2 mx-auto"
                    >
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Post on X
                    </button>
                    <button
                        onClick={handleCheckIsActiveXAuthor}
                        disabled={isCheckIsActiveXAuthorPending}
                        className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                        {isCheckIsActiveXAuthorPending
                            ? "Checking..."
                            : "Verify Tweet"}
                    </button>
                </div>
            )}

            {/* Step 4: 최종 확인 */}
            {step === "confirm" && (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">
                        Step 4: Complete Registration
                    </h3>
                    <button
                        onClick={handleConfirmRegisterXAuthor}
                        disabled={isConfirmRegisterXAuthorPending}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                        {isConfirmRegisterXAuthorPending
                            ? "Confirming..."
                            : "Complete Registration"}
                    </button>
                </div>
            )}

            {/* 완료 상태 */}
            {step === "complete" && (
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                        Registration Complete!
                    </h3>
                    <p className="text-gray-600">
                        Your X account has been successfully connected to
                        Starglow.
                    </p>
                </div>
            )}
        </div>
    );
}
