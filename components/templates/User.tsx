/// templates/User.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/organisms/NavBar";
import UserHeader from "@/components/organisms/UserHeader";
import UserSidebar from "@/components/organisms/UserSidebar";
import UserContent from "@/components/organisms/UserContent";
import Hamburger from "@/components/atoms/Hamburger";
import { useMobileMenu } from "@/app/hooks/useMobileMenu";
import type { User, Wallet } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/app/hooks/useToast";

export interface UserTemplateProps {
    user: User;
    owner: boolean;
    wallets: Wallet[];
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default function User({
    user,
    owner,
    wallets,
    searchParams,
}: UserTemplateProps) {
    const [contentType, setContentType] = useState("myassets");
    const { isOpen, toggle, close } = useMobileMenu();
    const toast = useToast();

    useEffect(() => {
        if (!searchParams) return;

        const integration = searchParams.integration as string | undefined;
        if (integration) {
            setContentType("integration");
            if (integration === "telegram_success") {
                toast.success("Telegram account integrated successfully!");
            } else if (integration === "telegram_exists") {
                toast.error(
                    "This Telegram account is already linked to another user."
                );
            } else if (integration === "telegram_unlinked") {
                toast.success("Telegram account unlinked successfully!");
            } else {
                toast.error("Unknown integration status.");
            }
        }
    }, [searchParams, toast]);

    const handleSectionClick = useCallback(
        (section: string) => {
            setContentType(section);
            close();
        },
        [close]
    );

    return (
        <div className="relative min-h-screen bg-background">
            {/* Main Content Area */}
            <div className="flex h-screen">
                {/* Desktop Sidebar */}
                <UserSidebar onSectionClick={setContentType} />

                {/* User Content */}
                <main className="flex-1 bg-background">
                    <UserContent contentType={contentType} user={user} />
                </main>
            </div>
        </div>
    );
}
