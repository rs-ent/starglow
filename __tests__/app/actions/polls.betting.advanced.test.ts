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

// 핵심 모킹
jest.mock("@/lib/prisma/client", () => ({
    prisma: mockDeep<PrismaClient>(),
}));

// Mock dependencies
jest.mock("../../../app/actions/playerAssets", () => ({
    updatePlayerAsset: jest.fn(),
}));

// 알림 시스템 모킹
jest.mock("../../../app/actions/notification/actions", () => ({
    createBettingWinNotification: jest.fn(),
    createBettingFailedNotification: jest.fn(),
    createBettingRefundNotification: jest.fn(),
    createSettlementCompleteNotification: jest.fn(),
}));

// Story related dependencies 모킹
jest.mock("../../../app/story/nft/actions", () => ({
    transferNFTToUser: jest.fn(),
}));

jest.mock("../../../app/story/client", () => ({
    getStoryClient: jest.fn(),
}));

// Import after mocking
import { prisma } from "@/lib/prisma/client";
import {
    createBettingWinNotification,
    createBettingFailedNotification,
    createBettingRefundNotification,
    createSettlementCompleteNotification,
} from "../../../app/actions/notification/actions";

// Mock console 설정
const mockConsoleError = jest
    .spyOn(console, "error")
    .mockImplementation((message, ...args) => {
        console.log("🔍 Console Error:", message, ...args);
    });

const mockUpdatePlayerAsset = require("../../../app/actions/playerAssets")
    .updatePlayerAsset as jest.Mock;

// Type-safe mock references
const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("🚀 베팅 시스템 고급 검증 테스트", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConsoleError.mockClear();
        mockReset(mockPrisma);
        mockUpdatePlayerAsset.mockReset();

        // 알림 함수들 기본 모킹
        (createBettingWinNotification as jest.Mock).mockResolvedValue(true);
        (createBettingFailedNotification as jest.Mock).mockResolvedValue(true);
        (createBettingRefundNotification as jest.Mock).mockResolvedValue(true);
        (createSettlementCompleteNotification as jest.Mock).mockResolvedValue(
            true
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("🔔 알림 시스템 완전 검증", () => {
        it("🏆 승리자 알림 시스템 정확성", async () => {
            console.log("🔍 Testing: 승리자 알림 시스템");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-notification";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "알림 테스트 Poll",
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

            const mockWinners = [
                {
                    id: "log1",
                    playerId: "winner1",
                    amount: 500,
                    optionId: "option1",
                },
                {
                    id: "log2",
                    playerId: "winner2",
                    amount: 500,
                    optionId: "option1",
                },
            ];

            const mockLosers = [
                {
                    id: "log3",
                    playerId: "loser1",
                    amount: 1000,
                    optionId: "option2",
                },
                {
                    id: "log4",
                    playerId: "loser2",
                    amount: 1000,
                    optionId: "option2",
                },
            ];

            // 정산 후 Poll 조회용 모킹
            mockPrisma.poll.findUnique
                .mockResolvedValueOnce(mockPoll as any) // 첫 번째 호출 (정산용)
                .mockResolvedValueOnce({
                    // 두 번째 호출 (알림용)
                    title: mockPoll.title,
                    bettingAssetId: mockPoll.bettingAssetId,
                } as any);

            // 모든 베팅자 조회 모킹
            mockPrisma.pollLog.findMany
                .mockResolvedValueOnce(mockWinners as any) // 정산용 승리자 조회
                .mockResolvedValueOnce([...mockWinners, ...mockLosers] as any); // 알림용 전체 베팅자 조회

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 정산 결과 검증
            expect(result.success).toBe(true);
            expect(result.totalWinners).toBe(2);

            // 알림 호출 검증
            expect(createBettingWinNotification).toHaveBeenCalledTimes(2);
            expect(createBettingFailedNotification).toHaveBeenCalledTimes(2);
            expect(createSettlementCompleteNotification).toHaveBeenCalledTimes(
                1
            );

            // 승리자 알림 내용 검증
            expect(createBettingWinNotification).toHaveBeenCalledWith(
                "winner1",
                pollId,
                "알림 테스트 Poll",
                500,
                expect.any(Number)
            );

            console.log("✅ 승리자 알림 시스템 정확");
        });

        it("💸 환불 알림 시스템 검증", async () => {
            console.log("🔍 Testing: 환불 알림 시스템");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-refund-notification";
            const winningOptionIds = ["option3"]; // 아무도 베팅하지 않은 옵션

            const mockPoll = {
                id: pollId,
                title: "환불 알림 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000, option2: 1500 },
                totalCommissionAmount: 125,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            const mockAllBettors = [
                {
                    id: "log1",
                    playerId: "player1",
                    amount: 1000,
                    optionId: "option1",
                },
                {
                    id: "log2",
                    playerId: "player2",
                    amount: 1500,
                    optionId: "option2",
                },
            ];

            mockPrisma.poll.findUnique
                .mockResolvedValueOnce(mockPoll as any)
                .mockResolvedValueOnce({
                    title: mockPoll.title,
                    bettingAssetId: mockPoll.bettingAssetId,
                } as any);

            // 환불 시나리오에서는 findMany가 여러 번 호출됨
            mockPrisma.pollLog.findMany
                .mockResolvedValueOnce([]) // 첫 번째: 승리자 조회 (빈 배열)
                .mockResolvedValueOnce(mockAllBettors as any) // 두 번째: 환불용 전체 베팅자 조회
                .mockResolvedValueOnce(
                    mockAllBettors.map((b) => ({
                        // 세 번째: 알림용 전체 베팅자 조회
                        playerId: b.playerId,
                        optionId: b.optionId,
                        amount: b.amount,
                        player: { id: b.playerId },
                    })) as any
                );

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 환불 결과 검증
            expect(result.success).toBe(true);
            expect(result.isRefund).toBe(true);

            // 환불 알림 검증 (Promise.allSettled로 처리되므로 비동기 대기)
            await new Promise((resolve) => setTimeout(resolve, 10)); // 비동기 알림 처리 대기

            expect(createBettingRefundNotification).toHaveBeenCalledTimes(2);
            expect(createBettingRefundNotification).toHaveBeenCalledWith(
                "player1",
                pollId,
                "환불 알림 테스트",
                1000,
                "No winning option determined"
            );

            console.log("✅ 환불 알림 시스템 정확");
        });

        it("⚠️ 알림 실패 시 정산 성공 유지", async () => {
            console.log("🔍 Testing: 알림 실패 시 정산 안정성");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            // 알림 함수 실패 시뮬레이션
            (createBettingWinNotification as jest.Mock).mockRejectedValue(
                new Error("Notification service down")
            );

            const pollId = "test-poll-notification-failure";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "알림 실패 테스트",
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
                    playerId: "winner1",
                    amount: 1000,
                    optionId: "option1",
                },
            ];

            mockPrisma.poll.findUnique
                .mockResolvedValueOnce(mockPoll as any)
                .mockResolvedValueOnce({
                    title: mockPoll.title,
                    bettingAssetId: mockPoll.bettingAssetId,
                } as any);

            mockPrisma.pollLog.findMany
                .mockResolvedValueOnce(mockWinners as any)
                .mockResolvedValueOnce(
                    mockWinners.map((w) => ({
                        playerId: w.playerId,
                        optionId: w.optionId,
                        amount: w.amount,
                        player: { id: w.playerId },
                    })) as any
                );

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 정산은 성공해야 함 (알림 실패와 무관)
            expect(result.success).toBe(true);
            expect(result.totalWinners).toBe(1);

            console.log("✅ 알림 실패 시에도 정산 성공 유지");
        });
    });

    describe("⚡ 대용량 성능 테스트", () => {
        it("🏟️ 1000명 동시 베팅 처리", async () => {
            console.log("🔍 Testing: 1000명 동시 베팅 성능");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-1000-users";
            const winningOptionIds = ["option1"];

            // 1000명의 베팅자 생성
            const mockWinners = Array.from({ length: 600 }, (_, i) => ({
                id: `log${i + 1}`,
                playerId: `winner${i + 1}`,
                amount: Math.floor(Math.random() * 100) + 1,
                optionId: "option1",
            }));

            const mockLosers = Array.from({ length: 400 }, (_, i) => ({
                id: `log${i + 601}`,
                playerId: `loser${i + 1}`,
                amount: Math.floor(Math.random() * 100) + 1,
                optionId: "option2",
            }));

            const totalWinBets = mockWinners.reduce(
                (sum, w) => sum + w.amount,
                0
            );
            const totalLoseBets = mockLosers.reduce(
                (sum, l) => sum + l.amount,
                0
            );
            const totalBets = totalWinBets + totalLoseBets;

            const mockPoll = {
                id: pollId,
                title: "1000명 동시 베팅 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: totalWinBets,
                    option2: totalLoseBets,
                },
                totalCommissionAmount: totalBets * 0.05,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            mockPrisma.poll.findUnique
                .mockResolvedValueOnce(mockPoll as any)
                .mockResolvedValueOnce({
                    title: mockPoll.title,
                    bettingAssetId: mockPoll.bettingAssetId,
                } as any);

            mockPrisma.pollLog.findMany
                .mockResolvedValueOnce(mockWinners as any)
                .mockResolvedValueOnce(
                    [...mockWinners, ...mockLosers].map((u) => ({
                        playerId: u.playerId,
                        optionId: u.optionId,
                        amount: u.amount,
                        player: { id: u.playerId },
                    })) as any
                );

            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );

            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const startTime = performance.now();
            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });
            const endTime = performance.now();

            const processingTime = endTime - startTime;

            // 성능 검증
            expect(result.success).toBe(true);
            expect(result.totalWinners).toBe(600);
            expect(result.payoutDetails).toHaveLength(600);
            expect(processingTime).toBeLessThan(10000); // 10초 이내

            console.log(`✅ 1000명 처리 완료 (${processingTime.toFixed(2)}ms)`);
        });

        it("🚀 메모리 사용량 최적화 검증", async () => {
            console.log("🔍 Testing: 메모리 사용량 최적화");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-memory";
            const winningOptionIds = ["option1"];

            // 메모리 측정 시작
            const initialMemory = process.memoryUsage();

            // 5000명의 베팅자 시뮬레이션 (대용량)
            const mockWinners = Array.from({ length: 5000 }, (_, i) => ({
                id: `log${i + 1}`,
                playerId: `player${i + 1}`,
                amount: 100,
                optionId: "option1",
            }));

            const mockPoll = {
                id: pollId,
                title: "메모리 최적화 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 500000 },
                totalCommissionAmount: 25000,
                houseCommissionRate: 0.05,
                status: "ACTIVE",
                endDate: new Date(Date.now() - 1000),
                bettingStatus: "OPEN",
                isSettled: false,
                settledAt: null,
                answerOptionIds: null,
            };

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 메모리 측정 종료
            const finalMemory = process.memoryUsage();
            const memoryIncrease =
                finalMemory.heapUsed - initialMemory.heapUsed;

            // 메모리 사용량 검증 (50MB 이하)
            expect(result.success).toBe(true);
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

            console.log(
                `✅ 메모리 사용량: ${(memoryIncrease / 1024 / 1024).toFixed(
                    2
                )}MB`
            );
        });
    });

    describe("🎯 극한 상황 시나리오", () => {
        it("🔥 제로 수수료 베팅 정산", async () => {
            console.log("🔍 Testing: 제로 수수료 베팅");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-zero-commission";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "제로 수수료 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000, option2: 2000 },
                totalCommissionAmount: 0, // 수수료 없음
                houseCommissionRate: 0, // 수수료율 0%
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
                    amount: 1000,
                    optionId: "option1",
                },
            ];

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 전액 배당 검증 (수수료 없음)
            expect(result.success).toBe(true);
            expect(result.totalPayout).toBe(3000); // 1000 + 2000 = 3000 (수수료 0)

            console.log("✅ 제로 수수료 정산 정확");
        });

        it("💯 100% 수수료 베팅 처리", async () => {
            console.log("🔍 Testing: 100% 수수료 베팅");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-full-commission";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "100% 수수료 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 1000, option2: 2000 },
                totalCommissionAmount: 3000, // 전액 수수료
                houseCommissionRate: 1.0, // 수수료율 100%
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
                    amount: 1000,
                    optionId: "option1",
                },
            ];

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            // 배당 없음 검증 (100% 수수료)
            expect(result.success).toBe(true);
            expect(result.totalPayout).toBe(0); // 3000 - 3000 = 0

            console.log("✅ 100% 수수료 정산 정확");
        });

        it("🔢 1원 단위 정밀 계산 검증", async () => {
            console.log("🔍 Testing: 1원 단위 정밀 계산");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const pollId = "test-poll-precision-calculation";
            const winningOptionIds = ["option1"];

            const mockPoll = {
                id: pollId,
                title: "정밀 계산 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: {
                    option1: 333.33,
                    option2: 333.33,
                    option3: 333.34,
                }, // 총 1000원, 소수점 계산
                totalCommissionAmount: 50.0,
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
                    amount: 111.11,
                    optionId: "option1",
                },
                {
                    id: "log2",
                    playerId: "winner2",
                    amount: 111.11,
                    optionId: "option1",
                },
                {
                    id: "log3",
                    playerId: "winner3",
                    amount: 111.11,
                    optionId: "option1",
                },
            ];

            mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );
            mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

            const result = await settleBettingPoll({
                pollId,
                winningOptionIds,
            });

            expect(result.success).toBe(true);
            // 소수점 계산에서 미세한 오차 허용 (± 0.05원)
            expect(Math.abs((result.totalPayout || 0) - 950)).toBeLessThan(
                0.05
            );

            // 각 승리자의 배당 합계가 총 배당과 일치하는지 확인
            const totalIndividualPayout =
                result.payoutDetails?.reduce(
                    (sum, payout) => sum + payout.amount,
                    0
                ) || 0;

            expect(
                Math.abs(totalIndividualPayout - (result.totalPayout || 0))
            ).toBeLessThan(0.01);

            console.log(
                `✅ 1원 단위 정밀 계산 정확 (실제: ${result.totalPayout})`
            );
        });

        it("🌊 연쇄 베팅 및 정산 시나리오", async () => {
            console.log("🔍 Testing: 연쇄 베팅 및 정산");

            const polls = [
                {
                    id: "poll1",
                    title: "연쇄 Poll 1",
                    optionBetAmounts: { option1: 1000, option2: 500 },
                    winningOptions: ["option1"],
                },
                {
                    id: "poll2",
                    title: "연쇄 Poll 2",
                    optionBetAmounts: { option1: 800, option2: 1200 },
                    winningOptions: ["option2"],
                },
                {
                    id: "poll3",
                    title: "연쇄 Poll 3",
                    optionBetAmounts: {
                        option1: 600,
                        option2: 400,
                        option3: 1000,
                    },
                    winningOptions: ["option1", "option3"],
                },
            ];

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            for (const [index, poll] of polls.entries()) {
                const mockPoll = {
                    id: poll.id,
                    title: poll.title,
                    bettingMode: true,
                    bettingAssetId: "test-asset",
                    optionBetAmounts: poll.optionBetAmounts,
                    totalCommissionAmount:
                        Object.values(poll.optionBetAmounts).reduce(
                            (a, b) => a + b,
                            0
                        ) * 0.05,
                    houseCommissionRate: 0.05,
                    status: "ACTIVE",
                    endDate: new Date(Date.now() - 1000),
                    bettingStatus: "OPEN",
                    isSettled: false,
                    settledAt: null,
                    answerOptionIds: null,
                };

                const mockWinners = poll.winningOptions.map((optionId, i) => ({
                    id: `${poll.id}-log${i + 1}`,
                    playerId: `${poll.id}-winner${i + 1}`,
                    amount: (poll.optionBetAmounts as any)[optionId] || 0,
                    optionId,
                }));

                mockPrisma.poll.findUnique.mockResolvedValue(mockPoll as any);
                mockPrisma.pollLog.findMany.mockResolvedValue(
                    mockWinners as any
                );
                mockPrisma.$transaction.mockImplementation(
                    async (callback: any) => {
                        return await callback(mockPrisma);
                    }
                );
                mockPrisma.poll.update.mockResolvedValue(mockPoll as any);

                const result = await settleBettingPoll({
                    pollId: poll.id,
                    winningOptionIds: poll.winningOptions,
                });

                expect(result.success).toBe(true);
                console.log(`  ✅ ${poll.title} 정산 완료`);
            }

            console.log("✅ 연쇄 베팅 및 정산 성공");
        });
    });

    describe("🔄 실시간 시나리오 검증", () => {
        it("⚡ 실시간 베팅→정산 워크플로우", async () => {
            console.log("🔍 Testing: 실시간 베팅→정산 워크플로우");

            const pollId = "test-poll-realtime-workflow";

            // 1단계: 실시간 베팅 시뮬레이션
            const mockPoll = {
                id: pollId,
                title: "실시간 워크플로우 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                startDate: new Date(Date.now() - 1000),
                endDate: new Date(Date.now() + 1000),
                options: [
                    { optionId: "option1", name: "Option 1" },
                    { optionId: "option2", name: "Option 2" },
                ],
                minimumBet: 1,
                maximumBet: 1000,
                allowMultipleVote: true,
            };

            const mockPlayer = {
                id: "realtime-player",
                userId: "realtime-user",
            };

            // 베팅 단계별 시뮬레이션
            const bettingSteps = [
                { amount: 100, option: "option1", expectedSuccess: true },
                { amount: 200, option: "option2", expectedSuccess: true },
                { amount: 150, option: "option1", expectedSuccess: true },
            ];

            for (const [index, step] of bettingSteps.entries()) {
                // 베팅 상태 확인 모킹
                mockPrisma.poll.findUnique.mockResolvedValueOnce({
                    bettingStatus: "OPEN",
                    isSettled: false,
                    settledAt: null,
                } as any);

                // 잔액 충분한 것으로 모킹
                mockPrisma.playerAsset.findUnique.mockResolvedValueOnce({
                    balance: 10000,
                } as any);

                // 기존 베팅 로그 모킹
                mockPrisma.pollLog.findMany.mockResolvedValueOnce([]);

                if (step.expectedSuccess) {
                    // 성공적인 베팅 트랜잭션 모킹
                    mockPrisma.$transaction.mockImplementationOnce(
                        async (callback: any) => {
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
                                        id: `log${index + 1}`,
                                        pollId: pollId,
                                        playerId: mockPlayer.id,
                                        optionId: step.option,
                                        amount: step.amount,
                                    } as any),
                                },
                            };

                            mockUpdatePlayerAsset.mockResolvedValueOnce({
                                success: true,
                            });
                            return await callback(mockTx);
                        }
                    );

                    const result = await participatePoll({
                        poll: mockPoll as any,
                        player: mockPlayer as any,
                        optionId: step.option,
                        amount: step.amount,
                    });

                    expect(result.success).toBe(step.expectedSuccess);
                    console.log(
                        `  ✅ 베팅 ${index + 1}: ${step.amount} → ${
                            step.option
                        }`
                    );
                }
            }

            // 2단계: 정산 시뮬레이션
            console.log("  🔄 정산 단계 시작");

            mockUpdatePlayerAsset.mockResolvedValue({ success: true });

            const finalPoll = {
                id: pollId,
                title: "실시간 워크플로우 테스트",
                bettingMode: true,
                bettingAssetId: "test-asset",
                optionBetAmounts: { option1: 250, option2: 200 }, // 위 베팅 결과
                totalCommissionAmount: 22.5, // 5% 수수료
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
                    playerId: "realtime-player",
                    amount: 250,
                    optionId: "option1",
                },
            ];

            mockPrisma.poll.findUnique.mockResolvedValue(finalPoll as any);
            mockPrisma.pollLog.findMany.mockResolvedValue(mockWinners as any);
            mockPrisma.$transaction.mockImplementation(
                async (callback: any) => {
                    return await callback(mockPrisma);
                }
            );
            mockPrisma.poll.update.mockResolvedValue(finalPoll as any);

            const settlementResult = await settleBettingPoll({
                pollId,
                winningOptionIds: ["option1"],
            });

            expect(settlementResult.success).toBe(true);
            expect(settlementResult.totalPayout).toBe(427.5); // 450 - 22.5 = 427.5

            console.log("✅ 실시간 베팅→정산 워크플로우 완료");
        });
    });
});

// 결과 요약
afterAll(() => {
    mockConsoleError.mockRestore();
    console.log("\n" + "=".repeat(80));
    console.log("🚀 베팅 시스템 고급 검증 테스트 완료");
    console.log("=".repeat(80));
    console.log("📋 추가 검증 완료 항목:");
    console.log("  ✅ 알림 시스템 완전 검증");
    console.log("  ✅ 대용량 성능 테스트 (1000+ 사용자)");
    console.log("  ✅ 극한 상황 시나리오");
    console.log("  ✅ 실시간 워크플로우 검증");
    console.log("  ✅ 메모리 최적화 확인");
    console.log("=".repeat(80));
});
