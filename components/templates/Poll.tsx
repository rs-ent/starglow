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
import { useCollectionGet } from "@/app/hooks/useCollectionContracts";
import Image from "next/image";

interface SinglePollProps {
    poll: Poll;
}

interface TokenGatingData {
    hasToken: boolean;
    ownerWallets: string[];
    tokenCount: number;
}

export default function SinglePoll({ poll }: SinglePollProps) {
    const { startLoading, endLoading } = useLoading();
    const { user } = useRequireAuth();

    const [showOptions, setShowOptions] = useState(false);
    const [isNotStarted, setIsNotStarted] = useState(false);
    const [selection, setSelection] = useState<PollOption | null>(null);
    const [tokenGatingData, setTokenGatingData] =
        useState<TokenGatingData | null>(null);
    const { tokenGating, isLoading, error } = usePollsGet({
        tokenGatingInput: {
            pollId: poll.id,
            userId: user?.id || "",
        },
    });

    const { collection } = useCollectionGet({
        collectionAddress: poll.needTokenAddress || "",
    });

    useEffect(() => {
        const now = new Date();
        if (poll.startDate > now) {
            setShowOptions(false);
            setIsNotStarted(true);
            toast.info(
                `The poll will be open in ${poll.startDate.toLocaleString()}`
            );
        } else if (poll.endDate < now) {
            setShowOptions(false);
            setIsNotStarted(false);
            toast.info(`The poll is ended at ${poll.endDate.toLocaleString()}`);
        } else {
            setShowOptions(true);
            setIsNotStarted(false);
        }

        if (poll.needToken || poll.needTokenAddress) {
            if (collection) {
                toast.info(
                    `This poll is need a ${collection.data?.name} NFT to participate. We will check your NFT balance and process the participation.`
                );
            }
            if (tokenGating && tokenGating.success && tokenGating.data) {
                toast.info("Token Gating data loaded");
                setTokenGatingData(tokenGating.data);
                if (tokenGating.data.hasToken) {
                    toast.success(
                        "You have the NFT. You can participate in this poll!"
                    );
                } else {
                    toast.error(
                        "You don't have the NFT. Please purchase the NFT before participation."
                    );
                }
            }
        } else if (tokenGating && tokenGating.success && tokenGating.data) {
            setTokenGatingData(tokenGating.data);
        }
    }, [poll, tokenGating, collection]);

    const {
        participatePoll,
        isLoading: isParticipating,
        error: participateError,
    } = usePollsSet();

    const toast = useToast();
    const options = poll.options as unknown as PollOption[];

    useEffect(() => {
        if (isParticipating) {
            toast.info("Participating...");
            startLoading();
        } else {
            endLoading();
            if (participateError) {
                toast.error(participateError.message);
            } else if (selection) {
                toast.success(
                    `Participation successful! You have voted for [${selection?.name}]`
                );
            }
        }
    }, [isParticipating, participateError]);

    const handleSubmit = () => {
        if (!selection) {
            toast.info("Please select an option");
            return;
        }

        if (!tokenGatingData) {
            toast.error(
                "Please wait for the token gating process to complete."
            );
            return;
        }

        if (!tokenGatingData?.hasToken) {
            toast.error(
                "This polls is need an authentication. Please purchase the NFT before participation."
            );
            return;
        }

        participatePoll({
            pollId: poll.id,
            userId: user!.id,
            optionId: selection.optionId,
            tokenGating: tokenGating,
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
                    {isNotStarted ? `POLL OPEN IN` : `RESULT OPEN IN`}
                </h2>
                <h2 className="text-center text-4xl">
                    <Countdown
                        endDate={
                            isNotStarted
                                ? new Date(poll.startDate)
                                : new Date(poll.endDate)
                        }
                        size={45}
                        className="text-outline-1"
                    />
                </h2>
                <h2
                    className={cn(
                        "text-3xl px-3 text-center mt-14 max-w-[1000px] leading-0.5",
                        getResponsiveClass(40).textClass
                    )}
                >
                    {poll.title || ""}
                </h2>

                <div
                    className="
                        max-w-[800px] w-full aspect-[2.0625/1] 
                        bg-gradient-to-br from-[rgba(255,255,255,0.7)] to-[rgba(0,0,0,0.8)] 
                        rounded-3xl p-[1px] shadow-sm my-10
                    "
                >
                    <PollThumbnail
                        poll={poll}
                        quality={100}
                        imageClassName="rounded-3xl"
                        showAvailableVideo={true}
                    />
                </div>

                {showOptions && (
                    <div className="grid grid-cols-1 gap-3 my-6 p-2 w-full">
                        {options.map((option: PollOption) => (
                            <div
                                key={option.optionId}
                                onClick={() => setSelection(option)}
                                className={cn(
                                    "flex items-center justify-between w-[90%] p-4 rounded-2xl",
                                    "bg-[rgba(0,0,0,0.05)] inner-shadow",
                                    "transition-all duration-300",
                                    "hover:bg-[rgba(0,0,0,0.35)]",
                                    "cursor-pointer",
                                    "relative overflow-hidden",
                                    "mx-auto"
                                )}
                            >
                                <div className="flex-1 flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-full z-10",
                                            "border-2 border-[rgba(255,255,255,0.3)]",
                                            "relative",
                                            "transition-all duration-300",
                                            "transform hover:scale-110",
                                            getResponsiveClass(25).frameClass,
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

                                    <h1
                                        className={cn(
                                            "text-[rgba(255,255,255,0.9)] z-10 leading-0",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {option.name}
                                    </h1>
                                </div>

                                <div
                                    className="absolute inset-0 z-0 inner-shadow"
                                    style={{
                                        backgroundImage: option.imgUrl
                                            ? `url(${option.imgUrl})`
                                            : "none",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        opacity: 0.6,
                                        mixBlendMode: "overlay",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!tokenGatingData && (
                    <div className="my-6 text-center text-xs text-[rgba(255,255,255,0.4)] animate-pulse">
                        Validating...
                    </div>
                )}

                {selection && tokenGatingData?.hasToken && (
                    <div className="mb-12">
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

*/
