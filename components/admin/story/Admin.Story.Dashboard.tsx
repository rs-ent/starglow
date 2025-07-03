/// components/admin/story/Admin.Story.Dashboard.tsx

"use client";

import { useState } from "react";

import {
    FaNetworkWired,
    FaWallet,
    FaEdit,
    FaRocket,
    FaShieldAlt,
    FaCube,
    FaPalette,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import AdminStoryManagementSPG from "./Admin.Story.Management.SPG";
import AdminStoryMetadata from "./Admin.Story.Metadata";
import AdminStoryMint from "./Admin.Story.Mint";
import AdminStoryNetwork from "./Admin.Story.Network";
import AdminStoryRegisterIPAsset from "./Admin.Story.RegisterIPAsset";
import AdminStorySPG from "./Admin.Story.SPG";
import AdminStoryTBA from "./Admin.Story.TBA";
import AdminStoryWallets from "./Admin.Story.Wallets";
import AdminStorySPGPreview from "./Admin.Story.SPG.Preview";

export default function AdminStoryDashboard() {
    const [selection, setSelection] = useState<
        | "network"
        | "escrow"
        | "metadata"
        | "spg"
        | "spg-preview"
        | "mint"
        | "register-ip"
        | "spg-management"
        | "tba"
        | null
    >(null);

    if (selection === "network") {
        return <AdminStoryNetwork onBack={() => setSelection(null)} />;
    }
    if (selection === "escrow") {
        return <AdminStoryWallets onBack={() => setSelection(null)} />;
    }
    if (selection === "metadata") {
        return <AdminStoryMetadata onBack={() => setSelection(null)} />;
    }
    if (selection === "spg") {
        return <AdminStorySPG onBack={() => setSelection(null)} />;
    }
    if (selection === "spg-preview") {
        return <AdminStorySPGPreview onBack={() => setSelection(null)} />;
    }
    if (selection === "mint") {
        return <AdminStoryMint onBack={() => setSelection(null)} />;
    }
    if (selection === "register-ip") {
        return <AdminStoryRegisterIPAsset onBack={() => setSelection(null)} />;
    }
    if (selection === "spg-management") {
        return <AdminStoryManagementSPG onBack={() => setSelection(null)} />;
    }
    if (selection === "tba") {
        return <AdminStoryTBA onBack={() => setSelection(null)} />;
    }
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-blue-900/30 relative overflow-hidden">
            {/* Subtle background icons for protocol feel */}
            <TbTopologyStar3 className="absolute text-[18rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                Story Protocol <span className="text-blue-400">Admin</span>
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 text-lg tracking-wide border border-blue-500/30"
                    onClick={() => setSelection("network")}
                >
                    <FaNetworkWired className="text-2xl" />
                    Manage Networks
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-lg tracking-wide border border-purple-500/30"
                    onClick={() => setSelection("escrow")}
                >
                    <FaWallet className="text-2xl" />
                    Manage Wallets
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-700 via-blue-700 to-purple-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 text-lg tracking-wide border border-cyan-500/30"
                    onClick={() => setSelection("tba")}
                >
                    <FaShieldAlt className="text-2xl" />
                    Manage TBA
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-700 via-blue-700 to-purple-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-lg tracking-wide border border-indigo-500/30"
                    onClick={() => setSelection("metadata")}
                >
                    <FaEdit className="text-2xl" />
                    Manage Metadata
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-lg tracking-wide border border-indigo-500/30"
                    onClick={() => setSelection("spg")}
                >
                    Create SPG Collections
                </button>

                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-orange-700 hover:to-purple-700 transition-all duration-200 text-lg tracking-wide border border-pink-500/30"
                    onClick={() => setSelection("mint")}
                >
                    <FaRocket className="text-2xl" />
                    Mint NFTs
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-700 via-cyan-700 to-blue-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-blue-700 hover:to-green-700 transition-all duration-200 text-lg tracking-wide border border-green-500/30"
                    onClick={() => setSelection("register-ip")}
                >
                    <FaCube className="text-2xl" />
                    Register IP Assets
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-700 via-purple-700 to-fuchsia-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-fuchsia-700 hover:to-pink-700 transition-all duration-200 text-lg tracking-wide border border-pink-500/30"
                    onClick={() => setSelection("spg-preview")}
                >
                    <FaPalette className="text-2xl" />
                    Preview Collections
                </button>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-700 via-cyan-700 to-blue-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-blue-700 hover:to-green-700 transition-all duration-200 text-lg tracking-wide border border-green-500/30"
                    onClick={() => setSelection("spg-management")}
                >
                    <FaCube className="text-2xl" />
                    Manage SPG Collections
                </button>
            </div>
        </div>
    );
}
