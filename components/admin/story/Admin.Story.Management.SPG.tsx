/// components/admin/story/Admin.Story.Management.SPG.tsx

import { useEffect, useState } from "react";
import { useSPG } from "@/app/story/spg/hooks";
import FileUploader from "@/components/atoms/FileUploader";
import { TbTopologyStar3 } from "react-icons/tb";
import { SiEthereum } from "react-icons/si";
import { fetchURI } from "@/app/story/metadata/actions";

// SPG 컬렉션 필수 필드 타입
interface SPGForm {
    address: string;
    contractURI?: string;
    isListed?: boolean;
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
}

function CollectionThumbnail({
    contractURI,
    fallback,
}: {
    contractURI?: string;
    fallback?: string;
}) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        async function fetchImage() {
            if (!contractURI) return;
            try {
                const metadata = await fetchURI({ uri: contractURI });
                if (!ignore) setImageUrl(metadata?.image || null);
            } catch {
                if (!ignore) setImageUrl(null);
            }
        }
        fetchImage();
        return () => {
            ignore = true;
        };
    }, [contractURI]);

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt="thumbnail"
                className="w-24 h-24 object-cover rounded-xl border-2 border-blue-800 shadow-lg bg-[#181c2b]"
            />
        );
    }
    if (fallback) {
        return (
            <img
                src={fallback}
                alt="thumbnail"
                className="w-24 h-24 object-cover rounded-xl border-2 border-blue-800 shadow-lg bg-[#181c2b]"
            />
        );
    }
    return (
        <div className="w-24 h-24 rounded-xl bg-blue-900/30 flex items-center justify-center text-4xl text-blue-700 border-2 border-blue-800">
            📦
        </div>
    );
}

function kstInputToUTC(val?: string) {
    if (!val) return undefined;
    // val: "2025-04-01T17:00" (KST)
    const date = new Date(val);
    // 9시간 빼기
    date.setHours(date.getHours() - 9);
    return date.toISOString();
}

function utcToKSTInput(dt?: string) {
    if (!dt) return "";
    const date = new Date(dt);
    // 9시간 더하기
    date.setHours(date.getHours() + 9);
    return date.toISOString().slice(0, 16);
}

export default function AdminStoryManagementSPG({
    onBack,
}: {
    onBack: () => void;
}) {
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
        getSPGsInput: {
            // 전체 목록 (isListed만 true로 제한하지 않음)
        },
    });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<SPGForm>({
        address: "",
        contractURI: "",
        isListed: false,
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
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleSave = async () => {
        await updateSPGUtilsMutationAsync({
            ...form,
            preOrderStart: kstInputToUTC(form.preOrderStart),
            preOrderEnd: kstInputToUTC(form.preOrderEnd),
            saleStart: kstInputToUTC(form.saleStart),
            saleEnd: kstInputToUTC(form.saleEnd),
            glowStart: kstInputToUTC(form.glowStart),
            glowEnd: kstInputToUTC(form.glowEnd),
            pageImages: form.pageImages.map((img) => img.url),
        });
    };

    // pageImages 업로드 핸들러
    const handleImagesUpload = (files: { id: string; url: string }[]) => {
        setForm((prev) => ({
            ...prev,
            pageImages: files,
        }));
    };

    // 카드형 컬렉션 목록 렌더러
    const renderCollectionCard = (spg: any) => (
        <div
            key={spg.address}
            className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl shadow-xl border border-blue-900/30 p-5 flex flex-col gap-3 hover:scale-[1.02] transition-all duration-200 relative group"
        >
            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={onBack}
                    title="뒤로가기"
                >
                    <span className="hidden md:inline">뒤로가기</span>
                </button>
                <h1 className="text-3xl font-bold text-white">
                    SPG 컬렉션 관리 센터
                </h1>
                <div />
            </div>
            {/* 썸네일 */}
            <div className="w-full flex justify-center items-center mb-2">
                <CollectionThumbnail
                    contractURI={spg.contractURI}
                    fallback={spg.pageImages?.[0]}
                />
            </div>
            {/* 컬렉션명/네트워크 */}
            <div className="flex flex-col items-center gap-1">
                <div className="text-lg font-bold text-cyan-300 truncate w-full text-center">
                    {spg.name || spg.address.slice(0, 8) + "..."}
                </div>
                <div className="text-xs text-blue-400 font-mono truncate w-full text-center">
                    {spg.address}
                </div>
            </div>
            {/* 상태/가격/기간 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                        spg.isListed
                            ? "bg-green-500/20 text-green-300"
                            : "bg-gray-700/40 text-gray-300"
                    }`}
                >
                    {spg.isListed ? "Listed" : "Unlisted"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-900/30 text-blue-200 font-bold">
                    {spg.price}$
                </span>
                {spg.saleStart && (
                    <span className="px-3 py-1 rounded-full text-xs bg-purple-900/30 text-purple-200">
                        {new Date(spg.saleStart).toLocaleDateString()} ~
                        {spg.saleEnd
                            ? " " + new Date(spg.saleEnd).toLocaleDateString()
                            : ""}
                    </span>
                )}
            </div>
            {/* 수정 버튼 */}
            <button
                className="mt-4 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-bold shadow hover:scale-105 transition-all"
                onClick={() => {
                    setForm({
                        address: spg.address,
                        isListed: spg.isListed,
                        preOrderStart: spg.preOrderStart
                            ? new Date(spg.preOrderStart)
                                  .toISOString()
                                  .slice(0, 16)
                            : "",
                        preOrderEnd: spg.preOrderEnd
                            ? new Date(spg.preOrderEnd)
                                  .toISOString()
                                  .slice(0, 16)
                            : "",
                        saleStart: spg.saleStart
                            ? new Date(spg.saleStart).toISOString().slice(0, 16)
                            : "",
                        saleEnd: spg.saleEnd
                            ? new Date(spg.saleEnd).toISOString().slice(0, 16)
                            : "",
                        glowStart: spg.glowStart
                            ? new Date(spg.glowStart).toISOString().slice(0, 16)
                            : "",
                        glowEnd: spg.glowEnd
                            ? new Date(spg.glowEnd).toISOString().slice(0, 16)
                            : "",
                        price: spg.price,
                        circulation: spg.circulation,
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
                    });
                    setShowForm(true);
                }}
            >
                수정
            </button>
        </div>
    );

    return (
        <div className="relative w-full min-h-[80vh] flex flex-col items-center justify-start bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-blue-900/30 overflow-hidden">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            {/* 상단 Hero 타이틀 */}
            <div className="w-full flex flex-col items-center mb-10 z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3 mb-2">
                    SPG 컬렉션 <span className="text-blue-400">관리</span>
                </h1>
                <p className="text-lg text-blue-300 max-w-2xl text-center">
                    Story Protocol Gateway NFT 컬렉션의 상태, 기간, 가격, 이미지
                    등 주요 정보를 한눈에 관리하세요.
                </p>
            </div>

            {/* 목록 */}
            <div className="w-full max-w-6xl z-10">
                {getSPGsIsLoading ? (
                    <div className="text-blue-200 py-16 text-center text-xl animate-pulse">
                        컬렉션 불러오는 중...
                    </div>
                ) : getSPGsIsError ? (
                    <div className="text-red-400 py-16 text-center text-xl">
                        {getSPGsError?.message || "목록을 불러오지 못했습니다."}
                    </div>
                ) : !getSPGsData || getSPGsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="text-7xl mb-4 opacity-30">📭</div>
                        <div className="text-blue-200 text-xl mb-2">
                            아직 등록된 SPG 컬렉션이 없습니다.
                        </div>
                        <div className="text-blue-400">
                            컬렉션이 배포되면 이곳에서 관리할 수 있습니다.
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 모바일: 카드형 */}
                        <div className="grid grid-cols-1 gap-6 md:hidden">
                            {getSPGsData.map(renderCollectionCard)}
                        </div>
                        {/* 데스크탑: 테이블형 */}
                        <div className="hidden md:block">
                            <div className="overflow-x-auto rounded-xl shadow-lg bg-[#23243a]/60">
                                <table className="min-w-full text-sm text-blue-100">
                                    <thead>
                                        <tr className="bg-[#23243a]/80 text-blue-300 divide-x divide-blue-900/30">
                                            <th className="px-4 py-3 text-center">
                                                썸네일
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                컬렉션명
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                address
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                isListed
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                price
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                기간
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getSPGsData.map((spg: any) => (
                                            <tr
                                                key={spg.address}
                                                className="border-b border-blue-900/30 hover:bg-blue-900/10 transition divide-x divide-blue-900/30"
                                            >
                                                <td className="px-4 py-2 text-center">
                                                    <CollectionThumbnail
                                                        contractURI={
                                                            spg.contractURI
                                                        }
                                                        fallback={
                                                            spg.pageImages?.[0]
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center font-bold text-cyan-200">
                                                    {spg.name ||
                                                        spg.address.slice(
                                                            0,
                                                            8
                                                        ) + "..."}
                                                </td>
                                                <td className="px-4 py-2 text-center font-mono text-xs max-w-[160px] truncate">
                                                    {spg.address}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            spg.isListed
                                                                ? "bg-green-500/20 text-green-300"
                                                                : "bg-gray-700/40 text-gray-300"
                                                        }`}
                                                    >
                                                        {spg.isListed
                                                            ? "Listed"
                                                            : "Unlisted"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="px-3 py-1 rounded-full text-xs bg-blue-900/30 text-blue-200 font-bold">
                                                        {spg.price}$
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center text-xs">
                                                    {spg.saleStart ? (
                                                        <span>
                                                            {new Date(
                                                                spg.saleStart
                                                            ).toLocaleDateString()}{" "}
                                                            ~
                                                            {spg.saleEnd
                                                                ? " " +
                                                                  new Date(
                                                                      spg.saleEnd
                                                                  ).toLocaleDateString()
                                                                : ""}
                                                        </span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-bold shadow hover:scale-105 transition-all"
                                                        onClick={() => {
                                                            setForm({
                                                                address:
                                                                    spg.address,
                                                                isListed:
                                                                    spg.isListed,
                                                                preOrderStart:
                                                                    spg.preOrderStart
                                                                        ? new Date(
                                                                              spg.preOrderStart
                                                                          )
                                                                              .toISOString()
                                                                              .slice(
                                                                                  0,
                                                                                  16
                                                                              )
                                                                        : "",
                                                                preOrderEnd:
                                                                    spg.preOrderEnd
                                                                        ? new Date(
                                                                              spg.preOrderEnd
                                                                          )
                                                                              .toISOString()
                                                                              .slice(
                                                                                  0,
                                                                                  16
                                                                              )
                                                                        : "",
                                                                saleStart:
                                                                    spg.saleStart
                                                                        ? new Date(
                                                                              spg.saleStart
                                                                          )
                                                                              .toISOString()
                                                                              .slice(
                                                                                  0,
                                                                                  16
                                                                              )
                                                                        : "",
                                                                saleEnd:
                                                                    spg.saleEnd
                                                                        ? new Date(
                                                                              spg.saleEnd
                                                                          )
                                                                              .toISOString()
                                                                              .slice(
                                                                                  0,
                                                                                  16
                                                                              )
                                                                        : "",
                                                                glowStart:
                                                                    spg.glowStart
                                                                        ? new Date(
                                                                              spg.glowStart
                                                                          )
                                                                              .toISOString()
                                                                              .slice(
                                                                                  0,
                                                                                  16
                                                                              )
                                                                        : "",
                                                                glowEnd:
                                                                    spg.glowEnd
                                                                        ? new Date(
                                                                              spg.glowEnd
                                                                          )
                                                                              .toISOString()
                                                                              .slice(
                                                                                  0,
                                                                                  16
                                                                              )
                                                                        : "",
                                                                price: spg.price,
                                                                circulation:
                                                                    spg.circulation,
                                                                pageImages:
                                                                    Array.isArray(
                                                                        spg.pageImages
                                                                    )
                                                                        ? spg.pageImages.map(
                                                                              (
                                                                                  url: string,
                                                                                  idx: number
                                                                              ) => ({
                                                                                  id: String(
                                                                                      idx
                                                                                  ),
                                                                                  url,
                                                                              })
                                                                          )
                                                                        : [],
                                                                backgroundColor:
                                                                    spg.backgroundColor ||
                                                                    "",
                                                                foregroundColor:
                                                                    spg.foregroundColor ||
                                                                    "",
                                                                name: spg.name,
                                                                artistId:
                                                                    spg.artistId,
                                                                networkId:
                                                                    spg.networkId,
                                                            });
                                                            setShowForm(true);
                                                        }}
                                                    >
                                                        수정
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 수정 슬라이드오버/모달 */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end bg-black/40 backdrop-blur-sm transition-all">
                    {/* 슬라이드오버 패널 */}
                    <div className="w-full md:w-[1280px] h-[90vh] md:h-full bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-t-3xl md:rounded-l-3xl md:rounded-t-none shadow-2xl border-l-4 border-blue-900/40 p-0 flex flex-col relative animate-slideInRight">
                        {/* 닫기 버튼 */}
                        <button
                            className="absolute top-4 right-4 text-blue-300 hover:text-white text-3xl z-20"
                            onClick={() => setShowForm(false)}
                            aria-label="닫기"
                        >
                            ×
                        </button>
                        {/* 상단: 썸네일/이름/상태 */}
                        <div className="flex flex-col items-center gap-2 pt-8 pb-4 px-8 border-b border-blue-900/30 bg-[#23243a]/60 rounded-t-3xl">
                            <div className="w-20 h-20 rounded-2xl bg-blue-900/30 flex items-center justify-center mb-2 border-2 border-blue-800 shadow-lg overflow-hidden">
                                <CollectionThumbnail
                                    contractURI={form.contractURI}
                                    fallback={form.pageImages?.[0]?.url}
                                />
                            </div>
                            <div className="text-2xl font-extrabold text-cyan-200 text-center truncate w-full">
                                {form.name || form.address.slice(0, 8) + "..."}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        form.isListed
                                            ? "bg-green-500/20 text-green-300"
                                            : "bg-gray-700/40 text-gray-300"
                                    }`}
                                >
                                    {form.isListed ? "Listed" : "Unlisted"}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs bg-blue-900/30 text-blue-200 font-bold">
                                    {form.price}$
                                </span>
                            </div>
                        </div>
                        {/* 폼 본문 */}
                        <form
                            className="flex-1 flex flex-col gap-6 px-8 py-6 overflow-y-auto"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                await handleSave();
                                setShowForm(false);
                            }}
                        >
                            {/* isListed 토글 */}
                            <div className="flex items-center gap-4">
                                <label className="text-blue-200 font-bold text-lg">
                                    isListed
                                </label>
                                <button
                                    type="button"
                                    className={`w-12 h-7 rounded-full flex items-center transition-colors duration-200 ${
                                        form.isListed
                                            ? "bg-green-400/60"
                                            : "bg-gray-600/60"
                                    }`}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            isListed: !f.isListed,
                                        }))
                                    }
                                >
                                    <span
                                        className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                            form.isListed
                                                ? "translate-x-5"
                                                : "translate-x-0"
                                        }`}
                                    ></span>
                                </button>
                                <span className="text-blue-400 text-sm">
                                    {form.isListed ? "공개됨" : "비공개"}
                                </span>
                            </div>
                            {/* 날짜/기간 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        preOrderStart
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={utcToKSTInput(
                                            form.preOrderStart
                                        )}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                preOrderStart: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        preOrderEnd
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={utcToKSTInput(form.preOrderEnd)}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                preOrderEnd: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        saleStart
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={utcToKSTInput(form.saleStart)}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                saleStart: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        saleEnd
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={utcToKSTInput(form.saleEnd)}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                saleEnd: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        glowStart
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={utcToKSTInput(form.glowStart)}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                glowStart: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        glowEnd
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={utcToKSTInput(form.glowEnd)}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                glowEnd: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            </div>
                            {/* 가격/수량 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        price
                                    </label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                price: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        circulation
                                    </label>
                                    <input
                                        type="number"
                                        value={form.circulation}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                circulation: Number(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        className="w-full rounded-xl px-3 py-2 bg-blue-900/30 text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                            {/* 이미지 업로드 */}
                            <div>
                                <label className="text-blue-200 font-bold mb-2 block">
                                    pageImages
                                </label>
                                <FileUploader
                                    bucket="spg"
                                    multiple={true}
                                    onComplete={handleImagesUpload}
                                />
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {form.pageImages.map((img) => (
                                        <img
                                            key={img.id}
                                            src={img.url}
                                            alt="page"
                                            className="w-16 h-16 object-cover rounded border-2 border-blue-800 shadow-md transition-transform hover:scale-110"
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* 컬러 선택 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        backgroundColor
                                    </label>
                                    <input
                                        type="color"
                                        value={
                                            form.backgroundColor || "#000000"
                                        }
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                backgroundColor: e.target.value,
                                            }))
                                        }
                                        className="w-12 h-8 p-0 border-none bg-transparent rounded-xl shadow"
                                    />
                                </div>
                                <div>
                                    <label className="text-blue-200 font-semibold">
                                        foregroundColor
                                    </label>
                                    <input
                                        type="color"
                                        value={
                                            form.foregroundColor || "#ffffff"
                                        }
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                foregroundColor: e.target.value,
                                            }))
                                        }
                                        className="w-12 h-8 p-0 border-none bg-transparent rounded-xl shadow"
                                    />
                                </div>
                            </div>
                        </form>
                        {/* 하단 고정 버튼 */}
                        <div className="w-full px-8 pb-6 pt-2 flex gap-3 justify-end bg-gradient-to-t from-[#23243a]/80 to-transparent rounded-b-3xl border-t border-blue-900/20">
                            <button
                                type="button"
                                className="px-6 py-3 rounded-xl bg-gray-700 text-blue-200 font-bold hover:bg-gray-600 transition"
                                onClick={() => setShowForm(false)}
                                disabled={updateSPGUtilsMutationIsPending}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                form=""
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={updateSPGUtilsMutationIsPending}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await handleSave();
                                    setShowForm(false);
                                }}
                            >
                                {updateSPGUtilsMutationIsPending
                                    ? "저장 중..."
                                    : "저장"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
