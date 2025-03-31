/// templates/User.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import UserHeader from "@/components/organisms/UserHeader";
import UserSidebar from "@/components/organisms/UserSidebar";
import UserContent from "@/components/organisms/UserContent";
import Hamburger from "@/components/atoms/Hamburger";
import { useMobileMenu } from "@/hooks/useMobileMenu";
import type { User, Wallet } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export interface UserTemplateProps {
  userData: User;
  owner: boolean;
  wallets: Wallet[];
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function User({
  userData,
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
        toast.error("This Telegram account is already linked to another user.");
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
      {/* Mobile Hamburger Icon */}
      <Hamburger
        isOpen={isOpen}
        toggle={toggle}
        className="absolute top-4 right-4 z-50 lg:hidden"
      />

      {/* User Header */}
      <UserHeader
        src={userData.image || "/default-profile.png"}
        name={userData.name || "User"}
        walletAddress={wallets.find((wallet) => wallet.primary)?.address}
      />

      {/* Main Content Area */}
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[clamp(220px,15%,300px)] bg-muted/30 pt-5">
          <UserSidebar onSectionClick={setContentType} />
        </aside>

        {/* User Content */}
        <main className="flex-1 bg-background">
          <UserContent contentType={contentType} />
        </main>
      </div>

      {/* Mobile Sidebar Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-40"
          >
            <UserSidebar
              onSectionClick={handleSectionClick}
              frameSize={25}
              textSize={30}
              paddingSize={70}
              gapSize={30}
              buttonGap={12}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
