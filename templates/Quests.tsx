/// templates/Quests.tsx

"use client";

import Image from "next/image"
import { motion } from "framer-motion";
import QuestUtilBar from "@/components/organisms/QuestUtilBar";
import QuestContents from "@/components/organisms/QuestContents";
import QuestNavBar from "@/components/organisms/QuestNavBar";

export default function Quests() {
    return (
        <div className="relative flex flex-col w-full">
            <div className="bg">
                <img
                    src="/bg/blur-galaxy.svg"
                    alt="Background"
                    className="fixed inset-0 w-full h-full object-cover object-center -z-50"
                />
                <motion.div
                    className="fixed -top-100 -right-100 -z-30"
                    animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                    transition={{
                        duration: 30,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                >
                    <img
                        src="/elements/blur.svg"
                        alt="Blur Element"
                        style={{ width: '1000px', height: 'auto' }}
                    />

                </motion.div>

                <motion.div
                    className="fixed -bottom-20 -left-20 -z-10"
                    animate={{ x: [0, 100, 0], rotate: [0, 360] }}
                    transition={{
                        duration: 400,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                >
                    <img
                        src="/elements/donut.svg"
                        alt="Donut"
                        style={{ width: '600px', height: 'auto' }}
                    />

                </motion.div>

                <motion.div
                    className="fixed top-10 right-20 -z-10 blur-sm"
                    animate={{ x: [100, 0, 100], rotate: [0, 360], scale: [1, 1.05, 1] }}
                    transition={{
                        duration: 350,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                >
                    <img
                        src="/logo/3d.svg"
                        alt="Logo"
                        style={{ width: '200px', height: 'auto' }}
                    />
                </motion.div>

                <div className="fixed bottom-0 bg-gradient-to-b from-[rgba(0,0,0,0)] to-[rgba(0,0,0,1)] w-full h-[50%] -z-20 blur-2xl" />
            </div>

            <div
                className="
                    fixed top-0 inset-x-0 border-b border-border/30 z-50 h-auto
                    px-[10px] py-[5px]
                    sm:px-[5px] sm:py-[5px]
                    md:px-[10px] md:py-[6px]
                    lg:px-[10px] lg:py-[7px]
                    xl:px-[20px] xl:py-[8px]
                "
            >
                <QuestUtilBar />
            </div>
            <div
                className="
                    flex justify-center items-center min-h-[80vh]
                    px-[5px] py-[5px] 
                    mt-[60px] mb-[100px]
                    sm:px-[10px] sm:py-[5px] sm:mt-[70px] sm:mb-[120px]
                    md:px-[20px] md:py-[5px] md:mt-[80px] md:mb-[140px]
                    lg:px-[40px] lg:py-[5px] lg:mt-[90px] lg:mb-[150px]
                    xl:px-[80px] xl:py-[5px] xl:mt-[100px] xl:mb-[160px]
                "
            >
                <QuestContents contentType="dailyQuest" />
            </div>

            <div
                className="
                    fixed bottom-0 inset-x-0 bg-card border-t border-border z-50 h-auto
                    px-[5px] py-[15px]
                    sm:px-[30px] sm:py-[20px]
                    md:px-[60px] md:py-[20px]
                    lg:px-[120px] lg:py-[20px]
                    xl:px-[200px] xl:py-[20px]
                "
            >
                <QuestNavBar />
            </div>

        </div>
    );
}