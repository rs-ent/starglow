/// components/polls/Polls.tsx

"use client";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import PollsContents from "@/components/polls/Polls.Contents";
import { User } from "next-auth";
import { motion } from "framer-motion";
import { memo } from "react";

interface PollsProps {
    user: User | null;
    player: Player | null;
}

function Polls({ user, player }: PollsProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full"
            >
                <motion.h2
                    variants={itemVariants}
                    className={cn(
                        "text-center text-4xl font-bold",
                        "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                        getResponsiveClass(45).textClass
                    )}
                >
                    Polls
                </motion.h2>

                <motion.div
                    variants={itemVariants}
                    className={cn(
                        "flex justify-center items-center",
                        "mt-[30px] mb-[30px] lg:mt-[40px] lg:mb-[40px]"
                    )}
                >
                    <PollsContents user={user} player={player} />
                </motion.div>
            </motion.div>
        </div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(Polls);
