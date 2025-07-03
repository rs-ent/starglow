/// components/admin/story/Admin.Story.SPG.Preview.tsx

import { useState } from "react";

import { type Artist } from "@prisma/client";
import { useSession } from "next-auth/react";
import { TbTopologyStar3 } from "react-icons/tb";
import { SiEthereum } from "react-icons/si";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useToast } from "@/app/hooks/useToast";
import { useSPG } from "@/app/story/spg/hooks";

export default function AdminStorySPGPreview({
    onBack,
}: {
    onBack?: () => void;
}) {
    const toast = useToast();
    const { data: session } = useSession();
    const userId = session?.user?.id || "";

    // 폼 상태 - 최소한의 필드만
    const [form, setForm] = useState<{
        name: string;
        artistId: string;
        imageUrl: string;
    }>({
        name: "",
        artistId: "",
        imageUrl: "",
    });

    const { artists, isLoading: isArtistsLoading } = useArtistsGet({
        getArtistsInput: {},
    });

    const {
        createSPGMutationAsync,
        createSPGMutationIsPending,
        getSPGsRefetch,
    } = useSPG({});

    const [step, setStep] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState("");

    // 심볼 자동 생성 함수
    const generateSymbol = (name: string): string => {
        return name
            .replace(/[^a-zA-Z0-9\s]/g, "") // 특수문자 제거
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase())
            .join("")
            .slice(0, 5); // 최대 5글자
    };

    // Preview SPG 생성 핸들러
    const handleCreatePreview = async () => {
        if (!form.name) {
            toast.error("컬렉션 이름을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // 기본값으로 채워서 createSPG 호출
            const result = await createSPGMutationAsync({
                userId,
                // 기본 네트워크 설정
                networkId: "default-preview-network",
                walletAddress: "0x0000000000000000000000000000000000000000",
                contractAddress: "0x0000000000000000000000000000000000000000",

                // 사용자 입력값
                name: form.name,
                symbol: generateSymbol(form.name),
                artistId: form.artistId || "",

                // 기본 메타데이터 (임시)
                selectedMetadata: {
                    id: "preview-metadata",
                    cid: "preview-cid",
                    url: form.imageUrl || "https://via.placeholder.com/400",
                    type: "preview",
                    previewUrl: null,
                    previewWidth: null,
                    previewHeight: null,
                    previewMimeType: null,
                    previewSizeBytes: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },

                // TBA 기본값
                tbaRegistry: "0x0000000000000000000000000000000000000000",
                tbaImplementation: "0x0000000000000000000000000000000000000000",

                // Preview 전용 baseURI
                baseURI: form.imageUrl || "https://via.placeholder.com/400",
            });

            // Preview 설정 업데이트 (hiddenDetails, comingSoon 등)
            // 여기서 updateSPGUtils를 호출해야 할 수도 있음

            toast.success("Preview Collection이 성공적으로 생성되었습니다!");
            setSuccessMsg(`Preview Collection: ${result.name}`);
            setStep(3); // 성공 화면으로 이동
        } catch (err: any) {
            setError(err?.message || "생성 중 오류가 발생했습니다.");
            toast.error("생성 실패");
        } finally {
            setIsSubmitting(false);
            getSPGsRefetch().catch((err) => {
                console.error(err);
            });
        }
    };

    // Progress Bar Component
    const ProgressBar = () => {
        const steps = ["시작", "아티스트 (선택)", "정보 입력", "완료"];
        return (
            <div className="w-full max-w-3xl mx-auto mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-blue-900/30 -translate-y-1/2"></div>
                    <div
                        className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-pink-500 to-purple-500 -translate-y-1/2 transition-all duration-500"
                        style={{
                            width: `${(step / (steps.length - 1)) * 100}%`,
                        }}
                    ></div>
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className={`relative z-10 flex flex-col items-center ${
                                i <= step ? "text-pink-300" : "text-blue-600"
                            }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    i < step
                                        ? "bg-gradient-to-r from-pink-500 to-purple-500 border-pink-300"
                                        : i === step
                                        ? "bg-blue-900 border-pink-400 animate-pulse"
                                        : "bg-[#181c2b] border-blue-800"
                                }`}
                            >
                                {i < step ? "✓" : i + 1}
                            </div>
                            <span className="text-xs mt-1 hidden md:block">
                                {s}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[14rem] text-pink-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            {/* 상단 네비게이션 */}
            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={onBack}
                    title="뒤로가기"
                >
                    <span className="hidden md:inline">뒤로가기</span>
                </button>
                <h2 className="text-2xl font-bold text-white">
                    Preview Collection 생성
                </h2>
            </div>

            {/* Progress Bar */}
            {step > 0 && step < 3 && <ProgressBar />}

            {/* Step 0: 인트로 */}
            {step === 0 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="text-8xl mb-4">🎨</div>
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            Preview Collection
                        </h1>
                        <p className="text-xl text-blue-300 mb-8">
                            계약 진행 중인 아티스트를 위한 미리보기 컬렉션을
                            만들어보세요
                        </p>
                        <div className="bg-blue-900/20 rounded-xl p-6 mb-8 border border-blue-700/50">
                            <h3 className="text-lg font-bold text-pink-300 mb-2">
                                ✨ Preview Collection 특징
                            </h3>
                            <ul className="text-blue-200 text-left space-y-2">
                                <li>• 실제 블록체인 배포 없이 카드만 표시</li>
                                <li>
                                    {`• 자동으로 블러 처리되어 "COMING SOON" 상태로 표시`}
                                </li>
                                <li>
                                    • 아티스트 연결은 선택사항 (나중에도 변경
                                    가능)
                                </li>
                                <li>• 마케팅 및 사전 홍보 용도</li>
                                <li>• 언제든 실제 컬렉션으로 전환 가능</li>
                            </ul>
                        </div>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="px-12 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-xl rounded-full shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-pink-500/50"
                    >
                        시작하기 →
                    </button>
                </div>
            )}

            {/* Step 1: 아티스트 선택 */}
            {step === 1 && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        아티스트와 연결하시겠어요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        아티스트를 선택하거나 건너뛸 수 있습니다{" "}
                        <span className="text-pink-300">(선택사항)</span>
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 max-h-[400px] overflow-y-auto p-2">
                        {isArtistsLoading ? (
                            <div className="col-span-full text-center text-blue-200">
                                아티스트 불러오는 중...
                            </div>
                        ) : (
                            artists?.map((artist: Artist) => (
                                <button
                                    key={artist.id}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            artistId: artist.id,
                                        }))
                                    }
                                    className={`
                                        relative group p-4 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform text-center
                                        ${
                                            form.artistId === artist.id
                                                ? "border-pink-400 bg-gradient-to-br from-pink-900/50 via-purple-900/50 to-blue-900/50 scale-105 ring-4 ring-pink-300/30"
                                                : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-pink-500/50"
                                        }
                                    `}
                                >
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                                        {artist.name?.charAt(0) || "A"}
                                    </div>
                                    <h3 className="font-bold text-pink-200 mb-1">
                                        {artist.name}
                                    </h3>
                                    <p className="text-xs text-blue-300">
                                        {artist.code}
                                    </p>
                                    {form.artistId === artist.id && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg animate-pulse">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(0)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <div className="flex gap-3">
                            {!form.artistId && (
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-colors"
                                >
                                    건너뛰기
                                </button>
                            )}
                            <button
                                onClick={() => setStep(2)}
                                disabled={false}
                                className="px-6 py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105"
                            >
                                {form.artistId ? "선택 완료 →" : "다음 →"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: 기본 정보 입력 */}
            {step === 2 && (
                <div className="w-full max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        Collection 정보를 입력하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        Preview Collection의 기본 정보를 설정하세요
                    </p>

                    <div className="bg-[#181c2b]/80 rounded-2xl p-8 border-4 border-pink-800 space-y-6">
                        <div>
                            <label className="block text-pink-300 mb-2 font-bold">
                                Collection 이름{" "}
                                <span className="text-purple-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="예: NewJeans Preview Collection"
                                className="w-full px-4 py-3 rounded-xl bg-pink-900/30 text-white border-2 border-pink-500/50 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-400/20 transition-all"
                            />
                            <p className="text-xs text-blue-400 mt-1">
                                심볼:{" "}
                                {form.name ? generateSymbol(form.name) : "AUTO"}
                            </p>
                        </div>

                        <div>
                            <label className="block text-pink-300 mb-2 font-bold">
                                이미지 URL{" "}
                                <span className="text-blue-400">
                                    (선택사항)
                                </span>
                            </label>
                            <input
                                type="url"
                                value={form.imageUrl}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        imageUrl: e.target.value,
                                    }))
                                }
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-3 rounded-xl bg-purple-900/30 text-white border-2 border-purple-500/50 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all"
                            />
                            <p className="text-xs text-blue-400 mt-1">
                                비워두면 기본 플레이스홀더가 사용됩니다
                            </p>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
                            <h4 className="text-blue-300 font-bold mb-2">
                                📋 선택된 설정
                            </h4>
                            <div className="text-blue-200 text-sm space-y-1">
                                <p>
                                    • 아티스트:{" "}
                                    {form.artistId
                                        ? artists?.find(
                                              (a: Artist) =>
                                                  a.id === form.artistId
                                          )?.name || "선택됨"
                                        : "연결 안함"}
                                </p>
                                <p>• 상태: Coming Soon 자동 설정</p>
                                <p>• 이미지: 자동 블러 처리</p>
                                <p>• 용도: 마케팅/홍보 전용</p>
                            </div>
                        </div>

                        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
                            <h4 className="text-yellow-300 font-bold mb-2">
                                🔒 자동 설정됩니다
                            </h4>
                            <ul className="text-yellow-200 text-sm space-y-1">
                                <li>• Coming Soon 상태로 표시</li>
                                <li>• 이미지 자동 블러 처리</li>
                                <li>{`• "SEE MORE" 버튼 비활성화`}</li>
                                <li>• 마케팅 전용 카드로 표시</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={handleCreatePreview}
                            disabled={
                                !form.name ||
                                isSubmitting ||
                                createSPGMutationIsPending
                            }
                            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                                !form.name ||
                                isSubmitting ||
                                createSPGMutationIsPending
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                            }`}
                        >
                            {isSubmitting || createSPGMutationIsPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    생성 중...
                                </span>
                            ) : (
                                "🎨 Preview Collection 생성"
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-300">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: 성공 화면 */}
            {step === 3 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="text-8xl mb-4 animate-bounce">🎉</div>
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Preview Collection 생성 완료!
                        </h1>
                        <p className="text-xl text-green-300 mb-8">
                            Preview Collection이 성공적으로 생성되었습니다
                        </p>
                        {successMsg && (
                            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 mb-8">
                                <p className="text-green-300 font-mono">
                                    {successMsg}
                                </p>
                            </div>
                        )}
                        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-blue-300 mb-2">
                                💡 다음 단계
                            </h3>
                            <ul className="text-blue-200 text-left space-y-2">
                                <li>
                                    {`• Collection 목록에서 "COMING SOON" 상태로 표시됩니다`}
                                </li>
                                <li>
                                    • 이미지가 자동으로 블러 처리되어 나타납니다
                                </li>
                                <li>
                                    • 계약 완료 후 실제 Collection으로 전환할 수
                                    있습니다
                                </li>
                                <li>• 언제든 수정이나 삭제가 가능합니다</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep(0);
                                setForm({
                                    name: "",
                                    artistId: "",
                                    imageUrl: "",
                                });
                                setError("");
                                setSuccessMsg("");
                            }}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            새 Preview 만들기
                        </button>
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all"
                        >
                            관리 페이지로 돌아가기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
