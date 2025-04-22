import { formatEther } from "viem";
import hre from "hardhat";

async function main() {
    try {
        console.log("Deploying Collection...");

        // 배포 계정 설정
        const publicClient = await hre.viem.getPublicClient();
        const [deployer] = await hre.viem.getWalletClients();

        // 배포 계정 잔액 확인
        const balance = await publicClient.getBalance({
            address: deployer.account.address,
        });

        console.log(
            `Deploying with account: ${deployer.account.address}\n`,
            `Balance: ${formatEther(balance)} ETH`
        );

        // Collection 컨트랙트 배포
        const Collection = await hre.ethers.getContractFactory("Collection");
        const collection = await Collection.deploy(
            "Starglow Collection", // name
            "STAR", // symbol
            deployer.account.address, // initialOwner
            1000n, // maxSupply
            0n, // initialMintPrice
            "https://api.starglow.com/metadata/", // baseURI
            "https://api.starglow.com/contract-metadata", // contractURI
            {
                maxFeePerGas: 3000000000n, // 3 gwei
                maxPriorityFeePerGas: 2000000000n, // 2 gwei
                gasLimit: 4000000n, // 가스 한도 증가 (4M)
            }
        );

        await collection.waitForDeployment();
        const collectionAddress = await collection.getAddress();
        console.log("Collection deployed to:", collectionAddress);

        // 배포 검증
        const adminRole = await collection.DEFAULT_ADMIN_ROLE();
        const hasRole = await collection.hasRole(
            adminRole,
            deployer.account.address
        );

        console.log(
            `\nDeployment completed!`,
            `\nCollection address: ${collectionAddress}`,
            `\nAdmin role check: ${hasRole ? "Success ✅" : "Failed ❌"}`,
            `\n`,
            `\nVerify on Etherscan:`,
            `\nnpx hardhat verify --network sepolia ${collectionAddress} "Starglow Collection" "STAR" "${deployer.account.address}" 1000 0 "https://api.starglow.com/metadata/" "https://api.starglow.com/contract-metadata"`
        );
    } catch (error) {
        console.error("\nDeployment failed:", error);
        process.exit(1);
    }
}

// 스크립트 실행
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
