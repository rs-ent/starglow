const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Deploying contracts...");

    // Collection 컨트랙트 배포
    const Collection = await ethers.getContractFactory("StarglowCollection");
    const collection = await Collection.deploy();
    await collection.waitForDeployment();
    const collectionAddress = await collection.getAddress();
    console.log(
        "StarglowCollection implementation deployed to:",
        collectionAddress
    );

    // Factory 컨트랙트 배포
    const Factory = await ethers.getContractFactory("StarglowFactory");
    const factory = await Factory.deploy(collectionAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("StarglowFactory deployed to:", factoryAddress);

    console.log("Deployment completed!");
    console.log("-------------------");
    console.log("Collection Implementation:", collectionAddress);
    console.log("Factory:", factoryAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
