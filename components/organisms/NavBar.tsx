/// components\organisms\NavBar.tsx
"use client";

import LinkButton from "../atoms/LinkButton";
import AuthButton from "../atoms/AuthButton";
import Hamburger from "../atoms/Hamburger";
import { useMobileMenu } from "@/app/hooks/useMobileMenu";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
    { name: "About Us", href: "/" },
    { name: "Quests", href: "/quests" },
    { name: "Polls", href: "/polls" },
    { name: "NFTs", href: "/nfts" },
];

export default function NavBar() {
    const { isOpen, toggle, close } = useMobileMenu();
    const { data: session } = useSession();
    if (
        session &&
        session.user &&
        !menuItems.find((item) => item.name === "My Page")
    ) {
        menuItems.push({ name: "My Page", href: `/user/${session.user.id}` });
    }
    return (
        <nav
            className="
                flex w-full items-center justify-between bg-gradient-to-br from-[rgba(5,1,10,0.3)] to-[rgba(1,1,2,0.7)]
                py-3 px-5
                sm:py-4 sm:px-6
                md:py-6 md:px-8
                lg:py-8 lg:px-10
                xl:py-8 xl:px-12
            "
        >
            {/* Logo */}
            <LinkButton
                href="/"
                className="flex justify-start w-[150px] md:w-[200px] lg:w-[220px] xl:w-[300px]"
                paddingSize={0}
                gapSize={0}
            >
                <img
                    src="/logo/lt-row.svg"
                    alt="Starglow"
                    className="w-[250px] h-auto"
                />
            </LinkButton>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center justify-end space-x-2 md:space-x-4 lg:space-x-9 xl:space-x-16">
                {menuItems.map(({ name, href }) => (
                    <LinkButton
                        key={name}
                        href={href}
                        textSize={15}
                        paddingSize={0}
                    >
                        {name}
                    </LinkButton>
                ))}
                <AuthButton
                    frameSize={15}
                    textSize={15}
                    paddingSize={10}
                    gapSize={10}
                    showUserCard={false}
                />
            </div>

            {/* Mobile Hamburger Icon */}
            <Hamburger
                isOpen={isOpen}
                toggle={toggle}
                className="lg:hidden z-50"
            />

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-0 left-0 w-full h-screen bg-[rgba(0,0,0,0.85)] backdrop-blur-sm flex flex-col items-center justify-center space-y-12 z-40"
                    >
                        <AuthButton
                            frameSize={50}
                            paddingSize={70}
                            gapSize={50}
                            textSize={35}
                            className="font-main"
                        />
                        {menuItems.map(({ name, href }) => (
                            <LinkButton
                                key={name}
                                href={href}
                                onClick={close}
                                textSize={35}
                                paddingSize={0}
                                className="font-main"
                            >
                                {name}
                            </LinkButton>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
