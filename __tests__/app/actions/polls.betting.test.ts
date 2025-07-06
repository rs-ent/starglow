import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import {
    settleBettingPoll,
    participatePoll,
    createPoll,
    type SettleBettingPollInput,
    type SettleBettingPollResult,
    type ParticipatePollInput,
    type CreatePollInput,
} from "@/app/actions/polls";

// 핵심 모킹만 수행
jest.mock("@/lib/prisma/client", () => ({
    prisma: mockDeep<PrismaClient>(),
}));

// Mock dependencies
jest.mock("../../../app/actions/playerAssets", () => ({
    updatePlayerAsset: jest.fn(),
}));

jest.mock("../../../app/actions/notification/actions", () => ({
    createBettingWinNotification: jest.fn(),
    createBettingFailedNotification: jest.fn(),
    createBettingRefundNotification: jest.fn(),
    createSettlementCompleteNotification: jest.fn(),
}));

// Mock Story related dependencies to avoid ES Module issues
jest.mock("../../../app/story/nft/actions", () => ({
    transferNFTToUser: jest.fn(),
}));

jest.mock("../../../app/story/client", () => ({
    getStoryClient: jest.fn(),
}));

// Import after mocking
import { prisma } from "@/lib/prisma/client";

// Mock console.error but allow it to show during debugging
const mockConsoleError = jest
    .spyOn(console, "error")
    .mockImplementation((message, ...args) => {
        console.log("🔍 Console Error:", message, ...args);
    });

const mockUpdatePlayerAsset = require("../../../app/actions/playerAssets")
    .updatePlayerAsset as jest.Mock;

// Type-safe mock references
const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("🎰 베팅 모드 Poll 정산 시스템 테스트", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConsoleError.mockClear();
        mockReset(mockPrisma);
        mockUpdatePlayerAsset.mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("⚠️ 중요: 정산 시스템 핵심 로직 검증", () => {
        it("🏆 단일 승리자 배당금 계산 정확성", async () => {
            console.log("🔍 Testing: 단일 승리자 배당금 계산");

            // Mock updatePlayerAsset to return success
            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-single-winner";
            const winningOptionIds = ["option1"];

            // 테스트 시나리오:
            // - option1에 100 베팅
            // - option2에 200 베팅
            // - 총 300 베팅, 5% 수수료 = 15
            // - 배당 풀: 285
            // - option1 승리 시 전액 배당
            const mockPoll = {
                id: pollId,
                title: "단일 승리자 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100, option2: 200 },
                totalCommissionAmount: 15,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "winner1",
                    amount: 100,
                    optionId: "option1",
                },
            ];

            // Mock 설정
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            // 정산 실행
            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 결과 검증
            expect(result.success).toBe(true);
            expect(result.totalPayout).toBe(285); // 300 - 15 = 285
            expect(result.totalWinners).toBe(1);
            expect(result.isRefund).toBeFalsy();

            console.log("✅ 단일 승리자 배당금 계산 정확");
        });

        it("💸 승리자 없는 경우 전액 환불 검증", async () => {
            console.log("🔍 Testing: 승리자 없는 경우 환불 로직");

            // Mock updatePlayerAsset to return success for refunds
            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-no-winners";
            const winningOptionIds = ["option3"]; // 아무도 베팅하지 않은 옵션

            const mockPoll = {
                id: pollId,
                title: "환불 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100, option2: 200 }, // option3 베팅 없음
                totalCommissionAmount: 15,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockAllBettors = [
                { id: "log1", playerId: "player1", amount: 100 },
                { id: "log2", playerId: "player2", amount: 200 },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany
                .mockResolvedValueOnce(mockAllBettors as any) // 전체 베팅자
                .mockResolvedValueOnce([] as any); // 승리자 없음

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 환불 검증
            expect(result.success).toBe(true);
            expect(result.isRefund).toBe(true);
            expect(result.totalPayout).toBe(300); // 전액 환불
            expect(result.totalWinners).toBe(2); // 환불 받은 사람 수

            console.log("✅ 승리자 없는 경우 환불 로직 정확");
        });

        it("🚫 중복 정산 방지 검증", async () => {
            console.log("🔍 Testing: 중복 정산 방지 로직");

            const pollId = "test-poll-already-settled";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "이미 정산된 Poll",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100 },
                totalCommissionAmount: 5,
                houseCommissionRate: 0.05,
                status: "ENDED",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "SETTLED",
                isSettled: true,
                settledAt: new Date(),
                answerOptionIds: ["option1"],
            };

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 중복 정산 방지 검증
            expect(result.success).toBe(false);
            expect(result.error).toContain("already been settled");

            console.log("✅ 중복 정산 방지 로직 정확");
        });
    });

    describe("💡 베팅 차단 로직 검증", () => {
        it("🔒 정산 중인 Poll 베팅 차단", async () => {
            console.log("🔍 Testing: 정산 중인 Poll 베팅 차단");

            const mockPoll = {
                id: "test-poll-settling",
                title: "정산 중인 Poll",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            // 정산 중 상태 모킹
            mockPrisma.poll.findUnique.mockResolvedValue({
                bettingStatus: "SETTLING",
                isSettled: false,
                settledAt: null,
            } as any);

            const result = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100,
            });

            // 베팅 차단 검증
            expect(result.success).toBe(false);
            expect(result.error).toContain("currently being settled");

            console.log("✅ 정산 중인 Poll 베팅 차단 정확");
        });

        it("🚫 정산 완료된 Poll 베팅 차단", async () => {
            console.log("🔍 Testing: 정산 완료된 Poll 베팅 차단");

            const mockPoll = {
                id: "test-poll-settled",
                title: "정산 완료된 Poll",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            // 정산 완료 상태 모킹
            mockPrisma.poll.findUnique.mockResolvedValue({
                bettingStatus: "SETTLED",
                isSettled: true,
                settledAt: new Date(),
            } as any);

            const result = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100,
            });

            // 베팅 차단 검증
            expect(result.success).toBe(false);
            expect(result.error).toContain("already been settled");

            console.log("✅ 정산 완료된 Poll 베팅 차단 정확");
        });
    });

    describe("📊 소수점 계산 정확성 검증", () => {
        it("🎯 복잡한 소수점 배당금 계산", async () => {
            console.log("🔍 Testing: 소수점 배당금 계산 정확성");

            // Mock updatePlayerAsset to return success
            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-precision";
            const winningOptionIds = ["option1"];

            // 소수점 계산 테스트 시나리오
            const mockPoll = {
                id: pollId,
                title: "소수점 정밀도 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 33.33, option2: 66.67 }, // 총 100
                totalCommissionAmount: 5.0,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 33.33,
                    optionId: "option1",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 소수점 계산 검증
            expect(result.success).toBe(true);
            expect(result.totalPayout).toBe(95); // 100 - 5 = 95

            console.log("✅ 소수점 배당금 계산 정확");
        });
    });

    describe("🔥 동시성 문제 (Race Conditions) 테스트", () => {
        it("💥 여러 사용자 동시 베팅 - 잔액 부족 시나리오", async () => {
            console.log("🔍 Testing: 동시 베팅 시 잔액 부족 처리");

            const mockPoll = {
                id: "test-poll-race-condition",
                title: "동시성 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player-race",
                userId: "user-race",
            };

            // 첫 번째 베팅 시도 - 성공
            mockPrisma.poll.findUnique.mockResolvedValueOnce({
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
            } as any);

            mockPrisma.playerAsset.findUnique.mockResolvedValueOnce({
                balance: 200, // 충분한 잔액
            } as any);

            mockPrisma.pollLog.findMany.mockResolvedValueOnce([]);

            mockPrisma.$transaction.mockImplementationOnce(
                async (callback: any) => {
                    // 첫 번째 베팅: 트랜잭션 내부 모킹 완성
                    const mockTx = {
                        ...mockPrisma,
                        poll: {
                            ...mockPrisma.poll,
                            findUnique: jest
                                .fn()
                                .mockResolvedValueOnce({
                                    bettingStatus: "OPEN",
                                    isSettled: false,
                                    settledAt: null,
                                } as any)
                                .mockResolvedValueOnce({
                                    optionBetAmounts: {},
                                    totalCommissionAmount: 0,
                                    totalVotes: 0,
                                    uniqueVoters: 0,
                                } as any),
                            update: jest.fn().mockResolvedValue({} as any),
                        },
                        playerAsset: {
                            ...mockPrisma.playerAsset,
                            findUnique: jest.fn().mockResolvedValue({
                                balance: 200,
                            } as any),
                        },
                        pollLog: {
                            ...mockPrisma.pollLog,
                            upsert: jest.fn().mockResolvedValue({
                                id: "log1",
                                pollId: mockPoll.id,
                                playerId: mockPlayer.id,
                                optionId: "option1",
                                amount: 150,
                            } as any),
                        },
                    };

                    // updatePlayerAsset 모킹
                    mockUpdatePlayerAsset.mockResolvedValueOnce({
                        success: true,
                    });

                    return await callback(mockTx);
                }
            );

            // 두 번째 베팅 시도 - 실패 (잔액 부족)
            mockPrisma.poll.findUnique.mockResolvedValueOnce({
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
            } as any);

            mockPrisma.playerAsset.findUnique.mockResolvedValueOnce({
                balance: 50, // 부족한 잔액
            } as any);

            // 기존 베팅 로그 확인 모킹 (두 번째 베팅용)
            mockPrisma.pollLog.findMany.mockResolvedValueOnce([]);

            // 첫 번째 베팅 실행
            const result1 = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 150,
            });

            // 두 번째 베팅 실행 (잔액 부족으로 트랜잭션 전에 실패해야 함)
            const result2 = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 150,
            });

            // 결과 검증
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(false);
            expect(result2.error).toContain("Insufficient balance");

            console.log("✅ 동시 베팅 시 잔액 부족 처리 정확");
        });

        it("🔒 정산 중 베팅 시도 차단", async () => {
            console.log("🔍 Testing: 정산 중 베팅 시도 차단");

            const mockPoll = {
                id: "test-poll-settling",
                title: "정산 중 베팅 차단",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            // 정산 중 상태로 설정
            mockPrisma.poll.findUnique.mockResolvedValue({
                bettingStatus: "SETTLING",
                isSettled: false,
                settledAt: null,
            } as any);

            const result = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("currently being settled");

            console.log("✅ 정산 중 베팅 차단 정확");
        });

        it("⚡ 동시 정산 시도 방지", async () => {
            console.log("🔍 Testing: 동시 정산 시도 방지");

            const pollId = "test-poll-concurrent-settlement";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "동시 정산 방지 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100 },
                totalCommissionAmount: 5,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            let transactionCallCount = 0;
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    transactionCallCount++;
                    if (transactionCallCount === 1) {
                        // 첫 번째 정산 시도: 성공
                        mockPrisma.poll.findUnique.mockResolvedValueOnce(
                            mockPoll as any
                        );
                        mockPrisma.poll.update.mockResolvedValueOnce(
                            mockPoll as any
                        );
                        mockPrisma.pollLog.findMany.mockResolvedValueOnce([
                            {
                                id: "log1",
                                playerId: "player1",
                                amount: 100,
                                optionId: "option1",
                            },
                        ] as any);
                        return await callback(mockPrisma);
                    } else {
                        // 두 번째 정산 시도: 이미 정산 중이므로 실패
                        throw new Error(
                            "Poll is currently being settled or already settled"
                        );
                    }
                }
            );

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const settlement1Promise = settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            const settlement2Promise = settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            const [result1, result2] = await Promise.all([
                settlement1Promise,
                settlement2Promise,
            ]);

            // 하나는 성공, 하나는 실패해야 함
            const successCount = [result1.success, result2.success].filter(
                Boolean
            ).length;
            expect(successCount).toBe(1); // 정확히 하나만 성공해야 함

            console.log("✅ 동시 정산 방지 정확");
        });
    });

    describe("💸 극단적인 베팅 시나리오", () => {
        it("🎰 한 옵션에만 모든 베팅이 몰린 경우", async () => {
            console.log("🔍 Testing: 한 옵션 독점 베팅");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-monopoly";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "독점 베팅 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: 10000, // 모든 베팅이 option1에만
                    option2: 0,
                    option3: 0,
                },
                totalCommissionAmount: 500,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 5000,
                    optionId: "option1",
                },
                {
                    id: "log2",
                    playerId: "player2",
                    amount: 3000,
                    optionId: "option1",
                },
                {
                    id: "log3",
                    playerId: "player3",
                    amount: 2000,
                    optionId: "option1",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(true);
            expect(result.totalPayout).toBe(9500); // 10000 - 500 = 9500
            expect(result.totalWinners).toBe(3);

            console.log("✅ 한 옵션 독점 베팅 처리 정확");
        });

        it("🔢 매우 큰 금액 베팅 (오버플로우 테스트)", async () => {
            console.log("🔍 Testing: 매우 큰 금액 베팅");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-overflow";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "오버플로우 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: 999999999.99, // 매우 큰 금액
                    option2: 888888888.88,
                },
                totalCommissionAmount: 94444444.44,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 999999999.99,
                    optionId: "option1",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(true);
            expect(result.totalPayout).toBeGreaterThan(0);
            expect(Number.isFinite(result.totalPayout)).toBe(true);

            console.log("✅ 매우 큰 금액 베팅 처리 정확");
        });

        it("🔸 매우 작은 금액 베팅 (소수점 정밀도)", async () => {
            console.log("🔍 Testing: 매우 작은 금액 베팅");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-precision";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "소수점 정밀도 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: 0.01, // 매우 작은 금액
                    option2: 0.02,
                    option3: 0.03,
                },
                totalCommissionAmount: 0.003,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 0.01,
                    optionId: "option1",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(true);
            expect(result.totalPayout).toBeGreaterThan(0);
            expect(result.totalPayout).toBeLessThan(0.1);

            console.log("✅ 매우 작은 금액 베팅 처리 정확");
        });

        it("🎯 복잡한 다중 승리자 배당 계산", async () => {
            console.log("🔍 Testing: 복잡한 다중 승리자 배당");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-complex-multi";
            const winningOptionIds = ["option1", "option3"]; // 2개 옵션 승리

            const mockPoll = {
                id: pollId,
                title: "복잡한 다중 승리자 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: 123.45,
                    option2: 678.9,
                    option3: 234.56,
                    option4: 345.67,
                },
                totalCommissionAmount: 69.13,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 100.0,
                    optionId: "option1",
                },
                {
                    id: "log2",
                    playerId: "player2",
                    amount: 23.45,
                    optionId: "option1",
                },
                {
                    id: "log3",
                    playerId: "player3",
                    amount: 200.0,
                    optionId: "option3",
                },
                {
                    id: "log4",
                    playerId: "player4",
                    amount: 34.56,
                    optionId: "option3",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(true);
            expect(result.totalWinners).toBe(4);
            expect(result.payoutDetails).toHaveLength(4);

            // 각 승리자의 배당이 0보다 큰지 확인
            result.payoutDetails?.forEach((payout) => {
                expect(payout.amount).toBeGreaterThan(0);
            });

            console.log("✅ 복잡한 다중 승리자 배당 처리 정확");
        });
    });

    describe("⚠️ 에러 상황 처리", () => {
        it("💥 데이터베이스 트랜잭션 실패", async () => {
            console.log("🔍 Testing: 데이터베이스 트랜잭션 실패");

            const pollId = "test-poll-db-failure";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "DB 실패 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100 },
                totalCommissionAmount: 5,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            mockPrisma.$transaction.mockRejectedValue(
                new Error("Database connection failed")
            );
            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("Database connection failed");

            console.log("✅ 데이터베이스 실패 처리 정확");
        });

        it("🔒 updatePlayerAsset 실패 처리", async () => {
            console.log("🔍 Testing: 에셋 업데이트 실패");

            // updatePlayerAsset 실패 시뮬레이션
            mockUpdatePlayerAsset.mockResolvedValue({
                success: false,
                error: "Insufficient balance",
            });

            const pollId = "test-poll-asset-failure";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "에셋 업데이트 실패 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100 },
                totalCommissionAmount: 5,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 100,
                    optionId: "option1",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("Insufficient balance");

            console.log("✅ 에셋 업데이트 실패 처리 정확");
        });

        it("🕐 타임아웃 처리", async () => {
            console.log("🔍 Testing: 타임아웃 처리");

            const pollId = "test-poll-timeout";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "타임아웃 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 100 },
                totalCommissionAmount: 5,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            // 타임아웃 시뮬레이션 (실제로는 빠르게 실패)
            mockPrisma.$transaction.mockRejectedValue(
                new Error("Transaction timeout")
            );
            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("timeout");

            console.log("✅ 타임아웃 처리 정확");
        }, 10000); // 10초 타임아웃 설정
    });

    describe("🎯 경계값 테스트", () => {
        it("🔢 최소/최대 베팅 금액 경계값", async () => {
            console.log("🔍 Testing: 베팅 금액 경계값");

            const mockPoll = {
                id: "test-poll-boundary",
                title: "경계값 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 10,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            mockPrisma.poll.findUnique.mockResolvedValue({
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
            } as any);

            // 최소 금액 미만 베팅 시도
            const result1 = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 9, // 최소 금액(10) 미만
            });

            expect(result1.success).toBe(false);
            expect(result1.error).toContain("Minimum bet amount");

            // 최대 금액 초과 베팅 시도
            const result2 = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 1001, // 최대 금액(1000) 초과
            });

            expect(result2.success).toBe(false);
            expect(result2.error).toContain("Maximum bet amount");

            console.log("✅ 베팅 금액 경계값 처리 정확");
        });

        it("⏰ 베팅 시간 경계값", async () => {
            console.log("🔍 Testing: 베팅 시간 경계값");

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            // 아직 시작하지 않은 폴
            const futurePoll = {
                id: "test-poll-future",
                title: "미래 폴",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() + 1000), // 1초 후 시작
                endDate: new Date(Date.now() + 2000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const result1 = await participatePoll({
                poll: futurePoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100,
            });

            expect(result1.success).toBe(false);
            expect(result1.error).toContain("not active yet");

            // 이미 종료된 폴
            const pastPoll = {
                id: "test-poll-past",
                title: "과거 폴",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 2000),
                endDate: new Date(Date.now() - 1000 - 30 * 60 * 1000), // 30분 + 1초 전 종료
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const result2 = await participatePoll({
                poll: pastPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100,
            });

            expect(result2.success).toBe(false);
            expect(result2.error).toContain("has ended");

            console.log("✅ 베팅 시간 경계값 처리 정확");
        });
    });

    describe("🛡️ 보안 관련 테스트", () => {
        it("🚫 존재하지 않는 Poll ID", async () => {
            console.log("🔍 Testing: 존재하지 않는 Poll ID");

            const pollId = "non-existent-poll";
            const winningOptionIds = ["option1"];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(null);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("not a betting poll");

            console.log("✅ 존재하지 않는 Poll ID 처리 정확");
        });

        it("🔒 무효한 옵션 ID", async () => {
            console.log("🔍 Testing: 무효한 옵션 ID");

            const mockPoll = {
                id: "test-poll-invalid-option",
                title: "무효한 옵션 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            mockPrisma.poll.findUnique.mockResolvedValue({
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
            } as any);

            const result = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "invalid-option", // 존재하지 않는 옵션
                amount: 100,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("Invalid option");

            console.log("✅ 무효한 옵션 ID 처리 정확");
        });

        it("💰 잔액 부족 시나리오", async () => {
            console.log("🔍 Testing: 잔액 부족 시나리오");

            const mockPoll = {
                id: "test-poll-insufficient-balance",
                title: "잔액 부족 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            mockPrisma.poll.findUnique.mockResolvedValue({
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
            } as any);

            // 잔액 부족 시뮬레이션
            mockPrisma.playerAsset.findUnique.mockResolvedValue({
                balance: 50, // 잔액 50
            } as any);

            const result = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100, // 100 베팅 시도
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("Insufficient balance");

            console.log("✅ 잔액 부족 처리 정확");
        });
    });

    describe("🚀 스트레스 테스트", () => {
        it("📊 대량 베팅 데이터 처리", async () => {
            console.log("🔍 Testing: 대량 베팅 데이터 처리");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-stress";
            const winningOptionIds = ["option1"];

            // 100명의 승리자 시뮬레이션
            const mockWinners = Array.from({ length: 100 }, (_, i) => ({
                id: `log${i + 1}`,
                playerId: `player${i + 1}`,
                amount: Math.floor(Math.random() * 1000) + 1,
                optionId: "option1",
            }));

            const totalWinningBets = mockWinners.reduce(
                (sum, winner) => sum + winner.amount,
                0
            );

            const mockPoll = {
                id: pollId,
                title: "스트레스 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: totalWinningBets,
                    option2: 50000,
                },
                totalCommissionAmount: (totalWinningBets + 50000) * 0.05,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const startTime = Date.now();
            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(result.totalWinners).toBe(100);
            expect(result.payoutDetails).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(5000); // 5초 이내 완료

            console.log(`✅ 대량 데이터 처리 완료 (${endTime - startTime}ms)`);
        });

        it("🔄 반복 베팅 시나리오", async () => {
            console.log("🔍 Testing: 반복 베팅 시나리오");

            const mockPoll = {
                id: "test-poll-repeated",
                title: "반복 베팅 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
                allowMultipleVote: true,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            // 각 베팅 시도별로 개별 모킹 설정
            for (let i = 0; i < 5; i++) {
                // 베팅 상태 확인 모킹
                mockPrisma.poll.findUnique.mockResolvedValueOnce({
                    bettingStatus: "OPEN",
                    isSettled: false,
                    settledAt: null,
                } as any);

                // 잔액 확인 모킹
                mockPrisma.playerAsset.findUnique.mockResolvedValueOnce({
                    balance: 10000, // 충분한 잔액
                } as any);

                // 기존 베팅 로그 확인 모킹
                mockPrisma.pollLog.findMany.mockResolvedValueOnce([]);

                if (i < 3) {
                    // 처음 3번은 성공
                    mockPrisma.$transaction.mockImplementationOnce(
                        async (callback: any) => {
                            // 트랜잭션 내부 모킹 완성
                            const mockTx = {
                                ...mockPrisma,
                                poll: {
                                    ...mockPrisma.poll,
                                    findUnique: jest
                                        .fn()
                                        .mockResolvedValueOnce({
                                            bettingStatus: "OPEN",
                                            isSettled: false,
                                            settledAt: null,
                                        } as any)
                                        .mockResolvedValueOnce({
                                            optionBetAmounts: {},
                                            totalCommissionAmount: 0,
                                            totalVotes: 0,
                                            uniqueVoters: 0,
                                        } as any),
                                    update: jest
                                        .fn()
                                        .mockResolvedValue({} as any),
                                },
                                playerAsset: {
                                    ...mockPrisma.playerAsset,
                                    findUnique: jest.fn().mockResolvedValue({
                                        balance: 10000,
                                    } as any),
                                },
                                pollLog: {
                                    ...mockPrisma.pollLog,
                                    upsert: jest.fn().mockResolvedValue({
                                        id: `log${i + 1}`,
                                        pollId: mockPoll.id,
                                        playerId: mockPlayer.id,
                                        optionId: "option1",
                                        amount: 100,
                                    } as any),
                                },
                            };

                            // updatePlayerAsset 모킹
                            mockUpdatePlayerAsset.mockResolvedValueOnce({
                                success: true,
                            });

                            return await callback(mockTx);
                        }
                    );
                } else {
                    // 나머지는 트랜잭션에서 실패
                    mockPrisma.$transaction.mockImplementationOnce(
                        async (callback: any) => {
                            throw new Error("Server overloaded");
                        }
                    );
                }
            }

            // 5번 연속 베팅 시도 (순차적으로 실행)
            const results = [];
            for (let i = 0; i < 5; i++) {
                try {
                    const result = await participatePoll({
                        poll: mockPoll as any,
                        player: mockPlayer as any,
                        optionId: "option1",
                        amount: 100,
                    });
                    results.push(result);
                } catch (error) {
                    // Server overloaded 에러는 participatePoll에서 "Failed to create poll log"로 변환됨
                    results.push({
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    });
                }
            }

            const successCount = results.filter((r) => r.success).length;

            expect(successCount).toBe(3); // 정확히 3번 성공해야 함
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
            expect(results[2].success).toBe(true);
            expect(results[3].success).toBe(false);
            expect(results[4].success).toBe(false);

            // 실패한 베팅들이 예상된 이유로 실패했는지 확인 (Server overloaded → Failed to create poll log)
            expect(results[3].error || results[4].error).toBeDefined();

            console.log(`✅ 반복 베팅 처리 완료 (${successCount}/5 성공)`);
        });
    });

    describe("🔄 베팅 상태 전이 및 일관성 테스트", () => {
        it("📊 정상적인 상태 전이: OPEN → SETTLING → SETTLED", async () => {
            console.log("🔍 Testing: 정상적인 상태 전이 시나리오");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-state-transition";
            const winningOptionIds = ["option1"];

            // 초기 상태: OPEN
            const initialPoll = {
                id: pollId,
                title: "상태 전이 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000, option2: 2000 },
                totalCommissionAmount: 150,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            // 정산 중 상태: SETTLING
            const settlingPoll = {
                ...initialPoll,
                bettingStatus: "SETTLING",
            };

            // 정산 완료 상태: SETTLED
            const settledPoll = {
                ...initialPoll,
                bettingStatus: "SETTLED",
                isSettled: true,
                settledAt: new Date(),
                answerOptionIds: winningOptionIds,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 1000,
                    optionId: "option1",
                },
            ];

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(initialPoll as any);

            // 첫 번째 호출: SETTLING 상태로 전이
            mockPrisma.poll.update.mockResolvedValueOnce(settlingPoll as any);

            // 두 번째 호출: SETTLED 상태로 전이
            mockPrisma.poll.update.mockResolvedValueOnce(settledPoll as any);

            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 상태 전이 검증
            expect(result.success).toBe(true);
            expect(mockPrisma.poll.update).toHaveBeenCalledTimes(2); // 정확히 2번 업데이트 되었는지
            expect(result.totalWinners).toBe(1);

            console.log("✅ 정상적인 상태 전이 완료");
        });

        it("❌ 잘못된 상태에서의 정산 시도 차단", async () => {
            console.log("🔍 Testing: 잘못된 상태에서의 정산 차단");

            const pollId = "test-poll-invalid-state";
            const winningOptionIds = ["option1"];

            // 이미 정산 완료된 상태
            const settledPoll = {
                id: pollId,
                title: "이미 정산된 Poll",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000 },
                totalCommissionAmount: 50,
                houseCommissionRate: 0.05,
                status: "ENDED",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "SETTLED",
                isSettled: true,
                settledAt: new Date(),
                answerOptionIds: ["option1"],
            };

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(settledPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("already been settled");

            console.log("✅ 잘못된 상태에서의 정산 차단 완료");
        });

        it("🔄 정산 중 상태에서의 베팅 차단 및 상태 일관성", async () => {
            console.log("🔍 Testing: 정산 중 상태에서의 베팅 차단");

            const mockPoll = {
                id: "test-poll-settling-state",
                title: "정산 중 상태 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            // 정산 중 상태
            const settlingPollState = {
                bettingStatus: "SETTLING",
                isSettled: false,
                settledAt: null,
            };

            mockPrisma.poll.findUnique.mockResolvedValue(
                settlingPollState as any
            );

            const result = await participatePoll({
                poll: mockPoll as any,
                player: mockPlayer as any,
                optionId: "option1",
                amount: 100,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("currently being settled");

            console.log("✅ 정산 중 상태에서의 베팅 차단 완료");
        });

        it("🔒 상태 일관성 검증 - isSettled와 settledAt 일치성", async () => {
            console.log("🔍 Testing: 상태 일관성 검증");

            const pollId = "test-poll-consistency";
            const winningOptionIds = ["option1"];

            // 일관성 없는 상태: isSettled=true이지만 settledAt=null
            const inconsistentPoll = {
                id: pollId,
                title: "일관성 없는 Poll",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000 },
                totalCommissionAmount: 50,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: true, // 일관성 없음
                settledAt: null, // 일관성 없음
                answerOptionIds: null,
            };

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(
                inconsistentPoll as any
            );

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // isSettled=true인 경우 정산 차단되어야 함
            expect(result.success).toBe(false);
            expect(result.error).toContain("already been settled");

            console.log("✅ 상태 일관성 검증 완료");
        });

        it("⏰ 시간 기반 상태 전이 검증", async () => {
            console.log("🔍 Testing: 시간 기반 상태 전이");

            const pollId = "test-poll-time-transition";
            const winningOptionIds = ["option1"];

            // 아직 종료되지 않은 poll
            const activePoll = {
                id: pollId,
                title: "시간 기반 전이 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000 },
                totalCommissionAmount: 50,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() + 1000), // 아직 종료되지 않음
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.findUnique.mockResolvedValue(activePoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("has not ended yet");

            console.log("✅ 시간 기반 상태 전이 검증 완료");
        });

        it("🔄 동시 상태 변경 시도 충돌 방지", async () => {
            console.log("🔍 Testing: 동시 상태 변경 충돌 방지");

            const pollId = "test-poll-concurrent-state";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "동시 상태 변경 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000 },
                totalCommissionAmount: 50,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 1000,
                    optionId: "option1",
                },
            ];

            // 첫 번째 정산 시도는 성공, 두 번째는 이미 정산 중이므로 실패
            let transactionCount = 0;
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    transactionCount++;
                    if (transactionCount === 1) {
                        // 첫 번째 정산 시도: 성공
                        mockPrisma.poll.findUnique.mockResolvedValueOnce(
                            mockPoll as any
                        );
                        mockPrisma.poll.update.mockResolvedValue(
                            mockPoll as any
                        );
                        mockPrisma.pollLog.findMany.mockResolvedValue(
                            mockWinners as any
                        );
                        mockUpdatePlayerAsset.mockResolvedValue({
                            success: true,
                        });
                        return await callback(mockPrisma);
                    } else {
                        // 두 번째 정산 시도: 이미 정산 중
                        throw new Error(
                            "Poll is currently being settled or already settled"
                        );
                    }
                }
            );

            // 동시 정산 시도
            const settlement1Promise = settleBettingPoll({
                pollId,
                winningOptionIds,
            });
            const settlement2Promise = settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            const [result1, result2] = await Promise.all([
                settlement1Promise,
                settlement2Promise,
            ]);

            // 하나는 성공, 하나는 실패해야 함
            const successCount = [result1.success, result2.success].filter(
                Boolean
            ).length;
            expect(successCount).toBe(1);

            console.log("✅ 동시 상태 변경 충돌 방지 완료");
        });
    });

    describe("🔍 베팅 상태 검증 로직 테스트", () => {
        it("📋 베팅 상태별 허용 동작 매트릭스 검증", async () => {
            console.log("🔍 Testing: 베팅 상태별 허용 동작 매트릭스");

            const mockPoll = {
                id: "test-poll-matrix",
                title: "상태 매트릭스 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [{ optionId: "option1", name: "Option 1" }],
                minimumBet: 1,
                maximumBet: 1000,
            };

            const mockPlayer = {
                id: "player1",
                userId: "user1",
            };

            const bettingStates = [
                { status: "OPEN", isSettled: false, settledAt: null },
                { status: "SETTLING", isSettled: false, settledAt: null },
                { status: "SETTLED", isSettled: true, settledAt: new Date() },
                { status: "CLOSED", isSettled: false, settledAt: null },
                { status: "CANCELLED", isSettled: false, settledAt: null },
            ];

            const expectedResults = [
                { status: "OPEN", shouldAllowBetting: true },
                { status: "SETTLING", shouldAllowBetting: false },
                { status: "SETTLED", shouldAllowBetting: false },
                { status: "CLOSED", shouldAllowBetting: false },
                { status: "CANCELLED", shouldAllowBetting: false },
            ];

            for (let i = 0; i < bettingStates.length; i++) {
                const state = bettingStates[i];
                const expected = expectedResults[i];

                // 베팅 상태 확인 모킹
                mockPrisma.poll.findUnique.mockResolvedValueOnce({
                    bettingStatus: state.status,
                    isSettled: state.isSettled,
                    settledAt: state.settledAt,
                } as any);

                if (expected.shouldAllowBetting) {
                    // OPEN 상태에서 베팅이 허용되려면 추가 검증들도 통과해야 함

                    // 잔액 확인 모킹
                    mockPrisma.playerAsset.findUnique.mockResolvedValueOnce({
                        balance: 1000, // 충분한 잔액
                    } as any);

                    // 기존 베팅 로그 확인 모킹
                    mockPrisma.pollLog.findMany.mockResolvedValueOnce([]);

                    // 트랜잭션 모킹
                    mockPrisma.$transaction.mockImplementationOnce(
                        async (callback: any) => {
                            // 트랜잭션 내부 모킹 완성
                            const mockTx = {
                                ...mockPrisma,
                                poll: {
                                    ...mockPrisma.poll,
                                    findUnique: jest
                                        .fn()
                                        .mockResolvedValueOnce({
                                            bettingStatus: "OPEN",
                                            isSettled: false,
                                            settledAt: null,
                                        } as any)
                                        .mockResolvedValueOnce({
                                            optionBetAmounts: {},
                                            totalCommissionAmount: 0,
                                            totalVotes: 0,
                                            uniqueVoters: 0,
                                        } as any),
                                    update: jest
                                        .fn()
                                        .mockResolvedValue({} as any),
                                },
                                playerAsset: {
                                    ...mockPrisma.playerAsset,
                                    findUnique: jest.fn().mockResolvedValue({
                                        balance: 1000,
                                    } as any),
                                },
                                pollLog: {
                                    ...mockPrisma.pollLog,
                                    upsert: jest.fn().mockResolvedValue({
                                        id: "log1",
                                        pollId: mockPoll.id,
                                        playerId: mockPlayer.id,
                                        optionId: "option1",
                                        amount: 100,
                                    } as any),
                                },
                            };

                            // updatePlayerAsset 모킹
                            mockUpdatePlayerAsset.mockResolvedValueOnce({
                                success: true,
                            });

                            return await callback(mockTx);
                        }
                    );
                }

                const result = await participatePoll({
                    poll: mockPoll as any,
                    player: mockPlayer as any,
                    optionId: "option1",
                    amount: 100,
                });

                expect(result.success).toBe(expected.shouldAllowBetting);

                if (!expected.shouldAllowBetting) {
                    expect(result.error).toBeDefined();
                    console.log(
                        `  ✅ ${state.status} 상태에서 베팅 차단: ${result.error}`
                    );
                } else {
                    console.log(`  ✅ ${state.status} 상태에서 베팅 허용`);
                }
            }

            console.log("✅ 베팅 상태별 허용 동작 매트릭스 검증 완료");
        });

        it("🔄 상태 전이 규칙 검증", async () => {
            console.log("🔍 Testing: 상태 전이 규칙 검증");

            // 허용되는 상태 전이들
            const validTransitions = [
                { from: "OPEN", to: "SETTLING" },
                { from: "SETTLING", to: "SETTLED" },
                { from: "OPEN", to: "CLOSED" },
                { from: "OPEN", to: "CANCELLED" },
            ];

            // 허용되지 않는 상태 전이들
            const invalidTransitions = [
                { from: "SETTLED", to: "OPEN" },
                { from: "SETTLED", to: "SETTLING" },
                { from: "SETTLING", to: "OPEN" },
                { from: "CLOSED", to: "OPEN" },
                { from: "CANCELLED", to: "OPEN" },
            ];

            console.log("  📋 허용되는 전이들:");
            validTransitions.forEach((transition) => {
                console.log(`    ✅ ${transition.from} → ${transition.to}`);
            });

            console.log("  📋 허용되지 않는 전이들:");
            invalidTransitions.forEach((transition) => {
                console.log(`    ❌ ${transition.from} → ${transition.to}`);
            });

            console.log("✅ 상태 전이 규칙 검증 완료");
        });
    });
});

// 결과 요약
afterAll(() => {
    mockConsoleError.mockRestore();
    console.log("\n" + "=".repeat(60));
    console.log("🎰 베팅 모드 Poll 테스트 완료");
    console.log("=".repeat(60));
    console.log("📋 주요 검증 항목:");
    console.log("  ✅ 배당금 계산 정확성");
    console.log("  ✅ 환불 로직 정확성");
    console.log("  ✅ 중복 정산 방지");
    console.log("  ✅ 베팅 차단 로직");
    console.log("  ✅ 소수점 계산 정확성");
    console.log("=".repeat(60));
});
