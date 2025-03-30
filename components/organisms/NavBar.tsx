/// components\organisms\NavBar.tsx
"use client";

import LinkButton from "../atoms/LinkButton";
import AuthButton from "../atoms/AuthButton";
import Hamburger from "../atoms/Hamburger";
import { useMobileMenu } from "@/hooks/useMobileMenu";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
    { name: "About Us", href: "/" },
    { name: "Quests", href: "/quests" },
    { name: "Polls", href: "/polls" },
    { name: "NFTs", href: "/nfts" },
];

export default function NavBar() {
    const { isOpen, toggle, close } = useMobileMenu();

    return (
        <nav
            className="
                flex w-full items-center justify-between bg-gradient-to-br from-[rgba(5,1,10,0.3)] to-[rgba(1,1,2,0.7)]
                py-3 px-5
                sm:py-4 sm:px-6
                md:py-6 md:px-8
                lg:py-8 lg:px-12
                xl:py-8 xl:px-24
            "
        >
            {/* Logo */}
            <LinkButton href="/" className="flex justify-start w-[150px] md:w-[200px] lg:w-[220px] xl:w-[300px]" paddingSize={0} gapSize={0}>
                <img src="/logo/lt-row.svg" alt="Starglow" className="w-[250px] h-auto" />
            </LinkButton>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-2 md:space-x-4 lg:space-x-12 xl:space-x-16">
                {menuItems.map(({ name, href }) => (
                    <LinkButton key={name} href={href} textSize={15} paddingSize={0}>
                        {name}
                    </LinkButton>
                ))}
                <AuthButton frameSize={15} textSize={15} paddingSize={10} gapSize={10} />
            </div>

            {/* Mobile Hamburger Icon */}
            <Hamburger isOpen={isOpen} toggle={toggle} className="lg:hidden z-50" />

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-0 left-0 w-full h-screen bg-[rgba(0,0,0,0.9)] backdrop-blur-sm flex flex-col items-center justify-center space-y-10 z-40"
                    >
                        {menuItems.map(({ name, href }) => (
                            <LinkButton
                                key={name}
                                href={href}
                                onClick={close}
                                textSize={40}
                                paddingSize={0}
                                className="font-main"
                            >
                                {name}
                            </LinkButton>
                        ))}
                        <AuthButton frameSize={40} paddingSize={70} gapSize={50} textSize={35} className="font-main" />
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}