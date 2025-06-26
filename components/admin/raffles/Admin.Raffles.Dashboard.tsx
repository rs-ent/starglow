/// components/admin/raffles/Admin.Raffles.Dashboard.tsx

"use client";

import { useState } from "react";

import { FaDice, FaChartBar, FaPlus } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import AdminRaffles from "./Admin.Raffles";
import AdminRafflesAnalytics from "./Admin.Raffles.Analytics";

export default function AdminRafflesDashboard() {
    const [selection, setSelection] = useState<
        "management" | "analytics" | null
    >(null);

    if (selection === "management") {
        return <AdminRaffles onBack={() => setSelection(null)} />;
    }
    if (selection === "analytics") {
        return <AdminRafflesAnalytics onBack={() => setSelection(null)} />;
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            {/* Subtle background icons for protocol feel */}
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                Raffle <span className="text-purple-400">Admin</span>
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-700 via-pink-700 to-red-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-red-700 hover:to-purple-700 transition-all duration-200 text-lg tracking-wide border border-purple-500/30"
                    onClick={() => setSelection("management")}
                >
                    <FaPlus className="text-2xl" />
                    Create Raffle
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-lg tracking-wide border border-blue-500/30"
                    onClick={() => setSelection("management")}
                >
                    <FaDice className="text-2xl" />
                    Manage Raffles
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-700 via-orange-700 to-red-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-red-700 hover:to-yellow-700 transition-all duration-200 text-lg tracking-wide border border-yellow-500/30"
                    onClick={() => setSelection("analytics")}
                >
                    <FaChartBar className="text-2xl" />
                    Analytics
                </button>
            </div>
        </div>
    );
}
