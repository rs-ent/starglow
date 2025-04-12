"use server";

import { spawn, ChildProcess } from "child_process";
import path from "path";
import { revalidatePath } from "next/cache";
import { saveFactoryContract } from "./blockchain";
import { lookupBlockchainNetwork } from "./blockchain";
import { createWalletClient, http, parseGwei, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs/promises";

// Viem을 사용한 Factory 컨트랙트 배포 유틸리티 함수
async function deployWithViem({
    network,
    contractAbi,
    bytecode,
    args = [],
    privateKey,
    gasMaxFee,
    gasMaxPriorityFee,
    gasLimit,
}: {
    network: {
        id: string;
        name: string;
        chainId: number;
        rpcUrl: string;
        symbol: string;
    };
    contractAbi: any[];
    bytecode: string;
    args?: any[];
    privateKey: string;
    gasMaxFee?: string;
    gasMaxPriorityFee?: string;
    gasLimit?: string;
}): Promise<{
    success: boolean;
    address?: string;
    transactionHash?: string;
    error?: string;
}> {
    try {
        // 계정 생성 - 프라이빗키가 0x로 시작하는지 확인
        if (!privateKey.startsWith("0x")) {
            privateKey = `0x${privateKey}`;
        }

        // 타입 캐스팅으로 타입 오류 해결
        const formattedPrivateKey = privateKey as `0x${string}`;
        const account = privateKeyToAccount(formattedPrivateKey);

        // 체인 설정 (타입 캐스팅 추가)
        const chain = {
            id: network.chainId,
            name: network.name,
            nativeCurrency: {
                name: network.name,
                symbol: network.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: [network.rpcUrl],
                },
            },
        } as const; // 타입 캐스팅으로 타입 오류 해결

        // 월렛 클라이언트 생성
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        // 가스 옵션 설정
        const gasOptions: any = {};
        if (gasMaxFee) gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
        if (gasMaxPriorityFee)
            gasOptions.maxPriorityFeePerGas = parseGwei(gasMaxPriorityFee);
        if (gasLimit) gasOptions.gas = BigInt(gasLimit);

        // 컨트랙트 배포
        const hash = await walletClient.deployContract({
            abi: contractAbi,
            bytecode: bytecode as `0x${string}`, // 타입 캐스팅 추가
            args,
            ...gasOptions,
        });

        // 배포된 컨트랙트 주소 가져오기
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const contractAddress = receipt.contractAddress;

        if (!contractAddress) {
            return {
                success: false,
                error: "Failed to get contract address from receipt",
            };
        }

        return {
            success: true,
            address: contractAddress,
            transactionHash: hash,
        };
    } catch (error) {
        console.error("Failed to deploy contract with viem:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error during deployment",
        };
    }
}

// 레거시 Hardhat 명령어 실행 유틸리티 함수 (기존 함수 유지)
async function runHardhatCommand(
    command: string[],
    cwd: string
): Promise<{ success: boolean; output: string; error?: string }> {
    try {
        // Vercel Edge 환경에서 child_process 실행 이슈를 해결하기 위한 workaround
        // 대신 하드햇 스크립트를 직접 실행
        const hardhatPath = path.join(cwd, "node_modules", ".bin", "hardhat");

        // 명령어 구성
        const fullCommand = `node "${hardhatPath}" ${command.join(" ")}`;
        console.log(`Executing: ${fullCommand}`);

        // 하드햇 실행
        return new Promise((resolve) => {
            const { exec } = require("child_process");
            exec(
                fullCommand,
                { cwd },
                (error: Error | null, stdout: string, stderr: string) => {
                    if (error) {
                        console.error(`Execution error: ${error.message}`);
                        resolve({
                            success: false,
                            output: stdout,
                            error: stderr || error.message,
                        });
                        return;
                    }

                    if (stderr) {
                        console.error(`Command stderr: ${stderr}`);
                    }

                    console.log(`Command stdout: ${stdout}`);
                    resolve({ success: true, output: stdout });
                }
            );
        });
    } catch (error) {
        console.error("Failed to execute Hardhat command:", error);
        return {
            success: false,
            output: "",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error executing Hardhat command",
        };
    }
}

interface DeployFactoryParams {
    network: string;
    gasMaxFee: string;
    gasMaxPriorityFee: string;
    gasLimit: string;
    useDefaultGas?: boolean;
    skipVerification?: boolean;
    userId?: string; // 배포 사용자 ID (미지정 시 'admin')
    useViem?: boolean; // Viem 사용 여부 (테스트용)
    privateKey?: string; // Viem 사용 시 필요한 프라이빗 키
}

interface DeployFactoryResult {
    success: boolean;
    data?: {
        address: string;
        transactionHash: string;
        network: string;
        networkId: string;
        chainId: number;
    };
    error?: string;
}

// Factory 컨트랙트 배포 서버 액션
export async function deployFactoryContract(
    params: DeployFactoryParams
): Promise<DeployFactoryResult> {
    try {
        const {
            network,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
            useDefaultGas,
            skipVerification,
            userId = "admin", // 기본값 'admin'
            useViem = true, // 기본적으로 Viem 사용
            privateKey,
        } = params;

        // 네트워크 이름을 사용하여 DB에서 네트워크 ID 찾기
        const networkResult = await lookupBlockchainNetwork({ name: network });

        if (!networkResult.success || !networkResult.data) {
            return { success: false, error: `Network not found: ${network}` };
        }

        const networkData = networkResult.data;
        const networkId = networkData.id;
        const chainId = networkData.chainId;

        // Viem 방식으로 배포 시도
        if (useViem) {
            try {
                // 프라이빗 키 확인
                if (!privateKey) {
                    return {
                        success: false,
                        error: "Private key is required for Viem deployment",
                    };
                }

                // 웹3 디렉토리 경로
                const web3Dir = path.join(process.cwd(), "web3");

                // Factory 컨트랙트 ABI와 바이트코드 읽기
                const factoryAbiPath = path.join(
                    web3Dir,
                    "artifacts/contracts/Factory.sol/CollectionFactory.json"
                );
                const factoryJson = JSON.parse(
                    await fs.readFile(factoryAbiPath, "utf-8")
                );

                // 체인 정보 구성
                const networkInfo = {
                    id: networkId,
                    name: network,
                    chainId: chainId,
                    rpcUrl: networkData.rpcUrl,
                    symbol: networkData.symbol,
                };

                // Viem으로 배포
                const deployResult = await deployWithViem({
                    network: networkInfo,
                    contractAbi: factoryJson.abi,
                    bytecode: factoryJson.bytecode,
                    privateKey,
                    gasMaxFee: useDefaultGas ? undefined : gasMaxFee,
                    gasMaxPriorityFee: useDefaultGas
                        ? undefined
                        : gasMaxPriorityFee,
                    gasLimit: useDefaultGas ? undefined : gasLimit,
                });

                if (!deployResult.success) {
                    console.log(
                        "Viem deployment failed, falling back to Hardhat method"
                    );
                    console.error(
                        "Failed to deploy with Viem:",
                        deployResult.error
                    );
                    // Viem 배포 실패 시 폴백으로 하드햇 방식 사용
                    // 하단의 코드로 계속 실행됨
                } else {
                    console.log(
                        "Successfully deployed contract using Viem:",
                        deployResult.address
                    );
                    // 배포 성공 시 DB에 저장하고 결과 반환
                    const saveResult = await saveFactoryContract({
                        address: deployResult.address!,
                        networkId,
                        deployedBy: userId,
                        transactionHash: deployResult.transactionHash!,
                    });

                    if (!saveResult.success) {
                        return {
                            success: false,
                            error: `Deployment succeeded but failed to save to database: ${saveResult.error}`,
                        };
                    }

                    // 캐시 갱신
                    revalidatePath("/admin/blockchain");
                    revalidatePath("/admin/onchain");

                    return {
                        success: true,
                        data: {
                            address: deployResult.address!,
                            transactionHash: deployResult.transactionHash!,
                            network,
                            networkId,
                            chainId,
                        },
                    };
                }
            } catch (viemError) {
                console.error("Error using Viem for deployment:", viemError);
                // Viem 방식 오류 시 하드햇 방식으로 폴백
            }
        }

        // 레거시 방식 (Hardhat 명령어 사용)
        // Hardhat 명령어 구성
        const hardhatCommand = ["run", "scripts/deploy-factory.ts"];

        // 네트워크 지정
        hardhatCommand.push("--network", network);

        // 가스 설정
        if (useDefaultGas) {
            hardhatCommand.push("--use-default-gas");
        } else {
            if (gasMaxFee) hardhatCommand.push("--max-fee", gasMaxFee);
            if (gasMaxPriorityFee)
                hardhatCommand.push("--max-priority-fee", gasMaxPriorityFee);
            if (gasLimit) hardhatCommand.push("--gas-limit", gasLimit);
        }

        // 검증 스킵 옵션
        if (skipVerification) {
            hardhatCommand.push("--skip-verification");
        }

        // 웹3 디렉토리 경로
        const web3Dir = path.join(process.cwd(), "web3");

        // 배포 명령 실행
        console.log(`Running Hardhat command: ${hardhatCommand.join(" ")}`);
        const result = await runHardhatCommand(hardhatCommand, web3Dir);

        if (!result.success) {
            return {
                success: false,
                error: `Deployment failed: ${result.error || "Unknown error"}`,
            };
        }

        // 결과에서 JSON 데이터 추출
        const resultJsonMatch = result.output.match(
            /---DEPLOYMENT_RESULT_START---\s*([\s\S]*?)\s*---DEPLOYMENT_RESULT_END---/
        );

        if (!resultJsonMatch || !resultJsonMatch[1]) {
            // JSON 결과를 찾지 못했을 경우 예전 방식의 정규식으로 시도
            const addressMatch = result.output.match(
                /Contract address: (0x[a-fA-F0-9]{40})/
            );
            const txHashMatch = result.output.match(
                /Transaction hash: (0x[a-fA-F0-9]{64})/
            );

            if (!addressMatch || !txHashMatch) {
                return {
                    success: false,
                    error: "Failed to extract contract address or transaction hash from output",
                };
            }

            const address = addressMatch[1];
            const transactionHash = txHashMatch[1];

            // 배포 결과를 DB에 저장
            const saveResult = await saveFactoryContract({
                address,
                networkId,
                deployedBy: userId,
                transactionHash,
            });

            if (!saveResult.success) {
                return {
                    success: false,
                    error: `Deployment succeeded but failed to save to database: ${saveResult.error}`,
                };
            }

            // 캐시 갱신
            revalidatePath("/admin/blockchain");
            revalidatePath("/admin/onchain");

            return {
                success: true,
                data: {
                    address,
                    transactionHash,
                    network,
                    networkId,
                    chainId,
                },
            };
        }

        // JSON 파싱
        try {
            const deploymentData = JSON.parse(resultJsonMatch[1]);

            // 검증: 필수 필드 확인
            if (!deploymentData.address || !deploymentData.transactionHash) {
                return {
                    success: false,
                    error: "Deployment result missing required fields",
                };
            }

            // 배포 결과를 DB에 저장
            const saveResult = await saveFactoryContract({
                address: deploymentData.address,
                networkId,
                deployedBy: userId,
                transactionHash: deploymentData.transactionHash,
            });

            if (!saveResult.success) {
                return {
                    success: false,
                    error: `Deployment succeeded but failed to save to database: ${saveResult.error}`,
                };
            }

            // 캐시 갱신
            revalidatePath("/admin/blockchain");
            revalidatePath("/admin/onchain");

            return {
                success: true,
                data: {
                    address: deploymentData.address,
                    transactionHash: deploymentData.transactionHash,
                    network,
                    networkId,
                    chainId,
                },
            };
        } catch (jsonError) {
            console.error("Error parsing deployment result JSON:", jsonError);
            return {
                success: false,
                error: "Failed to parse deployment result data",
            };
        }
    } catch (error) {
        console.error("Error deploying Factory contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to deploy Factory contract",
        };
    }
}
