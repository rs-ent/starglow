/// components/admin/story/Admin.Story.Metadata.SPG.tsx

import type { ERC7572Metadata } from "@/app/story/metadata/actions";
import { useState } from "react";
import { useMetadata } from "@/app/story/metadata/hooks";
import { useSession } from "next-auth/react";
import { TbTopologyStar3 } from "react-icons/tb";
import { SiEthereum } from "react-icons/si";
import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";
import { useToast } from "@/app/hooks/useToast";

interface AdminStoryMetadataSPGProps {
    onBack: () => void;
}

const erc7572InitialForm: ERC7572Metadata = {
    name: "",
    description: "",
    image: "",
    banner_image: "",
    featured_image: "",
    external_link: "",
    collaborators: [],
};

export default function AdminStoryMetadataSPG({
    onBack,
}: AdminStoryMetadataSPGProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [erc7572Form, setErc7572Form] =
        useState<ERC7572Metadata>(erc7572InitialForm);
    const [collaboratorInput, setCollaboratorInput] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [editId, setEditId] = useState<string | null>(null); // 수정용 scaffold
    const [metadataType, setMetadataType] = useState<
        "spg-nft-collection-metadata" | "erc721-metadata"
    >("spg-nft-collection-metadata");

    const {
        metadataList,
        isLoadingMetadataList,
        isErrorMetadataList,
        refetchMetadataList,
        createMetadataAsync,
        isPendingCreateMetadata,
        deleteMetadataAsync,
        isPendingDeleteMetadata,
    } = useMetadata({
        getMetadataListInput: {
            type: metadataType,
        },
    });

    const handleAddCollaborator = () => {
        if (collaboratorInput.trim()) {
            setErc7572Form((prev) => ({
                ...prev,
                collaborators: [
                    ...(prev.collaborators || []),
                    collaboratorInput.trim(),
                ],
            }));
            setCollaboratorInput("");
        }
    };
    const handleRemoveCollaborator = (idx: number) => {
        setErc7572Form((prev) => ({
            ...prev,
            collaborators:
                prev.collaborators?.filter((_, i) => i !== idx) || [],
        }));
    };
    const handleErc7572Change = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setErc7572Form((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        if (!erc7572Form.name.trim() || !erc7572Form.description.trim()) {
            setError("Name과 Description은 필수입니다.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createMetadataAsync({
                metadata: erc7572Form,
                type: "spg-nft-collection-metadata",
                userId: session?.user?.id || "",
            });
            setErc7572Form(erc7572InitialForm);
            setSuccessMsg("메타데이터가 성공적으로 등록되었습니다!");
            refetchMetadataList();
        } catch (err: any) {
            setError(err?.message || "등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("정말로 삭제하시겠습니까?")) return;
        setError("");
        setSuccessMsg("");
        try {
            await deleteMetadataAsync({ id });
            setSuccessMsg("삭제되었습니다.");
            refetchMetadataList();
        } catch (err: any) {
            setError(err?.message || "삭제 중 오류가 발생했습니다.");
        }
    };

    const handleCopy = (cid: string) => {
        navigator.clipboard.writeText(cid);
        toast.success("CID가 복사되었습니다.");
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            {/* Subtle background icons for protocol feel */}
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={onBack}
                    title="다시 선택"
                >
                    <span className="hidden md:inline">다시 선택</span>
                </button>
            </div>

            <div className="w-full max-w-3xl z-10">
                {/* 리스트 */}
                <div className="mb-10 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-blue-400">
                            등록된 SPG NFT Collection 메타데이터
                        </span>
                    </h3>
                    {isLoadingMetadataList ? (
                        <div className="text-blue-200 py-8 text-center">
                            불러오는 중...
                        </div>
                    ) : isErrorMetadataList ? (
                        <div className="text-red-400 py-8 text-center">
                            목록을 불러오지 못했습니다.
                        </div>
                    ) : !metadataList || metadataList.length === 0 ? (
                        <div className="text-blue-200 py-8 text-center">
                            아직 등록된 메타데이터가 없습니다.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl shadow-lg bg-[#23243a]/60">
                            <table className="min-w-full text-sm text-blue-100">
                                <thead>
                                    <tr className="bg-[#23243a]/80 text-blue-300">
                                        <th className="px-4 py-3">CID</th>
                                        <th className="px-4 py-3">URL</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metadataList.map((item: any) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-blue-900/30 hover:bg-blue-900/10 transition"
                                        >
                                            <td
                                                className="px-4 py-2 font-mono max-w-[180px] truncate cursor-pointer"
                                                onClick={() => {
                                                    handleCopy(item.cid);
                                                }}
                                            >
                                                {item.cid}
                                            </td>
                                            <td className="px-4 py-2 font-mono max-w-[180px] truncate">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline text-blue-400 hover:text-blue-200 transition-all duration-150"
                                                >
                                                    {item.url}
                                                </a>
                                            </td>
                                            <td className="px-4 py-2 flex gap-2">
                                                <button
                                                    className="p-2 rounded-xl hover:bg-red-900/30 text-red-400 hover:text-red-500 transition shadow"
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    disabled={
                                                        isPendingDeleteMetadata
                                                    }
                                                    title="삭제"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-blue-400">
                            SPG NFT Collection 메타데이터 생성
                        </span>
                    </h3>
                    <p className="text-blue-200 mb-8 text-lg">
                        ERC-7572 표준에 맞는 컬렉션 메타데이터를 등록하세요.
                    </p>
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-5"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-blue-200 mb-1 font-semibold">
                                    Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={erc7572Form.name}
                                    onChange={handleErc7572Change}
                                    required
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow"
                                />
                            </div>
                            <div>
                                <label className="block text-blue-200 mb-1 font-semibold">
                                    Image
                                </label>
                                <FileUploaderIPFS
                                    userId={session?.user?.id || ""}
                                    type="image"
                                    multiple={false}
                                    onComplete={(files) => {
                                        if (files[0]?.url) {
                                            setErc7572Form((prev) => ({
                                                ...prev,
                                                image: files[0].url,
                                            }));
                                        }
                                    }}
                                />
                                <input
                                    name="image"
                                    value={erc7572Form.image || ""}
                                    onChange={handleErc7572Change}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                                />
                                {erc7572Form.image && (
                                    <img
                                        src={erc7572Form.image}
                                        alt="preview"
                                        className="mt-2 w-32 h-32 object-cover rounded-xl border"
                                    />
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-blue-200 mb-1 font-semibold">
                                Description{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={erc7572Form.description}
                                onChange={handleErc7572Change}
                                required
                                rows={3}
                                className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-blue-200 mb-1 font-semibold">
                                    Banner Image
                                </label>
                                <FileUploaderIPFS
                                    userId={session?.user?.id || ""}
                                    type="image"
                                    multiple={false}
                                    onComplete={(files) => {
                                        if (files[0]?.url) {
                                            setErc7572Form((prev) => ({
                                                ...prev,
                                                banner_image: files[0].url,
                                            }));
                                        }
                                    }}
                                />
                                <input
                                    name="banner_image"
                                    value={erc7572Form.banner_image || ""}
                                    onChange={handleErc7572Change}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                                />
                                {erc7572Form.banner_image && (
                                    <img
                                        src={erc7572Form.banner_image}
                                        alt="preview"
                                        className="mt-2 w-32 h-32 object-cover rounded-xl border"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-blue-200 mb-1 font-semibold">
                                    Featured Image
                                </label>
                                <FileUploaderIPFS
                                    userId={session?.user?.id || ""}
                                    type="image"
                                    multiple={false}
                                    onComplete={(files) => {
                                        if (files[0]?.url) {
                                            setErc7572Form((prev) => ({
                                                ...prev,
                                                featured_image: files[0].url,
                                            }));
                                        }
                                    }}
                                />
                                <input
                                    name="featured_image"
                                    value={erc7572Form.featured_image || ""}
                                    onChange={handleErc7572Change}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                                />
                                {erc7572Form.featured_image && (
                                    <img
                                        src={erc7572Form.featured_image}
                                        alt="preview"
                                        className="mt-2 w-32 h-32 object-cover rounded-xl border"
                                    />
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-blue-200 mb-1 font-semibold">
                                External Link
                            </label>
                            <input
                                name="external_link"
                                value={erc7572Form.external_link || ""}
                                onChange={handleErc7572Change}
                                placeholder="https://..."
                                className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow"
                            />
                        </div>
                        <div>
                            <label className="block text-blue-200 mb-1 font-semibold">
                                Collaborators (지갑 주소)
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={collaboratorInput}
                                    onChange={(e) =>
                                        setCollaboratorInput(e.target.value)
                                    }
                                    placeholder="0x..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none shadow"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCollaborator}
                                    className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition shadow"
                                >
                                    추가
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {erc7572Form.collaborators &&
                                    erc7572Form.collaborators.length > 0 &&
                                    erc7572Form.collaborators.map(
                                        (addr, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full flex items-center gap-2 shadow"
                                            >
                                                {addr}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveCollaborator(
                                                            idx
                                                        )
                                                    }
                                                    className="ml-1 text-red-400 hover:text-red-600"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        )
                                    )}
                            </div>
                        </div>
                        {error && (
                            <div className="text-red-400 text-sm font-semibold">
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="text-green-400 text-sm font-semibold">
                                {successMsg}
                            </div>
                        )}
                        <div className="flex justify-end mt-6">
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || isPendingCreateMetadata
                                }
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 text-lg"
                            >
                                {isSubmitting || isPendingCreateMetadata
                                    ? "등록 중..."
                                    : "메타데이터 등록"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
