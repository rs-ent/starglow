/// components\organisms\Admin.Nav.tsx

"use client";

import {
    CogIcon,
    BriefcaseIcon,
    HomeIcon,
    UsersIcon,
    VoteIcon,
    PartyPopperIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: HomeIcon },
        { href: "/admin/quests", label: "Quests", icon: BriefcaseIcon },
        { href: "/admin/polls", label: "Polls", icon: VoteIcon },
        { href: "/admin/onchain", label: "On Chain", icon: PartyPopperIcon },
        { href: "/admin/users", label: "Users", icon: UsersIcon },
        { href: "/admin/settings", label: "Settings", icon: CogIcon },
    ];

    return (
        <nav className="bg-gray-800 p-4">
            <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`text-white p-2 rounded hover:bg-gray-700 ${
                            pathname === item.href ? "bg-gray-700" : ""
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
