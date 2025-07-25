// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface ReentrancyGuardUpgradeable$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "ReentrancyGuardUpgradeable",
  "sourceName": "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol",
  "abi": [
    {
      "inputs": [],
      "name": "InvalidInitialization",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitializing",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "version",
          "type": "uint64"
        }
      ],
      "name": "Initialized",
      "type": "event"
    }
  ],
  "bytecode": "0x",
  "deployedBytecode": "0x",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "ReentrancyGuardUpgradeable",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<ReentrancyGuardUpgradeable$Type["abi"]>>;
  export function deployContract(
    contractName: "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol:ReentrancyGuardUpgradeable",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<ReentrancyGuardUpgradeable$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "ReentrancyGuardUpgradeable",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<ReentrancyGuardUpgradeable$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol:ReentrancyGuardUpgradeable",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<ReentrancyGuardUpgradeable$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "ReentrancyGuardUpgradeable",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<ReentrancyGuardUpgradeable$Type["abi"]>>;
  export function getContractAt(
    contractName: "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol:ReentrancyGuardUpgradeable",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<ReentrancyGuardUpgradeable$Type["abi"]>>;
}
