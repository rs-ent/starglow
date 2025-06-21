/// components/admin/story/Admin.Story.Metadata.NFT.tsx

import { useState } from "react";

import { useSession } from "next-auth/react";
import {
    FaImage,
    FaVideo,
    FaLink,
    FaPlus,
    FaTimes,
    FaCheck,
    FaTrash,
    FaCopy,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import { useToast } from "@/app/hooks/useToast";
import { useMetadata } from "@/app/story/metadata/hooks";
import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";

import type { ERC721Metadata } from "@/app/story/metadata/actions";

const nftInitialForm: ERC721Metadata = {
    name: "",
    description: "",
    image: "",
    external_url: "",
    attributes: [],
    animation_url: "",
    youtube_url: "",
    banner_image: "",
    featured_image: "",
    collaborators: [],
};

// Attribute 타입 정의
type AttributeType =
    | "string"
    | "number"
    | "boost_percentage"
    | "boost_number"
    | "date";

export default function AdminStoryMetadataNFT({
    onBack,
}: {
    onBack: () => void;
}) {
    const { data: session } = useSession();
    const toast = useToast();
    const [form, setForm] = useState<ERC721Metadata>(nftInitialForm);
    const [attribute, setAttribute] = useState({
        trait_type: "",
        value: "",
        display_type: "string" as AttributeType,
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [expandedMetadata, setExpandedMetadata] = useState<string | null>(
        null
    );

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
            type: "erc721-metadata",
        },
    });

    // 필드 변경 핸들러
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // attributes 추가/삭제
    const handleAddAttribute = () => {
        if (attribute.trait_type && attribute.value !== "") {
            const newAttribute: any = {
                trait_type: attribute.trait_type,
                value:
                    attribute.display_type === "number" ||
                    attribute.display_type === "boost_percentage" ||
                    attribute.display_type === "boost_number"
                        ? Number(attribute.value)
                        : attribute.display_type === "date"
                        ? new Date(attribute.value).getTime() / 1000
                        : attribute.value,
            };

            if (attribute.display_type !== "string") {
                newAttribute.display_type = attribute.display_type;
            }

            setForm((prev) => ({
                ...prev,
                attributes: [...(prev.attributes || []), newAttribute],
            }));
            setAttribute({ trait_type: "", value: "", display_type: "string" });
        }
    };

    const handleRemoveAttribute = (idx: number) => {
        setForm((prev) => ({
            ...prev,
            attributes: prev.attributes?.filter((_, i) => i !== idx) || [],
        }));
    };

    // 파일 업로드 핸들러
    const handleFileUpload = (field: keyof ERC721Metadata, files: any[]) => {
        if (files[0]?.url) {
            setForm((prev) => ({
                ...prev,
                [field]: files[0].url,
            }));
        }
    };

    // 등록
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        if (!form.name.trim() || !form.description.trim() || !form.image) {
            setError("Name, Description, Image는 필수입니다.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createMetadataAsync({
                metadata: form,
                type: "erc721-metadata",
                userId: session?.user?.id || "",
            });
            setForm(nftInitialForm);
            setSuccessMsg("NFT 메타데이터가 성공적으로 등록되었습니다!");
            refetchMetadataList().catch((err) => {
                console.error(err);
            });
            toast.success("메타데이터 등록 완료!");
        } catch (err: any) {
            setError(err?.message || "등록 중 오류가 발생했습니다.");
            toast.error("등록 실패");
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
            refetchMetadataList().catch((err) => {
                console.error(err);
            });
            toast.success("삭제 완료");
        } catch (err: any) {
            setError(err?.message || "삭제 중 오류가 발생했습니다.");
            toast.error("삭제 실패");
        }
    };

    // 메타데이터 미리보기
    const handleViewMetadata = async (cid: string) => {
        try {
            const response = await fetch(`https://w3s.link/ipfs/${cid}`);
            const data = await response.json();
            setExpandedMetadata(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(error);
            toast.error("메타데이터를 불러올 수 없습니다.");
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            {/* 배경 아이콘 */}
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
                <h2 className="text-2xl font-bold text-white">
                    NFT (ERC721) 메타데이터
                </h2>
                <div />
            </div>

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
                {/* 왼쪽: 등록 폼 */}
                <div className="space-y-8">
                    {/* 메타데이터 생성 폼 */}
                    <div className="p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <FaImage className="text-orange-400" />
                            <span className="text-orange-400">
                                NFT 메타데이터 생성
                            </span>
                        </h3>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-5"
                        >
                            {/* 기본 정보 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-orange-200 mb-1 font-semibold">
                                        Name{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="My Awesome NFT #1"
                                        className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-orange-200 mb-1 font-semibold">
                                        External URL
                                    </label>
                                    <input
                                        name="external_url"
                                        value={form.external_url || ""}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-orange-200 mb-1 font-semibold">
                                    Description{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    placeholder="This NFT represents..."
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow transition-all"
                                />
                            </div>

                            {/* 이미지 업로드 섹션 */}
                            <div className="space-y-6 p-6 bg-orange-900/10 rounded-xl border border-orange-800/30">
                                <h4 className="text-orange-300 font-bold mb-4 flex items-center gap-2">
                                    <FaImage /> 미디어 파일
                                </h4>

                                {/* 메인 이미지 */}
                                <div>
                                    <label className="block text-orange-200 mb-2 font-semibold">
                                        Image{" "}
                                        <span className="text-red-400">*</span>
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
                                        placeholder="ipfs://... or https://..."
                                        className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow mt-2 text-sm"
                                    />
                                    {form.image && (
                                        <img
                                            src={form.image}
                                            alt="preview"
                                            className="mt-3 w-full h-48 object-cover rounded-xl border-2 border-orange-700 shadow-lg"
                                        />
                                    )}
                                </div>

                                {/* 애니메이션 URL */}
                                <div>
                                    <label className="block text-orange-200 mb-2 font-semibold items-center gap-2">
                                        <FaVideo /> Animation URL
                                    </label>
                                    <FileUploaderIPFS
                                        userId={session?.user?.id || ""}
                                        type="video"
                                        multiple={false}
                                        onComplete={(files) =>
                                            handleFileUpload(
                                                "animation_url",
                                                files
                                            )
                                        }
                                    />
                                    <input
                                        name="animation_url"
                                        value={form.animation_url || ""}
                                        onChange={handleChange}
                                        placeholder="ipfs://... or https://..."
                                        className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow mt-2 text-sm"
                                    />
                                </div>

                                {/* YouTube URL */}
                                <div>
                                    <label className="block text-orange-200 mb-2 font-semibold items-center gap-2">
                                        <FaLink /> YouTube URL
                                    </label>
                                    <input
                                        name="youtube_url"
                                        value={form.youtube_url || ""}
                                        onChange={handleChange}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow"
                                    />
                                </div>
                            </div>

                            {/* Attributes 섹션 */}
                            <div className="space-y-4 p-6 bg-purple-900/10 rounded-xl border border-purple-800/30">
                                <h4 className="text-purple-300 font-bold mb-4">
                                    🎯 Attributes
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                                    <div className="md:col-span-4">
                                        <label className="block text-purple-200 mb-1 text-sm">
                                            Trait Type
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="예: Rarity"
                                            value={attribute.trait_type}
                                            onChange={(e) =>
                                                setAttribute((prev) => ({
                                                    ...prev,
                                                    trait_type: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-purple-800 focus:outline-none shadow text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-purple-200 mb-1 text-sm">
                                            Display Type
                                        </label>
                                        <select
                                            value={attribute.display_type}
                                            onChange={(e) =>
                                                setAttribute((prev) => ({
                                                    ...prev,
                                                    display_type: e.target
                                                        .value as AttributeType,
                                                }))
                                            }
                                            className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-purple-800 focus:outline-none shadow text-sm"
                                        >
                                            <option value="string">Text</option>
                                            <option value="number">
                                                Number
                                            </option>
                                            <option value="boost_percentage">
                                                Boost %
                                            </option>
                                            <option value="boost_number">
                                                Boost #
                                            </option>
                                            <option value="date">Date</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-purple-200 mb-1 text-sm">
                                            Value
                                        </label>
                                        <input
                                            type={
                                                attribute.display_type ===
                                                "date"
                                                    ? "date"
                                                    : "text"
                                            }
                                            placeholder={
                                                attribute.display_type ===
                                                "number"
                                                    ? "123"
                                                    : "예: Legendary"
                                            }
                                            value={attribute.value}
                                            onChange={(e) =>
                                                setAttribute((prev) => ({
                                                    ...prev,
                                                    value: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-purple-800 focus:outline-none shadow text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <button
                                            type="button"
                                            onClick={handleAddAttribute}
                                            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition shadow-lg transform hover:scale-105"
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>

                                {/* Attributes 목록 */}
                                {form.attributes &&
                                    form.attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {form.attributes.map(
                                                (attr, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-gradient-to-r from-purple-800/40 to-pink-800/40 text-purple-200 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-purple-700/50"
                                                    >
                                                        <span className="font-semibold">
                                                            {attr.trait_type}:
                                                        </span>
                                                        <span>
                                                            {typeof attr.value ===
                                                            "string"
                                                                ? attr.value
                                                                : attr.value instanceof
                                                                  Date
                                                                ? attr.value.toLocaleDateString()
                                                                : attr.value.toString()}
                                                        </span>
                                                        {attr.display_type &&
                                                            attr.display_type !==
                                                                "string" && (
                                                                <span className="text-xs text-purple-400">
                                                                    (
                                                                    {
                                                                        attr.display_type
                                                                    }
                                                                    )
                                                                </span>
                                                            )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveAttribute(
                                                                    idx
                                                                )
                                                            }
                                                            className="ml-1 text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* 미리보기 버튼 */}
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                            >
                                {showPreview
                                    ? "미리보기 닫기"
                                    : "JSON 미리보기"}
                            </button>

                            {/* JSON 미리보기 */}
                            {showPreview && (
                                <div className="bg-[#181c2b] rounded-xl p-4 border border-blue-800">
                                    <pre className="text-xs text-blue-300 overflow-x-auto">
                                        {JSON.stringify(form, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {error && (
                                <div className="text-red-400 text-sm font-semibold bg-red-900/20 rounded-xl p-3 border border-red-700/50">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="text-green-400 text-sm font-semibold bg-green-900/20 rounded-xl p-3 border border-green-700/50 flex items-center gap-2">
                                    <FaCheck /> {successMsg}
                                </div>
                            )}

                            <div className="flex justify-end mt-6">
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting || isPendingCreateMetadata
                                    }
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold shadow-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 text-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting || isPendingCreateMetadata
                                        ? "등록 중..."
                                        : "🚀 NFT 메타데이터 등록"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 오른쪽: 메타데이터 리스트 */}
                <div className="p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-orange-400">
                            📦 등록된 NFT 메타데이터
                        </span>
                    </h3>
                    {isLoadingMetadataList ? (
                        <div className="text-blue-200 py-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
                            <p className="mt-4">불러오는 중...</p>
                        </div>
                    ) : isErrorMetadataList ? (
                        <div className="text-red-400 py-8 text-center">
                            목록을 불러오지 못했습니다.
                        </div>
                    ) : !metadataList || metadataList.length === 0 ? (
                        <div className="text-blue-200 py-8 text-center">
                            <div className="text-6xl mb-4 opacity-50">📭</div>
                            <p>아직 등록된 메타데이터가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {metadataList.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="bg-[#181c2b]/60 rounded-xl p-4 border border-orange-800/30 hover:border-orange-600/50 transition-all duration-200 group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-orange-300 font-mono text-xs truncate max-w-[60%]">
                                            CID: {item.cid}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 rounded-lg hover:bg-orange-900/30 text-orange-400 hover:text-orange-300 transition opacity-0 group-hover:opacity-100"
                                                onClick={() => {
                                                    navigator.clipboard
                                                        .writeText(item.cid)
                                                        .catch((err) => {
                                                            console.error(err);
                                                        });
                                                    toast.success("CID 복사됨");
                                                }}
                                                title="CID 복사"
                                            >
                                                <FaCopy />
                                            </button>
                                            <button
                                                className="p-2 rounded-lg hover:bg-blue-900/30 text-blue-400 hover:text-blue-300 transition opacity-0 group-hover:opacity-100"
                                                onClick={() =>
                                                    handleViewMetadata(item.cid)
                                                }
                                                title="메타데이터 보기"
                                            >
                                                👁️
                                            </button>
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg hover:bg-green-900/30 text-green-400 hover:text-green-300 transition"
                                                title="IPFS에서 보기"
                                            >
                                                🔗
                                            </a>
                                            <button
                                                className="p-2 rounded-lg hover:bg-red-900/30 text-red-400 hover:text-red-500 transition"
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                disabled={
                                                    isPendingDeleteMetadata
                                                }
                                                title="삭제"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-xs">
                                        생성일:{" "}
                                        {new Date(
                                            item.createdAt
                                        ).toLocaleDateString()}
                                    </p>

                                    {/* 메타데이터 내용 표시 */}
                                    {expandedMetadata ===
                                        JSON.stringify(item, null, 2) && (
                                        <div className="mt-3 bg-[#0a0a0a] rounded-lg p-3 border border-orange-900/30">
                                            <pre className="text-xs text-orange-300 overflow-x-auto">
                                                {expandedMetadata}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
