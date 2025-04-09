require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
    solidity: {
        version: "0.8.22",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        polygon: {
            url: process.env.POLYGON_RPC_URL || "",
            accounts: process.env.POLYGON_PRIVATE_KEY
                ? [process.env.POLYGON_PRIVATE_KEY]
                : [],
            chainId: 137,
        },
    },
    etherscan: {
        apiKey: {
            polygon: process.env.POLYGONSCAN_API_KEY || "",
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
