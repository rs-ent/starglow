/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface StakingInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "addReward"
      | "assets"
      | "claimReward"
      | "claimedRewards"
      | "collection"
      | "initialize"
      | "owner"
      | "paused"
      | "renounceOwnership"
      | "rewards"
      | "setRewardStatus"
      | "stake"
      | "stakeInfo"
      | "transferOwnership"
      | "unstake"
      | "updateReward"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "Initialized"
      | "OwnershipTransferred"
      | "Paused"
      | "RewardAdded"
      | "RewardClaimed"
      | "RewardStatusChanged"
      | "RewardUpdated"
      | "Staked"
      | "Unpaused"
      | "Unstaked"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "addReward",
    values: [BigNumberish, BytesLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "assets", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "claimReward",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "claimedRewards",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "collection",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "rewards",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setRewardStatus",
    values: [BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "stake",
    values: [BigNumberish[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "stakeInfo",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "unstake",
    values: [BigNumberish[], boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "updateReward",
    values: [BigNumberish, BytesLike, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "addReward", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "assets", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "claimReward",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "claimedRewards",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "collection", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "rewards", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setRewardStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "stake", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "stakeInfo", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unstake", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "updateReward",
    data: BytesLike
  ): Result;
}

export namespace InitializedEvent {
  export type InputTuple = [version: BigNumberish];
  export type OutputTuple = [version: bigint];
  export interface OutputObject {
    version: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RewardAddedEvent {
  export type InputTuple = [
    rewardId: BigNumberish,
    assetId: BigNumberish,
    selector: BytesLike,
    rewardAmount: BigNumberish,
    requiredStakeTime: BigNumberish
  ];
  export type OutputTuple = [
    rewardId: bigint,
    assetId: bigint,
    selector: string,
    rewardAmount: bigint,
    requiredStakeTime: bigint
  ];
  export interface OutputObject {
    rewardId: bigint;
    assetId: bigint;
    selector: string;
    rewardAmount: bigint;
    requiredStakeTime: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RewardClaimedEvent {
  export type InputTuple = [
    tokenId: BigNumberish,
    rewardId: BigNumberish,
    receiver: AddressLike,
    amount: BigNumberish,
    timestamp: BigNumberish
  ];
  export type OutputTuple = [
    tokenId: bigint,
    rewardId: bigint,
    receiver: string,
    amount: bigint,
    timestamp: bigint
  ];
  export interface OutputObject {
    tokenId: bigint;
    rewardId: bigint;
    receiver: string;
    amount: bigint;
    timestamp: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RewardStatusChangedEvent {
  export type InputTuple = [rewardId: BigNumberish, isActive: boolean];
  export type OutputTuple = [rewardId: bigint, isActive: boolean];
  export interface OutputObject {
    rewardId: bigint;
    isActive: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RewardUpdatedEvent {
  export type InputTuple = [rewardId: BigNumberish];
  export type OutputTuple = [rewardId: bigint];
  export interface OutputObject {
    rewardId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace StakedEvent {
  export type InputTuple = [tokenId: BigNumberish, stakeTime: BigNumberish];
  export type OutputTuple = [tokenId: bigint, stakeTime: bigint];
  export interface OutputObject {
    tokenId: bigint;
    stakeTime: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnpausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnstakedEvent {
  export type InputTuple = [tokenId: BigNumberish, unstakeTime: BigNumberish];
  export type OutputTuple = [tokenId: bigint, unstakeTime: bigint];
  export interface OutputObject {
    tokenId: bigint;
    unstakeTime: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface Staking extends BaseContract {
  connect(runner?: ContractRunner | null): Staking;
  waitForDeployment(): Promise<this>;

  interface: StakingInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  addReward: TypedContractMethod<
    [
      assetId: BigNumberish,
      selector: BytesLike,
      rewardAmount: BigNumberish,
      requiredStakeTime: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  assets: TypedContractMethod<[], [string], "view">;

  claimReward: TypedContractMethod<
    [tokenId: BigNumberish, rewardId: BigNumberish],
    [void],
    "nonpayable"
  >;

  claimedRewards: TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [boolean],
    "view"
  >;

  collection: TypedContractMethod<[], [string], "view">;

  initialize: TypedContractMethod<
    [collectionAddress: AddressLike, assetsAddress: AddressLike],
    [void],
    "nonpayable"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  paused: TypedContractMethod<[], [boolean], "view">;

  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  rewards: TypedContractMethod<
    [arg0: BigNumberish],
    [
      [bigint, string, bigint, bigint, boolean] & {
        assetId: bigint;
        selector: string;
        rewardAmount: bigint;
        requiredStakeTime: bigint;
        isActive: boolean;
      }
    ],
    "view"
  >;

  setRewardStatus: TypedContractMethod<
    [rewardId: BigNumberish, isActive: boolean],
    [void],
    "nonpayable"
  >;

  stake: TypedContractMethod<
    [tokenIds: BigNumberish[], unstakeScheduledAt: BigNumberish],
    [void],
    "nonpayable"
  >;

  stakeInfo: TypedContractMethod<
    [arg0: BigNumberish],
    [
      [bigint, bigint, bigint, bigint, boolean] & {
        tokenId: bigint;
        stakedAt: bigint;
        unstakeScheduledAt: bigint;
        unstakedAt: bigint;
        isStaked: boolean;
      }
    ],
    "view"
  >;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  unstake: TypedContractMethod<
    [tokenIds: BigNumberish[], forceUnstake: boolean],
    [void],
    "nonpayable"
  >;

  updateReward: TypedContractMethod<
    [
      rewardId: BigNumberish,
      newSelector: BytesLike,
      newRewardAmount: BigNumberish,
      newRequiredStakeTime: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "addReward"
  ): TypedContractMethod<
    [
      assetId: BigNumberish,
      selector: BytesLike,
      rewardAmount: BigNumberish,
      requiredStakeTime: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "assets"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "claimReward"
  ): TypedContractMethod<
    [tokenId: BigNumberish, rewardId: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "claimedRewards"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "collection"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "initialize"
  ): TypedContractMethod<
    [collectionAddress: AddressLike, assetsAddress: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "paused"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "rewards"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [
      [bigint, string, bigint, bigint, boolean] & {
        assetId: bigint;
        selector: string;
        rewardAmount: bigint;
        requiredStakeTime: bigint;
        isActive: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "setRewardStatus"
  ): TypedContractMethod<
    [rewardId: BigNumberish, isActive: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "stake"
  ): TypedContractMethod<
    [tokenIds: BigNumberish[], unstakeScheduledAt: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "stakeInfo"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [
      [bigint, bigint, bigint, bigint, boolean] & {
        tokenId: bigint;
        stakedAt: bigint;
        unstakeScheduledAt: bigint;
        unstakedAt: bigint;
        isStaked: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "unstake"
  ): TypedContractMethod<
    [tokenIds: BigNumberish[], forceUnstake: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "updateReward"
  ): TypedContractMethod<
    [
      rewardId: BigNumberish,
      newSelector: BytesLike,
      newRewardAmount: BigNumberish,
      newRequiredStakeTime: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "Initialized"
  ): TypedContractEvent<
    InitializedEvent.InputTuple,
    InitializedEvent.OutputTuple,
    InitializedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "Paused"
  ): TypedContractEvent<
    PausedEvent.InputTuple,
    PausedEvent.OutputTuple,
    PausedEvent.OutputObject
  >;
  getEvent(
    key: "RewardAdded"
  ): TypedContractEvent<
    RewardAddedEvent.InputTuple,
    RewardAddedEvent.OutputTuple,
    RewardAddedEvent.OutputObject
  >;
  getEvent(
    key: "RewardClaimed"
  ): TypedContractEvent<
    RewardClaimedEvent.InputTuple,
    RewardClaimedEvent.OutputTuple,
    RewardClaimedEvent.OutputObject
  >;
  getEvent(
    key: "RewardStatusChanged"
  ): TypedContractEvent<
    RewardStatusChangedEvent.InputTuple,
    RewardStatusChangedEvent.OutputTuple,
    RewardStatusChangedEvent.OutputObject
  >;
  getEvent(
    key: "RewardUpdated"
  ): TypedContractEvent<
    RewardUpdatedEvent.InputTuple,
    RewardUpdatedEvent.OutputTuple,
    RewardUpdatedEvent.OutputObject
  >;
  getEvent(
    key: "Staked"
  ): TypedContractEvent<
    StakedEvent.InputTuple,
    StakedEvent.OutputTuple,
    StakedEvent.OutputObject
  >;
  getEvent(
    key: "Unpaused"
  ): TypedContractEvent<
    UnpausedEvent.InputTuple,
    UnpausedEvent.OutputTuple,
    UnpausedEvent.OutputObject
  >;
  getEvent(
    key: "Unstaked"
  ): TypedContractEvent<
    UnstakedEvent.InputTuple,
    UnstakedEvent.OutputTuple,
    UnstakedEvent.OutputObject
  >;

  filters: {
    "Initialized(uint64)": TypedContractEvent<
      InitializedEvent.InputTuple,
      InitializedEvent.OutputTuple,
      InitializedEvent.OutputObject
    >;
    Initialized: TypedContractEvent<
      InitializedEvent.InputTuple,
      InitializedEvent.OutputTuple,
      InitializedEvent.OutputObject
    >;

    "OwnershipTransferred(address,address)": TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;

    "Paused(address)": TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;
    Paused: TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;

    "RewardAdded(uint256,uint256,bytes4,uint256,uint256)": TypedContractEvent<
      RewardAddedEvent.InputTuple,
      RewardAddedEvent.OutputTuple,
      RewardAddedEvent.OutputObject
    >;
    RewardAdded: TypedContractEvent<
      RewardAddedEvent.InputTuple,
      RewardAddedEvent.OutputTuple,
      RewardAddedEvent.OutputObject
    >;

    "RewardClaimed(uint256,uint256,address,uint256,uint256)": TypedContractEvent<
      RewardClaimedEvent.InputTuple,
      RewardClaimedEvent.OutputTuple,
      RewardClaimedEvent.OutputObject
    >;
    RewardClaimed: TypedContractEvent<
      RewardClaimedEvent.InputTuple,
      RewardClaimedEvent.OutputTuple,
      RewardClaimedEvent.OutputObject
    >;

    "RewardStatusChanged(uint256,bool)": TypedContractEvent<
      RewardStatusChangedEvent.InputTuple,
      RewardStatusChangedEvent.OutputTuple,
      RewardStatusChangedEvent.OutputObject
    >;
    RewardStatusChanged: TypedContractEvent<
      RewardStatusChangedEvent.InputTuple,
      RewardStatusChangedEvent.OutputTuple,
      RewardStatusChangedEvent.OutputObject
    >;

    "RewardUpdated(uint256)": TypedContractEvent<
      RewardUpdatedEvent.InputTuple,
      RewardUpdatedEvent.OutputTuple,
      RewardUpdatedEvent.OutputObject
    >;
    RewardUpdated: TypedContractEvent<
      RewardUpdatedEvent.InputTuple,
      RewardUpdatedEvent.OutputTuple,
      RewardUpdatedEvent.OutputObject
    >;

    "Staked(uint256,uint256)": TypedContractEvent<
      StakedEvent.InputTuple,
      StakedEvent.OutputTuple,
      StakedEvent.OutputObject
    >;
    Staked: TypedContractEvent<
      StakedEvent.InputTuple,
      StakedEvent.OutputTuple,
      StakedEvent.OutputObject
    >;

    "Unpaused(address)": TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
    Unpaused: TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;

    "Unstaked(uint256,uint256)": TypedContractEvent<
      UnstakedEvent.InputTuple,
      UnstakedEvent.OutputTuple,
      UnstakedEvent.OutputObject
    >;
    Unstaked: TypedContractEvent<
      UnstakedEvent.InputTuple,
      UnstakedEvent.OutputTuple,
      UnstakedEvent.OutputObject
    >;
  };
}
