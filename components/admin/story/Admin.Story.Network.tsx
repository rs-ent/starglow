/// components/admin/story/Admin.Story.Network.tsx

"use client";

import { useState } from "react";

import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaNetworkWired,
    FaBackspace,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import { useStoryNetwork } from "@/app/story/network/hooks";

import type { BlockchainNetwork } from "@prisma/client";

export default function AdminStoryNetwork({ onBack }: { onBack?: () => void }) {
    const {
        storyNetworks,
        isLoadingStoryNetworks,
        isErrorStoryNetworks,
        createStoryNetworkAsync,
        updateStoryNetworkAsync,
        deleteStoryNetworkAsync,
        refetchStoryNetworks,
    } = useStoryNetwork();

    const [showForm, setShowForm] = useState(false);
    const [editNetwork, setEditNetwork] = useState<BlockchainNetwork | null>(
        null
    );
    const [form, setForm] = useState({
        name: "",
        chainId: "",
        symbol: "",
        rpcUrl: "",
        explorerUrl: "",
        isActive: true,
        isTestnet: false,
        multicallAddress: "",
        defaultNetwork: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // 핸들러
    const openAddForm = () => {
        setEditNetwork(null);
        setForm({
            name: "",
            chainId: "",
            symbol: "",
            rpcUrl: "",
            explorerUrl: "",
            isActive: true,
            isTestnet: false,
            defaultNetwork: false,
            multicallAddress: "",
        });
        setShowForm(true);
    };
    const openEditForm = (network: BlockchainNetwork) => {
        setEditNetwork(network);
        setForm({
            name: network.name,
            chainId: network.chainId.toString(),
            symbol: network.symbol,
            rpcUrl: network.rpcUrl,
            explorerUrl: network.explorerUrl,
            isActive: network.isActive,
            isTestnet: network.isTestnet,
            defaultNetwork: network.defaultNetwork,
            multicallAddress: network.multicallAddress || "",
        });
        setShowForm(true);
    };
    const closeForm = () => {
        setShowForm(false);
        setEditNetwork(null);
        setError("");
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
            if (editNetwork) {
                await updateStoryNetworkAsync({
                    id: editNetwork.id,
                    ...form,
                    chainId: Number(form.chainId),
                });
            } else {
                await createStoryNetworkAsync({
                    ...form,
                    chainId: Number(form.chainId),
                });
            }
            closeForm();
            refetchStoryNetworks().catch((err) => {
                console.error(err);
            });
        } catch (err: any) {
            setError(err?.message || "오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleDelete = async (network: BlockchainNetwork) => {
        if (
            !window.confirm(
                `정말로 '${network.name}' 네트워크를 삭제하시겠습니까?`
            )
        )
            return;
        setIsSubmitting(true);
        setError("");
        try {
            await deleteStoryNetworkAsync({ id: network.id });
            refetchStoryNetworks().catch((err) => {
                console.error(err);
            });
        } catch (err: any) {
            setError(err?.message || "삭제 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        onBack?.();
    };

    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-start bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-blue-900/30 overflow-hidden">
            {/* Subtle background icons for protocol feel */}
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            {/* 뒤로가기 버튼 */}
            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={handleBack}
                    title="뒤로가기"
                >
                    <FaBackspace className="text-xl" />
                    <span className="hidden md:inline">뒤로가기</span>
                </button>
            </div>

            <div className="w-full flex items-center justify-between mb-8 z-10">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FaNetworkWired className="text-blue-400" />
                    Story Networks
                </h2>
                <button
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:scale-105 hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                    onClick={openAddForm}
                >
                    <FaPlus /> Add Network
                </button>
            </div>

            {/* 네트워크 목록 */}
            <div className="w-full max-w-5xl z-10">
                {isLoadingStoryNetworks ? (
                    <div className="text-blue-200 text-center py-16">
                        Loading networks...
                    </div>
                ) : isErrorStoryNetworks ? (
                    <div className="text-red-400 text-center py-16">
                        네트워크 목록을 불러오지 못했습니다.
                    </div>
                ) : !storyNetworks || storyNetworks.length === 0 ? (
                    <div className="text-blue-200 text-center py-16">
                        등록된 네트워크가 없습니다.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-lg bg-[#23243a]/60">
                        <table className="min-w-full text-sm text-blue-100">
                            <thead>
                                <tr className="bg-[#23243a]/80 text-blue-300">
                                    <th className="px-4 py-3">Default</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Chain ID</th>
                                    <th className="px-4 py-3">Symbol</th>
                                    <th className="px-4 py-3">Active</th>
                                    <th className="px-4 py-3">Testnet</th>
                                    <th className="px-4 py-3">Explorer</th>
                                    <th className="px-4 py-3">RPC</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(storyNetworks) &&
                                    storyNetworks.map(
                                        (
                                            network: BlockchainNetwork,
                                            index: number
                                        ) => (
                                            <tr
                                                key={network.id || index}
                                                className="border-b border-blue-900/30 hover:bg-blue-900/10 transition"
                                            >
                                                <td className="px-4 py-2 font-semibold">
                                                    {network.defaultNetwork
                                                        ? "Yes"
                                                        : "No"}
                                                </td>
                                                <td className="px-4 py-2 font-semibold">
                                                    {network.name}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {network.chainId}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {network.symbol}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span
                                                        className={
                                                            network.isActive
                                                                ? "text-green-400"
                                                                : "text-gray-400"
                                                        }
                                                    >
                                                        {network.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span
                                                        className={
                                                            network.isTestnet
                                                                ? "text-yellow-300"
                                                                : "text-blue-200"
                                                        }
                                                    >
                                                        {network.isTestnet
                                                            ? "Testnet"
                                                            : "Mainnet"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 max-w-[160px] truncate">
                                                    <a
                                                        href={
                                                            network.explorerUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-blue-300 hover:text-blue-400"
                                                    >
                                                        {network.explorerUrl}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-2 max-w-[160px] truncate">
                                                    <a
                                                        href={network.rpcUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-blue-300 hover:text-blue-400"
                                                    >
                                                        {network.rpcUrl}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-2 flex gap-2">
                                                    <button
                                                        className="p-2 rounded hover:bg-blue-900/30 text-blue-300 hover:text-blue-400 transition"
                                                        onClick={() =>
                                                            openEditForm(
                                                                network
                                                            )
                                                        }
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="p-2 rounded hover:bg-red-900/30 text-red-400 hover:text-red-500 transition"
                                                        onClick={() =>
                                                            handleDelete(
                                                                network
                                                            )
                                                        }
                                                        title="Delete"
                                                        disabled={isSubmitting}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 네트워크 추가/수정 폼 (모달) */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#23243a] rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <FaNetworkWired className="text-blue-400" />
                            {editNetwork ? "Edit Network" : "Add Network"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-blue-200 mb-1">
                                        Name
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-blue-200 mb-1">
                                        Chain ID
                                    </label>
                                    <input
                                        name="chainId"
                                        value={form.chainId}
                                        onChange={handleChange}
                                        required
                                        type="number"
                                        className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-blue-200 mb-1">
                                        Symbol
                                    </label>
                                    <input
                                        name="symbol"
                                        value={form.symbol}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-blue-200 mb-1">
                                        Multicall Address
                                    </label>
                                    <input
                                        name="multicallAddress"
                                        value={form.multicallAddress}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-blue-200 mb-1">
                                        Explorer URL
                                    </label>
                                    <input
                                        name="explorerUrl"
                                        value={form.explorerUrl}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-blue-200 mb-1">
                                        RPC URL
                                    </label>
                                    <input
                                        name="rpcUrl"
                                        value={form.rpcUrl}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <label className="flex items-center gap-2 text-blue-200">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                        className="accent-blue-500"
                                    />
                                    Active
                                </label>
                                <label className="flex items-center gap-2 text-blue-200">
                                    <input
                                        type="checkbox"
                                        name="isTestnet"
                                        checked={form.isTestnet}
                                        onChange={handleChange}
                                        className="accent-yellow-400"
                                    />
                                    Testnet
                                </label>
                                <label className="flex items-center gap-2 text-blue-200">
                                    <input
                                        type="checkbox"
                                        name="defaultNetwork"
                                        checked={form.defaultNetwork}
                                        onChange={handleChange}
                                        className="accent-blue-500"
                                    />
                                    Default Network
                                </label>
                            </div>
                            {error && (
                                <div className="text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 rounded bg-gray-700 text-blue-200 hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                                >
                                    {isSubmitting
                                        ? "Saving..."
                                        : editNetwork
                                        ? "Update"
                                        : "Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TODO: 상세 보기, 필터, 페이지네이션, 네트워크별 상태 등 확장 가능 */}
        </div>
    );
}
