// components/user/User.Tweets.Dashboard.tsx

"use client";

import { useTweets } from "@/app/actions/x/hooks";
import { Player, TweetAuthor } from "@prisma/client";
import { User } from "next-auth";
import { useToast } from "@/app/hooks/useToast";

interface UserTweetsDashboardProps {
    user: User;
    player: Player;
    tweetAuthor: TweetAuthor;
    setShowTutorial: (show: boolean) => void;
    onXDisconnect: () => void;
}

export default function UserTweetsDashboard({
    user,
    player,
    tweetAuthor,
    setShowTutorial,
    onXDisconnect,
}: UserTweetsDashboardProps) {
    const toast = useToast();
    const { disconnectXAccountAsync } = useTweets();

    const handleDisconnectXAccount = async () => {
        const result = await disconnectXAccountAsync({ playerId: player.id });
        if (result.success) {
            toast.success("X account disconnected successfully");
        } else {
            toast.error(result.message || "Failed to disconnect X account");
        }
    };

    return (
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
            <button
                onClick={() => handleDisconnectXAccount()}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
            >
                Disconnect Account
            </button>
        </div>
    );
}
