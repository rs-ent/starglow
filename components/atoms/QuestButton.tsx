/// components/atoms/QuestButton.tsx

"use client";

import { useRef, useEffect, useState, use } from "react";
import { useQuest } from "@/hooks/useQuest";
import { useToast } from "@/hooks/useToast";
import { H1, H3, Paragraph } from "./Typography";
import { Daily_Quests, Player } from "@prisma/client";
import { cn } from "@/lib/utils/tailwind";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Popup from "./Popup";
import LinkButton from "./LinkButton";
import Icon from "./Icon";

const questList = {
    Website: {
        icon: "/ui/link.svg",
        background:
            "bg-gradient-to-br from-[rgba(111,99,242,1)] to-[rgba(87,63,163,1)]",
    },
    X: {
        icon: "/icons/providers/x.svg",
        background: "bg-gradient-to-br from-[rgba(5,5,5,1)] to-[rgba(0,0,0,1)]",
    },
    Default: {
        icon: "/ui/default-quest-icon.svg",
        background:
            "bg-gradient-to-br from-[rgba(74,74,80,1)] to-[rgba(50,50,53,1)]",
    },
};

export default function QuestButton({
    quests,
    playerId,
    questType = "Daily",
    alreadyCompleted = false,
}: {
    quests: Daily_Quests;
    playerId: Player["id"];
    questType?: "Daily" | "General";
    alreadyCompleted?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [questSucceeded, setQuestSucceeded] = useState(false);
    const [questSuccessCardVisible, setQuestSuccessCardVisible] =
        useState(false);
    const [questSuccessCardViewport, setQuestSuccessCardViewport] =
        useState(false);
    const { questComplete, addGameMoney } = useQuest();

    const buttonRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(buttonRef, { once: true });

    useEffect(() => {
        if (alreadyCompleted) {
            setQuestSucceeded(true);
        }
    }, [alreadyCompleted]);

    useEffect(() => {
        if (isInView) {
            if (questSuccessCardVisible) {
                setQuestSuccessCardViewport(true);
            }
        }
    }, [isInView, questSuccessCardVisible]);

    const toast = useToast();

    const handleClose = async (succeeded: boolean) => {
        setOpen(false);

        if (succeeded) {
            try {
                await questComplete({
                    playerId,
                    questId: quests.id,
                    type: questType,
                    Quest_Title: quests.Quest_Title,
                    Quest_Type: quests.Quest_Type,
                    Quest_Date: quests.Date,
                    Price: quests.Price,
                    Currency: quests.Currency,
                    URL: quests.URL,
                });

                await addGameMoney({
                    playerId,
                    questId: quests.id,
                    description: quests.Quest_Title,
                    Price: quests.Price || 0,
                    Currency: quests.Currency,
                });

                setQuestSucceeded(true);
                setQuestSuccessCardVisible(true);
                console.log("[Quest] Quest completed:", quests.id);
            } catch (error) {
                console.error(
                    "[Quest] Error completing quest:",
                    error,
                    quests.id
                );
                setQuestSucceeded(false);
            }
        } else {
            setQuestSucceeded(false);
            console.log("[Quest] Quest canceled by user:", quests.id);
            toast.info("Quest canceled. You can complete it later.");
        }
    };

    const target =
        questList[quests.Quest_Type as keyof typeof questList] ||
        questList["Default"];

    return (
        <>
            <div
                ref={buttonRef}
                onClick={() => !questSucceeded && setOpen(true)}
                className={`
                    ${
                        questSucceeded
                            ? "cursor-not-allowed opacity-35"
                            : "cursor-pointer"
                    }
                    relative grid w-full items-center justify-center px-4 py-5
                    bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.8)]
                    gradient-border rounded-3xl shadow-lg backdrop-blur-xs
                    hover:shadow-xl transition-all duration-300 ease-in-out
                    grid-cols-[auto_1fr_auto] gap-2
                `}
            >
                {/* Quest Success Card */}
                <AnimatePresence
                    onExitComplete={() => setQuestSuccessCardViewport(false)}
                >
                    {questSuccessCardViewport && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.1,
                                rotateX: -90,
                                rotateY: -45,
                                rotateZ: -45,
                                translateZ: -500,
                                boxShadow: "0 0 0px rgba(237,171,45,0)",
                                filter: "blur(80px)",
                            }}
                            animate={{
                                opacity: [0, 0.7, 1],
                                scale: [0.1, 1.2, 1],
                                rotateX: [-90, 20, 0],
                                rotateY: [-45, 20, 0],
                                rotateZ: [-45, 10, 0],
                                translateZ: [-500, 50, 0],
                                boxShadow: [
                                    "0 0 0px rgba(237,171,45,0)",
                                    "0 0 50px rgba(237,171,45,0.9)",
                                    "0 0 25px rgba(237,171,45,0.7)",
                                ],
                                filter: [
                                    "blur(80px)",
                                    "blur(10px)",
                                    "blur(0px)",
                                ],
                            }}
                            exit={{
                                opacity: [1, 0.4, 0],
                                scale: [1, 0.9, 0.2],
                                rotateX: [0, -30, 90],
                                rotateY: [0, -30, 45],
                                rotateZ: [0, -20, 45],
                                translateZ: [0, 50, -500],
                                boxShadow: [
                                    "0 0 25px rgba(237,171,45,0.7)",
                                    "0 0 50px rgba(237,171,45,0.9)",
                                    "0 0 0px rgba(237,171,45,0)",
                                ],
                                filter: [
                                    "blur(0px)",
                                    "blur(30px)",
                                    "blur(80px)",
                                ],
                            }}
                            transition={{
                                duration: 1.5,
                                ease: [0.25, 1, 0.5, 1],
                            }}
                            style={{
                                perspective: "1000px",
                                transformStyle: "preserve-3d",
                            }}
                            className="
                                absolute top-0 left-0 w-full h-full rounded-3xl 
                                border border-[rgba(237,171,45,0.8)] bg-[rgba(237,171,45,0.4)] backdrop-blur-sm
                                justify-center items-center flex
                            "
                        >
                            <H1
                                size={20}
                                className="text-white text-center font-superbold"
                            >
                                QUEST COMPLETE!
                            </H1>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Icon */}
                <div
                    className={cn(
                        "flex items-center justify-center rounded-full",
                        "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-16 lg:h-16 xl:w-18 xl:h-18",
                        target.background
                    )}
                >
                    <Icon svg={target.icon} size={35} />
                </div>

                {/* Description */}
                <div className="flex flex-col items-start justify-center px-2">
                    <Paragraph size={20} className="mb-1">
                        {quests.Quest_Title}
                    </Paragraph>
                    <H3 size={20} className="font-superbold">
                        + 800P
                    </H3>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center ml-auto">
                    <img
                        src={
                            questSucceeded
                                ? "/ui/ribbon-badge.svg"
                                : "/ui/right-arrow.svg"
                        }
                        alt="Arrow Icon"
                        style={{
                            width: questSucceeded ? "35px" : "15px",
                            height: "auto",
                        }}
                    />
                </div>
            </div>
            {/* Popup */}
            <Popup open={open} width="600px" onClose={() => handleClose(false)}>
                <div className="px-6 py-10 space-y-4 flex flex-col text-center items-center justify-center h-full">
                    <H1 size={40} className="text-primary mb-12">
                        Move to Quest
                    </H1>
                    <Paragraph size={15}>
                        You’re about to move to the quest page:
                    </Paragraph>
                    <Paragraph
                        size={15}
                        className="text-blue-500 border-b border-b-blue-500"
                    >
                        {quests.URL}
                    </Paragraph>
                    <LinkButton
                        href={quests.URL || "#"}
                        target="_blank"
                        onClick={() => {
                            handleClose(true);
                        }}
                        className="inline-block mt-12 px-4 py-2 rounded-lg bg-primary text-white hover:text-yellow-200 transition"
                    >
                        Go to Quest
                    </LinkButton>
                </div>
            </Popup>
        </>
    );
}
