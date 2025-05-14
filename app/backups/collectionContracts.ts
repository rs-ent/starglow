/*export interface TransferTokensInput {
    collectionAddress: string;
    fromAddress: string;
    spenderAddress: string;
    toAddress: string;
    tokenIds: number[];
    gasOptions?: EstimateGasOptions;
}

export interface TransferTokensResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function transferTokens(
    input: TransferTokensInput
): Promise<TransferTokensResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const tokens = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                tokenId: { in: input.tokenIds },
                isBurned: false,
            },
            select: {
                id: true,
                tokenId: true,
                isLocked: true,
            },
        });

        if (tokens.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens not found or burned",
            };
        }

        const tokenOwners = await getTokenOwners({
            collectionAddress: input.collectionAddress,
            tokenIds: input.tokenIds,
        });

        const invalidTokens = tokenOwners.owners.filter(
            (owner) => owner.toLowerCase() !== input.fromAddress.toLowerCase()
        );

        if (invalidTokens.length > 0) {
            return {
                success: false,
                error: `One or more tokens are not owned by the from address: ${invalidTokens.join(
                    ", "
                )}`,
            };
        }

        const lockedTokens = tokens.filter((token) => token.isLocked);
        if (lockedTokens.length > 0) {
            return {
                success: false,
                error: "One or more tokens are locked",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKeyByAddress(
            input.spenderAddress
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const privateKey = escrowWallet.data.privateKey;
        const formattedPrivateKey = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;
        const account = privateKeyToAccount(formattedPrivateKey as Address);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                {
                    functionName: "escrowTransfer",
                    args: [
                        input.fromAddress as Address,
                        account.address,
                        input.toAddress as Address,
                        input.tokenIds,
                    ],
                },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.escrowTransfer(
            [
                input.fromAddress as Address,
                account.address,
                input.toAddress as Address,
                input.tokenIds,
            ],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("INVALID_SIGNATURE")) {
                return {
                    success: false,
                    error: "Invalid transfer signature",
                };
            }
        }
        console.error("Error transferring tokens:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to transfer tokens",
        };
    }
}*/
