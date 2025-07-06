/// scripts/preview-asset-references.ts

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

async function main() {
    console.log("🔍 Previewing asset reference changes...");

    const oldAssetId = "cmcn4nkki01bcej0wei08v5fb"; // TSGP asset ID
    const newAssetId = "cmcq98cyn00vpjt0vlxsb9esn"; // SGP asset ID

    console.log(`📋 Old Asset ID: ${oldAssetId}`);
    console.log(`📋 New Asset ID: ${newAssetId}`);

    // Verify both assets exist
    const [oldAsset, newAsset] = await Promise.all([
        prisma.asset.findUnique({
            where: { id: oldAssetId },
            select: { id: true, name: true, symbol: true },
        }),
        prisma.asset.findUnique({
            where: { id: newAssetId },
            select: { id: true, name: true, symbol: true },
        }),
    ]);

    if (!oldAsset) {
        console.error(`❌ Old asset with ID ${oldAssetId} not found`);
        process.exit(1);
    }

    if (!newAsset) {
        console.error(`❌ New asset with ID ${newAssetId} not found`);
        process.exit(1);
    }

    console.log(`\n📄 Old Asset: ${oldAsset.name} (${oldAsset.symbol})`);
    console.log(`📄 New Asset: ${newAsset.name} (${newAsset.symbol})`);

    console.log("\n⏳ Counting affected records...\n");

    // Count records in each table
    const counts = await Promise.all([
        prisma.playerAsset.count({ where: { assetId: oldAssetId } }),
        prisma.quest.count({ where: { rewardAssetId: oldAssetId } }),
        prisma.questLog.count({ where: { rewardAssetId: oldAssetId } }),
        prisma.poll.count({ where: { bettingAssetId: oldAssetId } }),
        prisma.poll.count({
            where: { participationConsumeAssetId: oldAssetId },
        }),
        prisma.poll.count({
            where: { participationRewardAssetId: oldAssetId },
        }),
        prisma.pollLog.count({ where: { rewardAssetId: oldAssetId } }),
        prisma.rewardsLog.count({ where: { assetId: oldAssetId } }),
        prisma.stakeReward.count({ where: { assetId: oldAssetId } }),
        prisma.stakeRewardLog.count({ where: { assetId: oldAssetId } }),
        prisma.boardPostReward.count({ where: { assetId: oldAssetId } }),
        prisma.board.count({
            where: { postCreationRewardAssetId: oldAssetId },
        }),
        prisma.board.count({ where: { popularPostRewardAssetId: oldAssetId } }),
        prisma.board.count({
            where: { qualityContentRewardAssetId: oldAssetId },
        }),
        prisma.rafflePrize.count({ where: { assetId: oldAssetId } }),
        prisma.raffle.count({ where: { entryFeeAssetId: oldAssetId } }),
        prisma.assetTransaction.count({ where: { assetId: oldAssetId } }),
    ]);

    const [
        playerAssets,
        questRewardAssets,
        questLogRewardAssets,
        pollBettingAssets,
        pollParticipationConsumeAssets,
        pollParticipationRewardAssets,
        pollLogRewardAssets,
        rewardsLogs,
        stakeRewards,
        stakeRewardLogs,
        boardPostRewards,
        boardPostCreationRewards,
        boardPopularPostRewards,
        boardQualityContentRewards,
        rafflePrizes,
        raffleEntryFeeAssets,
        assetTransactions,
    ] = counts;

    console.log("📊 Records that will be updated:");
    console.log(`   • Player Assets: ${playerAssets}`);
    console.log(`   • Quest Reward Assets: ${questRewardAssets}`);
    console.log(`   • Quest Log Reward Assets: ${questLogRewardAssets}`);
    console.log(`   • Poll Betting Assets: ${pollBettingAssets}`);
    console.log(
        `   • Poll Participation Consume Assets: ${pollParticipationConsumeAssets}`
    );
    console.log(
        `   • Poll Participation Reward Assets: ${pollParticipationRewardAssets}`
    );
    console.log(`   • Poll Log Reward Assets: ${pollLogRewardAssets}`);
    console.log(`   • Rewards Logs: ${rewardsLogs}`);
    console.log(`   • Stake Rewards: ${stakeRewards}`);
    console.log(`   • Stake Reward Logs: ${stakeRewardLogs}`);
    console.log(`   • Board Post Rewards: ${boardPostRewards}`);
    console.log(
        `   • Board Post Creation Rewards: ${boardPostCreationRewards}`
    );
    console.log(`   • Board Popular Post Rewards: ${boardPopularPostRewards}`);
    console.log(
        `   • Board Quality Content Rewards: ${boardQualityContentRewards}`
    );
    console.log(`   • Raffle Prizes: ${rafflePrizes}`);
    console.log(`   • Raffle Entry Fee Assets: ${raffleEntryFeeAssets}`);
    console.log(`   • Asset Transactions: ${assetTransactions}`);

    const totalRecords = counts.reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 Total records to be updated: ${totalRecords}`);

    if (totalRecords > 0) {
        console.log(`\n✅ Ready to proceed with bulk update!`);
        console.log(`💡 Run: yarn bulk-update-assets`);
    } else {
        console.log(`\n⚠️  No records found with the old asset ID.`);
    }
}

main()
    .then(() => {
        console.log("\n🎉 Preview completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Preview failed with error:");
        console.error(error);
        process.exit(1);
    });
