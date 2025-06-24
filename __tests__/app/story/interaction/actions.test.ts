import {
    getUserVerifiedSPGs,
    getWalletAddressVerifiedSPGs,
} from "@/app/story/interaction/actions";

// Mock Prisma Client
jest.mock("../../../../lib/prisma/client", () => ({
    prisma: {
        wallet: {
            findMany: jest.fn(),
        },
        story_spg: {
            findMany: jest.fn(),
        },
    },
}));

// Mock NFT actions
jest.mock("../../../../app/story/nft/actions", () => ({
    getOwners: jest.fn(),
}));

describe("Interaction Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserVerifiedSPGs", () => {
        const validInput = {
            userId: "user-123",
        };

        const mockWallets = [
            { address: "0x1111111111111111111111111111111111111111" },
            { address: "0x2222222222222222222222222222222222222222" },
        ];

        const mockSPGs = [
            {
                id: "spg-1",
                address: "0xspg1111111111111111111111111111111111111",
                artist: {
                    id: "artist-1",
                    name: "Artist One",
                },
                network: {
                    id: "network-1",
                    chainId: 1,
                    name: "Ethereum",
                },
            },
            {
                id: "spg-2",
                address: "0xspg2222222222222222222222222222222222222",
                artist: {
                    id: "artist-2",
                    name: "Artist Two",
                },
                network: {
                    id: "network-2",
                    chainId: 137,
                    name: "Polygon",
                },
            },
        ];

        const mockTokenOwners = [
            {
                tokenId: "1",
                owner: "0x1111111111111111111111111111111111111111",
            },
            {
                tokenId: "2",
                owner: "0x3333333333333333333333333333333333333333",
            },
            {
                tokenId: "3",
                owner: "0x2222222222222222222222222222222222222222",
            },
        ];

        it("should successfully get user verified SPGs", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            prisma.wallet.findMany.mockResolvedValue(mockWallets);
            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockResolvedValue(mockTokenOwners);

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                ...mockSPGs[0],
                verifiedTokens: [1, 3], // Tokens owned by user's wallets
            });
            expect(result[1]).toEqual({
                ...mockSPGs[1],
                verifiedTokens: [1, 3], // Same tokens for second SPG
            });

            expect(prisma.wallet.findMany).toHaveBeenCalledWith({
                where: { userId: validInput.userId },
                select: { address: true },
            });
            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                include: {
                    artist: true,
                    network: true,
                },
            });
            expect(getOwners).toHaveBeenCalledTimes(2);
        });

        it("should return empty array when no input provided", async () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

            const result = await getUserVerifiedSPGs();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "[getUserVerifiedSPGs] No input or userId",
                undefined,
                undefined
            );

            consoleSpy.mockRestore();
        });

        it("should return empty array when no userId provided", async () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

            const result = await getUserVerifiedSPGs({ userId: "" });

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "[getUserVerifiedSPGs] No input or userId",
                { userId: "" },
                ""
            );

            consoleSpy.mockRestore();
        });

        it("should handle case where user has no wallets", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            prisma.wallet.findMany.mockResolvedValue([]);
            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockResolvedValue(mockTokenOwners);

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toHaveLength(2);
            expect(result[0].verifiedTokens).toEqual([]);
            expect(result[1].verifiedTokens).toEqual([]);
        });

        it("should handle case where no SPGs exist", async () => {
            const { prisma } = require("../../../../lib/prisma/client");

            prisma.wallet.findMany.mockResolvedValue(mockWallets);
            prisma.story_spg.findMany.mockResolvedValue([]);

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toEqual([]);
        });

        it("should handle case where no token owners exist", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            prisma.wallet.findMany.mockResolvedValue(mockWallets);
            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockResolvedValue([]);

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toHaveLength(2);
            expect(result[0].verifiedTokens).toEqual([]);
            expect(result[1].verifiedTokens).toEqual([]);
        });

        it("should handle case-insensitive address matching", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const mixedCaseWallets = [
                { address: "0x1111111111111111111111111111111111111111" },
            ];

            const mixedCaseTokenOwners = [
                {
                    tokenId: "1",
                    owner: "0X1111111111111111111111111111111111111111", // Uppercase
                },
                {
                    tokenId: "2",
                    owner: "0x1111111111111111111111111111111111111111", // Lowercase
                },
            ];

            prisma.wallet.findMany.mockResolvedValue(mixedCaseWallets);
            prisma.story_spg.findMany.mockResolvedValue([mockSPGs[0]]);
            getOwners.mockResolvedValue(mixedCaseTokenOwners);

            const result = await getUserVerifiedSPGs(validInput);

            expect(result[0].verifiedTokens).toEqual([1, 2]);
        });

        it("should handle database errors gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.wallet.findMany.mockRejectedValue(
                new Error("Database connection failed")
            );

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error getting user verified SPGs:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should handle getOwners errors gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.wallet.findMany.mockResolvedValue(mockWallets);
            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockRejectedValue(new Error("Contract call failed"));

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error getting user verified SPGs:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should handle SPGs with null artist or network", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const spgsWithNulls = [
                {
                    ...mockSPGs[0],
                    artist: null,
                    network: null,
                },
            ];

            prisma.wallet.findMany.mockResolvedValue(mockWallets);
            prisma.story_spg.findMany.mockResolvedValue(spgsWithNulls);
            getOwners.mockResolvedValue(mockTokenOwners);

            const result = await getUserVerifiedSPGs(validInput);

            expect(result).toHaveLength(1);
            expect(result[0].artist).toBeNull();
            expect(result[0].network).toBeNull();
            expect(result[0].verifiedTokens).toEqual([1, 3]);
        });
    });

    describe("getWalletAddressVerifiedSPGs", () => {
        const validAddress = "0x1111111111111111111111111111111111111111";

        const mockSPGs = [
            {
                id: "spg-1",
                address: "0xspg1111111111111111111111111111111111111",
                artist: {
                    id: "artist-1",
                    name: "Artist One",
                },
                network: {
                    id: "network-1",
                    chainId: 1,
                    name: "Ethereum",
                },
            },
        ];

        const mockTokenOwners = [
            {
                tokenId: "1",
                owner: "0x1111111111111111111111111111111111111111",
            },
            {
                tokenId: "2",
                owner: "0x2222222222222222222222222222222222222222",
            },
        ];

        it("should successfully get wallet address verified SPGs", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockResolvedValue(mockTokenOwners);

            const result = await getWalletAddressVerifiedSPGs(validAddress);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                ...mockSPGs[0],
                verifiedTokens: [1], // Only token owned by the specific address
            });

            expect(prisma.story_spg.findMany).toHaveBeenCalledWith({
                include: {
                    artist: true,
                    network: true,
                },
            });
            expect(getOwners).toHaveBeenCalledWith({
                spgAddress: mockSPGs[0].address,
            });
        });

        it("should return empty array when no address provided", async () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

            const result = await getWalletAddressVerifiedSPGs("");

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "[getWalletAddressVerifiedSPGs] No address",
                ""
            );

            consoleSpy.mockRestore();
        });

        it("should handle case-insensitive address matching", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const mixedCaseTokenOwners = [
                {
                    tokenId: "1",
                    owner: "0X1111111111111111111111111111111111111111", // Uppercase
                },
                {
                    tokenId: "2",
                    owner: "0x2222222222222222222222222222222222222222",
                },
            ];

            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockResolvedValue(mixedCaseTokenOwners);

            const result = await getWalletAddressVerifiedSPGs(
                validAddress.toLowerCase()
            );

            expect(result[0].verifiedTokens).toEqual([1]);
        });

        it("should handle case where address owns no tokens", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const noMatchingOwners = [
                {
                    tokenId: "1",
                    owner: "0x3333333333333333333333333333333333333333",
                },
            ];

            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockResolvedValue(noMatchingOwners);

            const result = await getWalletAddressVerifiedSPGs(validAddress);

            expect(result).toHaveLength(1);
            expect(result[0].verifiedTokens).toEqual([]);
        });

        it("should handle database errors gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.findMany.mockRejectedValue(
                new Error("Database connection failed")
            );

            const result = await getWalletAddressVerifiedSPGs(validAddress);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error getting user verified SPGs:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should handle getOwners errors gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            prisma.story_spg.findMany.mockResolvedValue(mockSPGs);
            getOwners.mockRejectedValue(new Error("Contract call failed"));

            const result = await getWalletAddressVerifiedSPGs(validAddress);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error getting user verified SPGs:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should handle multiple SPGs correctly", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const multipleSPGs = [
                mockSPGs[0],
                {
                    id: "spg-2",
                    address: "0xspg2222222222222222222222222222222222222",
                    artist: { id: "artist-2", name: "Artist Two" },
                    network: { id: "network-2", chainId: 137, name: "Polygon" },
                },
            ];

            prisma.story_spg.findMany.mockResolvedValue(multipleSPGs);
            getOwners
                .mockResolvedValueOnce([
                    { tokenId: "1", owner: validAddress },
                    {
                        tokenId: "2",
                        owner: "0x3333333333333333333333333333333333333333",
                    },
                ])
                .mockResolvedValueOnce([
                    { tokenId: "3", owner: validAddress },
                    { tokenId: "4", owner: validAddress },
                ]);

            const result = await getWalletAddressVerifiedSPGs(validAddress);

            expect(result).toHaveLength(2);
            expect(result[0].verifiedTokens).toEqual([1]);
            expect(result[1].verifiedTokens).toEqual([3, 4]);
        });
    });

    describe("Edge Cases and Performance", () => {
        it("should handle large number of SPGs efficiently", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const largeSPGList = Array.from({ length: 100 }, (_, i) => ({
                id: `spg-${i}`,
                address: `0xspg${i.toString().padStart(40, "0")}`,
                artist: { id: `artist-${i}`, name: `Artist ${i}` },
                network: {
                    id: `network-${i}`,
                    chainId: i,
                    name: `Network ${i}`,
                },
            }));

            prisma.wallet.findMany.mockResolvedValue([
                { address: "0x1111111111111111111111111111111111111111" },
            ]);
            prisma.story_spg.findMany.mockResolvedValue(largeSPGList);
            getOwners.mockResolvedValue([
                {
                    tokenId: "1",
                    owner: "0x1111111111111111111111111111111111111111",
                },
            ]);

            const result = await getUserVerifiedSPGs({ userId: "user-123" });

            expect(result).toHaveLength(100);
            expect(getOwners).toHaveBeenCalledTimes(100);
        });

        it("should handle empty token ID arrays", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            prisma.wallet.findMany.mockResolvedValue([
                { address: "0x1111111111111111111111111111111111111111" },
            ]);
            prisma.story_spg.findMany.mockResolvedValue([
                {
                    id: "spg-1",
                    address: "0xspg1111111111111111111111111111111111111",
                    artist: null,
                    network: null,
                },
            ]);
            getOwners.mockResolvedValue([]);

            const result = await getUserVerifiedSPGs({ userId: "user-123" });

            expect(result).toHaveLength(1);
            expect(result[0].verifiedTokens).toEqual([]);
        });

        it("should handle invalid token IDs gracefully", async () => {
            const { prisma } = require("../../../../lib/prisma/client");
            const { getOwners } = require("../../../../app/story/nft/actions");

            const invalidTokenOwners = [
                {
                    tokenId: "invalid",
                    owner: "0x1111111111111111111111111111111111111111",
                },
                {
                    tokenId: "NaN",
                    owner: "0x1111111111111111111111111111111111111111",
                },
                {
                    tokenId: "123",
                    owner: "0x1111111111111111111111111111111111111111",
                },
            ];

            prisma.wallet.findMany.mockResolvedValue([
                { address: "0x1111111111111111111111111111111111111111" },
            ]);
            prisma.story_spg.findMany.mockResolvedValue([
                {
                    id: "spg-1",
                    address: "0xspg1111111111111111111111111111111111111",
                    artist: null,
                    network: null,
                },
            ]);
            getOwners.mockResolvedValue(invalidTokenOwners);

            const result = await getUserVerifiedSPGs({ userId: "user-123" });

            expect(result[0].verifiedTokens).toEqual([NaN, NaN, 123]);
        });
    });
});
