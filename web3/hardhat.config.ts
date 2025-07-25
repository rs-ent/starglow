import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 500,
                details: {
                    yul: true,
                    yulDetails: {
                        stackAllocation: true,
                        optimizerSteps: "dhfoDgvulfnTUtnIf",
                    },
                },
            },
            viaIR: true,
        },
    },
    etherscan: {
        apiKey: {
            berachain: "berachain", // apiKey is not required, just set a placeholder
        },
        customChains: [
            {
                network: "berachain",
                chainId: 80094,
                urls: {
                    apiURL: "https://api.routescan.io/v2/network/mainnet/evm/80094/etherscan",
                    browserURL: "https://beratrail.io",
                },
            },
        ],
    },
    networks: {
        sepolia: {
            url:
                process.env.SEPOLIA_RPC_URL ||
                "https://ethereum-sepolia.rpc.subquery.network/public",
            accounts: process.env.ESCROW_PRIVATE_KEY
                ? [process.env.ESCROW_PRIVATE_KEY]
                : [],
            chainId: 11155111,
            timeout: 300000,
            gasPrice: "auto",
        },
        polygonAmoy: {
            url:
                process.env.POLYGON_RPC_URL ||
                "https://rpc-amoy.polygon.technology",
            accounts: process.env.ESCROW_PRIVATE_KEY
                ? [process.env.ESCROW_PRIVATE_KEY]
                : [],
            chainId: 80002,
            timeout: 300000,
            gas: 6000000,
            gasPrice: 30000000000, // 30 gwei
        },
        berachain_bepolia: {
            url:
                process.env.BERACHAIN_RPC_URL ||
                "https://bepolia.rpc.berachain.com",
            accounts: process.env.ESCROW_PRIVATE_KEY
                ? [process.env.ESCROW_PRIVATE_KEY]
                : [],
            chainId: 80069,
            timeout: 300000,
            gas: 6000000,
            gasPrice: 10000000000, // 10 gwei
        },
        berachain: {
            url: "https://rpc.berachain.com",
            accounts: process.env.ESCROW_PRIVATE_KEY
                ? [process.env.ESCROW_PRIVATE_KEY]
                : [],
            chainId: 80094,
            timeout: 300000,
            gas: 6000000,
            gasPrice: 10000000000, // 10 gwei
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
