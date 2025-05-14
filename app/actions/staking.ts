/// app/actions/staking.ts

"use server";

import stakingJson from "@/web3/artifacts/contracts/Staking.sol/Staking.json";
const stakingAbi = stakingJson.abi;
const stakingBytecode = stakingJson.bytecode as `0x${string}`;

import assetsJson from "@/web3/artifacts/contracts/Assets.sol/Assets.json";
const assetsAbi = assetsJson.abi;
const assetsBytecode = assetsJson.bytecode as `0x${string}`;

import collectionJson from "@/web3/artifacts/contracts/Collection.sol/Collection.json";
const collectionAbi = collectionJson.abi;
const collectionBytecode = collectionJson.bytecode as `0x${string}`;

export interface DeployStakingInput {
    networkId: string;
    walletId: string;
    collectionAddress: string;
    assetsAddress: string;
}
