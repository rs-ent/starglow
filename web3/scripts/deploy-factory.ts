/// web3\scripts\deploy-factory.ts

import { formatEther, parseGwei } from "viem";
import hre from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentConfig {
    gasSettings: {
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        gasLimit?: bigint;
    };
    verification: boolean;
}

// 명령줄 인자 파싱 함수
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const result: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
        // 인자가 '--'로 시작하는 경우 처리
        if (args[i].startsWith("--")) {
            const key = args[i].slice(2); // '--' 제거

            // 다음 값이 있고 '--'로 시작하지 않으면 값으로 간주
            if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                result[key] = args[i + 1];
                i++; // 값을 사용했으므로 인덱스 증가
            } else {
                // 값이 없는 플래그는 true로 설정
                result[key] = "true";
            }
        }
    }

    return result;
}

// 명령줄 인자에서 가스 설정을 가져오는 함수
function getGasSettingsFromArgs(): {
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasLimit?: bigint;
} {
    const args = parseCommandLineArgs();
    const settings: {
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        gasLimit?: bigint;
    } = {};

    // 명령줄 인자에서 가스 설정 읽기
    if (args["max-fee"]) {
        settings.maxFeePerGas = parseGwei(args["max-fee"]);
    }

    if (args["max-priority-fee"]) {
        settings.maxPriorityFeePerGas = parseGwei(args["max-priority-fee"]);
    }

    if (args["gas-limit"]) {
        settings.gasLimit = BigInt(args["gas-limit"]);
    }

    return settings;
}

// 네트워크별 기본 가스 설정 (참고용)
const defaultGasSettings: Record<string, DeploymentConfig> = {
    hardhat: {
        gasSettings: {},
        verification: false,
    },
    sepolia: {
        gasSettings: {
            maxFeePerGas: 3000000000n, // 3 gwei
            maxPriorityFeePerGas: 2000000000n, // 2 gwei
            gasLimit: 4000000n, // 4M
        },
        verification: true,
    },
    polygonAmoy: {
        gasSettings: {
            maxFeePerGas: 500000000n, // 0.5 gwei
            maxPriorityFeePerGas: 300000000n, // 0.3 gwei
            gasLimit: 5000000n, // 5M
        },
        verification: true,
    },
    // 추가 네트워크 설정...
};

async function main() {
    try {
        console.log("Deploying Factory contract...");

        // 기본 설정 가져오기
        const networkName = process.env.HARDHAT_NETWORK || "hardhat";
        const skipVerification = process.argv.includes("--skip-verification");
        const dryRun = process.argv.includes("--dry-run");
        const forceDefaultGas = process.argv.includes("--use-default-gas");

        console.log(`Network: ${networkName}`);

        // 가스 설정 결정 (명령줄 인자 > 기본 설정)
        let gasSettings;

        if (forceDefaultGas) {
            // 기본 가스 설정 사용
            gasSettings = defaultGasSettings[networkName]?.gasSettings || {};
            console.log("Using default gas settings for", networkName);
        } else {
            // 명령줄 인자에서 가스 설정 가져오기
            gasSettings = getGasSettingsFromArgs();

            // 가스 설정이 제공되지 않은 경우 에러
            if (
                Object.keys(gasSettings).length === 0 &&
                networkName !== "hardhat" &&
                networkName !== "localhost"
            ) {
                console.error(
                    "\nERROR: Gas settings are required for deployment to network:",
                    networkName
                );
                console.error(
                    "Please provide the following command line arguments:"
                );
                console.error(
                    "  --max-fee <gwei>         - Maximum fee per gas in gwei"
                );
                console.error(
                    "  --max-priority-fee <gwei> - Maximum priority fee per gas in gwei"
                );
                console.error(
                    "  --gas-limit <limit>      - Gas limit for deployment"
                );
                console.error("\nExample:");
                console.error(
                    `  npx hardhat run scripts/deploy-factory.ts --network ${networkName} --max-fee 3 --max-priority-fee 2 --gas-limit 4000000`
                );
                console.error(
                    "\nOr use --use-default-gas to use default gas settings"
                );

                if (defaultGasSettings[networkName]) {
                    console.error(
                        "\nDefault gas settings for",
                        networkName,
                        ":"
                    );
                    console.error(
                        "  --max-fee",
                        Number(
                            defaultGasSettings[networkName].gasSettings
                                .maxFeePerGas || 0n
                        ) / 1e9,
                        "gwei"
                    );
                    console.error(
                        "  --max-priority-fee",
                        Number(
                            defaultGasSettings[networkName].gasSettings
                                .maxPriorityFeePerGas || 0n
                        ) / 1e9,
                        "gwei"
                    );
                    console.error(
                        "  --gas-limit",
                        defaultGasSettings[
                            networkName
                        ].gasSettings.gasLimit?.toString()
                    );
                }

                process.exit(1);
            }
        }

        // 로그 출력으로 가스 설정 확인
        if (Object.keys(gasSettings).length > 0) {
            console.log("Using gas settings:");
            if (gasSettings.maxFeePerGas) {
                console.log(
                    `- Max Fee: ${formatEther(gasSettings.maxFeePerGas)} ETH (${
                        gasSettings.maxFeePerGas
                    } wei)`
                );
            }
            if (gasSettings.maxPriorityFeePerGas) {
                console.log(
                    `- Max Priority Fee: ${formatEther(
                        gasSettings.maxPriorityFeePerGas
                    )} ETH (${gasSettings.maxPriorityFeePerGas} wei)`
                );
            }
            if (gasSettings.gasLimit) {
                console.log(`- Gas Limit: ${gasSettings.gasLimit}`);
            }
        } else {
            console.log("No specific gas settings required for local network.");
        }

        // 검증 설정
        const verification =
            defaultGasSettings[networkName]?.verification !== false &&
            !skipVerification;

        // 최종 설정 적용
        const currentConfig = {
            gasSettings,
            verification,
        };

        // 배포 계정 설정
        const publicClient = await hre.viem.getPublicClient();
        const [deployer] = await hre.viem.getWalletClients();

        // 네트워크 정보 얻기
        const chainId = await publicClient.getChainId();

        // 배포 계정 잔액 확인
        const balance = await publicClient.getBalance({
            address: deployer.account.address,
        });

        console.log(
            `Deploying with account: ${deployer.account.address}`,
            `\nBalance: ${formatEther(balance)} ETH`,
            `\nChain ID: ${chainId}`
        );

        if (dryRun) {
            console.log("\nDRY RUN - Stopping before actual deployment");
            return;
        }

        console.log("\nDeploying Factory contract...");
        const Factory = await hre.ethers.getContractFactory(
            "CollectionFactory"
        );

        const deployTx = await Factory.deploy(
            deployer.account.address,
            currentConfig.gasSettings
        );

        console.log(`Deployment transaction hash: ${deployTx.hash}`);
        console.log("Waiting for deployment transaction confirmation...");

        await deployTx.waitForDeployment();
        const factoryAddress = deployTx.address;

        console.log(`\nFactory deployed successfully! ✅`);
        console.log(`Contract address: ${factoryAddress}`);

        // 배포 정보 저장
        const deploymentInfo = {
            network: networkName,
            chainId: chainId,
            factoryAddress: factoryAddress,
            deployer: deployer.account.address,
            transactionHash: deployTx.hash,
            gasSettings: {
                maxFeePerGas:
                    currentConfig.gasSettings.maxFeePerGas?.toString(),
                maxPriorityFeePerGas:
                    currentConfig.gasSettings.maxPriorityFeePerGas?.toString(),
                gasLimit: currentConfig.gasSettings.gasLimit?.toString(),
            },
            timestamp: new Date().toISOString(),
        };

        const deploymentsDir = path.join(__dirname, "../deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        const networkDir = path.join(deploymentsDir, networkName);
        if (!fs.existsSync(networkDir)) {
            fs.mkdirSync(networkDir);
        }

        fs.writeFileSync(
            path.join(networkDir, "Factory.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );

        // 컨트랙트 검증
        if (
            currentConfig.verification &&
            networkName !== "hardhat" &&
            networkName !== "localhost"
        ) {
            console.log("\nVerifying contract on block explorer...");
            try {
                await hre.run("verify:verify", {
                    address: factoryAddress,
                    constructorArguments: [deployer.account.address],
                });
                console.log("Verification successful! ✅");
            } catch (error) {
                console.error("Verification failed:", error);
                console.log(`Contract address: ${factoryAddress}`);
                console.log(
                    `Constructor arguments: [${deployer.account.address}]`
                );
            }
        }

        console.log(
            `\nDeployment completed! 🚀`,
            `\n- Network: ${networkName}`,
            `\n- Chain ID: ${chainId}`,
            `\n- Factory address: ${factoryAddress}`,
            `\n- Transaction hash: ${deployTx.hash}`,
            `\n- Deployment info saved to: ${path.join(
                networkDir,
                "Factory.json"
            )}`
        );

        // 환경 변수로 활용할 수 있는 포맷으로 출력
        console.log("\nSet these values in your environment:");
        console.log(`FACTORY_CONTRACT_ADDRESS=${factoryAddress}`);
        console.log(`FACTORY_DEPLOY_TX_HASH=${deployTx.hash}`);

        // 서버 액션에서 결과를 쉽게 파싱할 수 있도록 명확한 표시자 추가
        console.log("\n---DEPLOYMENT_RESULT_START---");
        console.log(
            JSON.stringify({
                address: factoryAddress,
                transactionHash: deployTx.hash,
                network: networkName,
                chainId: chainId,
            })
        );
        console.log("---DEPLOYMENT_RESULT_END---");
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
