"use server";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient } from "@/app/story/client";

export async function getWalletsCount() {
    return await prisma.wallet.count({
        cacheStrategy: getCacheStrategy("oneHour"),
        where: {
            status: "ACTIVE",
        },
    });
}

export async function getDailyActivityWallets(targetDateISO: string) {
    const targetDate = new Date(targetDateISO);
    const utcStartOfDay = new Date(targetDate);
    utcStartOfDay.setUTCHours(0, 0, 0, 0);

    const utcEndOfDay = new Date(targetDate);
    utcEndOfDay.setUTCHours(23, 59, 59, 999);

    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid targetDate ISO string");
    }

    const existing = await prisma.dailyActivityWallets.findUnique({
        where: { date: utcStartOfDay },
    });

    const nextDay = new Date(utcStartOfDay);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const shouldCalculate = !existing || existing.updatedAt < nextDay;

    if (!shouldCalculate) {
        return existing;
    }

    const BATCH_SIZE = 1000;
    const stats = {
        active: new Set<string>(),
        new: new Set<string>(),
        revisit: new Set<string>(),
        providers: new Map<string, number>(),
    };

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const walletsBatch = await prisma.wallet.findMany({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: {
                lastAccessedAt: {
                    gte: utcStartOfDay,
                    lte: utcEndOfDay,
                },
                status: "ACTIVE",
            },
            select: {
                address: true,
                provider: true,
                createdAt: true,
                lastAccessedAt: true,
            },
            skip,
            take: BATCH_SIZE,
        });

        if (walletsBatch.length === 0) {
            hasMore = false;
            break;
        }

        walletsBatch.forEach((wallet) => {
            stats.active.add(wallet.address);

            stats.providers.set(
                wallet.provider,
                (stats.providers.get(wallet.provider) || 0) + 1
            );

            const timeDiff =
                wallet.lastAccessedAt!.getTime() - wallet.createdAt.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff >= 24) {
                stats.revisit.add(wallet.address);
            } else {
                stats.new.add(wallet.address);
            }
        });

        skip += BATCH_SIZE;
        hasMore = walletsBatch.length === BATCH_SIZE;
    }

    const providerPopularity = Array.from(stats.providers.entries()).map(
        ([provider, count]) => ({ provider, count })
    );

    const data = {
        date: utcStartOfDay,
        active: stats.active.size,
        new: stats.new.size,
        revisit: stats.revisit.size,
        providerPopularity: providerPopularity,
    };

    return await prisma.dailyActivityWallets.upsert({
        where: { date: utcStartOfDay },
        update: data,
        create: data,
    });
}

export async function getQuestPerformance(targetDateISO: string) {
    const targetDate = new Date(targetDateISO);
    const utcStartOfDay = new Date(targetDate);
    utcStartOfDay.setUTCHours(0, 0, 0, 0);

    const utcEndOfDay = new Date(targetDate);
    utcEndOfDay.setUTCHours(23, 59, 59, 999);

    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid targetDate ISO string");
    }

    const existing = await prisma.dailyActivityQuests.findUnique({
        where: { date: utcStartOfDay },
    });

    const nextDay = new Date(utcStartOfDay);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const shouldCalculate = !existing || existing.updatedAt < nextDay;

    if (!shouldCalculate) {
        return existing;
    }

    const BATCH_SIZE = 1000;
    const stats = {
        completed: new Set<string>(),
        claimed: new Set<string>(),
        questStats: new Map<
            string,
            {
                questId: string;
                questTitle: string;
                completed: number;
                claimed: number;
            }
        >(),
    };

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const questLogsBatch = await prisma.questLog.findMany({
            where: {
                OR: [
                    {
                        completedAt: {
                            gte: utcStartOfDay,
                            lte: utcEndOfDay,
                        },
                    },
                    {
                        claimedAt: {
                            gte: utcStartOfDay,
                            lte: utcEndOfDay,
                        },
                    },
                ],
            },
            select: {
                id: true,
                questId: true,
                completedAt: true,
                completedDates: true,
                claimedAt: true,
                claimedDates: true,
                quest: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            skip,
            take: BATCH_SIZE,
        });

        if (questLogsBatch.length === 0) {
            hasMore = false;
            break;
        }

        questLogsBatch.forEach((log) => {
            const questId = log.questId;
            const questTitle = log.quest.title;

            if (!stats.questStats.has(questId)) {
                stats.questStats.set(questId, {
                    questId,
                    questTitle,
                    completed: 0,
                    claimed: 0,
                });
            }

            const questStat = stats.questStats.get(questId)!;

            const isCompletedOnTargetDate =
                (log.completedAt &&
                    log.completedAt >= utcStartOfDay &&
                    log.completedAt <= utcEndOfDay) ||
                (log.completedDates &&
                    log.completedDates.some((date) => {
                        const d = new Date(date);
                        return d >= utcStartOfDay && d <= utcEndOfDay;
                    }));

            const isClaimedOnTargetDate =
                (log.claimedAt &&
                    log.claimedAt >= utcStartOfDay &&
                    log.claimedAt <= utcEndOfDay) ||
                (log.claimedDates &&
                    log.claimedDates.some((date) => {
                        const d = new Date(date);
                        return d >= utcStartOfDay && d <= utcEndOfDay;
                    }));

            if (isCompletedOnTargetDate) {
                stats.completed.add(log.id);
                questStat.completed += 1;
            }

            if (isClaimedOnTargetDate) {
                stats.claimed.add(log.id);
                questStat.claimed += 1;
            }
        });

        skip += BATCH_SIZE;
        hasMore = questLogsBatch.length === BATCH_SIZE;
    }

    const questPopularity = Array.from(stats.questStats.values());

    const data = {
        date: utcStartOfDay,
        completed: stats.completed.size,
        claimed: stats.claimed.size,
        questPopularity: questPopularity,
    };

    return await prisma.dailyActivityQuests.upsert({
        where: { date: utcStartOfDay },
        update: data,
        create: data,
    });
}

export async function getPollPerformance(targetDateISO: string) {
    const targetDate = new Date(targetDateISO);
    const utcStartOfDay = new Date(targetDate);
    utcStartOfDay.setUTCHours(0, 0, 0, 0);

    const utcEndOfDay = new Date(targetDate);
    utcEndOfDay.setUTCHours(23, 59, 59, 999);

    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid targetDate ISO string");
    }

    const existing = await prisma.dailyActivityPolls.findUnique({
        where: { date: utcStartOfDay },
    });

    const nextDay = new Date(utcStartOfDay);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const shouldCalculate = !existing || existing.updatedAt < nextDay;

    if (!shouldCalculate) {
        return existing;
    }

    const BATCH_SIZE = 1000;
    const stats = {
        participation: new Set<string>(),
        pollStats: new Map<
            string,
            {
                pollId: string;
                pollTitle: string;
                bettingMode: boolean;
                participation: number;
            }
        >(),
    };

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const pollLogsBatch = await prisma.pollLog.findMany({
            where: {
                createdAt: {
                    gte: utcStartOfDay,
                    lte: utcEndOfDay,
                },
            },
            select: {
                id: true,
                pollId: true,
                poll: {
                    select: {
                        id: true,
                        title: true,
                        bettingMode: true,
                    },
                },
            },
            skip,
            take: BATCH_SIZE,
        });

        if (pollLogsBatch.length === 0) {
            hasMore = false;
            break;
        }

        pollLogsBatch.forEach((log) => {
            const pollId = log.pollId;
            const pollTitle = log.poll.title;
            const bettingMode = log.poll.bettingMode;

            if (!stats.pollStats.has(pollId)) {
                stats.pollStats.set(pollId, {
                    pollId,
                    pollTitle,
                    bettingMode,
                    participation: 0,
                });
            }

            const pollStat = stats.pollStats.get(pollId)!;
            stats.participation.add(log.id);
            pollStat.participation += 1;
        });

        skip += BATCH_SIZE;
        hasMore = pollLogsBatch.length === BATCH_SIZE;
    }

    const pollPopularity = Array.from(stats.pollStats.values());

    const data = {
        date: utcStartOfDay,
        participation: stats.participation.size,
        pollPopularity: pollPopularity,
    };

    return await prisma.dailyActivityPolls.upsert({
        where: { date: utcStartOfDay },
        update: data,
        create: data,
    });
}

export async function getRafflePerformance(targetDateISO: string) {
    const targetDate = new Date(targetDateISO);
    const utcStartOfDay = new Date(targetDate);
    utcStartOfDay.setUTCHours(0, 0, 0, 0);

    const utcEndOfDay = new Date(targetDate);
    utcEndOfDay.setUTCHours(23, 59, 59, 999);

    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid targetDate ISO string");
    }

    const existing = await prisma.dailyActivityOffchainRaffles.findUnique({
        where: { date: utcStartOfDay },
    });

    const nextDay = new Date(utcStartOfDay);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const shouldCalculate = !existing || existing.updatedAt < nextDay;

    if (!shouldCalculate) {
        return existing;
    }

    const BATCH_SIZE = 1000;
    const stats = {
        participation: new Set<string>(),
        raffleStats: new Map<
            string,
            {
                raffleId: string;
                raffleTitle: string;
                participation: number;
            }
        >(),
    };

    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const raffleParticipantsBatch = await prisma.raffleParticipant.findMany(
            {
                where: {
                    createdAt: {
                        gte: utcStartOfDay,
                        lte: utcEndOfDay,
                    },
                },
                select: {
                    id: true,
                    raffleId: true,
                    raffle: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                skip,
                take: BATCH_SIZE,
            }
        );

        if (raffleParticipantsBatch.length === 0) {
            hasMore = false;
            break;
        }

        raffleParticipantsBatch.forEach((participant) => {
            const raffleId = participant.raffleId;
            const raffleTitle = participant.raffle.title;

            if (!stats.raffleStats.has(raffleId)) {
                stats.raffleStats.set(raffleId, {
                    raffleId,
                    raffleTitle,
                    participation: 0,
                });
            }

            const raffleStat = stats.raffleStats.get(raffleId)!;
            stats.participation.add(participant.id);
            raffleStat.participation += 1;
        });

        skip += BATCH_SIZE;
        hasMore = raffleParticipantsBatch.length === BATCH_SIZE;
    }

    const rafflePopularity = Array.from(stats.raffleStats.values());

    const data = {
        date: utcStartOfDay,
        participation: stats.participation.size,
        rafflePopularity: rafflePopularity,
    };

    return await prisma.dailyActivityOffchainRaffles.upsert({
        where: { date: utcStartOfDay },
        update: data,
        create: data,
    });
}

export async function getOnchainRafflePerformance(targetDateISO: string) {
    const targetDate = new Date(targetDateISO);
    const utcStartOfDay = new Date(targetDate);
    utcStartOfDay.setUTCHours(0, 0, 0, 0);

    const utcEndOfDay = new Date(targetDate);
    utcEndOfDay.setUTCHours(23, 59, 59, 999);

    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid targetDate ISO string");
    }

    const contracts = await prisma.onchainRaffleContract.findMany({
        where: { isActive: true },
        include: {
            network: {
                select: {
                    id: true,
                    name: true,
                    chainId: true,
                    symbol: true,
                    rpcUrl: true,
                    explorerUrl: true,
                    multicallAddress: true,
                },
            },
        },
    });

    const results = [];

    for (const contract of contracts) {
        try {
            const existing =
                await prisma.dailyActivityOnchainRaffles.findUnique({
                    where: {
                        date_contractAddress_networkId: {
                            date: utcStartOfDay,
                            contractAddress: contract.address,
                            networkId: contract.networkId,
                        },
                    },
                });

            const nextDay = new Date(utcStartOfDay);
            nextDay.setUTCDate(nextDay.getUTCDate() + 1);

            const shouldCalculate = !existing || existing.updatedAt < nextDay;

            if (!shouldCalculate) {
                results.push(existing);
                continue;
            }

            const publicClient = await fetchPublicClient({
                network: contract.network,
            });

            // Use contract deployment block as starting point to avoid unnecessary searches
            const contractDeploymentBlock = BigInt(contract.blockNumber || 0);

            // Only need to find the end block for target date
            const endTimestamp = BigInt(
                Math.floor(utcEndOfDay.getTime() / 1000)
            );
            const latestBlock = await publicClient.getBlock({
                blockTag: "latest",
            });

            const endBlock = await findBlockByTimestamp(
                endTimestamp,
                publicClient,
                contractDeploymentBlock,
                latestBlock.number
            );

            // Start from the later of: contract deployment block or target date start
            const startTimestamp = BigInt(
                Math.floor(utcStartOfDay.getTime() / 1000)
            );
            let startBlock = contractDeploymentBlock;

            // If target date is after contract deployment, find the exact start block
            if (startTimestamp > 0n) {
                const contractDeploymentTimestamp = await publicClient
                    .getBlock({
                        blockNumber: contractDeploymentBlock,
                    })
                    .then((block: any) => block.timestamp)
                    .catch(() => 0n);

                if (startTimestamp > contractDeploymentTimestamp) {
                    startBlock = await findBlockByTimestamp(
                        startTimestamp,
                        publicClient,
                        contractDeploymentBlock,
                        endBlock
                    );
                }
            }

            // Split into chunks to avoid RPC limits (max 10,000 blocks per request)
            const maxBlockRange = 9999n;
            const events = [];

            for (
                let currentStart = startBlock;
                currentStart <= endBlock;
                currentStart += maxBlockRange
            ) {
                const currentEnd =
                    currentStart + maxBlockRange - 1n > endBlock
                        ? endBlock
                        : currentStart + maxBlockRange - 1n;

                try {
                    const chunkEvents = await publicClient.getLogs({
                        address: contract.address as `0x${string}`,
                        event: {
                            type: "event",
                            name: "Participated",
                            inputs: [
                                {
                                    indexed: true,
                                    name: "raffleId",
                                    type: "uint256",
                                },
                                {
                                    indexed: true,
                                    name: "player",
                                    type: "address",
                                },
                                {
                                    name: "participantId",
                                    type: "uint256",
                                },
                                {
                                    name: "ticketNumber",
                                    type: "uint256",
                                },
                            ],
                        },
                        fromBlock: currentStart,
                        toBlock: currentEnd,
                    });
                    events.push(...chunkEvents);

                    // Add delay between chunks to respect rate limits
                    await new Promise((resolve) => setTimeout(resolve, 200)); // 200ms delay between chunks
                } catch (chunkError) {
                    const chunkErrorMessage =
                        chunkError instanceof Error
                            ? chunkError.message
                            : String(chunkError);
                    console.warn(
                        `Failed to fetch events for blocks ${currentStart}-${currentEnd}:`,
                        chunkErrorMessage
                    );

                    // If it's a rate limit error, wait longer before continuing
                    if (
                        chunkErrorMessage.includes("429") ||
                        chunkErrorMessage.includes("Too Many Requests")
                    ) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        );
                    } else {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 500)
                        );
                    }
                    // Continue with next chunk even if one fails
                }
            }

            // Since we used precise block range from binary search,
            // all events are already within target date range
            const targetDateEvents = events;

            const raffleStats = new Map<
                string,
                {
                    raffleId: string;
                    raffleTitle: string;
                    participation: number;
                    contractAddress: string;
                }
            >();

            for (const event of targetDateEvents) {
                if (!event.args || !event.args.raffleId) continue;
                const raffleId = event.args.raffleId.toString();

                if (!raffleStats.has(raffleId)) {
                    let raffleTitle = `Raffle ${raffleId}`;

                    try {
                        const { getContract } = await import("viem");
                        const rafflesJson = await import(
                            "@/web3/artifacts/contracts/Raffles_v2.sol/RafflesV2.json"
                        );

                        const raffleContract = getContract({
                            address: contract.address as `0x${string}`,
                            abi: rafflesJson.abi,
                            client: publicClient,
                        });

                        const cardInfo = await (
                            raffleContract.read as any
                        ).getRaffleListCardInfo([BigInt(raffleId)]);

                        if (cardInfo && cardInfo.title) {
                            raffleTitle = cardInfo.title;
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to get raffle title for ${raffleId}:`,
                            error
                        );
                    }

                    raffleStats.set(raffleId, {
                        raffleId,
                        raffleTitle,
                        participation: 0,
                        contractAddress: contract.address,
                    });
                }

                const raffleStat = raffleStats.get(raffleId)!;
                raffleStat.participation += 1;
            }

            const rafflePopularity = Array.from(raffleStats.values());

            let totalDrawnParticipants = 0;
            const raffleIds = Array.from(raffleStats.keys());
            for (let i = 0; i < raffleIds.length; i++) {
                const raffleId = raffleIds[i];
                try {
                    const { getContract } = await import("viem");
                    const rafflesJson = await import(
                        "@/web3/artifacts/contracts/Raffles_v2.sol/RafflesV2.json"
                    );

                    const raffleContract = getContract({
                        address: contract.address as `0x${string}`,
                        abi: rafflesJson.abi,
                        client: publicClient,
                    });

                    const drawProgress = await (
                        raffleContract.read as any
                    ).getBatchDrawProgress([BigInt(raffleId)]);

                    const drawnCount = Number(drawProgress[1]);
                    totalDrawnParticipants += drawnCount;

                    // Add delay every 3 contract calls to respect rate limits
                    if ((i + 1) % 3 === 0) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 300)
                        );
                    }
                } catch (error) {
                    console.warn(
                        `Failed to get draw progress for raffle ${raffleId}:`,
                        error
                    );
                    // Add delay on error
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }

            const data = {
                date: utcStartOfDay,
                contractAddress: contract.address,
                networkId: contract.networkId,
                participation: targetDateEvents.length,
                totalDrawnParticipants: totalDrawnParticipants,
                rafflePopularity: rafflePopularity,
                totalEvents: events.length,
                processedBlocks: Number(endBlock - startBlock + 1n),
                blockRange: {
                    startBlock: Number(startBlock),
                    endBlock: Number(endBlock),
                },
            };

            const result = await prisma.dailyActivityOnchainRaffles.upsert({
                where: {
                    date_contractAddress_networkId: {
                        date: utcStartOfDay,
                        contractAddress: contract.address,
                        networkId: contract.networkId,
                    },
                },
                update: data,
                create: data,
            });

            results.push(result);
        } catch (error) {
            console.error(
                `Error processing contract ${contract.address}:`,
                error
            );
            continue;
        }
    }

    return results;
}

async function findBlockByTimestamp(
    targetTimestamp: bigint,
    publicClient: any,
    minBlock: bigint,
    maxBlock: bigint
): Promise<bigint> {
    let left = minBlock;
    let right = maxBlock;
    let result = minBlock;
    let requestCount = 0;

    while (left <= right) {
        const mid = (left + right) / 2n;

        try {
            // Add rate limiting every 5 requests during binary search
            if (requestCount > 0 && requestCount % 5 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5 second delay
            }

            const block = await publicClient.getBlock({ blockNumber: mid });
            requestCount++;

            if (block.timestamp <= targetTimestamp) {
                result = mid;
                left = mid + 1n;
            } else {
                right = mid - 1n;
            }
        } catch (error) {
            console.warn(`Block ${mid} not found, adjusting range`, error);
            requestCount++;
            right = mid - 1n;

            // Add extra delay on errors to avoid cascading rate limits
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    }

    return result;
}
