import hre from "hardhat";

async function main() {
    const txHash = process.argv[2];

    if (!txHash) {
        console.log("❌ Please provide transaction hash");
        console.log(
            "Usage: npx hardhat run scripts/check-transaction.ts --network berachain_bepolia <TX_HASH>"
        );
        return;
    }

    console.log(`🔍 Checking transaction: ${txHash}`);
    console.log(`📡 Network: ${hre.network.name}`);

    try {
        const tx = await hre.ethers.provider.getTransaction(txHash);

        if (!tx) {
            console.log("❌ Transaction not found");
            return;
        }

        console.log("\n📋 Transaction Details:");
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to || "Contract Creation"}`);
        console.log(`Value: ${hre.ethers.formatEther(tx.value || 0)} ETH`);
        console.log(`Gas Limit: ${tx.gasLimit}`);
        console.log(
            `Gas Price: ${hre.ethers.formatUnits(
                tx.gasPrice || 0,
                "gwei"
            )} gwei`
        );

        const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);

        if (!receipt) {
            console.log("\n⏳ Transaction is still pending...");
            console.log("💡 Please wait for it to be mined.");

            if (hre.network.name === "berachain_bepolia") {
                console.log(
                    `🔗 Check status: https://bepolia.beratrail.io/tx/${txHash}`
                );
            }
            return;
        }

        console.log("\n✅ Transaction confirmed!");
        console.log(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);
        console.log(`Block Number: ${receipt.blockNumber}`);
        console.log(`Gas Used: ${receipt.gasUsed}`);

        if (receipt.status === 1 && receipt.contractAddress) {
            console.log(
                `\n🎉 Contract deployed to: ${receipt.contractAddress}`
            );

            console.log("\n🔍 To verify the contract, run:");
            console.log(
                `npx hardhat verify --network ${hre.network.name} ${receipt.contractAddress}`
            );

            if (hre.network.name === "berachain_bepolia") {
                console.log("\n🐻 Berachain Bepolia Explorer:");
                console.log(
                    `https://bepolia.beratrail.io/address/${receipt.contractAddress}`
                );
            }
        } else if (receipt.status === 0) {
            console.log("\n❌ Transaction failed!");
            console.log(
                "💡 Check the transaction details on the explorer for more information."
            );
        }

        if (hre.network.name === "berachain_bepolia") {
            console.log(
                `\n🔗 Explorer: https://bepolia.beratrail.io/tx/${txHash}`
            );
        }
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
