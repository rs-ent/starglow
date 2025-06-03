// Story Protocol Metadata Types

// Collection Metadata (contractURI)
export interface CollectionMetadata {
    name: string;
    description: string;
    image: string;
    external_link?: string;
    seller_fee_basis_points?: number;
    fee_recipient?: string;
}

// NFT Metadata (tokenURI) - ERC721 표준
export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    animation_url?: string;
}

// IP Asset Metadata (ipMetadataURI) - Story Protocol 전용
export interface IPMetadata {
    title: string;
    description: string;
    ipType?: string; // "STORY", "CHARACTER", "ART", "MUSIC" 등
    creators?: Array<{
        name: string;
        address?: string;
        contributionPercent?: number;
    }>;
    dateCreated?: string;
    media?: Array<{
        url: string;
        mimeType: string;
    }>;
    tags?: string[];
    commercialTerms?: {
        commercialUse: boolean;
        commercialAttribution: boolean;
        derivativesAllowed: boolean;
        derivativesAttribution: boolean;
        derivativesApproval: boolean;
        derivativesReciprocal: boolean;
        territories?: string[];
        distributionChannels?: string[];
        contentRestrictions?: string[];
    };
} 