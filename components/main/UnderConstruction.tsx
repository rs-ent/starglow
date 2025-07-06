/// components/main/UnderConstruction.tsx

"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import FollowUs from "./FollowUs";

const BgImage = memo(function BgImage() {
    return (
        <Image
            src="/bg/gradient-galaxy.svg"
            alt="Background"
            priority
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top -z-10"
        />
    );
});

// 메모이제이션된 애니메이션 타이틀
const AnimatedTitle = memo(() => (
    <motion.div
        initial={{ textShadow: "0 0 10px rgba(255,255,255,0.4)" }}
        animate={{
            textShadow: [
                "0 0 5px rgba(255,255,255,0.3)",
                "0 0 25px rgba(255,255,255,0.65)",
                "0 0 7px rgba(255,255,255,0.2)",
            ],
        }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
    >
        <h1
            className="
                font-main italic
                text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl
            "
        >
            STARGLOW
        </h1>
    </motion.div>
));
AnimatedTitle.displayName = "AnimatedTitle";

// 메모이제이션된 장식 요소들
const DecorationElements = memo(() => (
    <>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
                repeat: Infinity,
                repeatDelay: 1,
                duration: 5,
                ease: "easeInOut",
            }}
        >
            <div
                className="absolute -z-10
                        top-0.5 left-[calc(90%+17px)] w-[35px]
                        sm:-top-3 sm:left-[calc(90%+27px)] sm:w-[50px]
                        md:-top-5 md:left-[calc(90%+25px)] md:w-[75px]
                        lg:-top-6 lg:left-[calc(90%+30px)] lg:w-[100px]
                        xl:-top-5 xl:left-[calc(90%+60px)]"
            >
                <img
                    src="/elements/el02.svg"
                    alt="Decoration element"
                    loading="lazy"
                    className="w-full h-auto"
                />
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
                repeat: Infinity,
                repeatDelay: 2,
                duration: 5,
                ease: "easeInOut",
            }}
        >
            <div
                className="absolute -z-10
                        top-4 left-[calc(50%-8px)] w-[35px]
                        sm:top-3 sm:left-[calc(50%-10px)] sm:w-[50px]
                        md:top-2 md:left-[calc(50%-20px)] md:w-[75px]
                        lg:top-2 lg:left-[calc(50%-27px)] lg:w-[100px]
                        xl:top-7 xl:left-[calc(50%-20px)]"
            >
                <img
                    src="/elements/el02.svg"
                    alt="Decoration element"
                    loading="lazy"
                    className="w-full h-auto"
                />
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
                repeat: Infinity,
                delay: 2,
                repeatDelay: 0.5,
                duration: 5,
                ease: "easeInOut",
            }}
        >
            <div
                className="absolute -z-10
                        top-[30px] left-[-15px] w-[35px]
                        sm:top-[30px] sm:left-[-19px] sm:w-[50px]
                        md:top-[30px] md:left-[-31px] md:w-[75px]
                        lg:top-[39px] lg:left-[-43px] lg:w-[100px]
                        xl:top-[64px] xl:left-[-41px]"
            >
                <img
                    src="/elements/el02-1.svg"
                    alt="Decoration element"
                    loading="lazy"
                    className="w-full h-auto"
                />
            </div>
        </motion.div>
    </>
));
DecorationElements.displayName = "DecorationElements";

export default function UnderConstruction() {
    return (
        <div className="relative flex flex-col min-h-screen w-full">
            <BgImage />

            <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
                <div className="text-center max-w-4xl mx-auto">
                    {/* 로고 섹션 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-8"
                    >
                        <div className="relative inline-block">
                            <AnimatedTitle />
                            <DecorationElements />
                        </div>
                    </motion.div>

                    {/* 메인 메시지 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-12"
                    >
                        <h2
                            className={cn(
                                "text-3xl md:text-5xl lg:text-6xl font-bold text-white",
                                getResponsiveClass(35).textClass
                            )}
                        >
                            Stay tuned for our{" "}
                        </h2>
                        <h2
                            className={cn(
                                "text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8",
                                getResponsiveClass(40).textClass
                            )}
                        >
                            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                                NEW Beginning!
                            </span>
                        </h2>

                        <div className="max-w-2xl mx-auto text-center">
                            <p
                                className={cn(
                                    "text-base md:text-lg lg:text-xl text-gray-300 mb-2",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                A brand-new journey awaits with our new web app.
                            </p>
                            <p
                                className={cn(
                                    "text-base md:text-lg lg:text-xl text-gray-300 mb-2",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {`Rest assured! while you're away, we'll keep your
                                assets safe`}
                            </p>
                            <p
                                className={cn(
                                    "text-base md:text-lg lg:text-xl text-gray-300 mb-8",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                and sound for your return. Thank you!
                            </p>
                        </div>
                    </motion.div>

                    {/* 로고 */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <FollowUs
                            frameSize={40}
                            textSize={20}
                            gapSize={10}
                            className="max-w-md mx-auto"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
