/// components/quests/Quests.tsx

"use client";

import { memo } from "react";
import { Player } from "@prisma/client";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import QuestsContents from "@/components/quests/Quests.Contents";
import { User } from "next-auth";
import { motion } from "framer-motion";

interface QuestsProps {
    user: User | null;
    player: Player | null;
}

function Quests({ user, player }: QuestsProps) {
    // 배경 애니메이션 설정
    const backgroundVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.8 } },
    };

    // 콘텐츠 애니메이션 설정
    const contentVariants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: 0.3 },
        },
    };

    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            {/* 배경 요소 - 메모리 최적화를 위해 별도 컴포넌트로 분리하지 않고 직접 포함 */}
            <motion.div
                initial="initial"
                animate="animate"
                variants={backgroundVariants}
                className="fixed inset-0 -z-20"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-[#09011b] to-[#311473]" />

                {/* 도넛 이미지 - 성능 최적화를 위해 width/height 속성 사용 */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <img
                        src="/elements/donut.svg"
                        alt="Donut"
                        width={600}
                        height={600}
                        className="scale-150 rotate-90 md:scale-125 md:rotate-0 lg:scale-100 lg:rotate-0 transition-all duration-1000"
                        loading="lazy"
                        fetchPriority="low"
                    />
                </div>

                <img
                    src="/elements/bg-quest-blur.svg"
                    alt="Background"
                    className="opacity-90 w-full h-full object-cover scale-125 lg:scale-100 bg-blend-overlay transition-all duration-1000"
                    loading="eager"
                    fetchPriority="high"
                />
            </motion.div>

            {/* 콘텐츠 영역 */}
            <motion.div
                initial="initial"
                animate="animate"
                variants={contentVariants}
                className="relative z-10"
            >
                <h2
                    className={cn(
                        "text-center text-4xl",
                        "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                        getResponsiveClass(45).textClass
                    )}
                >
                    Quest
                </h2>

                <div
                    className={cn(
                        "flex justify-center items-center",
                        "mt-[30px] mb-[30px] lg:mt-[40px] lg:mb-[40px]"
                    )}
                >
                    <QuestsContents user={user} player={player} />
                </div>
            </motion.div>
        </div>
    );
}

export default memo(Quests);
