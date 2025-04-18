/// app/blockchain/abis/Collection.ts

// Collection 컨트랙트에서 사용하는 ABI (Application Binary Interface) 정의

export const COLLECTION_ABI = [
    {
        inputs: [
            {
                internalType: "string",
                name: "name",
                type: "string",
            },
            {
                internalType: "string",
                name: "symbol",
                type: "string",
            },
            {
                internalType: "address",
                name: "initialOwner",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_maxSupply",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "initialMintPrice",
                type: "uint256",
            },
            {
                internalType: "string",
                name: "baseURI",
                type: "string",
            },
            {
                internalType: "string",
                name: "contractURI_",
                type: "string",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [],
        name: "AccessControlBadConfirmation",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                internalType: "bytes32",
                name: "neededRole",
                type: "bytes32",
            },
        ],
        name: "AccessControlUnauthorizedAccount",
        type: "error",
    },
    {
        inputs: [],
        name: "ApprovalCallerNotOwnerNorApproved",
        type: "error",
    },
    {
        inputs: [],
        name: "ApprovalQueryForNonexistentToken",
        type: "error",
    },
    {
        inputs: [],
        name: "BalanceQueryForZeroAddress",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "numerator",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "denominator",
                type: "uint256",
            },
        ],
        name: "ERC2981InvalidDefaultRoyalty",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "receiver",
                type: "address",
            },
        ],
        name: "ERC2981InvalidDefaultRoyaltyReceiver",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "numerator",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "denominator",
                type: "uint256",
            },
        ],
        name: "ERC2981InvalidTokenRoyalty",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "receiver",
                type: "address",
            },
        ],
        name: "ERC2981InvalidTokenRoyaltyReceiver",
        type: "error",
    },
    {
        inputs: [],
        name: "EnforcedPause",
        type: "error",
    },
    {
        inputs: [],
        name: "ExpectedPause",
        type: "error",
    },
    {
        inputs: [],
        name: "MintERC2309QuantityExceedsLimit",
        type: "error",
    },
    {
        inputs: [],
        name: "MintToZeroAddress",
        type: "error",
    },
    {
        inputs: [],
        name: "MintZeroQuantity",
        type: "error",
    },
    {
        inputs: [],
        name: "NotCompatibleWithSpotMints",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    {
        inputs: [],
        name: "OwnerQueryForNonexistentToken",
        type: "error",
    },
    {
        inputs: [],
        name: "OwnershipNotInitializedForExtraData",
        type: "error",
    },
    {
        inputs: [],
        name: "ReentrancyGuardReentrantCall",
        type: "error",
    },
    {
        inputs: [],
        name: "SequentialMintExceedsLimit",
        type: "error",
    },
    {
        inputs: [],
        name: "SequentialUpToTooSmall",
        type: "error",
    },
    {
        inputs: [],
        name: "SpotMintTokenIdTooSmall",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenAlreadyExists",
        type: "error",
    },
    {
        inputs: [],
        name: "TransferCallerNotOwnerNorApproved",
        type: "error",
    },
    {
        inputs: [],
        name: "TransferFromIncorrectOwner",
        type: "error",
    },
    {
        inputs: [],
        name: "TransferToNonERC721ReceiverImplementer",
        type: "error",
    },
    {
        inputs: [],
        name: "TransferToZeroAddress",
        type: "error",
    },
    {
        inputs: [],
        name: "URIQueryForNonexistentToken",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "approved",
                type: "address",
            },
            {
                indexed: true,
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "operator",
                type: "address",
            },
            {
                indexed: false,
                internalType: "bool",
                name: "approved",
                type: "bool",
            },
        ],
        name: "ApprovalForAll",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "startTokenId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "quantity",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "gasPrice",
                type: "uint256",
            },
        ],
        name: "BatchMinted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "string",
                name: "baseURI",
                type: "string",
            },
        ],
        name: "BaseURIUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "bool",
                name: "enabled",
                type: "bool",
            },
        ],
        name: "MintingStatusUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Paused",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: true,
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Unpaused",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "quantity",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "gasFee",
                type: "uint256",
            },
        ],
        name: "batchMint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "maxSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "mintingEnabled",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "paused",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "baseURI_",
                type: "string",
            },
        ],
        name: "setBaseURI",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bool",
                name: "enabled",
                type: "bool",
            },
        ],
        name: "setMintingEnabled",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "contractURI_",
                type: "string",
            },
        ],
        name: "setContractURI",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
            {
                internalType: "bytes",
                name: "signature",
                type: "bytes",
            },
            {
                internalType: "uint256",
                name: "gasFee",
                type: "uint256",
            },
        ],
        name: "escrowTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;
