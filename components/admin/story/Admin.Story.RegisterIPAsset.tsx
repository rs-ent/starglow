/// components/admin/story/Admin.Story.RegisterIPAsset.tsx

"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";
import { FaCube, FaRocket, FaFilter, FaSearch } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";
import { keccak256, toHex } from "viem";

import { useToast } from "@/app/hooks/useToast";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { useMetadata } from "@/app/story/metadata/hooks";
import { useStoryNetwork } from "@/app/story/network/hooks";
import { useNFT } from "@/app/story/nft/hooks";

import type { IPAssetMetadata } from "@/app/story/metadata/actions";
import type { Story_nft, ipfs } from "@prisma/client";

export default function AdminStoryRegisterIPAsset({
    onBack,
}: {
    onBack?: () => void;
}) {
    const { data: session } = useSession();
    const toast = useToast();
    const userId = session?.user?.id || "";

    // Hooks
    const {
        nfts: unregisteredNFTs,
        isNFTsLoading,
        isNFTsError,
        nftsError,
        refetchNFTs,

        batchRegisterAsIPAssetAsync,
    } = useNFT({
        getNFTsInput: {
            unregistered: true,
        },
    });
    const { storyNetworks } = useStoryNetwork();
    const { escrowWallets } = useEscrowWallets();
    const {
        metadataList: ipAssetMetadataList,
        isLoadingMetadataList: isLoadingIPAssetMetadata,
    } = useMetadata({
        getMetadataListInput: {
            type: "ip-asset-metadata",
        },
    });

    // State
    const [selectedNFTs, setSelectedNFTs] = useState<Story_nft[]>([]);
    const [selectedIPMetadata, setSelectedIPMetadata] = useState<ipfs | null>(
        null
    );
    const [filterNetwork, setFilterNetwork] = useState<string>("");
    const [filterCollection, setFilterCollection] = useState<string>("");
    const [searchTokenId, setSearchTokenId] = useState<string>("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationProgress, setRegistrationProgress] = useState(0);

    // NFT 필터링
    const filteredNFTs = (unregisteredNFTs || []).filter((nft) => {
        if (filterNetwork && nft.networkId !== filterNetwork) return false;
        if (filterCollection && nft.contractAddress !== filterCollection)
            return false;
        if (searchTokenId && !nft.tokenId.includes(searchTokenId)) return false;
        return true;
    });

    // 고유한 컬렉션 주소 목록
    const uniqueCollections = Array.from(
        new Set((unregisteredNFTs || []).map((nft) => nft.contractAddress))
    );

    // IP Asset 등록 처리
    const handleRegisterIPAsset = async () => {
        if (!selectedNFTs.length || !selectedIPMetadata) {
            toast.error("NFT와 IP 메타데이터를 모두 선택해주세요.");
            return;
        }

        setIsRegistering(true);
        setRegistrationProgress(10);

        try {
            // 지갑 찾기
            const wallet = escrowWallets?.find(
                (w) => w.address === selectedNFTs[0].ownerAddress
            );

            if (!wallet) {
                throw new Error("NFT 소유자 지갑을 찾을 수 없습니다.");
            }

            setRegistrationProgress(30);

            // IP Asset 메타데이터 파싱
            const ipMetadataResponse = await fetch(selectedIPMetadata.url);
            const ipMetadata: IPAssetMetadata = await ipMetadataResponse.json();

            setRegistrationProgress(50);

            // NFT의 tokenURI 가져오기 (이미 저장되어 있음)
            const nftMetadataHashes = selectedNFTs.map((nft) =>
                nft.tokenURI
                    ? keccak256(toHex(nft.tokenURI))
                    : "0x0000000000000000000000000000000000000000000000000000000000000000"
            );

            setRegistrationProgress(70);

            await batchRegisterAsIPAssetAsync({
                userId,
                networkId: selectedNFTs[0].networkId,
                walletAddress: wallet.address,
                nftContract: selectedNFTs[0].contractAddress,
                tokenIds: selectedNFTs.map((nft) => BigInt(nft.tokenId)),
                ipMetadataURI: selectedIPMetadata.url,
                ipMetadataHash: keccak256(toHex(JSON.stringify(ipMetadata))),
                nftMetadataURIs: selectedNFTs.map((nft) => nft.tokenURI || ""),
                nftMetadataHashes: nftMetadataHashes,
            }).catch((err) => {
                console.error(err);
            });

            setRegistrationProgress(100);

            toast.success(
                `NFT #${selectedNFTs[0].tokenId}가 IP Asset으로 등록되었습니다!`
            );

            // 목록 새로고침
            await refetchNFTs();

            // 상태 초기화
            setSelectedNFTs([]);
            setSelectedIPMetadata(null);
        } catch (error: any) {
            console.error("IP Asset 등록 실패:", error);
            toast.error(error?.message || "IP Asset 등록에 실패했습니다.");
        } finally {
            setIsRegistering(false);
            setRegistrationProgress(0);
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            {/* 헤더 */}
            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={onBack}
                    title="뒤로가기"
                >
                    <span className="hidden md:inline">뒤로가기</span>
                </button>
                <h1 className="text-3xl font-bold text-white">IP Asset 등록</h1>
                <div className="w-20" />
            </div>

            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
                {/* 왼쪽: NFT 목록 */}
                <div className="space-y-6">
                    {/* 필터 섹션 */}
                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-6 border border-blue-900/30">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaFilter className="text-blue-400" />
                            미등록 NFT 검색
                        </h3>

                        <div className="space-y-4">
                            {/* 네트워크 필터 */}
                            <div>
                                <label className="block text-blue-200 mb-2 text-sm">
                                    네트워크
                                </label>
                                <select
                                    value={filterNetwork}
                                    onChange={(e) =>
                                        setFilterNetwork(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">모든 네트워크</option>
                                    {Array.isArray(storyNetworks) &&
                                        storyNetworks.map((network) => (
                                            <option
                                                key={network.id}
                                                value={network.id}
                                            >
                                                {network.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* 컬렉션 필터 */}
                            <div>
                                <label className="block text-blue-200 mb-2 text-sm">
                                    컬렉션
                                </label>
                                <select
                                    value={filterCollection}
                                    onChange={(e) =>
                                        setFilterCollection(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">모든 컬렉션</option>
                                    {uniqueCollections.map((address) => (
                                        <option key={address} value={address}>
                                            {address.slice(0, 8)}...
                                            {address.slice(-6)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Token ID 검색 */}
                            <div>
                                <label className="block text-blue-200 mb-2 text-sm">
                                    Token ID 검색
                                </label>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                                    <input
                                        type="text"
                                        value={searchTokenId}
                                        onChange={(e) =>
                                            setSearchTokenId(e.target.value)
                                        }
                                        placeholder="Token ID 입력..."
                                        className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#181c2b] text-white border border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NFT 목록 */}
                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-6 border border-blue-900/30">
                        <h3 className="text-xl font-bold text-white mb-4">
                            미등록 NFT 목록 ({filteredNFTs.length}개)
                        </h3>

                        {isNFTsLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                                <p className="text-blue-200">
                                    NFT 목록을 불러오는 중...
                                </p>
                            </div>
                        ) : isNFTsError ? (
                            <div className="text-center py-8 text-red-400">
                                <p className="text-lg mb-2">
                                    NFT 목록을 불러오는데 실패했습니다.
                                </p>
                                <p className="text-sm">
                                    {nftsError?.message || "알 수 없는 오류"}
                                </p>
                            </div>
                        ) : filteredNFTs.length === 0 ? (
                            <div className="text-center py-8 text-blue-200">
                                <p className="text-lg mb-2">
                                    IP Asset으로 등록되지 않은 NFT가 없습니다.
                                </p>
                                <p className="text-sm text-blue-400">
                                    모든 NFT가 이미 IP Asset으로 등록되었습니다.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {filteredNFTs.map((nft) => (
                                    <button
                                        key={`${nft.contractAddress}-${nft.tokenId}`}
                                        onClick={() =>
                                            setSelectedNFTs((prev) => [
                                                ...prev,
                                                nft,
                                            ])
                                        }
                                        className={`
                                            w-full p-4 rounded-xl border-2 transition-all duration-200
                                            ${
                                                selectedNFTs.some(
                                                    (item) =>
                                                        item.contractAddress ===
                                                            nft.contractAddress &&
                                                        item.tokenId ===
                                                            nft.tokenId
                                                )
                                                    ? "border-purple-400 bg-purple-900/30"
                                                    : "border-blue-800 bg-[#181c2b]/50 hover:border-purple-500/50"
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-left">
                                                <p className="text-white font-bold">
                                                    Token #{nft.tokenId}
                                                </p>
                                                <p className="text-xs text-blue-300 font-mono">
                                                    {nft.contractAddress.slice(
                                                        0,
                                                        8
                                                    )}
                                                    ...
                                                    {nft.contractAddress.slice(
                                                        -6
                                                    )}
                                                </p>
                                                {(nft as any).Story_spg && (
                                                    <p className="text-sm text-purple-300 mt-1">
                                                        {
                                                            (nft as any)
                                                                .Story_spg.name
                                                        }{" "}
                                                        (
                                                        {
                                                            (nft as any)
                                                                .Story_spg
                                                                .symbol
                                                        }
                                                        )
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    소유자:{" "}
                                                    {nft.ownerAddress.slice(
                                                        0,
                                                        6
                                                    )}
                                                    ...
                                                    {nft.ownerAddress.slice(-4)}
                                                </p>
                                            </div>
                                            <FaCube className="text-2xl text-purple-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 오른쪽: IP 메타데이터 선택 및 등록 */}
                <div className="space-y-6">
                    {/* IP 메타데이터 선택 */}
                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-6 border border-blue-900/30">
                        <h3 className="text-xl font-bold text-white mb-4">
                            IP Asset 메타데이터 선택
                        </h3>

                        {isLoadingIPAssetMetadata ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                                <p className="text-blue-200">
                                    메타데이터를 불러오는 중...
                                </p>
                            </div>
                        ) : !ipAssetMetadataList ||
                          ipAssetMetadataList.length === 0 ? (
                            <div className="text-center py-8 text-blue-200">
                                <p>등록된 IP Asset 메타데이터가 없습니다.</p>
                                <button
                                    onClick={() =>
                                        toast.info(
                                            "메타데이터 관리 페이지에서 먼저 등록해주세요."
                                        )
                                    }
                                    className="mt-4 text-green-400 hover:text-green-300 underline"
                                >
                                    메타데이터 등록하러 가기
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                                {ipAssetMetadataList.map((meta) => (
                                    <button
                                        key={meta.id}
                                        onClick={() =>
                                            setSelectedIPMetadata(meta)
                                        }
                                        className={`
                                            p-4 rounded-xl border-2 transition-all duration-200
                                            ${
                                                selectedIPMetadata?.id ===
                                                meta.id
                                                    ? "border-green-400 bg-green-900/30"
                                                    : "border-blue-800 bg-[#181c2b]/50 hover:border-green-500/50"
                                            }
                                        `}
                                    >
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">
                                                📄
                                            </div>
                                            <p className="text-xs text-green-200 font-mono truncate">
                                                {meta.cid.slice(0, 8)}...
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 등록 정보 요약 */}
                    {selectedNFTs.length > 0 && selectedIPMetadata && (
                        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">
                                등록 정보 요약
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-purple-300">
                                        NFTs:
                                    </span>
                                    <span className="text-white ml-2">
                                        {selectedNFTs
                                            .map(
                                                (nft) => `Token #${nft.tokenId}`
                                            )
                                            .join(", ")}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-purple-300">
                                        컨트랙트:
                                    </span>
                                    <span className="text-white ml-2 font-mono text-xs">
                                        {selectedNFTs
                                            .map((nft) => nft.contractAddress)
                                            .join(", ")}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-purple-300">
                                        IP 메타데이터:
                                    </span>
                                    <span className="text-white ml-2 font-mono text-xs">
                                        {selectedIPMetadata.cid.slice(0, 12)}...
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 등록 버튼 */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleRegisterIPAsset}
                            disabled={
                                !selectedNFTs.length ||
                                !selectedIPMetadata ||
                                isRegistering
                            }
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                                flex items-center justify-center gap-3
                                ${
                                    selectedNFTs.length > 0 &&
                                    selectedIPMetadata &&
                                    !isRegistering
                                        ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:scale-105 shadow-lg hover:shadow-purple-500/50"
                                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                }
                            `}
                        >
                            {isRegistering ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                    <span>등록 중...</span>
                                </>
                            ) : (
                                <>
                                    <FaRocket />
                                    <span>IP Asset으로 등록하기</span>
                                </>
                            )}
                        </button>

                        {/* 진행률 표시 */}
                        {isRegistering && registrationProgress > 0 && (
                            <div className="w-full bg-blue-900/20 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{
                                        width: `${registrationProgress}%`,
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
