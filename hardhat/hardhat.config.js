require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        amoy: {
            url: process.env.AMOY_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: process.env.POLYGONSCAN_API_KEY,
    },
};
