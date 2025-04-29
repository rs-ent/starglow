/// components\templates\Polls.Participation.tsx

"use client";

import { useState, useEffect } from "react";
import { Poll } from "@prisma/client";
import Countdown from "@/components/atoms/Countdown";
import { PollOption } from "@/app/actions/polls";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import PollThumbnail from "../atoms/Polls.Thumbnail";
import { cn } from "@/lib/utils/tailwind";
import Button from "../atoms/Button";
import { usePollsSet, usePollsGet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import { useRequireAuth } from "@/app/auth/authUtils.Client";
import { useLoading } from "@/app/hooks/useLoading";

interface SinglePollProps {
    poll: Poll;
}

export default function SinglePoll({ poll }: SinglePollProps) {
    const { startLoading, endLoading } = useLoading();
    const { user } = useRequireAuth();

    const [selection, setSelection] = useState<PollOption | null>(null);
    const { tokenGating, isLoading, error } = usePollsGet({
        tokenGatingInput: {
            pollId: poll.id,
            userId: user?.id || "",
        },
    });
    const { participatePoll } = usePollsSet();

    const toast = useToast();
    const options = poll.options as unknown as PollOption[];

    useEffect(() => {
        if (isLoading) {
            startLoading();
        } else {
            endLoading();
        }
    }, [isLoading]);

    const handleSubmit = () => {
        if (!selection) {
            toast.info("Please select an option");
            return;
        }

        if (!tokenGating?.success || !tokenGating?.data?.hasToken) {
            toast.error(
                "This polls is need an authentication. Please purchase the NFT before participation."
            );
            return;
        }

        participatePoll({
            pollId: poll.id,
            userId: user!.id,
            optionId: selection.optionId,
            ipAddress: "127.0.0.1",
            userAgent: "test",
        });
    };

    return (
        <div
            className="
                py-2 px-12 flex flex-col min-h-screen items-center justify-center
                bg-[url('/bg/blur-galaxy.svg')] bg-cover bg-center
            "
        >
            <div className="relative flex flex-col items-center justify-center">
                <h2
                    className={cn(
                        "text-center text-base text-outline-1 mt-10",
                        getResponsiveClass(15).textClass
                    )}
                >
                    RESULT OPEN IN
                </h2>
                <h2 className="text-center text-4xl">
                    <Countdown
                        endDate={new Date(poll.endDate)}
                        size={45}
                        className="text-outline-1"
                    />
                </h2>
                <h2
                    className={cn(
                        "text-3xl px-3 text-center mt-14 max-w-[800px]",
                        getResponsiveClass(35).textClass
                    )}
                >
                    {poll.title || ""}
                </h2>

                <div
                    className="
                        max-w-[600px] w-full aspect-[2.0625/1] 
                        bg-gradient-to-br from-[rgba(255,255,255,0.7)] to-[rgba(0,0,0,0.8)] 
                        rounded-3xl p-[1px] shadow-sm
                    "
                >
                    <PollThumbnail
                        poll={poll}
                        quality={100}
                        imageClassName="rounded-3xl"
                    />
                </div>
                <div className="grid grid-cols-1 gap-3 mt-6 p-2">
                    {options.map((option: PollOption) => (
                        <div
                            key={option.optionId}
                            onClick={() => setSelection(option)}
                            className={cn(
                                "flex items-center gap-4 mb-0.5 w-[800px] h-[60px] p-4 rounded-2xl",
                                "bg-[rgba(0,0,0,0.15)] inner-shadow",
                                "transition-all duration-300",
                                "hover:bg-[rgba(0,0,0,0.25)]",
                                "cursor-pointer"
                            )}
                        >
                            {/* Radio Button */}
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-full",
                                    "border-2 border-[rgba(255,255,255,0.3)]",
                                    "relative",
                                    "transition-all duration-300",
                                    "transform hover:scale-110",
                                    selection === option &&
                                        "bg-[rgba(255,255,255,0.2)]"
                                )}
                            >
                                {selection === option && (
                                    <div
                                        className="
                                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                            w-3 h-3 rounded-full
                                            bg-white
                                            shadow-[0_0_8px_rgba(255,255,255,0.8)]
                                        "
                                    />
                                )}
                            </div>

                            <h1 className="text-xl text-[rgba(255,255,255,0.85)]">
                                {option.name}
                            </h1>
                        </div>
                    ))}
                </div>

                {selection && (
                    <div className="my-6">
                        <Button
                            onClick={handleSubmit}
                            variant="space"
                            className=""
                        >
                            Submit
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

/*
{option.imgUrl && (
                                <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden">
                                    <Image
                                        src={option.imgUrl || ""}
                                        alt={option.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
*/
