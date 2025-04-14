import { IPFSUploadResult } from "@/app/actions/files";

/**
 * Result of a collection creation operation
 */
export interface CreateCollectionResult {
    success: boolean;
    message: string;
    collection?: DeployedCollection;
    error?: string;
}

/**
 * Deployed NFT collection details
 */
export interface DeployedCollection {
    id: string;
    name: string;
    symbol: string;
    address: string;
    networkId: string;
    transactionHash: string;
    factoryId: string;
    ownerId?: string;
    deployedAt: string;
    maxSupply?: number;
    mintPrice?: string;
    baseURI: string;
    contractURI: string;
    metadataCID?: string;
}

/**
 * Factory contract details
 */
export interface FactoryContract {
    id: string;
    name: string;
    version: string;
    address: string;
    networkId: string;
    abi: string;
    ownerId: string;
    deployedAt: string;
    collections?: DeployedCollection[];
}

/**
 * NFT Metadata interface
 */
export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: {
        trait_type: string;
        value: string | number;
    }[];
    external_url?: string;
    background_color?: string;
    animation_url?: string;
}

/**
 * Collection Metadata interface
 */
export interface CollectionMetadata {
    name: string;
    description: string;
    image: string;
    external_link?: string;
    seller_fee_basis_points?: number;
    fee_recipient?: string;
}

export interface CreateCollectionParams {
    factoryAddress: string;
    networkId: string;
    name: string;
    symbol: string;
    maxSupply: number;
    mintPrice: string;
    baseURI: string;
    contractURI: string;
    privateKey: string;
    metadataCID?: string;
}

export interface TokenMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: {
        trait_type: string;
        value: string | number;
    }[];
}
