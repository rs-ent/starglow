import { Network, Alchemy } from "alchemy-sdk";

const settings = {
    apiKey: "bF31V5FnOVPvKXz7odRaV8_ITeiuJpLM",
    network: Network.MATIC_MAINNET,
};

const alchemy = new Alchemy(settings);

// get all the sent transactions from given address
const sentTransactions = alchemy.core
    .getAssetTransfers({
        fromBlock: "0x0",
        fromAddress: "0x994b342dd87fc825f66e51ffa3ef71ad818b6893",
        category: ["erc721", "external", "erc20"],
    })
    .then(console.log);
