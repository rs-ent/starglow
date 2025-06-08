/// components/admin/story/Admin.Story.Management.SPG.tsx

import { useEffect, useState } from "react";
import { useSPG } from "@/app/story/spg/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import FileUploader from "@/components/atoms/FileUploader";
import { TbTopologyStar3 } from "react-icons/tb";
import { SiEthereum } from "react-icons/si";
import { fetchURI } from "@/app/story/metadata/actions";
import {
    FaEdit,
    FaCalendarAlt,
    FaDollarSign,
    FaPercentage,
    FaPalette,
    FaWallet,
    FaListUl,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaArrowLeft,
    FaSave,
    FaChartPie,
    FaTimes,
    FaPlus,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/app/hooks/useToast";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// SPG 컬렉션 필수 필드 타입
interface SPGForm {
    address: string;
    contractURI?: string;
    isListed?: boolean;
    sharePercentage?: number;
    reportUrl?: string;
    preOrderStart?: string;
    preOrderEnd?: string;
    saleStart?: string;
    saleEnd?: string;
    glowStart?: string;
    glowEnd?: string;
    price: number;
    circulation: number;
    pageImages: { id: string; url: string }[];
    backgroundColor?: string;
    foregroundColor?: string;
    name?: string;
    artistId?: string;
    networkId?: string;
    imageUrl?: string;
}

function formatKSTDate(dateStr?: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toDatetimeLocalValue(dt?: string) {
    if (!dt) return "";
    // dt는 ISO string일 수 있음
    const date = new Date(dt);
    // 브라우저 input value는 local time 기준이어야 함
    // padStart로 항상 2자리 보장
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    console.log(yyyy, mm, dd, hh, min);
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// 썸네일 컴포넌트
function CollectionThumbnail({
    imageUrl,
    contractURI,
    fallback,
    size = "normal",
}: {
    imageUrl?: string;
    contractURI?: string;
    fallback?: string;
    size?: "normal" | "large";
}) {
    const [metaImage, setMetaImage] = useState<string | null>(null);
    useEffect(() => {
        if (!contractURI) return;
        fetchURI({ uri: contractURI })
            .then((meta) => setMetaImage(meta?.image || null))
            .catch(() => setMetaImage(null));
    }, [contractURI]);
    const src = imageUrl || metaImage || fallback;
    const sizeClasses = size === "large" ? "w-32 h-32" : "w-24 h-24";
    if (src) {
        return (
            <img
                src={src}
                alt="thumbnail"
                className={`${sizeClasses} object-cover rounded-xl border-2 border-blue-800 shadow-lg bg-[#181c2b]`}
            />
        );
    }
    return (
        <div
            className={`${sizeClasses} rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center text-4xl text-blue-600 border-2 border-blue-700/50`}
        >
            📦
        </div>
    );
}

// SortableItem 컴포넌트 추가
function SortableItem({
    img,
    onRemove,
}: {
    img: { id: string; url: string };
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative group cursor-move ${
                isDragging ? "opacity-50 scale-105" : ""
            }`}
        >
            <img
                src={img.url}
                alt="page"
                className="w-full h-48 object-cover rounded-xl border-2 border-blue-700/50 group-hover:border-cyan-500/50 transition-all duration-200"
            />
            <button
                onClick={() => onRemove(img.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            >
                <FaTimes className="text-xs" />
            </button>
        </div>
    );
}

export default function AdminStoryManagementSPG({
    onBack,
}: {
    onBack: () => void;
}) {
    const toast = useToast();
    const {
        getSPGsData,
        getSPGsIsLoading,
        getSPGsIsError,
        getSPGsError,
        updateSPGUtilsMutation,
        updateSPGUtilsMutationAsync,
        updateSPGUtilsMutationIsPending,
        updateSPGUtilsMutationIsError,
    } = useSPG({
        getSPGsInput: {},
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<SPGForm>({
        address: "",
        contractURI: "",
        isListed: false,
        sharePercentage: 0,
        imageUrl: "",
        preOrderStart: "",
        preOrderEnd: "",
        saleStart: "",
        saleEnd: "",
        glowStart: "",
        glowEnd: "",
        price: 0,
        circulation: 1000,
        pageImages: [],
        backgroundColor: "",
        foregroundColor: "",
    });

    const {
        escrowWallets,
        isLoadingEscrowWallets,
        isErrorEscrowWallets,
        refetchEscrowWallets,

        registeredEscrowWallets,
        isLoadingRegisteredEscrowWallets,
        isErrorRegisteredEscrowWallets,
        refetchRegisteredEscrowWallets,

        addEscrowWalletToSPG,
        addEscrowWalletToSPGAsync,
        isPendingAddEscrowWalletToSPG,
        isErrorAddEscrowWalletToSPG,
    } = useEscrowWallets({
        getRegisteredEscrowWalletsInput: {
            spgAddress: form.address,
        },
    });

    const [activeTab, setActiveTab] = useState<
        "info" | "escrowWallets" | "schedule" | "design"
    >("info");

    const [selectedWallet, setSelectedWallet] = useState<string>("");

    const toISOString = (val?: string) =>
        val ? new Date(val).toISOString() : undefined;

    const handleSave = async () => {
        try {
            await updateSPGUtilsMutationAsync({
                ...form,
                preOrderStart: toISOString(form.preOrderStart),
                preOrderEnd: toISOString(form.preOrderEnd),
                saleStart: toISOString(form.saleStart),
                saleEnd: toISOString(form.saleEnd),
                glowStart: toISOString(form.glowStart),
                glowEnd: toISOString(form.glowEnd),
                pageImages: form.pageImages.map((img) => img.url),
            });
            toast.success("SPG 정보가 성공적으로 업데이트되었습니다!");
            setShowForm(false);
        } catch (error: any) {
            toast.error(error?.message || "업데이트 중 오류가 발생했습니다.");
        }
    };

    // pageImages 업로드 핸들러
    const handleImagesUpload = (files: { id: string; url: string }[]) => {
        setForm((prev) => ({
            ...prev,
            pageImages: files,
        }));
    };

    const handleAddEscrowWallet = async () => {
        if (!selectedWallet) {
            toast.error("지갑을 선택해주세요.");
            return;
        }

        try {
            const result = await addEscrowWalletToSPGAsync({
                spgAddress: form.address,
                walletAddress: selectedWallet,
            });

            if (!result) {
                toast.error("Escrow wallet 등록 중 오류가 발생했습니다.");
                return;
            }

            toast.success("Escrow wallet이 성공적으로 등록되었습니다.");
            setSelectedWallet("");
            refetchRegisteredEscrowWallets();
        } catch (error: any) {
            toast.error(
                error?.message || "Escrow wallet 등록 중 오류가 발생했습니다."
            );
        }
    };

    // 카드형 컬렉션 목록 렌더러
    const renderCollectionCard = (spg: any) => {
        const isActive =
            spg.saleStart &&
            new Date(spg.saleStart) <= new Date() &&
            (!spg.saleEnd || new Date(spg.saleEnd) >= new Date());
        return (
            <motion.div
                key={spg.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-[#2a2342] via-[#23243a] to-[#181c2b] rounded-3xl shadow-2xl border border-blue-800/30 overflow-hidden group cursor-pointer"
                onClick={() => {
                    setForm({
                        address: spg.address,
                        isListed: spg.isListed,
                        preOrderStart: spg.preOrderStart || "",
                        preOrderEnd: spg.preOrderEnd || "",
                        saleStart: spg.saleStart || "",
                        saleEnd: spg.saleEnd || "",
                        glowStart: spg.glowStart || "",
                        glowEnd: spg.glowEnd || "",
                        price: spg.price || 0,
                        circulation: spg.circulation || 0,
                        pageImages: Array.isArray(spg.pageImages)
                            ? spg.pageImages.map(
                                  (url: string, idx: number) => ({
                                      id: String(idx),
                                      url,
                                  })
                              )
                            : [],
                        backgroundColor: spg.backgroundColor || "",
                        foregroundColor: spg.foregroundColor || "",
                        name: spg.name,
                        artistId: spg.artistId,
                        networkId: spg.networkId,
                        imageUrl: spg.imageUrl || "",
                        reportUrl: spg.reportUrl || "",
                        sharePercentage: spg.sharePercentage || 0,
                    });
                    setShowForm(true);
                }}
            >
                <div className="relative p-6">
                    {/* 상태 배지 */}
                    <div className="absolute top-4 right-4 z-10">
                        {spg.isListed ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                                <FaCheckCircle className="text-xs" /> Listed
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-700/40 text-gray-400 border border-gray-600/30 flex items-center gap-1">
                                <FaTimesCircle className="text-xs" /> Unlisted
                            </span>
                        )}
                    </div>
                    {/* 썸네일과 정보 */}
                    <div className="flex items-start gap-4">
                        <CollectionThumbnail
                            imageUrl={spg.imageUrl}
                            contractURI={spg.contractURI}
                            fallback={spg.pageImages?.[0]}
                        />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                                {spg.name ||
                                    `Collection #${spg.address.slice(0, 6)}`}
                            </h3>
                            <p className="text-sm text-blue-400 font-mono mb-3">
                                {spg.address.slice(0, 12)}...
                                {spg.address.slice(-10)}
                            </p>
                            {/* 정보 태그들 */}
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 rounded-lg text-xs bg-blue-900/30 text-blue-300 border border-blue-700/30 flex items-center gap-1">
                                    <FaDollarSign className="text-xs" />{" "}
                                    {spg.price} USD
                                </span>
                                <span className="px-3 py-1 rounded-lg text-xs bg-purple-900/30 text-purple-300 border border-purple-700/30 flex items-center gap-1">
                                    <FaListUl className="text-xs" />{" "}
                                    {spg.circulation} NFTs
                                </span>
                                {isActive && (
                                    <span className="px-3 py-1 rounded-lg text-xs bg-orange-900/30 text-orange-300 border border-orange-700/30 flex items-center gap-1 animate-pulse">
                                        <FaClock className="text-xs" /> 판매중
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* 기간 정보 */}
                    {spg.saleStart && (
                        <div className="mt-4 pt-4 border-t border-blue-800/20">
                            <div className="flex items-center gap-2 text-xs text-blue-300">
                                <FaCalendarAlt />
                                <span>
                                    판매 기간: {formatKSTDate(spg.saleStart)}
                                </span>
                                {spg.saleEnd && (
                                    <>
                                        <span className="text-blue-500">~</span>
                                        <span>
                                            {formatKSTDate(spg.saleEnd)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* 호버 효과 */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
        );
    };

    return (
        <div className="relative w-full min-h-[80vh] flex flex-col items-center justify-start">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[20rem] text-blue-900/5 left-[-4rem] top-[-6rem] pointer-events-none select-none z-0 animate-pulse" />
            <SiEthereum className="absolute text-[10rem] text-purple-800/5 right-[-3rem] bottom-[-3rem] pointer-events-none select-none z-0 animate-pulse" />

            {/* 상단 Hero 섹션 */}
            <div className="w-full flex flex-col items-center mb-12 z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-6"
                >
                    <button
                        onClick={onBack}
                        className="p-3 rounded-xl bg-blue-900/20 text-blue-300 hover:bg-blue-900/30 hover:text-white transition-all duration-300 hover:scale-105"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                        SPG Collection Manager
                    </h1>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-blue-300 max-w-3xl text-center"
                >
                    Story Protocol Gateway NFT 컬렉션의 모든 정보를 한눈에
                    관리하고 업데이트하세요
                </motion.p>
            </div>

            {/* 컬렉션 목록 */}
            <div className="w-full max-w-7xl z-10">
                <AnimatePresence mode="wait">
                    {getSPGsIsLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                            <p className="text-xl text-blue-300">
                                컬렉션을 불러오는 중...
                            </p>
                        </motion.div>
                    ) : getSPGsIsError ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="text-6xl mb-4">⚠️</div>
                            <p className="text-xl text-red-400">
                                {getSPGsError?.message ||
                                    "컬렉션을 불러올 수 없습니다"}
                            </p>
                        </motion.div>
                    ) : !getSPGsData || getSPGsData.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="text-8xl mb-6 opacity-30">📭</div>
                            <h3 className="text-2xl font-bold text-blue-200 mb-2">
                                아직 등록된 SPG 컬렉션이 없습니다
                            </h3>
                            <p className="text-blue-400">
                                컬렉션이 배포되면 이곳에서 관리할 수 있습니다
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getSPGsData.map((spg: any) =>
                                renderCollectionCard(spg)
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* 수정 모달 */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={(e) =>
                            e.target === e.currentTarget && setShowForm(false)
                        }
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-4xl bg-gradient-to-br from-[#2a2342] via-[#23243a] to-[#181c2b] rounded-3xl shadow-2xl border border-blue-800/30 overflow-hidden"
                        >
                            {/* 모달 헤더 */}
                            <div className="relative p-6 border-b border-blue-800/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="absolute top-6 right-6 p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <CollectionThumbnail
                                        imageUrl={form.imageUrl}
                                        contractURI={form.contractURI}
                                        fallback={form.pageImages?.[0]?.url}
                                        size="large"
                                    />
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">
                                            {form.name || "SPG Collection 설정"}
                                        </h2>
                                        <p className="text-sm text-blue-400 font-mono">
                                            {form.address}
                                        </p>
                                    </div>
                                </div>
                                {/* 탭 네비게이션 */}
                                <div className="flex gap-2 mt-6">
                                    {[
                                        {
                                            id: "info",
                                            label: "기본 정보",
                                            icon: <FaEdit />,
                                        },
                                        {
                                            id: "escrowWallets",
                                            label: "에스크로 지갑",
                                            icon: <FaWallet />,
                                        },
                                        {
                                            id: "schedule",
                                            label: "판매 일정",
                                            icon: <FaCalendarAlt />,
                                        },
                                        {
                                            id: "design",
                                            label: "디자인",
                                            icon: <FaPalette />,
                                        },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() =>
                                                setActiveTab(tab.id as any)
                                            }
                                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                                                activeTab === tab.id
                                                    ? "bg-blue-600 text-white shadow-lg"
                                                    : "bg-blue-900/20 text-blue-300 hover:bg-blue-900/30"
                                            }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 모달 본문 */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <AnimatePresence mode="wait">
                                    {/* 기본 정보 탭 */}
                                    {activeTab === "info" && (
                                        <motion.div
                                            key="info"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            {/* isListed 토글 */}
                                            <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">
                                                        컬렉션 공개 상태
                                                    </h3>
                                                    <p className="text-sm text-blue-300 mt-1">
                                                        공개로 설정하면
                                                        사용자들이 컬렉션을 볼
                                                        수 있습니다
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                                                        form.isListed
                                                            ? "bg-gradient-to-r from-green-500 to-green-600"
                                                            : "bg-gray-600"
                                                    }`}
                                                    onClick={() =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            isListed:
                                                                !f.isListed,
                                                        }))
                                                    }
                                                >
                                                    <span
                                                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${
                                                            form.isListed
                                                                ? "translate-x-1"
                                                                : "-translate-x-7"
                                                        }`}
                                                    />
                                                </button>
                                            </div>

                                            {/* 매출 공유 비율 */}
                                            <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                                                <div>
                                                    <label className="block text-blue-200 font-semibold mb-2">
                                                        매출 공유 비율
                                                    </label>
                                                    <div className="relative">
                                                        <FaPercentage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                                        <input
                                                            type="number"
                                                            value={
                                                                form.sharePercentage
                                                            }
                                                            max={1}
                                                            min={0}
                                                            step={0.01}
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        sharePercentage:
                                                                            Math.min(
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ),
                                                                                1
                                                                            ),
                                                                    })
                                                                )
                                                            }
                                                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                                                <div>
                                                    <label className="block text-blue-200 font-semibold mb-2">
                                                        리포트 URL
                                                    </label>
                                                    <div className="relative">
                                                        <FaChartPie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                                        <input
                                                            type="text"
                                                            value={
                                                                form.reportUrl
                                                            }
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        reportUrl:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="w-full">
                                                        <label className="block text-blue-200 font-semibold mb-2">
                                                            판매 가격 (USD)
                                                        </label>
                                                        <div className="relative">
                                                            <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                                            <input
                                                                type="number"
                                                                value={
                                                                    form.price
                                                                }
                                                                onChange={(e) =>
                                                                    setForm(
                                                                        (
                                                                            f
                                                                        ) => ({
                                                                            ...f,
                                                                            price: Number(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ),
                                                                        })
                                                                    )
                                                                }
                                                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-full">
                                                        <label className="block text-blue-200 font-semibold mb-2">
                                                            발행 수량
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={
                                                                form.circulation
                                                            }
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        circulation:
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ),
                                                                    })
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 에스크로 지갑 탭 */}
                                    {activeTab === "escrowWallets" && (
                                        <motion.div
                                            key="escrowWallets"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            {/* Escrow Wallet 관리 섹션 */}
                                            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                    <FaWallet className="text-purple-400" />
                                                    에스크로 지갑 관리
                                                </h3>

                                                {/* 등록된 Escrow Wallet 목록 */}
                                                <div className="mb-4">
                                                    <h4 className="text-sm text-blue-300 mb-2">
                                                        등록된 Escrow Wallet
                                                    </h4>
                                                    {isLoadingRegisteredEscrowWallets ? (
                                                        <div className="text-blue-300 text-center py-2">
                                                            로딩 중...
                                                        </div>
                                                    ) : isErrorRegisteredEscrowWallets ? (
                                                        <div className="text-red-400 text-center py-2">
                                                            목록을 불러오는데
                                                            실패했습니다.
                                                        </div>
                                                    ) : !registeredEscrowWallets ||
                                                      registeredEscrowWallets.length ===
                                                          0 ? (
                                                        <div className="text-blue-300 text-center py-2">
                                                            등록된 Escrow
                                                            Wallet이 없습니다.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {registeredEscrowWallets.map(
                                                                (wallet) => (
                                                                    <div
                                                                        key={
                                                                            wallet
                                                                        }
                                                                        className="flex items-center justify-between p-2 bg-blue-900/30 rounded-lg"
                                                                    >
                                                                        <span className="text-blue-200 font-mono text-sm">
                                                                            {
                                                                                wallet
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 새로운 Escrow Wallet 등록 */}
                                                <div>
                                                    <h4 className="text-sm text-blue-300 mb-2">
                                                        새 Escrow Wallet 등록
                                                    </h4>
                                                    {isLoadingEscrowWallets ? (
                                                        <div className="text-blue-300 text-center py-2">
                                                            사용 가능한 지갑
                                                            목록을 불러오는
                                                            중...
                                                        </div>
                                                    ) : isErrorEscrowWallets ? (
                                                        <div className="text-red-400 text-center py-2">
                                                            지갑 목록을
                                                            불러오는데
                                                            실패했습니다.
                                                        </div>
                                                    ) : !escrowWallets ||
                                                      escrowWallets.length ===
                                                          0 ? (
                                                        <div className="text-blue-300 text-center py-2">
                                                            등록 가능한 지갑이
                                                            없습니다.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <select
                                                                value={
                                                                    selectedWallet
                                                                }
                                                                onChange={(e) =>
                                                                    setSelectedWallet(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full px-4 py-2 rounded-lg bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            >
                                                                <option value="">
                                                                    지갑을
                                                                    선택하세요
                                                                </option>
                                                                {escrowWallets
                                                                    .filter(
                                                                        (
                                                                            wallet
                                                                        ) =>
                                                                            !registeredEscrowWallets?.includes(
                                                                                wallet.address
                                                                            )
                                                                    )
                                                                    .map(
                                                                        (
                                                                            wallet
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    wallet.address
                                                                                }
                                                                                value={
                                                                                    wallet.address
                                                                                }
                                                                            >
                                                                                {
                                                                                    wallet.address
                                                                                }{" "}
                                                                                {wallet.isActive
                                                                                    ? "(활성)"
                                                                                    : "(비활성)"}
                                                                            </option>
                                                                        )
                                                                    )}
                                                            </select>
                                                            <button
                                                                onClick={
                                                                    handleAddEscrowWallet
                                                                }
                                                                disabled={
                                                                    isPendingAddEscrowWalletToSPG ||
                                                                    !selectedWallet
                                                                }
                                                                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                            >
                                                                {isPendingAddEscrowWalletToSPG ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        등록
                                                                        중...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaPlus />
                                                                        선택한
                                                                        지갑
                                                                        등록
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 판매 일정 탭 */}
                                    {activeTab === "schedule" && (
                                        <motion.div
                                            key="schedule"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    {
                                                        label: "사전 예약 시작",
                                                        field: "preOrderStart",
                                                    },
                                                    {
                                                        label: "사전 예약 종료",
                                                        field: "preOrderEnd",
                                                    },
                                                    {
                                                        label: "판매 시작",
                                                        field: "saleStart",
                                                    },
                                                    {
                                                        label: "판매 종료",
                                                        field: "saleEnd",
                                                    },
                                                    {
                                                        label: "글로우 시작",
                                                        field: "glowStart",
                                                    },
                                                    {
                                                        label: "글로우 종료",
                                                        field: "glowEnd",
                                                    },
                                                ].map((item) => (
                                                    <div key={item.field}>
                                                        <label className="block text-blue-200 font-semibold mb-2">
                                                            {item.label}
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={toDatetimeLocalValue(
                                                                form[
                                                                    item.field as keyof SPGForm
                                                                ] as string
                                                            )}
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        [item.field]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 디자인 탭 */}
                                    {activeTab === "design" && (
                                        <motion.div
                                            key="design"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            {/* 썸네일 */}
                                            <div>
                                                <label className="block text-blue-200 font-semibold mb-2">
                                                    썸네일 이미지
                                                </label>
                                                <FileUploader
                                                    bucket="spg"
                                                    multiple={false}
                                                    onComplete={(files) => {
                                                        if (files[0]?.url) {
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                imageUrl:
                                                                    files[0]
                                                                        .url,
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <div className="grid grid-cols-4 gap-3 mt-4">
                                                    {form.imageUrl && (
                                                        <div className="relative group">
                                                            <img
                                                                src={
                                                                    form.imageUrl
                                                                }
                                                                alt="thumbnail"
                                                                className="w-full h-24 object-cover rounded-xl border-2 border-blue-700/50 group-hover:border-cyan-500/50 transition-all duration-200"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 페이지 이미지 */}
                                            <div>
                                                <label className="block text-blue-200 font-semibold mb-2">
                                                    페이지 이미지
                                                </label>
                                                <FileUploader
                                                    bucket="spg"
                                                    multiple={true}
                                                    onComplete={
                                                        handleImagesUpload
                                                    }
                                                />
                                                <div className="grid grid-cols-4 gap-3 mt-4">
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={
                                                            closestCenter
                                                        }
                                                        onDragEnd={(event) => {
                                                            const {
                                                                active,
                                                                over,
                                                            } = event;
                                                            if (
                                                                over &&
                                                                active.id !==
                                                                    over.id
                                                            ) {
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        pageImages:
                                                                            arrayMove(
                                                                                f.pageImages,
                                                                                f.pageImages.findIndex(
                                                                                    (
                                                                                        img
                                                                                    ) =>
                                                                                        img.id ===
                                                                                        active.id
                                                                                ),
                                                                                f.pageImages.findIndex(
                                                                                    (
                                                                                        img
                                                                                    ) =>
                                                                                        img.id ===
                                                                                        over.id
                                                                                )
                                                                            ),
                                                                    })
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <SortableContext
                                                            items={form.pageImages.map(
                                                                (img) => img.id
                                                            )}
                                                            strategy={
                                                                rectSortingStrategy
                                                            }
                                                        >
                                                            {form.pageImages.map(
                                                                (img) => (
                                                                    <SortableItem
                                                                        key={
                                                                            img.id
                                                                        }
                                                                        img={
                                                                            img
                                                                        }
                                                                        onRemove={(
                                                                            id
                                                                        ) =>
                                                                            setForm(
                                                                                (
                                                                                    f
                                                                                ) => ({
                                                                                    ...f,
                                                                                    pageImages:
                                                                                        f.pageImages.filter(
                                                                                            (
                                                                                                i
                                                                                            ) =>
                                                                                                i.id !==
                                                                                                id
                                                                                        ),
                                                                                })
                                                                            )
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </SortableContext>
                                                    </DndContext>
                                                </div>
                                            </div>

                                            {/* 색상 선택 */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-blue-200 font-semibold mb-2">
                                                        배경색
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="color"
                                                            value={
                                                                form.backgroundColor ||
                                                                "#000000"
                                                            }
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        backgroundColor:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-16 h-16 rounded-xl border-2 border-blue-700/50 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={
                                                                form.backgroundColor ||
                                                                "#000000"
                                                            }
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        backgroundColor:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="flex-1 px-4 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-blue-200 font-semibold mb-2">
                                                        전경색
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="color"
                                                            value={
                                                                form.foregroundColor ||
                                                                "#ffffff"
                                                            }
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        foregroundColor:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-16 h-16 rounded-xl border-2 border-blue-700/50 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={
                                                                form.foregroundColor ||
                                                                "#ffffff"
                                                            }
                                                            onChange={(e) =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        foregroundColor:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="flex-1 px-4 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 모달 푸터 */}
                            <div className="p-6 border-t border-blue-800/30 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-3 rounded-xl bg-gray-700/50 text-blue-300 font-semibold hover:bg-gray-700/70 transition-all duration-200"
                                        disabled={
                                            updateSPGUtilsMutationIsPending
                                        }
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold shadow-xl hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                        disabled={
                                            updateSPGUtilsMutationIsPending
                                        }
                                    >
                                        <FaSave />
                                        {updateSPGUtilsMutationIsPending
                                            ? "저장 중..."
                                            : "변경사항 저장"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
