// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import "hardhat/types/artifacts";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";

import { SPGNFTFactory$Type } from "./SPGNFTFactory";

declare module "hardhat/types/artifacts" {
  interface ArtifactsMap {
    ["SPGNFTFactory"]: SPGNFTFactory$Type;
    ["contracts/SPGNFTFactory.sol:SPGNFTFactory"]: SPGNFTFactory$Type;
  }

  interface ContractTypesMap {
    ["SPGNFTFactory"]: GetContractReturnType<SPGNFTFactory$Type["abi"]>;
    ["contracts/SPGNFTFactory.sol:SPGNFTFactory"]: GetContractReturnType<SPGNFTFactory$Type["abi"]>;
  }
}
