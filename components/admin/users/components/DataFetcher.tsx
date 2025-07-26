"use client";

import {
    getWalletsCount,
    getDailyActivityWallets,
    getQuestPerformance,
    getPollPerformance,
    getRafflePerformance,
    getOnchainRafflePerformance,
} from "@/app/actions/userDashboard/actions-read";
import { useCallback, useState } from "react";
import type {
    DailyActivityQuests,
    DailyActivityWallets,
    DailyActivityPolls,
    DailyActivityOffchainRaffles,
} from "@prisma/client";

const serviceStartDate = "2025-07-09T00:00:00.000Z";

export interface CombinedRafflePerformance
    extends DailyActivityOffchainRaffles {
    onchainSummary?: {
        totalContracts: number;
        totalParticipation: number;
        totalDrawnParticipants: number;
        contractResults: Array<{
            contractAddress: string;
            networkId: string;
            participation: number;
            totalDrawnParticipants: number;
            raffleStats: any[];
            totalEvents: number;
            processedBlocks: number;
            blockRange: { startBlock: number; endBlock: number };
        }>;
    };
}

export type RefreshTarget =
    | "wallets"
    | "dailyActiveUsers"
    | "questPerformance"
    | "pollPerformance"
    | "rafflePerformance";

export const useDataFetcher = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchWalletsData = useCallback(async () => {
        return await getWalletsCount();
    }, []);

    const fetchDailyWalletsData = useCallback(async (): Promise<
        DailyActivityWallets[]
    > => {
        const startDate = new Date(serviceStartDate);
        const endDate = new Date();
        const results: DailyActivityWallets[] = [];

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateISO = currentDate.toISOString();
            const walletData = await getDailyActivityWallets(dateISO);

            if (walletData) {
                results.push(walletData);
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        return results;
    }, []);

    const fetchDailyQuestsData = useCallback(async (): Promise<
        DailyActivityQuests[]
    > => {
        const startDate = new Date(serviceStartDate);
        const endDate = new Date();
        const results: DailyActivityQuests[] = [];

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateISO = currentDate.toISOString();
            const questData = await getQuestPerformance(dateISO);

            if (questData) {
                results.push(questData);
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        return results;
    }, []);

    const fetchDailyPollsData = useCallback(async (): Promise<
        DailyActivityPolls[]
    > => {
        const startDate = new Date(serviceStartDate);
        const endDate = new Date();
        const results: DailyActivityPolls[] = [];

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateISO = currentDate.toISOString();
            const pollData = await getPollPerformance(dateISO);

            if (pollData) {
                results.push(pollData);
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        return results;
    }, []);

    const fetchDailyRafflesData = useCallback(async (): Promise<
        CombinedRafflePerformance[]
    > => {
        const startDate = new Date(serviceStartDate);
        const endDate = new Date();
        const results: CombinedRafflePerformance[] = [];

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateISO = currentDate.toISOString();

            // Fetch both offchain and onchain data in parallel
            const [offchainData, onchainDataArray] = await Promise.all([
                getRafflePerformance(dateISO),
                getOnchainRafflePerformance(dateISO).catch(() => []), // Fallback to empty array on error
            ]);

            if (offchainData) {
                // Combine offchain data with onchain summary
                const combinedData: CombinedRafflePerformance = {
                    ...offchainData,
                    onchainSummary:
                        onchainDataArray.length > 0
                            ? {
                                  totalContracts: onchainDataArray.length,
                                  totalParticipation: onchainDataArray.reduce(
                                      (sum, contract) =>
                                          sum + contract.participation,
                                      0
                                  ),
                                  totalDrawnParticipants:
                                      onchainDataArray.reduce(
                                          (sum, contract) =>
                                              sum +
                                              ((contract as any)
                                                  .totalDrawnParticipants || 0),
                                          0
                                      ),
                                  contractResults: onchainDataArray.map(
                                      (contract) => ({
                                          contractAddress:
                                              contract.contractAddress,
                                          networkId: contract.networkId,
                                          participation: contract.participation,
                                          totalDrawnParticipants:
                                              (contract as any)
                                                  .totalDrawnParticipants || 0,
                                          raffleStats: Array.isArray(
                                              contract.rafflePopularity
                                          )
                                              ? contract.rafflePopularity
                                              : [],
                                          totalEvents: contract.totalEvents,
                                          processedBlocks:
                                              contract.processedBlocks,
                                          blockRange: contract.blockRange as {
                                              startBlock: number;
                                              endBlock: number;
                                          },
                                      })
                                  ),
                              }
                            : undefined,
                };

                results.push(combinedData);
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        return results;
    }, []);

    const handleRefresh = useCallback(
        async (
            target: RefreshTarget
        ): Promise<
            | number
            | DailyActivityWallets[]
            | DailyActivityQuests[]
            | DailyActivityPolls[]
            | CombinedRafflePerformance[]
            | null
        > => {
            setIsLoading(true);
            setError(null);

            try {
                switch (target) {
                    case "wallets":
                        const count = await fetchWalletsData();
                        return count;
                    case "dailyActiveUsers":
                        const dailyWalletsData = await fetchDailyWalletsData();
                        return dailyWalletsData;
                    case "questPerformance":
                        const dailyQuestsData = await fetchDailyQuestsData();
                        return dailyQuestsData;
                    case "pollPerformance":
                        const dailyPollsData = await fetchDailyPollsData();
                        return dailyPollsData;
                    case "rafflePerformance":
                        const dailyRafflesData = await fetchDailyRafflesData();
                        return dailyRafflesData;
                    default:
                        console.warn(`Unknown refresh target: ${target}`);
                        return null;
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to load data");
                return null;
            } finally {
                setIsLoading(false);
                setLastUpdated(new Date());
            }
        },
        [
            fetchWalletsData,
            fetchDailyWalletsData,
            fetchDailyQuestsData,
            fetchDailyPollsData,
            fetchDailyRafflesData,
        ]
    );

    return {
        isLoading,
        error,
        handleRefresh,
        fetchWalletsData,
        lastUpdated,
    };
};
