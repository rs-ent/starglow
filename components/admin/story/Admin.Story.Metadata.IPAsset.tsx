/// components/admin/story/Admin.Story.Metadata.IPAsset.tsx

import type { IPAssetMetadata } from "@/app/story/metadata/actions";
import { useState } from "react";
import { useMetadata } from "@/app/story/metadata/hooks";
import { useSession } from "next-auth/react";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";
import { useToast } from "@/app/hooks/useToast";

interface AdminStoryMetadataIPAssetProps {
    onBack: () => void;
}

const ipAssetInitialForm: IPAssetMetadata = {
    title: "",
    description: "",
    image: "",
    imageHash: "",
    mediaUrl: "",
    mediaHash: "",
    mediaType: "",
    videoUrl: "",
    videoHash: "",
    creators: [],
    tags: [],
};

export default function AdminStoryMetadataIPAsset({
    onBack,
}: AdminStoryMetadataIPAssetProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [form, setForm] = useState<IPAssetMetadata>(ipAssetInitialForm);
    const [creatorInput, setCreatorInput] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

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
            type: "ip-asset-metadata",
        },
    });

    const { escrowWallets } = useEscrowWallets({
        getEscrowWalletsInput: {
            isActive: true,
        },
    });

    // 해시 계산 함수 (SHA256)
    // 주의: 이 함수는 미디어 파일 자체의 해시를 계산합니다.
    // Story Protocol의 ipMetadataHash/nftMetadataHash와는 다릅니다.
    // - imageHash/mediaHash/videoHash: 미디어 파일의 무결성 검증용
    // - ipMetadataHash/nftMetadataHash: 전체 메타데이터 JSON의 해시 (Story Protocol 등록 시 사용)
    async function calcHashFromUrl(url: string): Promise<string> {
        if (!url) return "";
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", buf);
        return (
            "0x" +
            Array.from(new Uint8Array(hashBuffer))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
        );
    }

    // 업로드 후 해시 자동계산
    const handleFileUpload = async (
        field: "image" | "mediaUrl" | "videoUrl",
        files: any[]
    ) => {
        if (files[0]?.url) {
            const url = files[0].url;
            const hash = await calcHashFromUrl(url);
            setForm((prev) => ({
                ...prev,
                [field]: url,
                [`${
                    field === "image"
                        ? "imageHash"
                        : field === "mediaUrl"
                        ? "mediaHash"
                        : "videoHash"
                }`]: hash,
            }));
        }
    };

    // creators 선택 핸들러
    const handleToggleCreator = (address: string) => {
        setForm((prev) => {
            const exists = prev.creators?.some(
                (creator) => creator.address === address
            );

            if (exists) {
                // 제거하는 경우: 남은 creators들의 기여도를 재분배
                const remainingCreators =
                    prev.creators?.filter(
                        (creator) => creator.address !== address
                    ) || [];
                const redistributedCreators = remainingCreators.map(
                    (creator) => ({
                        ...creator,
                        contributionPercent:
                            remainingCreators.length > 0
                                ? 100 / remainingCreators.length
                                : 0,
                    })
                );

                return {
                    ...prev,
                    creators: redistributedCreators,
                };
            } else {
                // 추가하는 경우: 모든 creators의 기여도를 균등 분배
                const newCreators = [
                    ...(prev.creators || []),
                    {
                        name: `Creator ${address.slice(0, 8)}...${address.slice(
                            -6
                        )}`,
                        address: address,
                        contributionPercent: 0, // 임시값, 아래에서 재계산
                    },
                ];

                const equalPercent = 100 / newCreators.length;
                const redistributedCreators = newCreators.map((creator) => ({
                    ...creator,
                    contributionPercent: equalPercent,
                }));

                return {
                    ...prev,
                    creators: redistributedCreators,
                };
            }
        });
    };

    // tags 추가/삭제
    const handleAddTag = () => {
        if (tagInput.trim()) {
            setForm((prev) => ({
                ...prev,
                tags: [...(prev.tags || []), tagInput.trim()],
            }));
            setTagInput("");
        }
    };
    const handleRemoveTag = (idx: number) => {
        setForm((prev) => ({
            ...prev,
            tags: prev.tags?.filter((_, i) => i !== idx) || [],
        }));
    };

    // 입력값 변경
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 등록
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        if (!form.title.trim() || !form.description.trim()) {
            setError("Title과 Description은 필수입니다.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createMetadataAsync({
                metadata: form,
                type: "ip-asset-metadata",
                userId: session?.user?.id || "",
            });
            setForm(ipAssetInitialForm);
            setSuccessMsg("메타데이터가 성공적으로 등록되었습니다!");
            refetchMetadataList();
        } catch (err: any) {
            setError(err?.message || "등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 삭제
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

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={onBack}
                    title="다시 선택"
                >
                    <span className="hidden md:inline">다시 선택</span>
                </button>
            </div>

            {/* 메타데이터 리스트 */}
            <div className="mb-10 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30 w-full max-w-3xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-blue-400">
                        등록된 IP Asset 메타데이터
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
                                                navigator.clipboard.writeText(
                                                    item.cid
                                                );
                                                toast.success(
                                                    "CID가 복사되었습니다."
                                                );
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

            {/* 메타데이터 생성 폼 */}
            <div className="p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30 w-full max-w-3xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-blue-400">
                        IP Asset 메타데이터 생성
                    </span>
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-blue-200 mb-1 font-semibold">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
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
                                onComplete={(files) =>
                                    handleFileUpload("image", files)
                                }
                            />
                            <input
                                name="image"
                                value={form.image || ""}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                            />
                            {form.image && (
                                <img
                                    src={form.image}
                                    alt="preview"
                                    className="mt-2 w-32 h-32 object-cover rounded-xl border"
                                />
                            )}
                            {form.imageHash && (
                                <div className="text-xs text-blue-400 mt-1 break-all">
                                    Hash: {form.imageHash}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-blue-200 mb-1 font-semibold">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-blue-200 mb-1 font-semibold">
                                Media (음원 등)
                            </label>
                            <FileUploaderIPFS
                                userId={session?.user?.id || ""}
                                type="audio"
                                multiple={false}
                                onComplete={(files) =>
                                    handleFileUpload("mediaUrl", files)
                                }
                            />
                            <input
                                name="mediaUrl"
                                value={form.mediaUrl || ""}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                            />
                            {form.mediaUrl && (
                                <audio
                                    controls
                                    src={form.mediaUrl}
                                    className="mt-2 w-full"
                                />
                            )}
                            {form.mediaHash && (
                                <div className="text-xs text-blue-400 mt-1 break-all">
                                    Hash: {form.mediaHash}
                                </div>
                            )}
                            <input
                                name="mediaType"
                                value={form.mediaType || ""}
                                onChange={handleChange}
                                placeholder="audio/mpeg"
                                className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                            />
                        </div>
                        <div>
                            <label className="block text-blue-200 mb-1 font-semibold">
                                Video (뮤직비디오 등)
                            </label>
                            <FileUploaderIPFS
                                userId={session?.user?.id || ""}
                                type="video"
                                multiple={false}
                                onComplete={(files) =>
                                    handleFileUpload("videoUrl", files)
                                }
                            />
                            <input
                                name="videoUrl"
                                value={form.videoUrl || ""}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow mt-2"
                            />
                            {form.videoUrl && (
                                <video
                                    controls
                                    src={form.videoUrl}
                                    className="mt-2 w-full max-h-40"
                                />
                            )}
                            {form.videoHash && (
                                <div className="text-xs text-blue-400 mt-1 break-all">
                                    Hash: {form.videoHash}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-blue-200 mb-1 font-semibold">
                            Creators (에스크로 지갑에서 선택, 다중 선택 가능)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {escrowWallets?.map((wallet) => (
                                <button
                                    key={wallet.address}
                                    type="button"
                                    onClick={() =>
                                        handleToggleCreator(wallet.address)
                                    }
                                    className={`px-4 py-2 rounded-xl border font-mono ${
                                        form.creators?.some(
                                            (creator) =>
                                                creator.address ===
                                                wallet.address
                                        )
                                            ? "bg-blue-700 text-white border-blue-400"
                                            : "bg-[#181c2b] text-blue-200 border-blue-800"
                                    } hover:bg-blue-800 transition`}
                                >
                                    {wallet.address.slice(0, 8)}...
                                    {wallet.address.slice(-6)}
                                    {form.creators?.some(
                                        (creator) =>
                                            creator.address === wallet.address
                                    ) && (
                                        <span className="ml-2 text-green-400 font-bold">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {form.creators && form.creators.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {form.creators.map((creator, index) => (
                                    <span
                                        key={creator.address}
                                        className="bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full flex items-center gap-2 shadow"
                                    >
                                        <span className="font-mono text-xs">
                                            {creator.address.slice(0, 8)}...
                                            {creator.address.slice(-6)}
                                        </span>
                                        <span className="text-green-400 font-semibold">
                                            {creator.contributionPercent.toFixed(
                                                1
                                            )}
                                            %
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-blue-200 mb-1 font-semibold">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="예: music, video, artist"
                                className="flex-1 px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none shadow"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition shadow"
                            >
                                추가
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.tags &&
                                form.tags.length > 0 &&
                                form.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full flex items-center gap-2 shadow"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(idx)}
                                            className="ml-1 text-red-400 hover:text-red-600"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
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
                            disabled={isSubmitting || isPendingCreateMetadata}
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
    );
}
