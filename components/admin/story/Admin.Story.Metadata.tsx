/// components/admin/story/Admin.Story.Metadata.tsx

import { useState } from "react";

import { FaDatabase, FaCube, FaImages } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import AdminStoryMetadataIPAsset from "./Admin.Story.Metadata.IPAsset";
import AdminStoryMetadataNFT from "./Admin.Story.Metadata.NFT";
import AdminStoryMetadataSPG from "./Admin.Story.Metadata.SPG";

import type { ipfsType } from "@/app/story/metadata/actions";

interface AdminStoryMetadataProps {
    onBack?: () => void;
}

export default function AdminStoryMetadata({
    onBack,
}: AdminStoryMetadataProps) {
    const [type, setType] = useState<ipfsType | null>(null);

    // NFT 메타데이터 페이지로 전환 시 컴포넌트 렌더링
    if (type === "erc721-metadata") {
        return <AdminStoryMetadataNFT onBack={() => setType(null)} />;
    }

    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-start bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-blue-900/30 overflow-hidden">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[18rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[8rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={onBack}
                    title="뒤로가기"
                >
                    <span className="hidden md:inline">뒤로가기</span>
                </button>
                <h1 className="text-3xl font-bold text-white">
                    메타데이터 관리 센터
                </h1>
                <div />
            </div>

            {/* 타입 선택 화면 */}
            {!type && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-10 z-10">
                    <div className="text-center mb-6">
                        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            어떤 메타데이터를 관리하시겠습니까?
                        </h2>
                        <p className="text-blue-300 text-lg">
                            Story Protocol과 NFT를 위한 다양한 메타데이터를
                            생성하고 관리하세요
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
                        {/* SPG NFT Collection */}
                        <button
                            className="group relative flex flex-col items-center gap-4 px-10 py-8 bg-gradient-to-br from-blue-700/20 via-purple-700/20 to-indigo-700/20 text-white font-bold rounded-2xl shadow-xl hover:scale-105 hover:from-indigo-700/30 hover:to-blue-700/30 transition-all duration-300 text-xl tracking-wide border-2 border-blue-500/30 hover:border-blue-400/50 min-w-[300px] backdrop-blur-sm overflow-hidden"
                            onClick={() =>
                                setType("spg-nft-collection-metadata")
                            }
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10">
                                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <FaDatabase className="text-blue-400 drop-shadow-lg" />
                                </div>
                                <span className="text-2xl mb-3 block">
                                    SPG NFT Collection
                                </span>
                                <span className="text-blue-200 text-base text-center leading-relaxed">
                                    <b className="text-blue-300">
                                        컬렉션 전체 정보
                                    </b>
                                    를 등록합니다.
                                    <br />
                                    <span className="text-sm text-gray-300">
                                        프로젝트/아티스트 이름, 컬렉션 대표
                                        이미지, 설명 등
                                    </span>
                                    <br />
                                    <span className="text-blue-400 text-sm mt-2 inline-block">
                                        Story Protocol 표준(ERC-7572) 컬렉션
                                        메타데이터
                                    </span>
                                </span>
                            </div>

                            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-bl-xl font-normal">
                                컬렉션 정보
                            </div>
                        </button>

                        {/* IP Asset */}
                        <button
                            className="group relative flex flex-col items-center gap-4 px-10 py-8 bg-gradient-to-br from-purple-700/20 via-pink-700/20 to-indigo-700/20 text-white font-bold rounded-2xl shadow-xl hover:scale-105 hover:from-indigo-700/30 hover:to-purple-700/30 transition-all duration-300 text-xl tracking-wide border-2 border-purple-500/30 hover:border-purple-400/50 min-w-[300px] backdrop-blur-sm overflow-hidden"
                            onClick={() => setType("ip-asset-metadata")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10">
                                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <FaCube className="text-purple-400 drop-shadow-lg" />
                                </div>
                                <span className="text-2xl mb-3 block">
                                    IP ASSET 메타데이터
                                </span>
                                <span className="text-purple-200 text-base text-center leading-relaxed">
                                    <b className="text-purple-300">
                                        음원, 이미지 등 개별 IP 자산
                                    </b>
                                    의 상세 정보를 등록합니다.
                                    <br />
                                    <span className="text-sm text-gray-300">
                                        곡/영상/아트워크의 제목, 설명, 미디어
                                        파일, 저작자 등
                                    </span>
                                    <br />
                                    <span className="text-purple-400 text-sm mt-2 inline-block">
                                        Story Protocol IP 자산 메타데이터
                                    </span>
                                </span>
                            </div>

                            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-bl-xl font-normal">
                                IP 자산
                            </div>
                        </button>

                        {/* NFT (ERC721) */}
                        <button
                            className="group relative flex flex-col items-center gap-4 px-10 py-8 bg-gradient-to-br from-orange-700/20 via-red-700/20 to-pink-700/20 text-white font-bold rounded-2xl shadow-xl hover:scale-105 hover:from-pink-700/30 hover:to-orange-700/30 transition-all duration-300 text-xl tracking-wide border-2 border-orange-500/30 hover:border-orange-400/50 min-w-[300px] backdrop-blur-sm overflow-hidden"
                            onClick={() => setType("erc721-metadata")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10">
                                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <FaImages className="text-orange-400 drop-shadow-lg" />
                                </div>
                                <span className="text-2xl mb-3 block">
                                    NFT(ERC721) 메타데이터
                                </span>
                                <span className="text-orange-200 text-base text-center leading-relaxed">
                                    <b className="text-orange-300">
                                        각 NFT(토큰ID별) 고유 정보
                                    </b>
                                    를 등록합니다.
                                    <br />
                                    <span className="text-sm text-gray-300">
                                        NFT 이름, 설명, 이미지, 속성(희소성/등급
                                        등)
                                    </span>
                                    <br />
                                    <span className="text-orange-400 text-sm mt-2 inline-block">
                                        OpenSea 등 마켓플레이스 호환 메타데이터
                                    </span>
                                </span>
                            </div>

                            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-bl-xl font-normal">
                                NFT 정보
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* 폼 화면 */}
            {type === "spg-nft-collection-metadata" && (
                <AdminStoryMetadataSPG onBack={() => setType(null)} />
            )}
            {type === "ip-asset-metadata" && (
                <AdminStoryMetadataIPAsset onBack={() => setType(null)} />
            )}
        </div>
    );
}
