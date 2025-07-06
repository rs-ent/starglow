/// scripts/bulk-update-asset-references.ts

import { config } from "dotenv";
import path from "path";

// Load environment variables from .env file with explicit path
const envPath = path.resolve(process.cwd(), ".env");
console.log(`Loading .env from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
    console.error("Error loading .env file:", result.error);
} else {
    console.log("✅ Environment variables loaded successfully");
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables");
    process.exit(1);
} else {
    console.log("✅ DATABASE_URL found");
}

// Use regular PrismaClient for script execution (not edge version)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface BulkUpdateAssetReferencesInput {
    oldAssetId: string;
    newAssetId: string;
}

interface BulkUpdateAssetReferencesResult {
    success: boolean;
    updatedCounts: {
        playerAssets: number;
        questRewardAssets: number;
        questLogRewardAssets: number;
        pollBettingAssets: number;
        pollParticipationConsumeAssets: number;
        pollParticipationRewardAssets: number;
        pollLogRewardAssets: number;
        rewardsLogs: number;
        stakeRewards: number;
        stakeRewardLogs: number;
        boardPostRewards: number;
        boardPostCreationRewards: number;
        boardPopularPostRewards: number;
        boardQualityContentRewards: number;
        rafflePrizes: number;
        raffleEntryFeeAssets: number;
        assetTransactions: number;
    };
    error?: string;
}

async function bulkUpdateAssetReferences(
    input: BulkUpdateAssetReferencesInput
): Promise<BulkUpdateAssetReferencesResult> {
    try {
        // First, verify both assets exist
        const [oldAsset, newAsset] = await Promise.all([
            prisma.asset.findUnique({ where: { id: input.oldAssetId } }),
            prisma.asset.findUnique({ where: { id: input.newAssetId } }),
        ]);

        if (!oldAsset) {
            return {
                success: false,
                error: `Old asset with ID ${input.oldAssetId} not found`,
                updatedCounts: {} as any,
            };
        }

        if (!newAsset) {
            return {
                success: false,
                error: `New asset with ID ${input.newAssetId} not found`,
                updatedCounts: {} as any,
            };
        }

        // Perform the bulk update in a transaction
        const updatedCounts = await prisma.$transaction(async (tx) => {
            const counts = {
                playerAssets: 0,
                questRewardAssets: 0,
                questLogRewardAssets: 0,
                pollBettingAssets: 0,
                pollParticipationConsumeAssets: 0,
                pollParticipationRewardAssets: 0,
                pollLogRewardAssets: 0,
                rewardsLogs: 0,
                stakeRewards: 0,
                stakeRewardLogs: 0,
                boardPostRewards: 0,
                boardPostCreationRewards: 0,
                boardPopularPostRewards: 0,
                boardQualityContentRewards: 0,
                rafflePrizes: 0,
                raffleEntryFeeAssets: 0,
                assetTransactions: 0,
            };

            // Update PlayerAsset
            const playerAssetUpdate = await tx.playerAsset.updateMany({
                where: { assetId: input.oldAssetId },
                data: { assetId: input.newAssetId },
            });
            counts.playerAssets = playerAssetUpdate.count;

            // Update Quest rewardAssetId
            const questUpdate = await tx.quest.updateMany({
                where: { rewardAssetId: input.oldAssetId },
                data: { rewardAssetId: input.newAssetId },
            });
            counts.questRewardAssets = questUpdate.count;

            // Update QuestLog rewardAssetId
            const questLogUpdate = await tx.questLog.updateMany({
                where: { rewardAssetId: input.oldAssetId },
                data: { rewardAssetId: input.newAssetId },
            });
            counts.questLogRewardAssets = questLogUpdate.count;

            // Update Poll bettingAssetId
            const pollBettingUpdate = await tx.poll.updateMany({
                where: { bettingAssetId: input.oldAssetId },
                data: { bettingAssetId: input.newAssetId },
            });
            counts.pollBettingAssets = pollBettingUpdate.count;

            // Update Poll participationConsumeAssetId
            const pollConsumeUpdate = await tx.poll.updateMany({
                where: { participationConsumeAssetId: input.oldAssetId },
                data: { participationConsumeAssetId: input.newAssetId },
            });
            counts.pollParticipationConsumeAssets = pollConsumeUpdate.count;

            // Update Poll participationRewardAssetId
            const pollRewardUpdate = await tx.poll.updateMany({
                where: { participationRewardAssetId: input.oldAssetId },
                data: { participationRewardAssetId: input.newAssetId },
            });
            counts.pollParticipationRewardAssets = pollRewardUpdate.count;

            // Update PollLog rewardAssetId
            const pollLogUpdate = await tx.pollLog.updateMany({
                where: { rewardAssetId: input.oldAssetId },
                data: { rewardAssetId: input.newAssetId },
            });
            counts.pollLogRewardAssets = pollLogUpdate.count;

            // Update RewardsLog assetId
            const rewardsLogUpdate = await tx.rewardsLog.updateMany({
                where: { assetId: input.oldAssetId },
                data: { assetId: input.newAssetId },
            });
            counts.rewardsLogs = rewardsLogUpdate.count;

            // Update StakeReward assetId
            const stakeRewardUpdate = await tx.stakeReward.updateMany({
                where: { assetId: input.oldAssetId },
                data: { assetId: input.newAssetId },
            });
            counts.stakeRewards = stakeRewardUpdate.count;

            // Update StakeRewardLog assetId
            const stakeRewardLogUpdate = await tx.stakeRewardLog.updateMany({
                where: { assetId: input.oldAssetId },
                data: { assetId: input.newAssetId },
            });
            counts.stakeRewardLogs = stakeRewardLogUpdate.count;

            // Update BoardPostReward assetId
            const boardPostRewardUpdate = await tx.boardPostReward.updateMany({
                where: { assetId: input.oldAssetId },
                data: { assetId: input.newAssetId },
            });
            counts.boardPostRewards = boardPostRewardUpdate.count;

            // Update Board postCreationRewardAssetId
            const boardPostCreationUpdate = await tx.board.updateMany({
                where: { postCreationRewardAssetId: input.oldAssetId },
                data: { postCreationRewardAssetId: input.newAssetId },
            });
            counts.boardPostCreationRewards = boardPostCreationUpdate.count;

            // Update Board popularPostRewardAssetId
            const boardPopularUpdate = await tx.board.updateMany({
                where: { popularPostRewardAssetId: input.oldAssetId },
                data: { popularPostRewardAssetId: input.newAssetId },
            });
            counts.boardPopularPostRewards = boardPopularUpdate.count;

            // Update Board qualityContentRewardAssetId
            const boardQualityUpdate = await tx.board.updateMany({
                where: { qualityContentRewardAssetId: input.oldAssetId },
                data: { qualityContentRewardAssetId: input.newAssetId },
            });
            counts.boardQualityContentRewards = boardQualityUpdate.count;

            // Update RafflePrize assetId
            const rafflePrizeUpdate = await tx.rafflePrize.updateMany({
                where: { assetId: input.oldAssetId },
                data: { assetId: input.newAssetId },
            });
            counts.rafflePrizes = rafflePrizeUpdate.count;

            // Update Raffle entryFeeAssetId
            const raffleEntryUpdate = await tx.raffle.updateMany({
                where: { entryFeeAssetId: input.oldAssetId },
                data: { entryFeeAssetId: input.newAssetId },
            });
            counts.raffleEntryFeeAssets = raffleEntryUpdate.count;

            // Update AssetTransaction assetId
            const assetTransactionUpdate = await tx.assetTransaction.updateMany(
                {
                    where: { assetId: input.oldAssetId },
                    data: { assetId: input.newAssetId },
                }
            );
            counts.assetTransactions = assetTransactionUpdate.count;

            return counts;
        });

        console.log(`Asset references bulk update completed:`, updatedCounts);

        return {
            success: true,
            updatedCounts,
        };
    } catch (error) {
        console.error("Failed to bulk update asset references:", error);
        return {
            success: false,
            error: `Failed to update asset references: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            updatedCounts: {} as any,
        };
    }
}

async function main() {
    console.log("🚀 Starting bulk asset reference update...");

    const oldAssetId = "cmcn4nkki01bcej0wei08v5fb"; // TSGP asset ID
    const newAssetId = "cmcq98cyn00vpjt0vlxsb9esn"; // SGP asset ID

    console.log(`📋 Updating references from: ${oldAssetId}`);
    console.log(`📋 Updating references to: ${newAssetId}`);
    console.log("⏳ Processing...\n");

    const result = await bulkUpdateAssetReferences({
        oldAssetId,
        newAssetId,
    });

    if (result.success) {
        console.log("✅ Bulk update completed successfully!");
        console.log("\n📊 Updated counts:");
        console.log(`   • Player Assets: ${result.updatedCounts.playerAssets}`);
        console.log(
            `   • Quest Reward Assets: ${result.updatedCounts.questRewardAssets}`
        );
        console.log(
            `   • Quest Log Reward Assets: ${result.updatedCounts.questLogRewardAssets}`
        );
        console.log(
            `   • Poll Betting Assets: ${result.updatedCounts.pollBettingAssets}`
        );
        console.log(
            `   • Poll Participation Consume Assets: ${result.updatedCounts.pollParticipationConsumeAssets}`
        );
        console.log(
            `   • Poll Participation Reward Assets: ${result.updatedCounts.pollParticipationRewardAssets}`
        );
        console.log(
            `   • Poll Log Reward Assets: ${result.updatedCounts.pollLogRewardAssets}`
        );
        console.log(`   • Rewards Logs: ${result.updatedCounts.rewardsLogs}`);
        console.log(`   • Stake Rewards: ${result.updatedCounts.stakeRewards}`);
        console.log(
            `   • Stake Reward Logs: ${result.updatedCounts.stakeRewardLogs}`
        );
        console.log(
            `   • Board Post Rewards: ${result.updatedCounts.boardPostRewards}`
        );
        console.log(
            `   • Board Post Creation Rewards: ${result.updatedCounts.boardPostCreationRewards}`
        );
        console.log(
            `   • Board Popular Post Rewards: ${result.updatedCounts.boardPopularPostRewards}`
        );
        console.log(
            `   • Board Quality Content Rewards: ${result.updatedCounts.boardQualityContentRewards}`
        );
        console.log(`   • Raffle Prizes: ${result.updatedCounts.rafflePrizes}`);
        console.log(
            `   • Raffle Entry Fee Assets: ${result.updatedCounts.raffleEntryFeeAssets}`
        );
        console.log(
            `   • Asset Transactions: ${result.updatedCounts.assetTransactions}`
        );

        const totalUpdated = Object.values(result.updatedCounts).reduce(
            (sum, count) => sum + count,
            0
        );
        console.log(`\n🎯 Total records updated: ${totalUpdated}`);
    } else {
        console.error("❌ Bulk update failed:");
        console.error(`   Error: ${result.error}`);
        process.exit(1);
    }
}

main()
    .then(() => {
        console.log("\n🎉 Script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Script failed with error:");
        console.error(error);
        process.exit(1);
    });
