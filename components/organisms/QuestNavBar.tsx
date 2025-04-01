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
    { label: "Missions", icon: ScrollText },
    { label: "Referral", icon: Users },
];

export default function QuestNavBar({
    contentType,
    onActiveChange,
}: {
    contentType: string;
    onActiveChange: (active: string) => void;
}) {
    const [active, setActive] = useState<string>("Today");

    const handleActiveChange = (label: string) => {
        setActive(label);
        onActiveChange(label);
    };

    return (
        <div className="flex justify-around">
            {navItems.map(({ label, icon }) => (
                <VerticalButton
                    key={label}
                    icon={icon}
                    label={label}
                    isActive={active === label}
                    textSize={10}
                    paddingSize={0}
                    frameSize={30}
                    gapSize={5}
                    onClick={() => handleActiveChange(label)}
                    className={
                        active === label
                            ? "hover:bg-[rgba(0,0,0,0)]"
                            : "hover:bg-[rgba(0,0,0,0)] hover:opacity-100"
                    }
                />
            ))}
        </div>
    );
}
