/// components/main/Main.Gitbook.tsx

"use client";

import { memo } from "react";

import { motion } from "framer-motion";

import Image from "next/image";

// 메모이제이션된 애니메이션 요소들
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
                        sm:-[30px] sm:left-[-19px] sm:w-[50px]
                        md:-[30px] md:left-[-31px] md:w-[75px]
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

// 메인 컴포넌트
export default function MainGitbook() {
    return (
        <div
            className="
            flex flex-col items-center justify-center w-full text-center
            py-24
            sm:py-32
            md:py-40
            lg:py-48
            xl:py-56
        "
        >
            <div className="relative inline-block">
                <AnimatedTitle />
                <DecorationElements />
            </div>
            <h2
                className="
                    font-main text-[0.6rem]
                    mt-4 mb-2
                    sm:text-sm sm:mt-5 sm:mb-6
                    md:text-xl md:mt-6 md:mb-8
                    lg:text-2xl lg:mt-7 lg:mb-10
                    xl:text-4xl xl:mt-8 xl:mb-12
            "
            >
                GLOW AND GROW WITH YOUR STAR
            </h2>
            <div
                className="
                w-[60px] mb-2
                sm:w-[70px] sm:mb-3
                md:w-[90px] md:mb-4
                lg:w-[110px] lg:mb-5
                xl:w-[130px] xl:mb-6
            "
            >
                <Image
                    src="/elements/el01.svg"
                    alt="Decorative element"
                    className="w-full h-auto"
                    width={130}
                    height={130}
                    loading="lazy"
                    priority={false}
                />
            </div>
        </div>
    );
}
