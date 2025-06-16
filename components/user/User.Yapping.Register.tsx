/// components/user/User.Yapping.Register.tsx

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "../atoms/PartialLoading";
import TwitterIntegration from "../atoms/TwitterIntegration";
import { useState } from "react";

interface UserYappingRegisterProps {
    user: User | null;
    player: Player | null;
}

export default function UserYappingRegister({
    user,
    player,
}: UserYappingRegisterProps) {
    const [tweetAuthorId, setTweetAuthorId] = useState<string | null>(null);
    const [isValidated, setIsValidated] = useState<boolean>(false);

    const toast = useToast();
    const {
        validateRegisterXAuthor,
        validateRegisterXAuthorAsync,
        isValidateRegisterXAuthorPending,
        isValidateRegisterXAuthorError,
        validateRegisterXAuthorError,
    } = useTweets();

    const handleTwitterSignIn = async () => {
        try {
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
            } else {
                toast.error(
                    validateResult.message ||
                        "Invalid input. Please try again. If the problem persists, please contact support."
                );
                setIsValidated(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <TwitterIntegration />
        </div>
    );
}
