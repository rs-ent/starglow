/// components/user/User.Tweets.tsx

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "../atoms/PartialLoading";
import UserTweetsRegister from "./User.Tweets.Register";
import UserTweetsTutorialModal from "./User.Tweets.Tutorial.Modal";
import { cn } from "@/lib/utils/tailwind";
import { useState, useEffect } from "react";

interface UserTweetsProps {
    user: User | null;
    player: Player | null;
}

export default function UserTweets({ user, player }: UserTweetsProps) {
    const toast = useToast();
    const [showTutorial, setShowTutorial] = useState(false);
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

    const {
        authorByPlayerId,
        isAuthorByPlayerIdLoading,
        authorByPlayerIdError,
        refetchAuthorByPlayerId,
    } = useTweets({
        getAuthorByPlayerIdInput: {
            playerId: player?.id || "",
        },
    });

    useEffect(() => {
        const tutorialSeen = localStorage.getItem("tweets-tutorial-seen");
        if (!tutorialSeen && !isAuthorByPlayerIdLoading) {
            setShowTutorial(true);
        }
    }, [isAuthorByPlayerIdLoading]);

    const handleTutorialComplete = () => {
        localStorage.setItem("tweets-tutorial-seen", "true");
        setHasSeenTutorial(true);
        setShowTutorial(false);
    };

    if (isAuthorByPlayerIdLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <PartialLoading text="Loading..." size="sm" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-screen max-w-[1000px]",
                "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                "gap-[15px]"
            )}
        >
            <h2 className="text-2xl font-bold">TWEETS</h2>
            {authorByPlayerId && authorByPlayerId.registered ? (
                <div className="flex flex-col items-center gap-4">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
                        Start!
                    </button>
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="text-sm text-gray-400 hover:text-gray-300 underline"
                    >
                        View Tutorial Again
                    </button>
                </div>
            ) : (
                <UserTweetsRegister
                    user={user}
                    player={player}
                    tweetAuthor={authorByPlayerId}
                    onXAuthSuccess={refetchAuthorByPlayerId}
                />
            )}

            <UserTweetsTutorialModal
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                onComplete={handleTutorialComplete}
            />
        </div>
    );
}
