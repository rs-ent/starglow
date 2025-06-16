/// components/user/User.Yapping.tsx

import { useTweets } from "@/app/actions/x/hooks";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "../atoms/PartialLoading";
import UserYappingRegister from "./User.Yapping.Register";
import { cn } from "@/lib/utils/tailwind";

interface UserYappingProps {
    user: User | null;
    player: Player | null;
}

export default function UserYapping({ user, player }: UserYappingProps) {
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
        return <UserYappingRegister user={user} player={player} />;
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-screen max-w-[1000px]",
                "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                "gap-[15px]"
            )}
        >
            <h2 className="text-2xl font-bold">Yapping</h2>
            {authorByPlayerId.authorId ? (
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
                    Start!
                </button>
            ) : (
                <UserYappingRegister user={user} player={player} />
            )}
        </div>
    );
}
