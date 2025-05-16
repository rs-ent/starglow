/// components/molecules/User/User.Navigation.tsx

"use client";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { AnimatePresence, motion } from "framer-motion";

import { useState, useRef } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { XIcon } from "lucide-react";

const ArrowIcon = ({ className }: { className?: string }) => (
    <svg
        width="12"
        height="25"
        viewBox="0 0 12 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(className, getResponsiveClass(25).frameClass)}
    >
        <path
            d="M0.900391 1.44336L11.0388 12.9064L0.900391 24.3694"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CustomPrevArrow = ({
    onClick,
    currentSlide,
}: {
    onClick?: () => void;
    currentSlide?: number;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors",
            currentSlide === 0 && "opacity-0 pointer-events-none"
        )}
    >
        <ArrowIcon className="rotate-180 text-white" />
    </button>
);

const CustomNextArrow = ({
    onClick,
    currentSlide,
    slideCount,
}: {
    onClick?: () => void;
    currentSlide?: number;
    slideCount?: number;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors",
            currentSlide === slideCount! - 1 && "opacity-0 pointer-events-none"
        )}
    >
        <ArrowIcon className="text-white" />
    </button>
);

interface UserNavigationProps {
    className?: string;
    tabs: { id: string; label: string }[];
    onSelect?: (tab: string) => void;
}

export default function UserNavigation({
    className,
    tabs,
    onSelect,
}: UserNavigationProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState<string | null>(null);
    const sliderRef = useRef<Slider>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleSelect = (tab: string) => {
        setCurrentTab(tab);
        onSelect?.(tab);
        if (tab === "sign-out") {
            setMenuOpen(false);
            return;
        }

        const tabIndex = tabs.findIndex((t) => t.id === tab);
        if (sliderRef.current && tabIndex !== -1) {
            sliderRef.current.slickGoTo(tabIndex);
        }
    };

    const sliderSettings = {
        dots: false,
        arrows: true,
        infinite: false,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        swipeToSlide: false,
        centerMode: false,
        cssEase: "cubic-bezier(0.33, 1, 0.68, 1)",
        nextArrow: <CustomNextArrow />,
        prevArrow: <CustomPrevArrow />,
        afterChange: (currentSlide: number) => {
            handleSelect(tabs[currentSlide].id);
        },
    };

    return (
        <>
            {menuOpen && (
                <UserNavigationMenu
                    tabs={tabs}
                    onSelect={handleSelect}
                    onClose={() => setMenuOpen(false)}
                />
            )}
            <div
                className={cn(
                    "max-w-[1000px] w-screen px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto",
                    className
                )}
            >
                <div className="relative">
                    <Slider ref={sliderRef} {...sliderSettings}>
                        {tabs
                            .filter((tab) => tab.id !== "sign-out")
                            .map((tab) => (
                                <h2
                                    key={tab.id}
                                    onMouseDown={() => setIsDragging(false)}
                                    onTouchStart={() => setIsDragging(false)}
                                    onMouseMove={() => setIsDragging(true)}
                                    onTouchMove={() => setIsDragging(true)}
                                    onClick={() =>
                                        !isDragging && setMenuOpen(true)
                                    }
                                    onTouchEnd={() =>
                                        !isDragging && setMenuOpen(true)
                                    }
                                    className={cn(
                                        "text-center",
                                        getResponsiveClass(40).textClass
                                    )}
                                >
                                    {tab.label}
                                </h2>
                            ))}
                    </Slider>
                </div>
            </div>
        </>
    );
}

function UserNavigationMenu({
    tabs,
    onSelect,
    onClose,
}: {
    tabs: { id: string; label: string }[];
    onClose: () => void;
    onSelect: (tab: string) => void;
}) {
    const handleSelect = (tab: string) => {
        onSelect(tab);
        onClose();
    };
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{
                    type: "spring",
                    duration: 0.15,
                    damping: 19,
                    stiffness: 130,
                }}
                className="fixed inset-0 w-screen h-screen bg-[rgba(0,0,0,0.9)] backdrop-blur-xs z-50"
            >
                <div className="absolute top-0 right-0 p-6">
                    <button onClick={onClose}>
                        <XIcon className="text-white" />
                    </button>
                </div>
                <div className="flex flex-col p-6 items-center justify-center h-full">
                    {tabs.map((tab, index) => (
                        <motion.div
                            key={tab.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="text-white text-xl font-main"
                        >
                            <button onClick={() => handleSelect(tab.id)}>
                                {tab.label}
                            </button>
                            {index !== tabs.length - 1 && (
                                <div className="w-full h-[1px] my-6 bg-[rgba(255,255,255,0.5)]" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
