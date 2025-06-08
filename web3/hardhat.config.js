"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-viem");
require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("dotenv/config");
const config = {
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
    networks: {
        sepolia: {
            url:
                process.env.SEPOLIA_RPC_URL ||
                "https://ethereum-sepolia.rpc.subquery.network/public",
            accounts: process.env.ESCROW_PRIVATE_KEY
                ? [process.env.ESCROW_PRIVATE_KEY]
                : [],
            chainId: 11155111,
        },
        polygonAmoy: {
            url:
                process.env.POLYGON_RPC_URL ||
                "https://rpc-amoy.polygon.technology",
            accounts: process.env.ESCROW_PRIVATE_KEY
                ? [process.env.ESCROW_PRIVATE_KEY]
                : [],
            chainId: 80002,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
exports.default = config;
