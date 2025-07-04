/// components/user/User.Tweets.tsx

"use client";

import { useState, useEffect, useCallback } from "react";

import { useTweets } from "@/app/actions/x/hooks";
import { cn } from "@/lib/utils/tailwind";

import UserTweetsDashboard from "./User.Tweets.Dashboard";
import UserTweetsRegister from "./User.Tweets.Register";
import UserTweetsTutorialModal from "./User.Tweets.Tutorial.Modal";
import PartialLoading from "../atoms/PartialLoading";

import type { Player } from "@prisma/client";
import type { User } from "next-auth";

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

    const handleTutorialComplete = useCallback(() => {
        localStorage.setItem("tweets-tutorial-seen", "true");
        setShowTutorial(false);
    }, []);

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
                "px-4 sm:px-3 md:px-4 lg:px-6",
                "gap-[15px]"
            )}
        >
            {authorByPlayerId &&
            authorByPlayerId.registered &&
            user &&
            player ? (
                <UserTweetsDashboard
                    player={player}
                    setShowTutorial={setShowTutorial}
                />
            ) : (
                <UserTweetsRegister
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
