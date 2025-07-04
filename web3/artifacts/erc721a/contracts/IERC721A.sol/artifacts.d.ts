// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import "hardhat/types/artifacts";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";

import { IERC721A$Type } from "./IERC721A";

declare module "hardhat/types/artifacts" {
  interface ArtifactsMap {
    ["IERC721A"]: IERC721A$Type;
    ["erc721a/contracts/IERC721A.sol:IERC721A"]: IERC721A$Type;
  }

  interface ContractTypesMap {
    ["IERC721A"]: GetContractReturnType<IERC721A$Type["abi"]>;
    ["erc721a/contracts/IERC721A.sol:IERC721A"]: GetContractReturnType<IERC721A$Type["abi"]>;
  }
}
