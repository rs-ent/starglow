/// app/story/userWallet/actions.ts

"use server";

import { WalletStatus } from "@prisma/client";
import { ethers } from "ethers";
import { verifyMessage } from "viem";

import { prisma } from "@/lib/prisma/client";
import { decryptPrivateKey, encryptPrivateKey } from "@/lib/utils/encryption";
import { createNotification } from "@/app/actions/notification/actions";

import type { Prisma, Wallet } from "@prisma/client";
import type { Hex } from "viem";
import { auth } from "@/app/auth/authSettings";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

export async function createWallet(userId: string, provider: string | null) {
    if (provider === "wallet") {
        const wallets = await prisma.wallet.findMany({
            where: {
                userId,
            },
        });

        if (wallets.length > 1) {
            const starglowWallet = wallets.find(
                (wallet) => wallet.provider === "starglow"
            );
            if (starglowWallet) {
                await prisma.wallet.delete({
                    where: {
                        id: starglowWallet.id,
                    },
                });

                const player = await prisma.player.findUnique({
                    cacheStrategy: getCacheStrategy("sevenDays"),
                    where: { userId },
                    select: { id: true },
                });

                if (!player) {
                    return {
                        success: false,
                        error: "Player not found",
                    };
                }

                await prisma.userNotification.deleteMany({
                    where: {
                        playerId: player.id,
                        entityType: "wallet",
                        entityId: starglowWallet.address,
                    },
                });
            }
        }

        return;
    }
    try {
        const result = await prisma.$transaction(async (tx) => {
            const defaultNetwork = await tx.blockchainNetwork.findFirst({
                where: { defaultNetwork: true },
            });

            const networkValue = defaultNetwork?.chainId?.toString() || "EVM";
            const networkName = defaultNetwork?.name || "EVM";

            const existingWallet = await tx.wallet.findFirst({
                cacheStrategy: getCacheStrategy("tenSeconds"),
                where: {
                    userId,
                },
            });

            if (existingWallet) {
                return {
                    success: true,
                    message: `${networkName} wallet already exists`,
                };
            }

            const hasDefaultWallet = await tx.wallet.findFirst({
                cacheStrategy: getCacheStrategy("tenSeconds"),
                where: {
                    userId,
                    default: true,
                },
            });

            const wallet = ethers.Wallet.createRandom();
            const encryptedParts = await encryptPrivateKey(wallet.privateKey);

            const newWallet = await tx.wallet.create({
                data: {
                    userId: userId,
                    address: wallet.address,
                    privateKey: encryptedParts.dbPart,
                    keyHash: encryptedParts.keyHash,
                    nonce: encryptedParts.nonce,
                    network: networkValue,
                    primary: 1,
                    default: hasDefaultWallet ? false : true,
                    nickname: "My Starglow Wallet",
                    status: "ACTIVE",
                    provider: "starglow",
                    lastAccessedAt: new Date(),
                },
            });

            return {
                success: true,
                address: newWallet.address,
            };
        });

        await needToBackupWallet({ userId: userId });

        return result;
    } catch (error) {
        console.error("Error creating wallet", error);
        return {
            success: false,
            message: "Failed to create wallet",
        };
    }
}

/**
 * @security
 * This function handles sensitive key encryption and should not be modified
 */
export async function getPrivateKey(address: string) {
    try {
        const session = await auth();
        const wallet = await prisma.wallet.findUnique({
            cacheStrategy: getCacheStrategy("tenSeconds"),
            where: { address },
            select: {
                userId: true,
                privateKey: true,
                keyHash: true,
                nonce: true,
            },
        });

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        if (!wallet.privateKey || !wallet.keyHash || !wallet.nonce) {
            throw new Error("This wallet is not created by Starglow");
        }

        if (session?.user?.id !== wallet.userId) {
            throw new Error("Not authorized function");
        }

        const decryptedKey = await decryptPrivateKey({
            dbPart: wallet.privateKey,
            blobPart: wallet.keyHash,
            keyHash: wallet.keyHash,
            nonce: wallet.nonce,
        });

        return decryptedKey;
    } catch (error) {
        console.error("Error getting private key", error);
        throw new Error("Failed to get private key");
    }
}

export interface conectWalletInput {
    address: string;
    network: string;
    provider: string;
    nickname?: string;
}

// 🔔 백업 알림 정리 헬퍼 함수
async function cleanupBackupNotifications(
    tx: any,
    userId: string,
    walletAddress: string
): Promise<void> {
    try {
        const player = await tx.player.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (player) {
            await tx.userNotification.deleteMany({
                where: {
                    playerId: player.id,
                    entityType: "wallet",
                    entityId: walletAddress,
                    OR: [
                        { tags: { has: "backup" } },
                        { tags: { has: "security" } },
                        { type: "ACCOUNT_SECURITY" },
                    ],
                },
            });
        }
    } catch (error) {
        console.error("Failed to cleanup backup notifications:", error);
    }
}

export async function connectWallet(
    input: conectWalletInput
): Promise<Wallet | string> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error("Not authenticated");
        }

        const userId = session.user.id;

        const result = await prisma.$transaction(async (tx) => {
            const existingWallet = await tx.wallet.findUnique({
                cacheStrategy: getCacheStrategy("tenSeconds"),
                where: {
                    address: input.address,
                },
            });

            if (existingWallet) {
                if (existingWallet.userId !== userId) {
                    console.warn(
                        `Wallet ${input.address} belongs to user ${existingWallet.userId}, but user ${userId} is trying to connect. This should not happen in normal flow.`
                    );
                }

                const isExternalWallet = input.provider !== "starglow";
                const isStarglowToExternal =
                    existingWallet.provider === "starglow" && isExternalWallet;

                if (isExternalWallet && !existingWallet.default) {
                    await tx.wallet.updateMany({
                        where: {
                            userId: userId,
                            default: true,
                        },
                        data: {
                            default: false,
                        },
                    });
                }

                const updateData: any = {
                    lastAccessedAt: new Date(),
                    status: WalletStatus.ACTIVE,
                    ...(isExternalWallet && { default: true }),
                };

                if (isStarglowToExternal) {
                    updateData.provider = input.provider;
                    updateData.privateKey = null;
                    updateData.keyHash = null;
                    updateData.nonce = null;
                    updateData.nickname =
                        input.nickname || `${input.provider} Wallet`;
                }

                const updatedWallet = await tx.wallet.update({
                    where: {
                        id: existingWallet.id,
                    },
                    data: updateData,
                });

                if (isStarglowToExternal) {
                    await cleanupBackupNotifications(tx, userId, input.address);
                }

                return updatedWallet;
            }

            const isExternalWallet = input.provider !== "starglow";

            if (isExternalWallet) {
                await tx.wallet.updateMany({
                    where: {
                        userId: userId,
                        default: true,
                    },
                    data: {
                        default: false,
                    },
                });
            }

            const newWallet = await tx.wallet.upsert({
                where: {
                    address: input.address,
                },
                create: {
                    userId: userId,
                    address: input.address,
                    network: input.network,
                    provider: input.provider,
                    nickname: input.nickname || `${input.provider} Wallet`,
                    status: WalletStatus.ACTIVE,
                    lastAccessedAt: new Date(),
                    default: isExternalWallet ? true : false,
                },
                update: {
                    lastAccessedAt: new Date(),
                    status: WalletStatus.ACTIVE,
                    ...(isExternalWallet && { default: true }),
                },
            });

            return newWallet;
        });

        return result;
    } catch (error) {
        console.error("Failed to connect wallet", error);
        return "Failed to connect wallet";
    }
}

export interface verifyWalletSignatureInput {
    address: string;
    signature: string;
    message: string;
    network: string;
}

export async function verifyWalletSignature(
    input: verifyWalletSignatureInput
): Promise<boolean | string> {
    try {
        const isValid = await verifyMessage({
            address: input.address as Hex,
            message: input.message,
            signature: input.signature as Hex,
        });

        if (!isValid) {
            return "Invalid signature";
        }

        return true;
    } catch (error) {
        console.error("Failed to verify wallet signature", error);
        return "Failed to verify wallet signature";
    }
}

export interface updateWalletInput {
    walletAddress: string;
    network?: string;
    status?: WalletStatus;
    default?: boolean;
    nickname?: string;
    primary?: number;
}

export async function updateWallet(
    input: updateWalletInput
): Promise<Wallet | string> {
    try {
        // 🔧 내부에서 현재 세션 가져오기
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error("Not authenticated");
        }

        const userId = session.user.id;

        const result = await prisma.$transaction(async (tx) => {
            const { walletAddress, ...rest } = input;
            if (!walletAddress) {
                return "Invalid input";
            }

            // 권한 검증: 해당 지갑이 현재 사용자의 것인지 확인
            const wallet = await tx.wallet.findUnique({
                cacheStrategy: getCacheStrategy("tenSeconds"),
                where: { address: walletAddress },
                select: { userId: true },
            });

            if (!wallet || wallet.userId !== userId) {
                throw new Error("Wallet not found or not authorized");
            }

            if (rest.default) {
                await tx.wallet.updateMany({
                    where: {
                        userId: userId,
                        default: true,
                        address: { not: walletAddress },
                    },
                    data: { default: false },
                });
            }

            const updatedWallet = await tx.wallet.update({
                where: { address: walletAddress },
                data: rest,
            });

            return updatedWallet;
        });

        return result;
    } catch (error) {
        console.error("Failed to update wallet:", error);
        return "Failed to update wallet";
    }
}

export interface getWalletsInput {
    userId: string;
    network?: string;
    status?: WalletStatus;
    provider?: string;
}

export async function getWallets(
    input?: getWalletsInput
): Promise<Wallet[] | string> {
    if (!input) {
        return [];
    }

    try {
        const where: Prisma.WalletWhereInput = {};

        if (input?.userId) {
            where.userId = input.userId;
        }

        if (input?.network) {
            where.network = input.network;
        }

        if (input?.status) {
            where.status = input.status;
        }

        if (input?.provider) {
            where.provider = input.provider;
        }

        const wallets = await prisma.wallet.findMany({
            cacheStrategy: getCacheStrategy("tenSeconds"),
            where,
            orderBy: {
                default: "desc",
            },
        });

        return wallets;
    } catch (error) {
        console.error("Failed to get wallets:", error);
        return "Failed to get wallets";
    }
}

export interface deleteWalletInput {
    userId: string;
    walletAddress: string;
}

export async function deleteWallet(
    input: deleteWalletInput
): Promise<boolean | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { address: input.walletAddress },
                select: { default: true },
            });

            if (wallet?.default) {
                return "Default wallet cannot be deleted";
            }

            await tx.wallet.delete({
                where: { address: input.walletAddress },
            });

            return true;
        });

        return result;
    } catch (error) {
        console.error("Failed to delete wallet:", error);
        return "Failed to delete wallet";
    }
}

export interface getDefaultUserWalletInput {
    userId: string;
}

export async function getDefaultUserWallet(
    input?: getDefaultUserWalletInput
): Promise<Wallet | string | null> {
    if (!input) {
        return null;
    }

    try {
        const wallet = await prisma.wallet.findFirst({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: { userId: input.userId, default: true },
        });

        if (!wallet) {
            const wallets = await prisma.wallet.findMany({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where: { userId: input.userId },
                orderBy: {
                    lastAccessedAt: "desc",
                },
            });

            if (wallets.length === 0) {
                return "No wallets found";
            }

            const updatedWallet = await prisma.wallet.update({
                where: { id: wallets[0].id },
                data: { default: true },
            });

            return updatedWallet;
        }

        return wallet;
    } catch (error) {
        console.error("Failed to get default user wallet:", error);
        return "Failed to get default user wallet";
    }
}

export interface needToBackupWalletInput {
    userId: string;
}

export async function needToBackupWallet(input: needToBackupWalletInput) {
    try {
        // 만약 여전히 private key를 DB가 저장하고 있다면, 백업 알림을 생성
        // 이미 백업 알림을 생성했다면, 백업 알림을 업데이트

        const needBackupWallets = await prisma.wallet.findMany({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                userId: input.userId,
                // privateKey가 null이 아닌 지갑들만
                privateKey: { not: null },
            },
            select: {
                address: true,
                privateKey: true,
                createdAt: true,
            },
        });

        if (needBackupWallets.length === 0) {
            return {
                success: true,
                message: "No custodial wallets found that need backup",
                walletsNeedingBackup: 0,
            };
        }

        // Player 정보 가져오기 (createNotification에 필요)
        const player = await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("sevenDays"),
            where: { userId: input.userId },
            select: { id: true },
        });

        if (!player) {
            return {
                success: false,
                error: "Player not found",
            };
        }

        let notificationsCreated = 0;
        let notificationsSkipped = 0;

        for (const wallet of needBackupWallets) {
            try {
                // 이미 해당 지갑에 대한 백업 알림이 있는지 확인
                const existingNotification =
                    await prisma.userNotification.findFirst({
                        cacheStrategy: getCacheStrategy("tenSeconds"),
                        where: {
                            playerId: player.id,
                            entityType: "wallet",
                            entityId: wallet.address,
                            category: "SYSTEM",
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } },
                            ],
                            tags: { has: "backup" },
                        },
                    });

                if (existingNotification) {
                    notificationsSkipped++;
                    continue;
                }

                // 백업 알림 생성
                const notificationResult = await createNotification({
                    playerId: player.id,
                    type: "ACCOUNT_SECURITY",
                    category: "SYSTEM",
                    title: "Backup Your Private Key",
                    message:
                        "Secure your wallet by backing up your private key for safer asset management.",
                    description:
                        "For your security, please backup your private key. Starglow recommends keeping your private key safe and accessible only to you.",
                    entityType: "wallet",
                    entityId: wallet.address,
                    entityData: {
                        walletAddress: wallet.address,
                        reason: "MIGRATION_PREPARATION",
                        urgency: "RECOMMENDED",
                        walletCreatedAt: wallet.createdAt,
                    },
                    priority: "HIGH",
                    channels: ["in-app", "push"],
                    iconUrl: "/icons/security-shield.svg",
                    showBadge: true,
                    // 7일 후 만료 (너무 오래 남아있지 않도록)
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    metadata: {
                        backupReminder: true,
                        securityLevel: "HIGH",
                        triggerSource: "MANUAL_CHECK",
                        walletType: "DEVELOPMENT_CUSTODIAL",
                        productionReady: "NON_CUSTODIAL",
                    },
                    tags: ["security", "wallet", "backup", "development"],
                });

                if (notificationResult.success) {
                    notificationsCreated++;
                } else {
                    console.error(
                        `Failed to create backup notification for wallet ${wallet.address}:`,
                        notificationResult.error
                    );
                }
            } catch (error) {
                console.error(
                    `Error processing wallet ${wallet.address}:`,
                    error
                );
            }
        }

        return {
            success: true,
            message: `Backup notifications processed successfully`,
            walletsNeedingBackup: needBackupWallets.length,
            notificationsCreated,
            notificationsSkipped,
            details: {
                totalWallets: needBackupWallets.length,
                newNotifications: notificationsCreated,
                existingNotifications: notificationsSkipped,
            },
        };
    } catch (error) {
        console.error("Error in needToBackupWallet:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export interface walletBackupPostProcessInput {
    userId: string;
    walletAddress: string;
    newProvider?: string; // MetaMask export 시 provider 변경용
}

export interface walletBackupPostProcessOutput {
    success: boolean;
    message: string;
}

export async function walletBackupPostProcess(
    input: walletBackupPostProcessInput
): Promise<walletBackupPostProcessOutput> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { address: input.walletAddress },
                select: {
                    id: true,
                    userId: true,
                    privateKey: true,
                    keyHash: true,
                    nonce: true,
                    provider: true,
                },
            });

            if (!wallet) {
                return {
                    success: false,
                    message: "Wallet not found",
                };
            }

            // 권한 확인
            if (wallet.userId !== input.userId) {
                return {
                    success: false,
                    message: "Not authorized to backup this wallet",
                };
            }

            let updateData: any = {};
            let wasAlreadyBackedUp = false;

            // 이미 백업된 지갑인지 확인
            if (!wallet.privateKey && !wallet.keyHash && !wallet.nonce) {
                wasAlreadyBackedUp = true;
            } else {
                // 아직 백업되지 않은 지갑 - private key 제거
                updateData = {
                    privateKey: null,
                    keyHash: null,
                    nonce: null,
                    ...(input.newProvider && { provider: input.newProvider }),
                };
            }

            // Provider 변경이 있는 경우에만 업데이트
            if (input.newProvider && wallet.provider !== input.newProvider) {
                updateData.provider = input.newProvider;
            }

            // 업데이트할 내용이 있는 경우에만 실행
            if (Object.keys(updateData).length > 0) {
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: updateData,
                });
            }

            // 백업 알림 삭제를 위해 playerId 찾기
            const player = await tx.player.findUnique({
                where: { userId: input.userId },
                select: { id: true },
            });

            if (player) {
                await tx.userNotification.deleteMany({
                    where: {
                        playerId: player.id,
                        entityType: "wallet",
                        entityId: input.walletAddress,
                        OR: [
                            { tags: { has: "backup" } },
                            { tags: { has: "security" } },
                            { type: "ACCOUNT_SECURITY" },
                        ],
                    },
                });
            }

            return {
                success: true,
                message: wasAlreadyBackedUp
                    ? "Backup notifications cleaned up successfully"
                    : "Wallet backup completed successfully",
            };
        });

        return result;
    } catch (error) {
        console.error("Failed to backup wallet", error);
        return {
            success: false,
            message: "Failed to backup wallet",
        };
    }
}

export interface exportWalletToMetaMaskInput {
    userId: string;
    walletAddress: string;
}

export interface exportWalletToMetaMaskOutput {
    success: boolean;
    message: string;
    privateKey?: string;
    address?: string;
    error?: string;
}

export async function exportWalletToMetaMask(
    input: exportWalletToMetaMaskInput
): Promise<exportWalletToMetaMaskOutput> {
    try {
        if (!input.walletAddress) {
            return {
                success: false,
                message: "Wallet address is required",
                error: "INVALID_WALLET_ADDRESS",
            };
        }

        // 현재 세션 확인
        const session = await auth();
        if (!session?.user?.id || session.user.id !== input.userId) {
            return {
                success: false,
                message: "Not authorized",
                error: "UNAUTHORIZED",
            };
        }

        // 지갑 정보 확인
        const wallet = await prisma.wallet.findUnique({
            where: { address: input.walletAddress },
            select: {
                userId: true,
                address: true,
                privateKey: true,
                keyHash: true,
                nonce: true,
                provider: true,
                nickname: true,
            },
        });

        if (!wallet) {
            return {
                success: false,
                message: "Wallet not found",
                error: "WALLET_NOT_FOUND",
            };
        }

        if (wallet.userId !== input.userId) {
            return {
                success: false,
                message: "Not authorized to export this wallet",
                error: "UNAUTHORIZED",
            };
        }

        // Starglow 지갑인지 확인 (private key가 있는지)
        if (!wallet.privateKey || !wallet.keyHash || !wallet.nonce) {
            return {
                success: false,
                message: "This wallet is not managed by Starglow",
                error: "NOT_CUSTODIAL_WALLET",
            };
        }

        // Private key 복호화
        const privateKey = await getPrivateKey(input.walletAddress);

        return {
            success: true,
            message: "Wallet exported successfully",
            privateKey,
            address: wallet.address,
        };
    } catch (error) {
        console.error("Error exporting wallet:", {
            address: input.walletAddress?.slice(0, 10) + "...",
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
            success: false,
            message: "Failed to export wallet",
            error: "EXPORT_FAILED",
        };
    }
}
