/// components/user/User.Tweets.tsx

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "../atoms/PartialLoading";
import UserTweetsRegister from "./User.Tweets.Register";
import { cn } from "@/lib/utils/tailwind";

interface UserTweetsProps {
    user: User | null;
    player: Player | null;
}

export default function UserTweets({ user, player }: UserTweetsProps) {
    const toast = useToast();

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

    if (isAuthorByPlayerIdLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <PartialLoading text="Loading..." size="sm" />
            </div>
        );
    }

    if (!authorByPlayerId) {
        return (
            <UserTweetsRegister
                user={user}
                player={player}
                tweetAuthor={null}
                onXAuthSuccess={refetchAuthorByPlayerId}
            />
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
            {authorByPlayerId.registered ? (
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
                    Start!
                </button>
            ) : (
                <UserTweetsRegister
                    user={user}
                    player={player}
                    tweetAuthor={authorByPlayerId}
                    onXAuthSuccess={refetchAuthorByPlayerId}
                />
            )}
        </div>
    );
}
