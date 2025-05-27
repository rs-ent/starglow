/// components/main/Main.Gitbook.tsx

"use client";

import { H1, H2, Paragraph } from "../atoms/Typography";
import LinkButton from "../atoms/LinkButton";
import Icon from "../atoms/Icon";
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export default function MainGitbook() {
    return (
        <div className="
            flex flex-col items-center justify-center w-full text-center
            py-24
            sm:py-32
            md:py-40
            lg:py-48
            xl:py-56
        ">
            <div className="relative inline-block">
                <motion.div
                    initial={{ textShadow: "0 0 10px rgba(255,255,255,0.4)" }}
                    animate={{
                        textShadow: [
                            "0 0 5px rgba(255,255,255,0.3)",
                            "0 0 25px rgba(255,255,255,0.65)",
                            "0 0 7px rgba(255,255,255,0.2)"
                        ]
                    }}
                    transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                >
                    <H1
                        className="
                            font-main italic
                            text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl
                        "
                    >
                        STARGLOW
                    </H1>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, repeatDelay: 1, duration: 5, ease: "easeInOut" }}
                >
                    <div className="absolute -z-10
                                    top-0.5 left-[calc(90%+17px)] w-[35px]
                                    sm:-top-3 sm:left-[calc(90%+27px)] sm:w-[50px]
                                    md:-top-5 md:left-[calc(90%+25px)] md:w-[75px]
                                    lg:-top-6 lg:left-[calc(90%+30px)] lg:w-[100px]
                                    xl:-top-5 xl:left-[calc(90%+60px)]">
                        <img
                            src="/elements/el02.svg"
                            alt="el02"
                            className="w-full h-auto"
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, repeatDelay: 2, duration: 5, ease: "easeInOut" }}
                >
                    <div className="absolute -z-10
                                    top-4 left-[calc(50%-8px)] w-[35px]
                                    sm:top-3 sm:left-[calc(50%-10px)] sm:w-[50px]
                                    md:top-2 md:left-[calc(50%-20px)] md:w-[75px]
                                    lg:top-2 lg:left-[calc(50%-27px)] lg:w-[100px]
                                    xl:top-7 xl:left-[calc(50%-20px)]">
                        <img
                            src="/elements/el02.svg"
                            alt="el02"
                            className="w-full h-auto"
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, delay: 2, repeatDelay: 0.5, duration: 5, ease: "easeInOut" }}
                >
                    <div className="absolute -z-10
                                    -top-10 left-[calc(0%+26px)] w-[35px]
                                    sm:-top-10 sm:left-[calc(0%+20px)] sm:w-[50px]
                                    md:-top-10 md:left-[calc(0%+8px)] md:w-[75px]
                                    lg:-top-7 lg:left-[calc(0%-2px)] lg:w-[100px]
                                    xl:-top-1 xl:left-[calc(0%+2px)]">
                        <img
                            src="/elements/el02-1.svg"
                            alt="el02-1"
                            className="absolute top-17 left-[calc(0%-40px)] -z-10 w-[100px] h-auto"
                        />
                    </div>
                </motion.div>
            </div>
            <H2 className="
                    font-main text-[0.6rem]
                    mt-4 mb-2
                    sm:text-sm sm:mt-5 sm:mb-6
                    md:text-xl md:mt-6 md:mb-8
                    lg:text-2xl lg:mt-7 lg:mb-10
                    xl:text-4xl xl:mt-8 xl:mb-12
            ">
                GLOW AND GROW WITH YOUR STAR
            </H2>
            <div className="
                w-[60px] mb-12
                sm:w-[70px] sm:mb-14
                md:w-[90px] md:mb-16
                lg:w-[110px] lg:mb-20
                xl:w-[130px] xl:mb-20
            ">
                <img
                    src="/elements/el01.svg"
                    alt="element01"
                    style={{ width: '130px', height: 'auto' }}
                />

            </div>
            <LinkButton href="https://docs.starglow.io" target="_blank" img="/icons/gitbook.svg" frameSize={35} textSize={30} paddingSize={45} gapSize={35}
                className="flex mb-32 bg-gradient-to-br font-body font-extrabold from-[rgba(103,101,241,1)] to-[rgba(135,94,244,1)] rounded-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:text-white hover:animate-pulse"
            >
                About Us
            </LinkButton>
            <Paragraph
                className="
                    font-body mb-4
                    text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                "
            >
                Scroll to
            </Paragraph>
            <Icon icon={ArrowDown} size={35} className="animate-bounce" />
        </div>
    )
}