// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface EIP712Domain$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "EIP712Domain",
  "sourceName": "contracts/StarglowTBA.sol",
  "abi": [
    {
      "inputs": [],
      "name": "DOMAIN_SEPARATOR",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "NAME",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "VERSION",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "0x",
  "deployedBytecode": "0x",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "EIP712Domain",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<EIP712Domain$Type["abi"]>>;
  export function deployContract(
    contractName: "contracts/StarglowTBA.sol:EIP712Domain",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<EIP712Domain$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "EIP712Domain",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<EIP712Domain$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "contracts/StarglowTBA.sol:EIP712Domain",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<EIP712Domain$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "EIP712Domain",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<EIP712Domain$Type["abi"]>>;
  export function getContractAt(
    contractName: "contracts/StarglowTBA.sol:EIP712Domain",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<EIP712Domain$Type["abi"]>>;
}
