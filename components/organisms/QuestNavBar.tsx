/// components/organisms/QuestNavBar.tsx

"use client";

import React, { useState } from "react";
import { LucideIcon, Headphones, ScrollText, Users } from "lucide-react";
import VerticalButton from "../atoms/VerticalButton";

interface NavItem {
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: "Today", icon: Headphones },
    { label: "Mission", icon: ScrollText },
    { label: "Referral", icon: Users },
];

export default function QuestNavBar() {
    const [active, setActive] = useState<string>("Today");

    return (
            <div className="flex justify-around">
                {navItems.map(({ label, icon }) => (
                    <VerticalButton
                        key={label}
                        icon={icon}
                        label={label}
                        isActive={active === label}
                        textSize={20}
                        paddingSize={0}
                        frameSize={45}
                        gapSize={5}
                        onClick={() => setActive(label)}
                        className={active === label ? "hover:bg-[rgba(0,0,0,0)]" : "hover:bg-[rgba(0,0,0,0)] hover:opacity-100"}
                    />
                ))}
            </div>
    );
}