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

export declare namespace ISPGNFT {
  export type InitParamsStruct = {
    name: string;
    symbol: string;
    baseURI: string;
    contractURI: string;
    maxSupply: BigNumberish;
    mintFee: BigNumberish;
    mintFeeToken: AddressLike;
    mintFeeRecipient: AddressLike;
    owner: AddressLike;
    mintOpen: boolean;
    isPublicMinting: boolean;
  };

  export type InitParamsStructOutput = [
    name: string,
    symbol: string,
    baseURI: string,
    contractURI: string,
    maxSupply: bigint,
    mintFee: bigint,
    mintFeeToken: string,
    mintFeeRecipient: string,
    owner: string,
    mintOpen: boolean,
    isPublicMinting: boolean
  ] & {
    name: string;
    symbol: string;
    baseURI: string;
    contractURI: string;
    maxSupply: bigint;
    mintFee: bigint;
    mintFeeToken: string;
    mintFeeRecipient: string;
    owner: string;
    mintOpen: boolean;
    isPublicMinting: boolean;
  };
}

export interface DeploySPGNFTInterface extends Interface {
  getFunction(
    nameOrSignature: "deployCollection" | "deployStoryCollection"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "CollectionDeployed"): EventFragment;

  encodeFunctionData(
    functionFragment: "deployCollection",
    values: [ISPGNFT.InitParamsStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "deployStoryCollection",
    values: [string, string, string, string, AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "deployCollection",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deployStoryCollection",
    data: BytesLike
  ): Result;
}

export namespace CollectionDeployedEvent {
  export type InputTuple = [
    collection: AddressLike,
    owner: AddressLike,
    name: string,
    symbol: string
  ];
  export type OutputTuple = [
    collection: string,
    owner: string,
    name: string,
    symbol: string
  ];
  export interface OutputObject {
    collection: string;
    owner: string;
    name: string;
    symbol: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface DeploySPGNFT extends BaseContract {
  connect(runner?: ContractRunner | null): DeploySPGNFT;
  waitForDeployment(): Promise<this>;

  interface: DeploySPGNFTInterface;

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

  deployCollection: TypedContractMethod<
    [params: ISPGNFT.InitParamsStruct],
    [string],
    "nonpayable"
  >;

  deployStoryCollection: TypedContractMethod<
    [
      name: string,
      symbol: string,
      baseURI: string,
      contractURI: string,
      owner: AddressLike
    ],
    [string],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "deployCollection"
  ): TypedContractMethod<
    [params: ISPGNFT.InitParamsStruct],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "deployStoryCollection"
  ): TypedContractMethod<
    [
      name: string,
      symbol: string,
      baseURI: string,
      contractURI: string,
      owner: AddressLike
    ],
    [string],
    "nonpayable"
  >;

  getEvent(
    key: "CollectionDeployed"
  ): TypedContractEvent<
    CollectionDeployedEvent.InputTuple,
    CollectionDeployedEvent.OutputTuple,
    CollectionDeployedEvent.OutputObject
  >;

  filters: {
    "CollectionDeployed(address,address,string,string)": TypedContractEvent<
      CollectionDeployedEvent.InputTuple,
      CollectionDeployedEvent.OutputTuple,
      CollectionDeployedEvent.OutputObject
    >;
    CollectionDeployed: TypedContractEvent<
      CollectionDeployedEvent.InputTuple,
      CollectionDeployedEvent.OutputTuple,
      CollectionDeployedEvent.OutputObject
    >;
  };
}
