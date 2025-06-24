import {
    deploySPGNFTFactory,
    getSPGContracts,
    createSPG,
    getSPG,
    getSPGs,
    updateSPG,
    deleteSPG,
    updateSPGUtils,
    getTBAAddressForNFT,
} from "@/app/story/spg/actions";

// Mock Prisma Client
jest.mock("../../../../lib/prisma/client", () => ({
    prisma: {
        story_spgContract: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        story_spg: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

// Mock Story Client
jest.mock("../../../../app/story/client", () => ({
    fetchPublicClient: jest.fn(),
    fetchWalletClient: jest.fn(),
}));

// Mock Metadata Actions
jest.mock("../../../../app/story/metadata/actions", () => ({
    fetchURI: jest.fn(),
}));

// Mock viem
jest.mock("viem", () => ({
    decodeEventLog: jest.fn(),
}));

// Mock SPGNFTFactory
jest.mock(
    "../../../../web3/artifacts/contracts/SPGNFTFactory.sol/SPGNFTFactory.json",
    () => ({
        abi: [
            {
                name: "deployStoryCollection",
                type: "function",
                inputs: [],
                outputs: [],
            },
            {
                name: "CollectionDeployed",
                type: "event",
                inputs: [
                    { name: "collection", type: "address", indexed: false },
                ],
            },
        ],
        bytecode: "0x608060405234801561001057600080fd5b50",
    })
);

describe("SPG Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("deploySPGNFTFactory", () => {
        const validInput = {
            userId: "user-123",
            networkId: "network-123",
            walletAddress: "0x1234567890123456789012345678901234567890",
        };

        const mockWalletClient = {
            account: { address: "0x1234567890123456789012345678901234567890" },
            chain: { id: 1 },
            deployContract: jest.fn(),
        };

        const mockPublicClient = {
            waitForTransactionReceipt: jest.fn(),
        };

        it("should successfully deploy SPG NFT Factory", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const mockTxHash = "0xabc123";
            const mockContractAddress =
                "0x9876543210987654321098765432109876543210";
            const mockContract = {
                id: "contract-123",
                address: mockContractAddress,
                txHash: mockTxHash,
                networkId: validInput.networkId,
            };

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockWalletClient.deployContract.mockResolvedValue(mockTxHash);
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                contractAddress: mockContractAddress,
            });
            prisma.story_spgContract.create.mockResolvedValue(mockContract);

            const result = await deploySPGNFTFactory(validInput);

            expect(result).toEqual(mockContract);
            expect(mockWalletClient.deployContract).toHaveBeenCalledWith({
                abi: expect.any(Array),
                bytecode: expect.any(String),
                args: [],
                account: mockWalletClient.account,
                chain: mockWalletClient.chain,
            });
            expect(prisma.story_spgContract.create).toHaveBeenCalledWith({
                data: {
                    address: mockContractAddress,
                    txHash: mockTxHash,
                    networkId: validInput.networkId,
                },
            });
        });

        it("should throw error when wallet account not found", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const walletClientWithoutAccount = {
                ...mockWalletClient,
                account: null,
            };

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(walletClientWithoutAccount);

            await expect(deploySPGNFTFactory(validInput)).rejects.toThrow(
                "Wallet account not found"
            );
        });

        it("should throw error when contract address not found", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockWalletClient.deployContract.mockResolvedValue("0xabc123");
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                contractAddress: null,
            });

            await expect(deploySPGNFTFactory(validInput)).rejects.toThrow(
                "Contract address not found"
            );
        });

        it("should handle deployment errors", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockWalletClient.deployContract.mockRejectedValue(
                new Error("Deployment failed")
            );

            await expect(deploySPGNFTFactory(validInput)).rejects.toThrow(
                "Deployment failed"
            );
        });
    });

    describe("getSPGContracts", () => {
        const mockContracts = [
            {
                id: "contract-1",
                address: "0x1111111111111111111111111111111111111111",
                networkId: "network-123",
            },
            {
                id: "contract-2",
                address: "0x2222222222222222222222222222222222222222",
                networkId: "network-456",
            },
        ];

        it("should return all contracts when no input provided", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spgContract.findMany.mockResolvedValue(mockContracts);

            const result = await getSPGContracts();

            expect(result).toEqual(mockContracts);
            expect(prisma.story_spgContract.findMany).toHaveBeenCalledWith();
        });

        it("should filter by networkId when provided", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const filteredContracts = [mockContracts[0]];

            prisma.story_spgContract.findMany.mockResolvedValue(
                filteredContracts
            );

            const result = await getSPGContracts({ networkId: "network-123" });

            expect(result).toEqual(filteredContracts);
            expect(prisma.story_spgContract.findMany).toHaveBeenCalledWith({
                where: { networkId: "network-123" },
            });
        });
    });

    describe("createSPG", () => {
        const mockMetadata = {
            id: "metadata-123",
            cid: "metadata-cid",
            url: "https://example.com/metadata.json",
            type: "erc721-metadata",
            createdAt: new Date(),
            updatedAt: new Date(),
            previewUrl: null,
            previewWidth: null,
            previewHeight: null,
            previewMimeType: null,
            previewSizeBytes: null,
        };

        const validInput = {
            userId: "user-123",
            networkId: "network-123",
            walletAddress: "0x1234567890123456789012345678901234567890",
            contractAddress: "0x9876543210987654321098765432109876543210",
            name: "Test Collection",
            symbol: "TEST",
            selectedMetadata: mockMetadata,
            artistId: "artist-123",
            baseURI: "https://example.com/base/",
            tbaRegistry: "0x1111111111111111111111111111111111111111",
            tbaImplementation: "0x2222222222222222222222222222222222222222",
        };

        const mockWalletClient = {
            account: { address: "0x1234567890123456789012345678901234567890" },
            chain: { id: 1 },
            writeContract: jest.fn(),
        };

        const mockPublicClient = {
            simulateContract: jest.fn(),
            waitForTransactionReceipt: jest.fn(),
        };

        it("should successfully create SPG", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");
            const {
                fetchURI,
            } = require("../../../../app/story/metadata/actions");
            const { decodeEventLog } = require("viem");

            const mockTxHash = "0xabc123";
            const mockCollectionAddress =
                "0x3333333333333333333333333333333333333333";
            const mockFetchedMetadata = {
                name: "Test NFT",
                description: "Test Description",
                image: "https://example.com/image.jpg",
            };
            const mockSPG = {
                id: "spg-123",
                address: mockCollectionAddress,
                name: validInput.name,
                symbol: validInput.symbol,
                networkId: validInput.networkId,
                artistId: validInput.artistId,
            };

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockPublicClient.simulateContract.mockResolvedValue({
                request: { functionName: "deployStoryCollection" },
            });
            mockWalletClient.writeContract.mockResolvedValue(mockTxHash);
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                logs: [
                    {
                        data: "0x123",
                        topics: ["0x456"],
                    },
                ],
            });
            decodeEventLog
                .mockReturnValueOnce({ eventName: "CollectionDeployed" })
                .mockReturnValueOnce({
                    eventName: "CollectionDeployed",
                    args: { collection: mockCollectionAddress },
                });
            fetchURI.mockResolvedValue(mockFetchedMetadata);
            prisma.story_spg.create.mockResolvedValue(mockSPG);

            const result = await createSPG(validInput);

            expect(result).toEqual({ ...mockSPG, txHash: mockTxHash });
            expect(mockPublicClient.simulateContract).toHaveBeenCalledWith({
                address: validInput.contractAddress,
                abi: expect.any(Array),
                functionName: "deployStoryCollection",
                args: [
                    validInput.name,
                    validInput.symbol,
                    validInput.baseURI,
                    validInput.selectedMetadata.url,
                    validInput.walletAddress,
                    validInput.tbaRegistry,
                    validInput.tbaImplementation,
                ],
                account: mockWalletClient.account,
                chain: mockWalletClient.chain,
            });
        });

        it("should use metadata URL as baseURI when baseURI not provided", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");
            const {
                fetchURI,
            } = require("../../../../app/story/metadata/actions");
            const { decodeEventLog } = require("viem");

            const { baseURI, ...inputWithoutBaseURI } = validInput;

            const mockTxHash = "0xabc123";
            const mockCollectionAddress =
                "0x3333333333333333333333333333333333333333";
            const mockFetchedMetadata = {
                image: "https://example.com/image.jpg",
            };
            const mockSPG = { id: "spg-123", address: mockCollectionAddress };

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockPublicClient.simulateContract.mockResolvedValue({
                request: { functionName: "deployStoryCollection" },
            });
            mockWalletClient.writeContract.mockResolvedValue(mockTxHash);
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                logs: [{ data: "0x123", topics: ["0x456"] }],
            });
            decodeEventLog
                .mockReturnValueOnce({ eventName: "CollectionDeployed" })
                .mockReturnValueOnce({
                    eventName: "CollectionDeployed",
                    args: { collection: mockCollectionAddress },
                });
            fetchURI.mockResolvedValue(mockFetchedMetadata);
            prisma.story_spg.create.mockResolvedValue(mockSPG);

            await createSPG(inputWithoutBaseURI);

            expect(mockPublicClient.simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    args: expect.arrayContaining([
                        validInput.selectedMetadata.url, // baseURI should be metadata URL
                    ]),
                })
            );
        });

        it("should throw error when wallet account not found", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const walletClientWithoutAccount = {
                ...mockWalletClient,
                account: null,
            };

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(walletClientWithoutAccount);

            await expect(createSPG(validInput)).rejects.toThrow(
                "Wallet account not found"
            );
        });

        it("should throw error when CollectionDeployed event not found", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");
            const { decodeEventLog } = require("viem");

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockPublicClient.simulateContract.mockResolvedValue({
                request: { functionName: "deployStoryCollection" },
            });
            mockWalletClient.writeContract.mockResolvedValue("0xabc123");
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                logs: [{ data: "0x123", topics: ["0x456"] }],
            });
            decodeEventLog.mockReturnValue({ eventName: "OtherEvent" });

            await expect(createSPG(validInput)).rejects.toThrow(
                "CollectionDeployed event not found"
            );
        });

        it("should throw error when collection address not found in event", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");
            const { decodeEventLog } = require("viem");

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockPublicClient.simulateContract.mockResolvedValue({
                request: { functionName: "deployStoryCollection" },
            });
            mockWalletClient.writeContract.mockResolvedValue("0xabc123");
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                logs: [{ data: "0x123", topics: ["0x456"] }],
            });
            decodeEventLog
                .mockReturnValueOnce({ eventName: "CollectionDeployed" })
                .mockReturnValueOnce({
                    eventName: "CollectionDeployed",
                    args: { collection: null },
                });

            await expect(createSPG(validInput)).rejects.toThrow(
                "Collection address not found in event"
            );
        });
    });

    describe("getSPG", () => {
        const mockSPG = {
            id: "spg-123",
            address: "0x1234567890123456789012345678901234567890",
            name: "Test Collection",
            symbol: "TEST",
            artist: {
                id: "artist-123",
                name: "Test Artist",
            },
        };

        it("should return null when no input provided", async () => {
            const result = await getSPG();
            expect(result).toBeNull();
        });

        it("should return null when no valid fields provided", async () => {
            const result = await getSPG({});
            expect(result).toBeNull();
        });

        it("should get SPG by id", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);

            const result = await getSPG({ id: "spg-123" });

            expect(result).toEqual(mockSPG);
            expect(prisma.story_spg.findUnique).toHaveBeenCalledWith({
                where: { id: "spg-123" },
                include: { artist: true },
            });
        });

        it("should get SPG by address", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);

            const result = await getSPG({ address: mockSPG.address });

            expect(result).toEqual(mockSPG);
            expect(prisma.story_spg.findUnique).toHaveBeenCalledWith({
                where: { address: mockSPG.address },
                include: { artist: true },
            });
        });

        it("should get SPG by name", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);

            const result = await getSPG({ name: mockSPG.name });

            expect(result).toEqual(mockSPG);
            expect(prisma.story_spg.findUnique).toHaveBeenCalledWith({
                where: { name: mockSPG.name },
                include: { artist: true },
            });
        });

        it("should get SPG by symbol", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);

            const result = await getSPG({ symbol: mockSPG.symbol });

            expect(result).toEqual(mockSPG);
            expect(prisma.story_spg.findUnique).toHaveBeenCalledWith({
                where: { symbol: mockSPG.symbol },
                include: { artist: true },
            });
        });
    });

    describe("getSPGs", () => {
        const mockSPGs = [
            {
                id: "spg-1",
                address: "0x1111111111111111111111111111111111111111",
                ownerAddress: "0x1234567890123456789012345678901234567890",
                networkId: "network-123",
                isListed: true,
                artist: { id: "artist-1", name: "Artist 1" },
            },
            {
                id: "spg-2",
                address: "0x2222222222222222222222222222222222222222",
                ownerAddress: "0x9876543210987654321098765432109876543210",
                networkId: "network-456",
                isListed: false,
                artist: { id: "artist-2", name: "Artist 2" },
            },
        ];

        it("should return all SPGs when no input provided", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);

            const result = await getSPGs();

            expect(result).toEqual(mockSPGs);
            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                include: { artist: true },
            });
        });

        it("should return all SPGs when input has no valid filters", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);

            const result = await getSPGs({});

            expect(result).toEqual(mockSPGs);
            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                include: { artist: true },
            });
        });

        it("should filter by walletAddress", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const filteredSPGs = [mockSPGs[0]];

            prisma.story_spg.findMany.mockResolvedValue(filteredSPGs);

            const result = await getSPGs({
                walletAddress: "0x1234567890123456789012345678901234567890",
            });

            expect(result).toEqual(filteredSPGs);
            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                where: {
                    ownerAddress: "0x1234567890123456789012345678901234567890",
                },
                include: { artist: true },
            });
        });

        it("should filter by networkId", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const filteredSPGs = [mockSPGs[0]];

            prisma.story_spg.findMany.mockResolvedValue(filteredSPGs);

            const result = await getSPGs({ networkId: "network-123" });

            expect(result).toEqual(filteredSPGs);
            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                where: { networkId: "network-123" },
                include: { artist: true },
            });
        });

        it("should filter by isListed", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const listedSPGs = [mockSPGs[0]];

            prisma.story_spg.findMany.mockResolvedValue(listedSPGs);

            // isListed만으로는 필터링이 안되므로 networkId와 함께 전달
            const result = await getSPGs({
                networkId: "network-123",
                isListed: true,
            });

            expect(result).toEqual(listedSPGs);
            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                where: { networkId: "network-123", isListed: true },
                include: { artist: true },
            });
        });

        it("should apply multiple filters", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findMany.mockResolvedValue([mockSPGs[0]]);

            const result = await getSPGs({
                walletAddress: "0x1234567890123456789012345678901234567890",
                networkId: "network-123",
                isListed: true,
            });

            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                where: {
                    ownerAddress: "0x1234567890123456789012345678901234567890",
                    networkId: "network-123",
                    isListed: true,
                },
                include: { artist: true },
            });
        });
    });

    describe("updateSPG", () => {
        const mockUpdatedSPG = {
            id: "spg-123",
            address: "0x1234567890123456789012345678901234567890",
            name: "Updated Collection",
            symbol: "UPDATED",
            artistId: "artist-456",
            artist: { id: "artist-456", name: "Updated Artist" },
        };

        it("should successfully update SPG", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.update
                .mockResolvedValueOnce({}) // First update to set artistId to null
                .mockResolvedValueOnce(mockUpdatedSPG); // Second update with new data

            const result = await updateSPG({
                address: "0x1234567890123456789012345678901234567890",
                name: "Updated Collection",
                symbol: "UPDATED",
                artistId: "artist-456",
            });

            expect(result).toEqual(mockUpdatedSPG);
            expect(prisma.story_spg.update).toHaveBeenCalledTimes(2);
            expect(prisma.story_spg.update).toHaveBeenNthCalledWith(1, {
                where: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                data: { artistId: null },
            });
            expect(prisma.story_spg.update).toHaveBeenNthCalledWith(2, {
                where: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                data: {
                    name: "Updated Collection",
                    symbol: "UPDATED",
                    artistId: "artist-456",
                },
                include: { artist: true },
            });
        });

        it("should update only provided fields", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.update
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce(mockUpdatedSPG);

            await updateSPG({
                address: "0x1234567890123456789012345678901234567890",
                name: "Updated Collection",
            });

            expect(prisma.story_spg.update).toHaveBeenNthCalledWith(2, {
                where: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                data: { name: "Updated Collection" },
                include: { artist: true },
            });
        });
    });

    describe("deleteSPG", () => {
        const mockDeletedSPG = {
            id: "spg-123",
            address: "0x1234567890123456789012345678901234567890",
            name: "Deleted Collection",
            artist: { id: "artist-123", name: "Test Artist" },
        };

        it("should successfully delete SPG", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.delete.mockResolvedValue(mockDeletedSPG);

            const result = await deleteSPG({
                address: "0x1234567890123456789012345678901234567890",
            });

            expect(result).toEqual(mockDeletedSPG);
            expect(prisma.story_spg.delete).toHaveBeenCalledWith({
                where: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                include: { artist: true },
            });
        });

        it("should handle delete errors", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.delete.mockRejectedValue(
                new Error("Delete failed")
            );

            await expect(
                deleteSPG({
                    address: "0x1234567890123456789012345678901234567890",
                })
            ).rejects.toThrow("Delete failed");

            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe("updateSPGUtils", () => {
        const mockUpdatedSPG = {
            id: "spg-123",
            address: "0x1234567890123456789012345678901234567890",
            isListed: true,
            price: 100,
            circulation: 1000,
            artist: { id: "artist-123", name: "Test Artist" },
        };

        it("should successfully update SPG utilities", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.update.mockResolvedValue(mockUpdatedSPG);

            const result = await updateSPGUtils({
                address: "0x1234567890123456789012345678901234567890",
                isListed: true,
                price: 100,
                circulation: 1000,
                reportUrl: "https://example.com/report",
                sharePercentage: 10,
                imageUrl: "https://example.com/image.jpg",
                preOrderStart: "2023-01-01",
                preOrderEnd: "2023-01-31",
                saleStart: "2023-02-01",
                saleEnd: "2023-02-28",
                glowStart: "2023-03-01",
                glowEnd: "2023-03-31",
                pageImages: ["image1.jpg", "image2.jpg"],
                backgroundColor: "#ffffff",
                foregroundColor: "#000000",
            });

            expect(result).toEqual(mockUpdatedSPG);
            expect(prisma.story_spg.update).toHaveBeenCalledWith({
                where: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                data: {
                    isListed: true,
                    price: 100,
                    circulation: 1000,
                    reportUrl: "https://example.com/report",
                    sharePercentage: 10,
                    imageUrl: "https://example.com/image.jpg",
                    preOrderStart: "2023-01-01",
                    preOrderEnd: "2023-01-31",
                    saleStart: "2023-02-01",
                    saleEnd: "2023-02-28",
                    glowStart: "2023-03-01",
                    glowEnd: "2023-03-31",
                    pageImages: ["image1.jpg", "image2.jpg"],
                    backgroundColor: "#ffffff",
                    foregroundColor: "#000000",
                },
                include: { artist: true },
            });
        });

        it("should update only provided fields", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.update.mockResolvedValue(mockUpdatedSPG);

            await updateSPGUtils({
                address: "0x1234567890123456789012345678901234567890",
                isListed: true,
                price: 100,
            });

            expect(prisma.story_spg.update).toHaveBeenCalledWith({
                where: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                data: {
                    isListed: true,
                    price: 100,
                },
                include: { artist: true },
            });
        });
    });

    describe("getTBAAddressForNFT", () => {
        const mockSPG = {
            id: "spg-123",
            address: "0x1234567890123456789012345678901234567890",
            networkId: "network-123",
            tbaRegistryAddress: "0x1111111111111111111111111111111111111111",
            tbaImplementationAddress:
                "0x2222222222222222222222222222222222222222",
        };

        const mockPublicClient = {
            chain: { id: 1 },
            readContract: jest.fn(),
        };

        it("should successfully get TBA address for NFT", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");

            const mockTBAAddress = "0x3333333333333333333333333333333333333333";

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(mockPublicClient);
            mockPublicClient.readContract.mockResolvedValue(mockTBAAddress);

            const result = await getTBAAddressForNFT({
                spgAddress: mockSPG.address,
                tokenId: 1,
            });

            expect(result).toBe(mockTBAAddress);
            expect(mockPublicClient.readContract).toHaveBeenCalledWith({
                address: mockSPG.tbaRegistryAddress,
                abi: expect.any(Array),
                functionName: "account",
                args: [
                    mockSPG.tbaImplementationAddress,
                    BigInt(1),
                    mockSPG.address,
                    BigInt(1),
                    BigInt(0),
                ],
            });
        });

        it("should return null when SPG not found", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.story_spg.findUnique.mockResolvedValue(null);

            const result = await getTBAAddressForNFT({
                spgAddress: "0x1234567890123456789012345678901234567890",
                tokenId: 1,
            });

            expect(result).toBeNull();
        });

        it("should return null when TBA registry address not found", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            const spgWithoutTBA = {
                ...mockSPG,
                tbaRegistryAddress: null,
            };

            prisma.story_spg.findUnique.mockResolvedValue(spgWithoutTBA);

            const result = await getTBAAddressForNFT({
                spgAddress: mockSPG.address,
                tokenId: 1,
            });

            expect(result).toBeNull();
        });

        it("should return null when TBA implementation address not found", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            const spgWithoutTBA = {
                ...mockSPG,
                tbaImplementationAddress: null,
            };

            prisma.story_spg.findUnique.mockResolvedValue(spgWithoutTBA);

            const result = await getTBAAddressForNFT({
                spgAddress: mockSPG.address,
                tokenId: 1,
            });

            expect(result).toBeNull();
        });

        it("should handle contract read errors", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(mockPublicClient);
            mockPublicClient.readContract.mockRejectedValue(
                new Error("Contract read failed")
            );

            const result = await getTBAAddressForNFT({
                spgAddress: mockSPG.address,
                tokenId: 1,
            });

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error getting TBA address:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should use default chain ID when not available", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");

            const publicClientWithoutChain = {
                ...mockPublicClient,
                chain: null,
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(publicClientWithoutChain);
            publicClientWithoutChain.readContract.mockResolvedValue(
                "0x3333333333333333333333333333333333333333"
            );

            await getTBAAddressForNFT({
                spgAddress: mockSPG.address,
                tokenId: 1,
            });

            expect(publicClientWithoutChain.readContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    args: expect.arrayContaining([
                        BigInt(1), // Default chain ID
                    ]),
                })
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle database errors in getSPG", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.findUnique.mockRejectedValue(
                new Error("Database error")
            );

            await expect(getSPG({ id: "spg-123" })).rejects.toThrow(
                "Database error"
            );

            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            consoleSpy.mockRestore();
        });

        it("should handle database errors in getSPGs", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.findMany.mockRejectedValue(
                new Error("Database error")
            );

            await expect(getSPGs()).rejects.toThrow("Database error");

            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            consoleSpy.mockRestore();
        });

        it("should handle database errors in updateSPG", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.update.mockRejectedValue(
                new Error("Database error")
            );

            await expect(
                updateSPG({
                    address: "0x1234567890123456789012345678901234567890",
                    name: "Updated",
                })
            ).rejects.toThrow("Database error");

            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            consoleSpy.mockRestore();
        });

        it("should handle database errors in updateSPGUtils", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.update.mockRejectedValue(
                new Error("Database error")
            );

            await expect(
                updateSPGUtils({
                    address: "0x1234567890123456789012345678901234567890",
                    isListed: true,
                })
            ).rejects.toThrow("Database error");

            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty logs in createSPG", async () => {
            const {
                fetchPublicClient,
                fetchWalletClient,
            } = require("../../../../app/story/client");

            const mockWalletClient = {
                account: {
                    address: "0x1234567890123456789012345678901234567890",
                },
                chain: { id: 1 },
                writeContract: jest.fn(),
            };

            const mockPublicClient = {
                simulateContract: jest.fn(),
                waitForTransactionReceipt: jest.fn(),
            };

            const validInput = {
                userId: "user-123",
                networkId: "network-123",
                walletAddress: "0x1234567890123456789012345678901234567890",
                contractAddress: "0x9876543210987654321098765432109876543210",
                name: "Test Collection",
                symbol: "TEST",
                selectedMetadata: {
                    id: "metadata-123",
                    cid: "metadata-cid",
                    url: "https://example.com/metadata.json",
                    type: "erc721-metadata",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    previewUrl: null,
                    previewWidth: null,
                    previewHeight: null,
                    previewMimeType: null,
                    previewSizeBytes: null,
                },
                artistId: "artist-123",
                tbaRegistry: "0x1111111111111111111111111111111111111111",
                tbaImplementation: "0x2222222222222222222222222222222222222222",
            };

            fetchPublicClient.mockResolvedValue(mockPublicClient);
            fetchWalletClient.mockResolvedValue(mockWalletClient);
            mockPublicClient.simulateContract.mockResolvedValue({
                request: { functionName: "deployStoryCollection" },
            });
            mockWalletClient.writeContract.mockResolvedValue("0xabc123");
            mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
                logs: [], // Empty logs
            });

            await expect(createSPG(validInput)).rejects.toThrow(
                "CollectionDeployed event not found"
            );
        });

        it("should handle large token IDs in getTBAAddressForNFT", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const {
                fetchPublicClient,
            } = require("../../../../app/story/client");

            const mockSPG = {
                id: "spg-123",
                address: "0x1234567890123456789012345678901234567890",
                networkId: "network-123",
                tbaRegistryAddress:
                    "0x1111111111111111111111111111111111111111",
                tbaImplementationAddress:
                    "0x2222222222222222222222222222222222222222",
            };

            const mockPublicClient = {
                chain: { id: 1 },
                readContract: jest.fn(),
            };

            prisma.story_spg.findUnique.mockResolvedValue(mockSPG);
            fetchPublicClient.mockResolvedValue(mockPublicClient);
            mockPublicClient.readContract.mockResolvedValue(
                "0x3333333333333333333333333333333333333333"
            );

            const largeTokenId = 999999999999999;

            await getTBAAddressForNFT({
                spgAddress: mockSPG.address,
                tokenId: largeTokenId,
            });

            expect(mockPublicClient.readContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    args: expect.arrayContaining([BigInt(largeTokenId)]),
                })
            );
        });
    });
});
