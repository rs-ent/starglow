"use client";

import { useState } from "react";
import { H1, H3, Paragraph } from "./Typography";
import { Daily_Quests } from "@prisma/client";
import { cn } from "@/lib/utils/tailwind";
import Popup from "./Popup";
import LinkButton from "./LinkButton";

const missionList = {
    Website: {
        icon: "/ui/link.svg",
        background: "bg-gradient-to-br from-[rgba(111,99,242,1)] to-[rgba(87,63,163,1)]"
    },
    X: {
        icon: "/icons/providers/x.svg",
        background: "bg-gradient-to-br from-[rgba(5,5,5,1)] to-[rgba(0,0,0,1)]"
    },
    Default: {
        icon: "/ui/default-mission-icon.svg",
        background: "bg-gradient-to-br from-[rgba(74,74,80,1)] to-[rgba(50,50,53,1)]"
    }
}

export default function MissionButton({ mission }: { mission: Daily_Quests }) {
    const [open, setOpen] = useState(false);
    const [missionSucceeded, setMissionSucceeded] = useState(false);

    const handleClose = (succeeded: boolean) => {
        setOpen(false);

        if (succeeded) {
            setMissionSucceeded(true);
            console.info("[Mission] Mission succeeded:", mission.id);
        } else {
            setMissionSucceeded(false);
            console.error("[Mission] Mission failed:", mission.id);
        }
    };

    const target = missionList[mission.Quest_Type as keyof typeof missionList] || missionList["Default"];
    return (
        <>
            <div
                onClick={() => !missionSucceeded && setOpen(true)}
                className={`
                    ${missionSucceeded ? "cursor-not-allowed opacity-35 border border-[rgba(255,255,255,0.2)]" : "cursor-pointer gradient-border"}
                    relative grid w-full items-center justify-center px-4 py-5 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.8)] rounded-3xl shadow-lg backdrop-blur-sm
                    hover:shadow-xl transition-all duration-300 ease-in-out
                    grid-cols-[auto_1fr_auto] gap-2
                `}
            >
                {/*<div className="absolute top-0 left-0 w-full h-full rounded-3xl border border-[rgba(237,171,45,0.8)] bg-[rgba(237,171,45,0.4)] backdrop-blur-sm justify-center items-center flex ">
                    <H1 size={20} className="text-white text-center font-superbold">MISSION COMPLETE!</H1>
                </div>*/}
                {/* Icon */}
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-full", target.background)}>
                    <img
                        src={target.icon}
                        alt="Quest Icon"
                        style={{ width: '20px', height: 'auto' }}
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col items-start justify-center px-2">
                    <Paragraph size={20} className="mb-1">{mission.Quest_Title}</Paragraph>
                    <H3 size={20} className="font-superbold">+ 800P</H3>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center ml-auto">
                    <img
                        src={missionSucceeded ? "/ui/ribbon-badge.svg" : "/ui/right-arrow.svg"}
                        alt="Arrow Icon"
                        style={{ width: missionSucceeded ? '35px' : '15px', height: 'auto' }}
                    />
                </div>
            </div>
            {/* Popup */}
            <Popup open={open} width="600px" onClose={() => handleClose(false)}>
                <div className="px-6 py-10 space-y-4 flex flex-col text-center items-center justify-center h-full">
                    <H1 size={40} className="text-primary mb-12">Move to Mission</H1>
                    <Paragraph size={15} >
                        You’re about to move to the mission page:
                    </Paragraph>
                    <Paragraph size={15} className="text-blue-500 border-b border-b-blue-500">
                        {mission.URL}
                    </Paragraph>
                    <LinkButton
                        href={mission.URL || "#"}
                        target="_blank"
                        onClick={() => {
                            handleClose(true);
                        }}
                        className="inline-block mt-12 px-4 py-2 rounded-lg bg-primary text-white hover:text-yellow-200 transition"
                    >
                        Go to Mission
                    </LinkButton>
                </div>
            </Popup>
        </>
    )
};