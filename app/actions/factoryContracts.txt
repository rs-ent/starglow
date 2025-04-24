/// app\actions\contracts.ts

"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import {
    lookupBlockchainNetwork,
    getBlockchainNetworkById,
} from "./blockchain";
import { createWalletClient, http, parseGwei, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs/promises";
import { FACTORY_ABI } from "../blockchain/abis/Factory";
import { saveCollectionContract } from "./collectionContracts";

// Factory 컨트랙트 관련 함수들 (blockchain.ts에서 이동)
export async function getFactoryContracts(networkId?: string) {
    try {
        const contracts = await prisma.factoryContract.findMany({
            where: networkId ? { networkId } : {},
            include: {
                network: true,
            },
            orderBy: [{ deployedAt: "desc" }],
        });

        return { success: true, data: contracts };
    } catch (error) {
        console.error("Error fetching factory contracts:", error);
        return { success: false, error: "Failed to fetch factory contracts" };
    }
}

export async function getActiveFactoryContract(networkId: string) {
    try {
        const contract = await prisma.factoryContract.findFirst({
            where: {
                networkId,
                isActive: true,
            },
            include: {
                network: true,
            },
            orderBy: {
                deployedAt: "desc",
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "No active factory contract found for this network",
            };
        }

        return { success: true, data: contract };
    } catch (error) {
        console.error("Error fetching active factory contract:", error);
        return {
            success: false,
            error: "Failed to fetch active factory contract",
        };
    }
}

export interface saveFactoryContractParams {
    address: string;
    networkId: string;
    deployedBy?: string;
    transactionHash?: string;
}

export async function saveFactoryContract(params: saveFactoryContractParams) {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: params.networkId },
        });

        if (!network) {
            return { success: false, error: "Network not found" };
        }

        const contract = await prisma.factoryContract.create({
            data: {
                ...params,
                isActive: true,
            },
        });

        revalidatePath("/admin/onchain");
        return { success: true, data: contract };
    } catch (error) {
        console.error("Error saving factory contract:", error);
        return { success: false, error: "Failed to save factory contract" };
    }
}

export async function updateFactoryContractCollections(
    id: string,
    collections: string[]
) {
    try {
        const contract = await prisma.factoryContract.findUnique({
            where: { id },
        });

        if (!contract) {
            return { success: false, error: "Factory contract not found" };
        }

        const updatedContract = await prisma.factoryContract.update({
            where: { id },
            data: {
                collections,
            },
        });

        revalidatePath("/admin/onchain");
        return { success: true, data: updatedContract };
    } catch (error) {
        console.error("Error updating factory contract collections:", error);
        return {
            success: false,
            error: "Failed to update factory contract collections",
        };
    }
}

// Helper function to safely serialize objects with BigInt values
function safeStringify(obj: any, indent = 2) {
    return JSON.stringify(
        obj,
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        indent
    );
}

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
        console.log(`===== deployWithViem: Starting contract deployment =====`);
        console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`Constructor args: ${safeStringify(args)}`);

        // 계정 생성 - 프라이빗키가 0x로 시작하는지 확인
        if (!privateKey.startsWith("0x")) {
            privateKey = `0x${privateKey}`;
        }

        // 타입 캐스팅으로 타입 오류 해결
        const formattedPrivateKey = privateKey as `0x${string}`;
        const account = privateKeyToAccount(formattedPrivateKey);
        console.log(`Deployer account: ${account.address}`);

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

        // 퍼블릭 클라이언트 생성 (블록체인 쿼리용)
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // 계정 잔액 확인
        const balance = await publicClient.getBalance({
            address: account.address,
        });
        console.log(`Account balance: ${balance} wei`);

        if (balance === 0n) {
            return {
                success: false,
                error: "Deployer account has zero balance. Please fund the account first.",
            };
        }

        // 가스 옵션 설정
        const gasOptions: any = {};
        if (gasMaxFee) {
            gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
            console.log(
                `Max fee per gas: ${gasMaxFee} Gwei (${gasOptions.maxFeePerGas.toString()} wei)`
            );
        }
        if (gasMaxPriorityFee) {
            gasOptions.maxPriorityFeePerGas = parseGwei(gasMaxPriorityFee);
            console.log(
                `Max priority fee: ${gasMaxPriorityFee} Gwei (${gasOptions.maxPriorityFeePerGas.toString()} wei)`
            );
        }
        if (gasLimit) {
            gasOptions.gas = BigInt(gasLimit);
            console.log(`Gas limit: ${gasLimit}`);
        }

        // 컨트랙트 배포
        console.log(`Deploying contract...`);
        const hash = await walletClient.deployContract({
            abi: contractAbi,
            bytecode: bytecode as `0x${string}`, // 타입 캐스팅 추가
            args,
            ...gasOptions,
        });
        console.log(`Deployment transaction sent! Hash: ${hash}`);

        // 배포된 컨트랙트 주소 가져오기
        console.log(`Waiting for transaction receipt...`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(
            `Transaction mined in block ${receipt.blockNumber.toString()}`
        );
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);

        const contractAddress = receipt.contractAddress;

        if (!contractAddress) {
            return {
                success: false,
                error: "Failed to get contract address from receipt",
            };
        }

        console.log(`Contract deployed at: ${contractAddress}`);

        // 배포된 컨트랙트 검증
        try {
            console.log(`Verifying deployed contract...`);

            // 컨트랙트에 코드가 있는지 확인
            const code = await publicClient.getCode({
                address: contractAddress as `0x${string}`,
            });
            if (!code || code === "0x") {
                return {
                    success: false,
                    error: "Contract verification failed: No bytecode found at deployed address",
                };
            }
            console.log(`Contract bytecode verified (length: ${code.length})`);

            // Factory 컨트랙트의 경우 owner() 함수 호출하여 소유자 확인
            if (
                contractAbi.some(
                    (item: any) =>
                        item.type === "function" && item.name === "owner"
                )
            ) {
                try {
                    const owner = await publicClient.readContract({
                        address: contractAddress as `0x${string}`,
                        abi: contractAbi,
                        functionName: "owner",
                        args: [],
                    });
                    console.log(`Contract owner: ${owner}`);

                    // 소유자 검증
                    if (args.length > 0 && args[0]) {
                        // initialOwner가 인자로 전달된 경우
                        const expectedOwner = args[0];
                        if (owner !== expectedOwner) {
                            console.warn(
                                `Warning: Contract owner (${owner}) does not match expected owner (${expectedOwner})`
                            );
                        } else {
                            console.log(`Owner correctly set to ${owner}`);
                        }
                    }
                } catch (readError) {
                    console.warn(`Could not verify owner(): ${readError}`);
                }
            }
        } catch (verificationError) {
            console.error(`Contract verification error: ${verificationError}`);
            // 검증 실패해도 배포는 성공했으므로 경고만 하고 진행
        }

        console.log(`===== Contract deployment successful =====`);
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

export interface DeployFactoryParams {
    network: string;
    gasMaxFee: string;
    gasMaxPriorityFee: string;
    gasLimit: string;
    useDefaultGas?: boolean;
    skipVerification?: boolean;
    userId?: string; // 배포 사용자 ID (미지정 시 'admin')
    useViem?: boolean; // Viem 사용 여부 (테스트용)
    privateKey: string; // Viem 사용 시 필요한 프라이빗 키 (필수)
    initialOwner?: string; // 컨트랙트 소유자 (미지정 시 계정 주소 사용)
}

export interface DeployFactoryResult {
    success: boolean;
    data?: {
        address: string;
        transactionHash: string;
        network: string;
        networkId: string;
        chainId: number;
        owner: string; // 배포된 컨트랙트의 소유자
    };
    error?: string;
}

// Factory 컨트랙트 배포 서버 액션
export async function deployFactoryContract(
    params: DeployFactoryParams
): Promise<DeployFactoryResult> {
    try {
        console.log(
            "===== deployFactoryContract: Starting Factory deployment ====="
        );
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
            initialOwner, // 컨트랙트 소유자
        } = params;

        // privateKey 필수 확인
        if (!privateKey) {
            return {
                success: false,
                error: "Private key is required for contract deployment",
            };
        }

        // 배포자 계정 생성 - viem 방식이든 hardhat 방식이든 공통으로 사용
        let formattedPrivateKey = privateKey;
        if (!formattedPrivateKey.startsWith("0x")) {
            formattedPrivateKey = `0x${formattedPrivateKey}`;
        }
        const account = privateKeyToAccount(
            formattedPrivateKey as `0x${string}`
        );
        console.log(`Deployer account: ${account.address}`);

        // 컨트랙트 소유자 설정 (지정되지 않은 경우 배포자 계정 사용)
        const contractOwner = initialOwner || account.address;
        console.log(`Contract owner will be set to: ${contractOwner}`);

        // 네트워크 이름을 사용하여 DB에서 네트워크 ID 찾기
        console.log(`Looking up network: ${network}`);
        const networkResult = await lookupBlockchainNetwork({ name: network });

        if (!networkResult.success || !networkResult.data) {
            return { success: false, error: `Network not found: ${network}` };
        }

        const networkData = networkResult.data;
        const networkId = networkData.id;
        const chainId = networkData.chainId;
        console.log(
            `Network found: ${network} (Chain ID: ${chainId}, Network ID: ${networkId})`
        );

        // Viem 방식으로 배포 시도
        if (useViem) {
            try {
                // 웹3 디렉토리 경로
                const web3Dir = path.join(process.cwd(), "web3");

                // Factory 컨트랙트 ABI와 바이트코드 읽기
                console.log(`Reading Factory contract artifacts...`);
                const factoryAbiPath = path.join(
                    web3Dir,
                    "artifacts/contracts/Factory.sol/CollectionFactory.json"
                );

                let factoryJson;
                try {
                    factoryJson = JSON.parse(
                        await fs.readFile(factoryAbiPath, "utf-8")
                    );
                    console.log(
                        `Factory ABI loaded successfully - ${factoryJson.abi.length} entries`
                    );
                } catch (readError) {
                    console.error(`Failed to read Factory ABI: ${readError}`);
                    return {
                        success: false,
                        error: `Failed to read Factory contract ABI: ${
                            readError instanceof Error
                                ? readError.message
                                : "Unknown error"
                        }`,
                    };
                }

                // 체인 정보 구성
                const networkInfo = {
                    id: networkId,
                    name: network,
                    chainId: chainId,
                    rpcUrl: networkData.rpcUrl,
                    symbol: networkData.symbol,
                };

                // Viem으로 배포 - 소유자 설정
                console.log(
                    `Deploying Factory contract with owner: ${contractOwner}`
                );
                const deployResult = await deployWithViem({
                    network: networkInfo,
                    contractAbi: factoryJson.abi,
                    bytecode: factoryJson.bytecode,
                    args: [contractOwner], // Factory 컨트랙트의 생성자에 소유자 주소 전달
                    privateKey: formattedPrivateKey,
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
                        `Successfully deployed Factory contract using Viem: ${deployResult.address}`
                    );

                    // 배포 후 추가 검증
                    let verifiedOwner = contractOwner;
                    try {
                        // 체인 설정
                        const chain = {
                            id: chainId,
                            name: network,
                            nativeCurrency: {
                                name: network,
                                symbol: networkData.symbol,
                                decimals: 18,
                            },
                            rpcUrls: {
                                default: {
                                    http: [networkData.rpcUrl],
                                },
                            },
                        } as const;

                        // 퍼블릭 클라이언트 생성
                        const publicClient = createPublicClient({
                            chain,
                            transport: http(),
                        });

                        // 컨트랙트 소유자 확인
                        console.log(`Verifying contract owner...`);
                        const owner = await publicClient.readContract({
                            address: deployResult.address as `0x${string}`,
                            abi: factoryJson.abi,
                            functionName: "owner",
                            args: [],
                        });

                        console.log(`Factory contract owner: ${owner}`);
                        verifiedOwner = owner as string;

                        // getCollections 함수 호출 시도
                        try {
                            console.log(`Verifying getCollections function...`);
                            const collections = await publicClient.readContract(
                                {
                                    address:
                                        deployResult.address as `0x${string}`,
                                    abi: factoryJson.abi,
                                    functionName: "getCollections",
                                    args: [],
                                }
                            );

                            console.log(
                                `GetCollections result: ${safeStringify(
                                    collections
                                )}`
                            );
                        } catch (functionError) {
                            console.warn(
                                `getCollections test failed: ${functionError}`
                            );
                        }
                    } catch (verifyError) {
                        console.warn(
                            `Post-deployment verification failed: ${verifyError}`
                        );
                    }

                    // 배포 성공 시 DB에 저장하고 결과 반환
                    console.log(`Saving Factory contract to database...`);
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

                    console.log(
                        `===== Factory deployment completed successfully =====`
                    );
                    return {
                        success: true,
                        data: {
                            address: deployResult.address!,
                            transactionHash: deployResult.transactionHash!,
                            network,
                            networkId,
                            chainId,
                            owner: verifiedOwner,
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
                    owner: contractOwner || account.address,
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
                    owner: contractOwner || account.address,
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

// Create Collection 요청 파라미터 정의
export interface CreateCollectionParams {
    collectionKey: string;
    factoryAddress: string;
    networkId: string;
    name: string;
    symbol: string;
    maxSupply: number;
    mintPrice: string; // wei 단위 (예: "50000000000000000" = 0.05 ETH)
    baseURI: string;
    contractURI: string;
    privateKey: string; // 서명에 사용할 프라이빗 키
    gasMaxFee?: string; // 최대 가스 가격 (Gwei)
    gasMaxPriorityFee?: string; // 최대 우선 가스 가격 (Gwei)
    gasLimit?: string; // 가스 한도
    useDefaultGas?: boolean; // 기본 가스 사용 여부
}

// Create Collection 결과 타입 정의
export interface CreateCollectionResult {
    success: boolean;
    data?: {
        collectionAddress: string;
        transactionHash: string;
        name: string;
        symbol: string;
    };
    error?: string;
}

// Factory 컨트랙트를 통해 새 컬렉션 생성
export async function createCollection(
    params: CreateCollectionParams
): Promise<CreateCollectionResult> {
    try {
        console.log(
            "===== createCollection: Starting collection creation ====="
        );
        const {
            collectionKey,
            factoryAddress,
            networkId,
            name,
            symbol,
            maxSupply,
            mintPrice,
            baseURI,
            contractURI,
            privateKey,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
            useDefaultGas = false,
        } = params;

        console.log(
            `Factory address: ${factoryAddress}, Network ID: ${networkId}`
        );
        console.log(
            `Collection parameters: name=${name}, symbol=${symbol}, maxSupply=${maxSupply}`
        );

        // 네트워크 정보 조회 - networkId로 직접 조회
        console.log(`Looking up network with ID: ${networkId}`);
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            console.error(
                `Network lookup failed: ${
                    networkResult.error || "Unknown error"
                }`
            );
            return { success: false, error: `Network not found: ${networkId}` };
        }

        const networkData = networkResult.data;
        console.log(
            `Network found: ${networkData.name} (Chain ID: ${networkData.chainId})`
        );

        // 프라이빗 키 형식 확인
        let formattedPrivateKey = privateKey;
        if (!formattedPrivateKey.startsWith("0x")) {
            formattedPrivateKey = `0x${formattedPrivateKey}`;
            console.log("Private key formatted with 0x prefix");
        }

        try {
            // 계정 생성
            console.log("Creating Ethereum account from private key");
            const account = privateKeyToAccount(
                formattedPrivateKey as `0x${string}`
            );
            console.log(`Account created: ${account.address}`);

            // 체인 설정
            console.log("Configuring blockchain connection");
            const chain = {
                id: networkData.chainId,
                name: networkData.name,
                nativeCurrency: {
                    name: networkData.name,
                    symbol: networkData.symbol,
                    decimals: 18,
                },
                rpcUrls: {
                    default: {
                        http: [networkData.rpcUrl],
                    },
                },
            } as const;
            console.log(`Chain configured: ${chain.name} (${chain.id})`);
            console.log(`RPC URL: ${networkData.rpcUrl}`);

            // Factory 컨트랙트 ABI 사용 - 미리 정의된 ABI 사용
            console.log("Loading Factory contract ABI");
            const factoryAbi = FACTORY_ABI;

            // 월렛 클라이언트 생성
            console.log("Creating wallet client");
            const walletClient = createWalletClient({
                account,
                chain,
                transport: http(),
            });

            // 퍼블릭 클라이언트 생성 (읽기용)
            console.log("Creating public client");
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            });

            // Factory 컨트랙트가 실제로 존재하는지 확인
            console.log(`Checking Factory contract at ${factoryAddress}`);
            const code = await publicClient.getCode({
                address: factoryAddress as `0x${string}`,
            });
            if (!code || code === "0x") {
                return {
                    success: false,
                    error: "Factory contract does not exist at the provided address",
                };
            }
            console.log(
                `Factory contract bytecode verified (length: ${code.length})`
            );

            // Factory 컨트랙트 소유자 확인
            console.log(`Checking Factory contract owner`);
            try {
                const factoryOwner = await publicClient.readContract({
                    address: factoryAddress as `0x${string}`,
                    abi: factoryAbi,
                    functionName: "owner",
                    args: [],
                });

                console.log(`Factory contract owner: ${factoryOwner}`);

                // 호출자가 Factory 컨트랙트의 소유자인지 확인
                const isOwner = factoryOwner === account.address;
                if (!isOwner) {
                    console.error(
                        `Caller (${account.address}) is not the owner of Factory contract (${factoryOwner})!`
                    );
                    console.warn(
                        "Collection creation will likely fail due to onlyOwner restriction!"
                    );
                    // 오류 반환하지 않고 경고만 - 사용자가 원한다면 시도는 가능하도록
                }
            } catch (ownerError) {
                console.warn(`Could not verify Factory owner: ${ownerError}`);
                console.warn(
                    "Proceeding anyway, but this might fail if not properly deployed"
                );
            }

            // Factory 현재 상태 확인 (디버깅용)
            try {
                console.log(
                    "Getting current factory collections (pre-transaction)"
                );

                // getCollections 함수가 있을 수 있으므로 ABI에서 먼저 확인
                const hasGetCollections = factoryAbi.some(
                    (item: any) =>
                        item.type === "function" &&
                        item.name === "getCollections"
                );

                if (hasGetCollections) {
                    const currentCollections = await publicClient.readContract({
                        address: factoryAddress as `0x${string}`,
                        abi: factoryAbi,
                        functionName: "getCollections",
                        args: [],
                    });
                    console.log(
                        `Current collections count: ${
                            Array.isArray(currentCollections)
                                ? currentCollections.length
                                : "unknown"
                        }`
                    );
                    if (
                        Array.isArray(currentCollections) &&
                        currentCollections.length > 0
                    ) {
                        console.log(
                            `Latest collection: ${
                                currentCollections[
                                    currentCollections.length - 1
                                ]
                            }`
                        );
                    }
                } else {
                    console.log(
                        "Factory contract does not have getCollections function - skipping pre-check"
                    );
                }
            } catch (readError) {
                console.error(
                    "Error reading current factory state:",
                    readError
                );
                console.log(
                    "Continuing with collection creation despite pre-check error"
                );
            }

            // 민트 가격을 BigInt로 변환
            const mintPriceBigInt = BigInt(mintPrice);
            console.log(`Mint price (BigInt): ${mintPriceBigInt.toString()}`);

            // 가스 옵션 설정
            const gasOptions: any = {};
            if (!useDefaultGas) {
                if (gasMaxFee) {
                    gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
                    console.log(
                        `Max fee per gas: ${gasMaxFee} Gwei (${gasOptions.maxFeePerGas.toString()} wei)`
                    );
                }
                if (gasMaxPriorityFee) {
                    gasOptions.maxPriorityFeePerGas =
                        parseGwei(gasMaxPriorityFee);
                    console.log(
                        `Max priority fee: ${gasMaxPriorityFee} Gwei (${gasOptions.maxPriorityFeePerGas.toString()} wei)`
                    );
                }
                if (gasLimit) {
                    gasOptions.gas = BigInt(gasLimit);
                    console.log(`Gas limit: ${gasLimit}`);
                }
            } else {
                console.log("Using default gas settings");
            }

            // 함수 호출 직전
            console.log(
                "===== createCollection: Preparing to send transaction ====="
            );
            console.log("Calling createCollection with args:", {
                name,
                symbol,
                maxSupply,
                mintPrice: mintPriceBigInt.toString(),
                baseURI,
                contractURI,
                gasOptions:
                    Object.keys(gasOptions).length > 0
                        ? safeStringify({
                              maxFeePerGas: gasOptions.maxFeePerGas?.toString(),
                              maxPriorityFeePerGas:
                                  gasOptions.maxPriorityFeePerGas?.toString(),
                              gas: gasOptions.gas?.toString(),
                          })
                        : "default",
            });

            // createCollection 함수 호출
            console.log(`Sending transaction to factory at ${factoryAddress}`);
            const hash = await walletClient.writeContract({
                address: factoryAddress as `0x${string}`,
                abi: factoryAbi,
                functionName: "createCollection",
                args: [
                    name, // 컬렉션 이름
                    symbol, // 컬렉션 심볼
                    BigInt(maxSupply), // 최대 공급량
                    mintPriceBigInt, // 민팅 가격 (wei)
                    baseURI, // 베이스 URI
                    contractURI, // 컨트랙트 URI
                ],
                ...gasOptions, // 가스 옵션 추가
            });
            console.log(`Transaction sent! Hash: ${hash}`);

            // 트랜잭션 결과 대기
            console.log(`Waiting for transaction receipt...`);
            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });
            console.log("===== Transaction completed =====");
            console.log(`Status: ${receipt.status}`);
            console.log(`Block number: ${receipt.blockNumber.toString()}`);
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);

            // 트랜잭션 상태 확인
            if (receipt.status !== "success") {
                console.error("Transaction failed:", safeStringify(receipt));

                // 트랜잭션 실패 원인 검사 시도
                try {
                    // 실패한 트랜잭션 시뮬레이션 시도
                    console.log("Attempting to simulate failed transaction");
                    const failedTxSimulation =
                        await publicClient.simulateContract({
                            address: factoryAddress as `0x${string}`,
                            abi: factoryAbi,
                            functionName: "createCollection",
                            args: [
                                name,
                                symbol,
                                BigInt(maxSupply),
                                mintPriceBigInt,
                                baseURI,
                                contractURI,
                            ],
                            account: account.address,
                        });
                    console.log("Simulation result:", failedTxSimulation);
                } catch (simError) {
                    console.error("Simulation error:", simError);
                    console.log(
                        "This provides insight into why the transaction failed"
                    );
                }

                return {
                    success: false,
                    error: "Transaction failed to execute successfully",
                };
            }

            // 이벤트에서 컬렉션 주소 추출
            let collectionAddress = "";

            // 디버깅용: 모든 로그 출력
            console.log("Transaction logs:", safeStringify(receipt.logs));
            console.log(`Number of logs: ${receipt.logs.length}`);

            // 로그가 비어있는 경우에 대한 추가 진단
            if (receipt.logs.length === 0) {
                console.log(
                    "===== WARNING: Transaction succeeded but emitted no logs ====="
                );
                console.log("This could happen if:");
                console.log(
                    "1. The transaction reverted silently (success = true but no state change)"
                );
                console.log(
                    "2. The contract doesn't emit events for this function"
                );
                console.log(
                    "3. The transaction executed in a view/read-only mode"
                );

                // 트랜잭션이 정상적으로 처리되었는지 다시 확인
                try {
                    console.log(
                        "Getting block details to verify transaction was properly included"
                    );
                    const block = await publicClient.getBlock({
                        blockNumber: receipt.blockNumber,
                    });
                    console.log(
                        `Block ${receipt.blockNumber} mined at ${new Date(
                            Number(block.timestamp) * 1000
                        ).toISOString()}`
                    );
                    console.log(
                        `Block contains ${block.transactions.length} transactions`
                    );
                    console.log(`Gas used in block: ${block.gasUsed}`);

                    // 트랜잭션 상세 정보 확인
                    const txDetails = await publicClient.getTransaction({
                        hash: hash as `0x${string}`,
                    });
                    console.log("Transaction details:", {
                        from: txDetails.from,
                        to: txDetails.to,
                        value: txDetails.value.toString(),
                        data: txDetails.input.slice(0, 66) + "...", // 트랜잭션 데이터의 앞부분만 표시
                    });

                    // 실제로 호출된 함수 시그니처 확인 시도
                    const functionSelector = txDetails.input.slice(0, 10); // 함수 셀렉터 (첫 4바이트)
                    console.log(`Function selector: ${functionSelector}`);

                    // Factory ABI에서 매칭되는 함수 찾기
                    const matchingFunction = factoryAbi.find(
                        (item: any) =>
                            item.type === "function" &&
                            item.name === "createCollection"
                    );

                    if (matchingFunction) {
                        console.log(
                            `Called function should be: createCollection`
                        );
                    } else {
                        console.log(
                            "Could not identify the called function from ABI"
                        );
                    }
                } catch (blockError) {
                    console.error(
                        "Error getting additional transaction context:",
                        blockError
                    );
                }
            }

            // Factory의 이벤트 식별 업데이트
            // 우선 Factory 컨트랙트에서 발생한 로그 찾기
            console.log("Looking for events from Factory contract");
            const factoryLogs = receipt.logs.filter(
                (log) =>
                    log.address.toLowerCase() === factoryAddress.toLowerCase()
            );

            console.log(
                `Found ${factoryLogs.length} logs from factory contract`
            );

            if (factoryLogs.length > 0) {
                // Factory 로그에서 첫 번째 topics[1]에 있는 주소가 생성된 컬렉션일 가능성이 높음
                for (const log of factoryLogs) {
                    console.log(
                        `Examining factory log with topics: ${safeStringify(
                            log.topics
                        )}`
                    );
                    if (log.topics && log.topics.length >= 2) {
                        // topics[1]에서 주소 추출 (32바이트 값에서 20바이트 주소 추출)
                        // 타입 단언으로 undefined 처리
                        const topic1 = log.topics[1] as string;
                        const possibleAddress = `0x${topic1.slice(26)}`;
                        console.log(
                            `Extracted possible collection address: ${possibleAddress}`
                        );

                        // 유효한 이더리움 주소 형식인지 확인하고 0 주소가 아닌지 확인
                        if (
                            /^0x[a-fA-F0-9]{40}$/.test(possibleAddress) &&
                            possibleAddress !==
                                "0x0000000000000000000000000000000000000000"
                        ) {
                            console.log(
                                `✅ Found valid collection address: ${possibleAddress}`
                            );
                            collectionAddress = possibleAddress;
                            break;
                        }
                    }

                    // topics에서 찾지 못한 경우 data 필드 확인
                    if (
                        !collectionAddress &&
                        log.data &&
                        log.data.length > 66
                    ) {
                        console.log("Checking log data field for address");
                        // 일부 컨트랙트는 주소를 data 필드에 포함시킴
                        // data는 0x로 시작하는 16진수 문자열
                        // 일반적으로 이더리움 주소는 20바이트 (40자 16진수 문자)

                        // data에서 처음 32바이트(64자) 건너뛰고 다음 32바이트에서 주소 추출 시도
                        const dataWithoutPrefix = log.data.slice(2); // 0x 제거

                        // 32바이트씩 청크로 분할하여 각각 확인
                        for (let i = 0; i < dataWithoutPrefix.length; i += 64) {
                            const chunk = dataWithoutPrefix.slice(i, i + 64);
                            // 뒤쪽 20바이트 (40자)가 주소
                            const possibleAddress = `0x${chunk.slice(24)}`;

                            if (
                                /^0x[a-fA-F0-9]{40}$/.test(possibleAddress) &&
                                possibleAddress !==
                                    "0x0000000000000000000000000000000000000000"
                            ) {
                                console.log(
                                    `Found possible address in data: ${possibleAddress}`
                                );
                                // 주소를 찾았지만 바로 사용하지 않고 다른 주소를 더 찾아봄
                                if (!collectionAddress) {
                                    collectionAddress = possibleAddress;
                                }
                            }
                        }
                    }
                }
            }

            // 여전히 주소를 찾지 못했다면, 로그에서 생성된 컨트랙트 주소 찾기
            if (!collectionAddress) {
                console.log(
                    "Checking all logs for potential contract creation"
                );
                for (const log of receipt.logs) {
                    // Factory가 아닌 다른 주소에서 발생한 로그가 새로 생성된 컨트랙트일 수 있음
                    if (
                        log.address.toLowerCase() !==
                        factoryAddress.toLowerCase()
                    ) {
                        console.log(`Found log from address: ${log.address}`);
                        // 0 주소가 아닌지 확인
                        if (
                            log.address !==
                            "0x0000000000000000000000000000000000000000"
                        ) {
                            console.log(
                                `Using contract address: ${log.address}`
                            );
                            collectionAddress = log.address;
                            break;
                        }
                    }
                }
            }

            if (
                !collectionAddress ||
                collectionAddress ===
                    "0x0000000000000000000000000000000000000000"
            ) {
                console.error(
                    "Could not find valid collection address in transaction:",
                    hash
                );
                console.error("Transaction receipt:", safeStringify(receipt));

                return {
                    success: false,
                    error: "Failed to find a valid collection address in transaction logs",
                };
            }

            console.log("===== createCollection: Success! =====");
            console.log(`Collection address: ${collectionAddress}`);

            // 컬렉션 정보를 DB에 저장
            console.log(`Saving collection to database: ${collectionAddress}`);

            // 찾은 컬렉션 주소가 유효한지 한번 더 확인
            if (
                !collectionAddress.match(/^0x[a-fA-F0-9]{40}$/) ||
                collectionAddress ===
                    "0x0000000000000000000000000000000000000000"
            ) {
                console.error(
                    "Invalid collection address detected before DB save:",
                    collectionAddress
                );
                return {
                    success: false,
                    error: "Invalid collection address detected",
                };
            }

            const saveResult = await saveCollectionContract({
                collectionKey,
                address: collectionAddress,
                factoryAddress: factoryAddress,
                name,
                symbol,
                maxSupply,
                mintPrice,
                baseURI,
                contractURI,
                networkId,
                createdBy: "admin",
                transactionHash: hash,
            });

            if (!saveResult.success) {
                console.warn(
                    `Collection created but failed to save to database: ${saveResult.error}`
                );
                // 저장 실패해도 컬렉션 생성은 성공했으므로 경고만 로깅하고 계속 진행
            } else {
                console.log("Collection saved to database successfully");
            }

            // 캐시 갱신
            revalidatePath("/admin/onchain");

            return {
                success: true,
                data: {
                    collectionAddress,
                    transactionHash: hash,
                    name,
                    symbol,
                },
            };
        } catch (innerError) {
            console.error("Inner execution error:", innerError);
            if (innerError instanceof Error) {
                // 오류 메시지에서 유용한 정보 추출 시도
                const errorMsg = innerError.message;
                console.log("Error message:", errorMsg);

                // 일반적인 Web3 오류 패턴 확인
                if (errorMsg.includes("insufficient funds")) {
                    return {
                        success: false,
                        error: "Insufficient funds for gas * price + value - 계정에 충분한 ETH가 없습니다",
                    };
                } else if (
                    errorMsg.includes("gas required exceeds allowance")
                ) {
                    return {
                        success: false,
                        error: "Gas limit too low - 가스 한도를 높게 설정해 주세요",
                    };
                } else if (errorMsg.includes("already exists")) {
                    return {
                        success: false,
                        error: "Collection with this name or symbol already exists",
                    };
                } else if (errorMsg.includes("execution reverted")) {
                    // Revert 이유 추출 시도
                    const revertReason = errorMsg.match(
                        /execution reverted: (.*?)(?:"\}|$)/
                    );
                    if (revertReason && revertReason[1]) {
                        return {
                            success: false,
                            error: `Contract execution failed: ${revertReason[1]}`,
                        };
                    }
                }

                // 기타 모든 오류
                return {
                    success: false,
                    error: `Error creating collection: ${errorMsg}`,
                };
            } else {
                return {
                    success: false,
                    error: "Unknown error during collection creation",
                };
            }
        }
    } catch (error) {
        console.error("Outer error creating collection:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error creating collection",
        };
    }
}
