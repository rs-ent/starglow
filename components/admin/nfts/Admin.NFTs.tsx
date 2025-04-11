/// components\admin\nfts\Admin.NFTs.tsx

"use client";

import { useState } from "react";
import {
    useCollectionFactory,
    type CreateCollectionParams,
} from "@/app/hooks/useCollectionFactory";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    CheckCircle,
    AlertCircle,
    Calculator,
    RefreshCw,
    Wallet,
} from "lucide-react";
import { parseGwei } from "viem";
import { Slider } from "@/components/ui/slider";
import MetaMaskButton from "@/components/atoms/MetaMaskButton";

export default function AdminNFTs() {
    // 지갑 연결 상태 관리
    const [connectedAddress, setConnectedAddress] = useState<string | null>(
        null
    );

    // 폼 상태 관리
    const [formData, setFormData] = useState<CreateCollectionParams>({
        name: "",
        symbol: "",
        maxSupply: 10000,
        mintPrice: 0,
        baseURI: "https://api.example.com/metadata/",
        contractURI: "https://api.example.com/collection",
    });

    // 가스비 조절용 상태
    const [customGasPrice, setCustomGasPrice] = useState<number | null>(null);
    const [showGasEstimate, setShowGasEstimate] = useState(false);

    // 훅 사용
    const {
        createCollection,
        isPending,
        isSuccess,
        isError,
        error,
        transactionHash,
        isConfirming,
        isConfirmed,
        collections,
        isLoading,
        // 가스 관련
        estimateGas,
        estimatedGasAmount,
        isEstimating,
        gasPrice,
        gasPriceInGwei,
        gasFeeInEth,
        // 트랜잭션 시간 예측 관련 필드
        estimatedTimeText,
        networkCongestion,
    } = useCollectionFactory();

    // 입력 필드 변경 처리
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]:
                name === "maxSupply"
                    ? parseInt(value)
                    : name === "mintPrice"
                    ? parseFloat(value)
                    : value,
        });
    };

    // 지갑 연결 시 호출되는 함수
    const handleConnect = (address: string) => {
        setConnectedAddress(address);
        console.log("Connected to wallet:", address);
    };

    // 지갑 연결 해제 시 호출되는 함수
    const handleDisconnect = () => {
        setConnectedAddress(null);
        console.log("Disconnected from wallet");
    };

    // 가스비 예측
    const handleEstimateGas = async () => {
        if (!connectedAddress) {
            alert("먼저 MetaMask 지갑을 연결해주세요.");
            return;
        }

        setShowGasEstimate(true);
        await estimateGas(formData);
    };

    // 가스 가격 변경 처리
    const handleGasPriceChange = (value: number[]) => {
        setCustomGasPrice(value[0]);
    };

    // 폼 제출 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!connectedAddress) {
            alert("먼저 MetaMask 지갑을 연결해주세요.");
            return;
        }

        try {
            // 사용자 지정 가스 가격이 있는 경우 설정
            const params = { ...formData };
            if (customGasPrice !== null && gasPrice) {
                // 가스 가격 조정 (배율로 조정)
                params.gasPrice =
                    (BigInt(Math.round(customGasPrice * 100)) * gasPrice) /
                    BigInt(100);
            }
            await createCollection(params);
        } catch (err) {
            console.error("컬렉션 생성 중 오류:", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">NFT 컬렉션 관리</h3>
                    <p className="text-sm text-muted-foreground">
                        새로운 NFT 컬렉션을 생성하고 관리하세요.
                    </p>
                </div>

                {/* MetaMask 지갑 연결 버튼 */}
                <MetaMaskButton
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 컬렉션 생성 폼 */}
                <Card>
                    <CardHeader>
                        <CardTitle>새 NFT 컬렉션 생성</CardTitle>
                        <CardDescription>
                            블록체인에 새로운 NFT 컬렉션을 배포합니다.
                            {!connectedAddress && (
                                <div className="mt-2 text-amber-600 flex items-center gap-1 text-xs">
                                    <Wallet className="h-3 w-3" />
                                    <span>
                                        지갑을 연결해야 트랜잭션을 보낼 수
                                        있습니다
                                    </span>
                                </div>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">컬렉션 이름</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="My Awesome NFT"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="symbol">토큰 심볼</Label>
                                <Input
                                    id="symbol"
                                    name="symbol"
                                    placeholder="NFT"
                                    value={formData.symbol}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxSupply">
                                        최대 발행량
                                    </Label>
                                    <Input
                                        id="maxSupply"
                                        name="maxSupply"
                                        type="number"
                                        min="1"
                                        value={formData.maxSupply}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mintPrice">
                                        민팅 가격 (ETH)
                                    </Label>
                                    <Input
                                        id="mintPrice"
                                        name="mintPrice"
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={formData.mintPrice}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseURI">베이스 URI</Label>
                                <Input
                                    id="baseURI"
                                    name="baseURI"
                                    placeholder="https://api.example.com/metadata/"
                                    value={formData.baseURI}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contractURI">
                                    컨트랙트 URI
                                </Label>
                                <Input
                                    id="contractURI"
                                    name="contractURI"
                                    placeholder="https://api.example.com/collection"
                                    value={formData.contractURI}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* 가스비 예측 버튼 */}
                            <div className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleEstimateGas}
                                    disabled={
                                        isEstimating ||
                                        !formData.name ||
                                        !formData.symbol ||
                                        !connectedAddress
                                    }
                                    className="w-full"
                                >
                                    {isEstimating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            가스비 계산 중...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="mr-2 h-4 w-4" />
                                            가스비 예측하기
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* 가스비 예측 결과 및 조절 슬라이더 */}
                            {showGasEstimate && (
                                <div className="mt-4 p-3 bg-muted rounded-md space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-medium">
                                            예상 가스비
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleEstimateGas}
                                            className="h-6 w-6"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>가스 가격:</span>
                                            <span>{gasPriceInGwei} Gwei</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span>예상 가스 사용량:</span>
                                            <span>
                                                {estimatedGasAmount?.toString() ||
                                                    "계산 중..."}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>예상 총 비용:</span>
                                            <span>{gasFeeInEth} ETH</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span>네트워크 혼잡도:</span>
                                            <span
                                                className={
                                                    networkCongestion === "low"
                                                        ? "text-green-500"
                                                        : networkCongestion ===
                                                          "medium"
                                                        ? "text-yellow-500"
                                                        : networkCongestion ===
                                                          "high"
                                                        ? "text-red-500"
                                                        : ""
                                                }
                                            >
                                                {networkCongestion === "low"
                                                    ? "낮음"
                                                    : networkCongestion ===
                                                      "medium"
                                                    ? "보통"
                                                    : networkCongestion ===
                                                      "high"
                                                    ? "높음"
                                                    : "알 수 없음"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span>예상 처리 시간:</span>
                                            <span>{estimatedTimeText}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 pt-2">
                                        <Label
                                            htmlFor="gasPrice"
                                            className="text-xs"
                                        >
                                            가스 가격 조절 (배율)
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs">
                                                0.5x
                                            </span>
                                            <Slider
                                                id="gasPrice"
                                                defaultValue={[100]}
                                                min={50}
                                                max={200}
                                                step={5}
                                                onValueChange={
                                                    handleGasPriceChange
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-xs">2x</span>
                                        </div>
                                        <div className="text-xs text-right text-muted-foreground">
                                            {customGasPrice !== null
                                                ? `${(
                                                      customGasPrice / 100
                                                  ).toFixed(2)}x`
                                                : "1x"}{" "}
                                            (
                                            {customGasPrice !== null && gasPrice
                                                ? (
                                                      (Number(gasPriceInGwei) *
                                                          customGasPrice) /
                                                      100
                                                  ).toFixed(1)
                                                : gasPriceInGwei}{" "}
                                            Gwei)
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    isPending ||
                                    isConfirming ||
                                    !connectedAddress
                                }
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        트랜잭션 준비 중...
                                    </>
                                ) : isConfirming ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        트랜잭션 확인 중...
                                    </>
                                ) : !connectedAddress ? (
                                    "지갑 연결 필요"
                                ) : (
                                    "컬렉션 생성"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start">
                        {isError && (
                            <div className="flex items-center text-red-500 text-sm mt-2">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                {error?.message ||
                                    "트랜잭션 처리 중 오류가 발생했습니다."}
                            </div>
                        )}

                        {isSuccess && !isConfirmed && (
                            <div className="flex items-center text-amber-500 text-sm mt-2">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                트랜잭션이 제출되었습니다. 확인 중...
                                {transactionHash && (
                                    <a
                                        href={`https://etherscan.io/tx/${transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 underline"
                                    >
                                        보기
                                    </a>
                                )}
                            </div>
                        )}

                        {isConfirmed && (
                            <div className="flex items-center text-green-500 text-sm mt-2">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                컬렉션이 성공적으로 생성되었습니다!
                                {transactionHash && (
                                    <a
                                        href={`https://etherscan.io/tx/${transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 underline"
                                    >
                                        보기
                                    </a>
                                )}
                            </div>
                        )}
                    </CardFooter>
                </Card>

                {/* 컬렉션 목록 */}
                <Card>
                    <CardHeader>
                        <CardTitle>생성된 컬렉션</CardTitle>
                        <CardDescription>
                            이전에 생성한 NFT 컬렉션 목록입니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : collections && collections.length > 0 ? (
                            <ul className="space-y-2">
                                {collections.map((address, index) => (
                                    <li
                                        key={index}
                                        className="p-3 bg-muted rounded-md"
                                    >
                                        <div className="font-mono text-sm break-all">
                                            {address}
                                        </div>
                                        <a
                                            href={`https://etherscan.io/address/${address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                                        >
                                            Etherscan에서 보기
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                생성된 컬렉션이 없습니다.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
