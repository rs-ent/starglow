/// web3\scripts\deploy-factory.ts

import { formatEther } from "viem";
import hre from "hardhat";

async function main() {
    try {
        console.log("Deploying Factory contract...");

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

        // Factory 컨트랙트 배포
        const Factory = await hre.ethers.getContractFactory(
            "CollectionFactory"
        );
        const factory = await Factory.deploy(deployer.account.address, {
            maxFeePerGas: 3000000000n, // 3 gwei
            maxPriorityFeePerGas: 2000000000n, // 2 gwei
            gasLimit: 4000000n, // 가스 한도 증가 (4M)
        });

        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();
        console.log("Factory deployed to:", factoryAddress);

        // 배포 검증
        console.log("\nVerifying contract on Etherscan...");
        await hre.run("verify:verify", {
            address: factoryAddress,
            constructorArguments: [deployer.account.address],
        });

        console.log(
            `\nDeployment completed!`,
            `\nFactory address: ${factoryAddress}`,
            `\nVerification: Success ✅`
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
