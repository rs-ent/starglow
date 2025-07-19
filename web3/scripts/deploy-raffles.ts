import hre from "hardhat";

async function main() {
    console.log("🎯 Deploying Raffles contract...");

    const network = hre.network.name;
    console.log(`📡 Network: ${network}`);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`🚀 Deploying from: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);

    console.log("\n⏳ Deploying Raffles contract...");

    const Raffles = await hre.ethers.getContractFactory("Raffles");
    const raffles = await Raffles.deploy();

    await raffles.waitForDeployment();
    const rafflesAddress = await raffles.getAddress();

    console.log(`✅ Raffles deployed to: ${rafflesAddress}`);

    console.log("\n📋 Deployment Summary:");
    console.log(`Contract Address: ${rafflesAddress}`);
    console.log(`Network: ${network}`);
    console.log(`Deployer: ${deployer.address}`);

    const deploymentInfo = {
        contractAddress: rafflesAddress,
        network: network,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
    };

    console.log("\n🔍 To verify the contract, run:");
    console.log(`npx hardhat verify --network ${network} ${rafflesAddress}`);

    if (network === "berachain_bepolia") {
        console.log("\n🐻 Berachain Bepolia Explorer:");
        console.log(`https://bepolia.beratrail.io/address/${rafflesAddress}`);
        console.log("\n📝 Make sure your .env file contains:");
        console.log("ESCROW_PRIVATE_KEY=your_private_key_here");
    }

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
