/// components/user/User.Tweets.tsx

"use client";

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import PartialLoading from "../atoms/PartialLoading";
import UserTweetsRegister from "./User.Tweets.Register";
import UserTweetsTutorialModal from "./User.Tweets.Tutorial.Modal";
import { cn } from "@/lib/utils/tailwind";
import { useState, useEffect } from "react";
import UserTweetsDashboard from "./User.Tweets.Dashboard";

interface UserTweetsProps {
    user: User | null;
    player: Player | null;
}

export default function UserTweets({ user, player }: UserTweetsProps) {
    const [showTutorial, setShowTutorial] = useState(false);

    const {
        authorByPlayerId,
        isAuthorByPlayerIdLoading,
        refetchAuthorByPlayerId,
    } = useTweets({
        getAuthorByPlayerIdInput: {
            playerId: player?.id || "",
        },
    });

    useEffect(() => {
        const tutorialSeen = localStorage.getItem("tweets-tutorial-seen");
        if (!tutorialSeen && !isAuthorByPlayerIdLoading) {
            localStorage.setItem("tweets-tutorial-seen", "true");
            setShowTutorial(true);
        }
    }, [isAuthorByPlayerIdLoading]);

    const handleTutorialComplete = () => {
        localStorage.setItem("tweets-tutorial-seen", "true");
        setShowTutorial(false);
    };

    const handleXDisconnect = () => {
        refetchAuthorByPlayerId();
    };

    if (isAuthorByPlayerIdLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <PartialLoading text="Loading..." />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-screen max-w-[1000px] mx-auto",
                "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                "gap-[15px]"
            )}
        >
            <h2 className="text-2xl font-bold">TWEETS</h2>
            {authorByPlayerId &&
            authorByPlayerId.registered &&
            user &&
            player ? (
                <UserTweetsDashboard
                    user={user}
                    player={player}
                    tweetAuthor={authorByPlayerId}
                    setShowTutorial={setShowTutorial}
                    onXDisconnect={handleXDisconnect}
                />
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
