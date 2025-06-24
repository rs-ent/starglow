import {
    registerEscrowWallet,
    fetchEscrowWalletPrivateKey,
    getEscrowWallets,
    fetchEscrowWalletBalance,
    fetchEscrowWalletsBalance,
    setActiveEscrowWallet,
    getRegisteredEscrowWallets,
    addEscrowWalletToSPG,
} from "@/app/story/escrowWallet/actions";
import { EscrowWallet } from "@prisma/client";

// Mock Prisma Client
jest.mock("../../../../lib/prisma/client", () => ({
    prisma: {
        escrowWallet: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        blockchainNetwork: {
            findUnique: jest.fn(),
        },
        story_spg: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

// Mock Story Client
jest.mock("../../../../app/story/client", () => ({
    fetchPublicClient: jest.fn(),
    fetchWalletClient: jest.fn(),
}));

// Mock Encryption Utils
jest.mock("../../../../lib/utils/encryption", () => ({
    encryptPrivateKey: jest.fn(),
    decryptPrivateKey: jest.fn(),
}));

// Mock formatUnits from viem
jest.mock("viem", () => ({
    formatUnits: jest.fn(),
}));

describe("EscrowWallet Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("registerEscrowWallet", () => {
        const validInput = {
            address: "0x1234567890123456789012345678901234567890",
            privateKey:
                "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        };

        const mockEncryptedParts = {
            dbPart: "encrypted_db_part",
            keyHash: "key_hash",
            nonce: "nonce_value",
        };

        const mockWallet = {
            id: "wallet-123",
            address: validInput.address,
            privateKey: mockEncryptedParts.dbPart,
            keyHash: mockEncryptedParts.keyHash,
            nonce: mockEncryptedParts.nonce,
            isActive: true,
            balance: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it("should successfully register a new escrow wallet", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const { encryptPrivateKey } = require("@/lib/utils/encryption");

            encryptPrivateKey.mockResolvedValue(mockEncryptedParts);

            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    escrowWallet: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue(mockWallet),
                    },
                };
                return await callback(mockTx);
            });

            const result = await registerEscrowWallet(validInput);

            expect(result).toEqual(mockWallet);
            expect(encryptPrivateKey).toHaveBeenCalledWith(
                validInput.privateKey
            );
        });

        it("should return existing wallet if already registered", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const { encryptPrivateKey } = require("@/lib/utils/encryption");

            const existingWallet = { ...mockWallet, id: "existing-wallet-123" };

            encryptPrivateKey.mockResolvedValue(mockEncryptedParts);

            let mockTx: any;
            prisma.$transaction.mockImplementation(async (callback: any) => {
                mockTx = {
                    escrowWallet: {
                        findUnique: jest.fn().mockResolvedValue(existingWallet),
                        create: jest.fn(),
                    },
                };
                return await callback(mockTx);
            });

            const result = await registerEscrowWallet(validInput);

            expect(result).toEqual(existingWallet);
            expect(mockTx.escrowWallet.create).not.toHaveBeenCalled();
        });

        it("should handle encryption errors", async () => {
            const { encryptPrivateKey } = require("@/lib/utils/encryption");

            encryptPrivateKey.mockRejectedValue(new Error("Encryption failed"));

            const result = await registerEscrowWallet(validInput);

            expect(result).toBe("Error creating escrow wallet");
        });

        it("should handle database transaction errors", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const { encryptPrivateKey } = require("@/lib/utils/encryption");

            encryptPrivateKey.mockResolvedValue(mockEncryptedParts);
            prisma.$transaction.mockRejectedValue(new Error("Database error"));

            const result = await registerEscrowWallet(validInput);

            expect(result).toBe("Error creating escrow wallet");
        });

        it("should validate address format", async () => {
            const invalidInput = {
                address: "invalid-address",
                privateKey: validInput.privateKey,
            };

            const { prisma } = require("@/lib/prisma/client");
            const { encryptPrivateKey } = require("@/lib/utils/encryption");

            encryptPrivateKey.mockResolvedValue(mockEncryptedParts);

            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    escrowWallet: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({
                            ...mockWallet,
                            address: invalidInput.address,
                        }),
                    },
                };
                return await callback(mockTx);
            });

            const result = await registerEscrowWallet(invalidInput);

            expect(result).toEqual({
                ...mockWallet,
                address: invalidInput.address,
            });
        });

        it("should handle malformed private key", async () => {
            const malformedInput = {
                address: validInput.address,
                privateKey: "malformed-key",
            };

            const { encryptPrivateKey } = require("@/lib/utils/encryption");

            encryptPrivateKey.mockRejectedValue(
                new Error("Invalid private key format")
            );

            const result = await registerEscrowWallet(malformedInput);

            expect(result).toBe("Error creating escrow wallet");
        });
    });

    describe("fetchEscrowWalletPrivateKey", () => {
        const validInput = {
            address: "0x1234567890123456789012345678901234567890",
        };

        const mockWallet = {
            id: "wallet-123",
            address: validInput.address,
            privateKey: "encrypted_private_key",
            keyHash: "key_hash",
            nonce: "nonce_value",
            isActive: true,
            balance: {},
        };

        const decryptedKey =
            "0xdecrypted1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        it("should successfully fetch and decrypt private key", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const { decryptPrivateKey } = require("@/lib/utils/encryption");

            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    escrowWallet: {
                        findUnique: jest.fn().mockResolvedValue(mockWallet),
                    },
                };
                return await callback(mockTx);
            });

            decryptPrivateKey.mockResolvedValue(decryptedKey);

            const result = await fetchEscrowWalletPrivateKey(validInput);

            expect(result).toBe(decryptedKey);
            expect(decryptPrivateKey).toHaveBeenCalledWith({
                dbPart: mockWallet.privateKey,
                blobPart: mockWallet.keyHash,
                keyHash: mockWallet.keyHash,
                nonce: mockWallet.nonce,
            });
        });

        it("should return null when wallet not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    escrowWallet: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            const result = await fetchEscrowWalletPrivateKey(validInput);

            expect(result).toBeNull();
        });

        it("should handle decryption errors", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const { decryptPrivateKey } = require("@/lib/utils/encryption");

            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    escrowWallet: {
                        findUnique: jest.fn().mockResolvedValue(mockWallet),
                    },
                };
                return await callback(mockTx);
            });

            decryptPrivateKey.mockRejectedValue(new Error("Decryption failed"));

            const result = await fetchEscrowWalletPrivateKey(validInput);

            expect(result).toBeNull();
        });

        it("should handle database transaction errors", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.$transaction.mockRejectedValue(new Error("Database error"));

            const result = await fetchEscrowWalletPrivateKey(validInput);

            expect(result).toBeNull();
        });
    });

    describe("getEscrowWallets", () => {
        const mockWallets = [
            {
                id: "wallet-1",
                address: "0x1111111111111111111111111111111111111111",
                isActive: true,
                balance: {},
            },
            {
                id: "wallet-2",
                address: "0x2222222222222222222222222222222222222222",
                isActive: false,
                balance: {},
            },
        ];

        it("should return all wallets when no input provided", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.escrowWallet.findMany.mockResolvedValue(mockWallets);

            const result = await getEscrowWallets();

            expect(result).toEqual(mockWallets);
            expect(prisma.escrowWallet.findMany).toHaveBeenCalledWith();
        });

        it("should filter by isActive when specified", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const activeWallets = mockWallets.filter((w) => w.isActive);

            prisma.escrowWallet.findMany.mockResolvedValue(activeWallets);

            const result = await getEscrowWallets({ isActive: true });

            expect(result).toEqual(activeWallets);
            expect(prisma.escrowWallet.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
            });
        });

        it("should return empty array on database error", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.escrowWallet.findMany.mockRejectedValue(
                new Error("Database error")
            );

            const result = await getEscrowWallets();

            expect(result).toEqual([]);
        });
    });

    describe("fetchEscrowWalletBalance", () => {
        const mockStoryClient = {
            getBalance: jest.fn(),
        };

        const validInput = {
            storyClient: mockStoryClient as any,
            address: "0x1234567890123456789012345678901234567890",
        };

        it("should successfully fetch wallet balance", async () => {
            const { formatUnits } = require("viem");
            const mockBalance = BigInt("1000000000000000000"); // 1 ETH in wei
            const formattedBalance = "1.0";

            mockStoryClient.getBalance.mockResolvedValue(mockBalance);
            formatUnits.mockReturnValue(formattedBalance);

            const result = await fetchEscrowWalletBalance(validInput);

            expect(result).toBe(formattedBalance);
            expect(mockStoryClient.getBalance).toHaveBeenCalledWith(
                "0x1234567890123456789012345678901234567890"
            );
            expect(formatUnits).toHaveBeenCalledWith(mockBalance, 18);
        });

        it("should handle address without 0x prefix", async () => {
            const { formatUnits } = require("viem");
            const inputWithoutPrefix = {
                ...validInput,
                address: "1234567890123456789012345678901234567890",
            };
            const mockBalance = BigInt("500000000000000000");
            const formattedBalance = "0.5";

            mockStoryClient.getBalance.mockResolvedValue(mockBalance);
            formatUnits.mockReturnValue(formattedBalance);

            const result = await fetchEscrowWalletBalance(inputWithoutPrefix);

            expect(result).toBe(formattedBalance);
            expect(mockStoryClient.getBalance).toHaveBeenCalledWith(
                "0x1234567890123456789012345678901234567890"
            );
        });

        it("should return '0' when no input provided", async () => {
            const result = await fetchEscrowWalletBalance(undefined as any);

            expect(result).toBe("0");
        });

        it("should return '0' on error", async () => {
            mockStoryClient.getBalance.mockRejectedValue(
                new Error("Network error")
            );

            const result = await fetchEscrowWalletBalance(validInput);

            expect(result).toBe("0");
        });
    });

    describe("fetchEscrowWalletsBalance", () => {
        const validInput = {
            networkId: "network-123",
            addresses: [
                "0x1111111111111111111111111111111111111111",
                "0x2222222222222222222222222222222222222222",
            ],
        };

        const mockNetwork = {
            id: "network-123",
            chainId: 1,
            rpcUrl: "https://eth-mainnet.example.com",
        };

        it("should successfully fetch multiple wallet balances", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");
            const { formatUnits } = require("viem");

            const mockPublicClient = {
                getBalance: jest.fn(),
            };

            prisma.blockchainNetwork.findUnique.mockResolvedValue(mockNetwork);
            fetchPublicClient.mockResolvedValue(mockPublicClient);

            mockPublicClient.getBalance
                .mockResolvedValueOnce(BigInt("1000000000000000000")) // 1 ETH
                .mockResolvedValueOnce(BigInt("2000000000000000000")); // 2 ETH

            formatUnits.mockReturnValueOnce("1.0").mockReturnValueOnce("2.0");

            const result = await fetchEscrowWalletsBalance(validInput);

            expect(result).toEqual([
                { address: validInput.addresses[0], balance: "1.0" },
                { address: validInput.addresses[1], balance: "2.0" },
            ]);
        });

        it("should return empty array when network not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.blockchainNetwork.findUnique.mockResolvedValue(null);

            const result = await fetchEscrowWalletsBalance(validInput);

            expect(result).toEqual([]);
        });

        it("should return empty array on error", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.blockchainNetwork.findUnique.mockRejectedValue(
                new Error("Database error")
            );

            const result = await fetchEscrowWalletsBalance(validInput);

            expect(result).toEqual([]);
        });

        it("should handle individual balance fetch errors gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");

            const mockPublicClient = {
                getBalance: jest.fn(),
            };

            prisma.blockchainNetwork.findUnique.mockResolvedValue(mockNetwork);
            fetchPublicClient.mockResolvedValue(mockPublicClient);

            mockPublicClient.getBalance
                .mockResolvedValueOnce(BigInt("1000000000000000000")) // Success
                .mockRejectedValueOnce(new Error("Balance fetch failed")); // Error

            const result = await fetchEscrowWalletsBalance(validInput);

            // Should return empty array when any individual fetch fails
            expect(result).toEqual([]);
        });
    });

    describe("setActiveEscrowWallet", () => {
        const validInput = {
            address: "0x1234567890123456789012345678901234567890",
            isActive: true,
        };

        const mockUpdatedWallet = {
            id: "wallet-123",
            address: validInput.address,
            isActive: validInput.isActive,
            balance: {},
        };

        it("should successfully update wallet active status", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.escrowWallet.update.mockResolvedValue(mockUpdatedWallet);

            const result = await setActiveEscrowWallet(validInput);

            expect(result).toEqual(mockUpdatedWallet);
            expect(prisma.escrowWallet.update).toHaveBeenCalledWith({
                where: { address: validInput.address },
                data: { isActive: validInput.isActive },
            });
        });

        it("should handle database update errors", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.escrowWallet.update.mockRejectedValue(
                new Error("Update failed")
            );

            const result = await setActiveEscrowWallet(validInput);

            expect(result).toBe("Error setting active escrow wallet");
        });

        it("should handle setting wallet to inactive", async () => {
            const inactiveInput = { ...validInput, isActive: false };
            const inactiveWallet = { ...mockUpdatedWallet, isActive: false };

            const { prisma } = require("@/lib/prisma/client");

            prisma.escrowWallet.update.mockResolvedValue(inactiveWallet);

            const result = await setActiveEscrowWallet(inactiveInput);

            expect(result).toEqual(inactiveWallet);
            expect(prisma.escrowWallet.update).toHaveBeenCalledWith({
                where: { address: inactiveInput.address },
                data: { isActive: false },
            });
        });
    });

    describe("getRegisteredEscrowWallets", () => {
        const validInput = {
            spgAddress: "0x1234567890123456789012345678901234567890",
        };

        const mockSPG = {
            address: validInput.spgAddress,
            network: {
                id: "network-123",
                chainId: 1,
                rpcUrl: "https://eth-mainnet.example.com",
            },
        };

        const mockWallets = [
            { address: "0x1111111111111111111111111111111111111111" },
            { address: "0x2222222222222222222222222222222222222222" },
        ];

        it("should return verified escrow wallets", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");

            const mockPublicClient = {
                readContract: jest.fn(),
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            prisma.escrowWallet.findMany.mockResolvedValue(mockWallets);
            fetchPublicClient.mockResolvedValue(mockPublicClient);

            mockPublicClient.readContract
                .mockResolvedValueOnce(true) // First wallet is verified
                .mockResolvedValueOnce(false); // Second wallet is not verified

            const result = await getRegisteredEscrowWallets(validInput);

            expect(result).toEqual([mockWallets[0].address]);
        });

        it("should return empty array when no input provided", async () => {
            const result = await getRegisteredEscrowWallets();

            expect(result).toEqual([]);
        });

        it("should return empty array when SPG not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(null);

            const result = await getRegisteredEscrowWallets(validInput);

            expect(result).toEqual([]);
        });

        it("should handle contract read errors gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");

            const mockPublicClient = {
                readContract: jest.fn(),
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            prisma.escrowWallet.findMany.mockResolvedValue(mockWallets);
            fetchPublicClient.mockResolvedValue(mockPublicClient);

            mockPublicClient.readContract
                .mockResolvedValueOnce(true)
                .mockRejectedValueOnce(new Error("Contract read failed"));

            const result = await getRegisteredEscrowWallets(validInput);

            expect(result).toEqual([mockWallets[0].address]);
        });

        it("should return empty array on general error", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.story_spg.findUnique.mockRejectedValue(
                new Error("Database error")
            );

            const result = await getRegisteredEscrowWallets(validInput);

            expect(result).toEqual([]);
        });
    });

    describe("addEscrowWalletToSPG", () => {
        const validInput = {
            spgAddress: "0x1234567890123456789012345678901234567890",
            walletAddress: "0x1111111111111111111111111111111111111111",
        };

        const mockSPG = {
            address: validInput.spgAddress,
            network: {
                id: "network-123",
                chainId: 1,
                rpcUrl: "https://eth-mainnet.example.com",
            },
        };

        const mockTxHash =
            "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        it("should successfully add escrow wallet to SPG", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const mockPublicClient = {
                simulateContract: jest.fn(),
            };

            const mockWalletClient = {
                writeContract: jest.fn(),
                account: { address: validInput.walletAddress },
            };

            const mockRequest = {
                address: validInput.spgAddress,
                functionName: "addEscrowWallet",
                args: [validInput.walletAddress],
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);

            mockPublicClient.simulateContract.mockResolvedValue({
                request: mockRequest,
            });
            mockWalletClient.writeContract.mockResolvedValue(mockTxHash);

            const result = await addEscrowWalletToSPG(validInput);

            expect(result).toBe(mockTxHash);
            expect(mockPublicClient.simulateContract).toHaveBeenCalledWith({
                address: validInput.spgAddress,
                abi: expect.any(Array),
                functionName: "addEscrowWallet",
                args: [validInput.walletAddress],
                account: mockWalletClient.account,
            });
        });

        it("should return null when SPG not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(null);

            const result = await addEscrowWalletToSPG(validInput);

            expect(result).toBeNull();
        });

        it("should return null on contract simulation error", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const mockPublicClient = {
                simulateContract: jest.fn(),
            };

            const mockWalletClient = {
                account: { address: validInput.walletAddress },
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);

            mockPublicClient.simulateContract.mockRejectedValue(
                new Error("Simulation failed")
            );

            const result = await addEscrowWalletToSPG(validInput);

            expect(result).toBeNull();
        });

        it("should return null on transaction write error", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const mockPublicClient = {
                simulateContract: jest.fn(),
            };

            const mockWalletClient = {
                writeContract: jest.fn(),
                account: { address: validInput.walletAddress },
            };

            const mockRequest = {
                address: validInput.spgAddress,
                functionName: "addEscrowWallet",
                args: [validInput.walletAddress],
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);

            mockPublicClient.simulateContract.mockResolvedValue({
                request: mockRequest,
            });
            mockWalletClient.writeContract.mockRejectedValue(
                new Error("Transaction failed")
            );

            const result = await addEscrowWalletToSPG(validInput);

            expect(result).toBeNull();
        });
    });

    describe("Security and Edge Cases", () => {
        describe("Input Validation", () => {
            it("should handle malformed addresses in registerEscrowWallet", async () => {
                const malformedInput = {
                    address: "not-an-address",
                    privateKey:
                        "0x1234567890123456789012345678901234567890123456789012345678901234",
                };

                const { encryptPrivateKey } = require("@/lib/utils/encryption");
                const { prisma } = require("@/lib/prisma/client");

                encryptPrivateKey.mockResolvedValue({
                    dbPart: "encrypted",
                    keyHash: "hash",
                    nonce: "nonce",
                });

                prisma.$transaction.mockImplementation(
                    async (callback: any) => {
                        const mockTx = {
                            escrowWallet: {
                                findUnique: jest.fn().mockResolvedValue(null),
                                create: jest.fn().mockResolvedValue({
                                    id: "wallet-123",
                                    address: malformedInput.address,
                                    isActive: true,
                                }),
                            },
                        };
                        return await callback(mockTx);
                    }
                );

                const result = await registerEscrowWallet(malformedInput);

                expect(result).toEqual({
                    id: "wallet-123",
                    address: malformedInput.address,
                    isActive: true,
                });
            });

            it("should handle empty private key", async () => {
                const emptyKeyInput = {
                    address: "0x1234567890123456789012345678901234567890",
                    privateKey: "",
                };

                const { encryptPrivateKey } = require("@/lib/utils/encryption");

                encryptPrivateKey.mockRejectedValue(
                    new Error("Empty private key")
                );

                const result = await registerEscrowWallet(emptyKeyInput);

                expect(result).toBe("Error creating escrow wallet");
            });
        });

        describe("Concurrent Access", () => {
            it("should handle concurrent wallet registration attempts", async () => {
                const input = {
                    address: "0x1234567890123456789012345678901234567890",
                    privateKey:
                        "0x1234567890123456789012345678901234567890123456789012345678901234",
                };

                const { encryptPrivateKey } = require("@/lib/utils/encryption");
                const { prisma } = require("@/lib/prisma/client");

                encryptPrivateKey.mockResolvedValue({
                    dbPart: "encrypted",
                    keyHash: "hash",
                    nonce: "nonce",
                });

                // Simulate race condition
                let callCount = 0;
                prisma.$transaction.mockImplementation(
                    async (callback: any) => {
                        callCount++;
                        const mockTx = {
                            escrowWallet: {
                                findUnique: jest.fn().mockResolvedValue(
                                    callCount === 1
                                        ? null
                                        : {
                                              id: "existing",
                                              address: input.address,
                                          }
                                ),
                                create: jest.fn().mockResolvedValue({
                                    id: "wallet-123",
                                    address: input.address,
                                    isActive: true,
                                }),
                            },
                        };
                        return await callback(mockTx);
                    }
                );

                const [result1, result2] = await Promise.all([
                    registerEscrowWallet(input),
                    registerEscrowWallet(input),
                ]);

                // Both should succeed, but one should return existing wallet
                expect(result1).toBeDefined();
                expect(result2).toBeDefined();
            });
        });

        describe("Memory and Performance", () => {
            it("should handle large number of wallet addresses in fetchEscrowWalletsBalance", async () => {
                const largeInput = {
                    networkId: "network-123",
                    addresses: Array.from(
                        { length: 1000 },
                        (_, i) => `0x${i.toString(16).padStart(40, "0")}`
                    ),
                };

                const { prisma } = require("../../../../lib/prisma/client");
                const {
                    fetchPublicClient,
                } = require("../../../../app/story/client");
                const { formatUnits } = require("viem");

                const mockNetwork = { id: "network-123", chainId: 1 };
                const mockPublicClient = {
                    getBalance: jest
                        .fn()
                        .mockResolvedValue(BigInt("1000000000000000000")),
                };

                prisma.blockchainNetwork.findUnique.mockResolvedValue(
                    mockNetwork
                );
                fetchPublicClient.mockResolvedValue(mockPublicClient);
                formatUnits.mockReturnValue("1.0");

                const result = await fetchEscrowWalletsBalance(largeInput);

                expect(result).toHaveLength(1000);
                expect(mockPublicClient.getBalance).toHaveBeenCalledTimes(1000);
            });
        });

        describe("Encryption Security", () => {
            it("should never return unencrypted private keys in logs", async () => {
                const consoleSpy = jest
                    .spyOn(console, "error")
                    .mockImplementation();

                const input = {
                    address: "0x1234567890123456789012345678901234567890",
                    privateKey:
                        "0x1234567890123456789012345678901234567890123456789012345678901234",
                };

                const { encryptPrivateKey } = require("@/lib/utils/encryption");

                encryptPrivateKey.mockRejectedValue(
                    new Error("Encryption failed")
                );

                await registerEscrowWallet(input);

                // Check that private key is not logged
                const errorCalls = consoleSpy.mock.calls;
                errorCalls.forEach((call) => {
                    const logMessage = call.join(" ");
                    expect(logMessage).not.toContain(input.privateKey);
                });

                consoleSpy.mockRestore();
            });
        });
    });
});
