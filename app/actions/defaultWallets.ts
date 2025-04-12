/// app/actions/defaultWallets.ts
/// POLYGON NETWORK WALLET

"use server";

import { ethers } from "ethers";
import { prisma } from "@/lib/prisma/client";
import { decryptPrivateKey, encryptPrivateKey } from "@/lib/utils/encryption";

export async function createPolygonWallet(userId: string) {
    try {
        const existingWallet = await prisma.wallet.findFirst({
            where: { userId, network: "polygon" },
        });

        if (existingWallet) {
            return { success: true, message: "Polygon wallet already exists" };
        }

        const wallet = ethers.Wallet.createRandom();
        const ecryptedParts = await encryptPrivateKey(wallet.privateKey);

        const newWallet = await prisma.wallet.create({
            data: {
                userId: userId,
                address: wallet.address,
                privateKey: ecryptedParts.dbPart,
                keyHash: ecryptedParts.keyHash,
                nonce: ecryptedParts.nonce,
                network: "polygon",
                primary: 1,
                default: true,
                nickname: "My Starglow Wallet",
                status: "ACTIVE",
            },
        });

        return {
            success: true,
            address: newWallet.address,
        };
    } catch (error) {
        console.error("Error creating polygon wallet", error);
        return {
            success: false,
            message: "Failed to create polygon wallet",
        };
    }
}

/**
 * @security
 * This function handles sensitive key encryption and should not be modified
 */
export async function getPrivateKey(address: string) {
    try {
        const wallet = await prisma.wallet.findFirst({
            where: { address, network: "polygon" },
            select: {
                userId: true,
                privateKey: true,
                keyHash: true,
                nonce: true,
            },
        });

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        if (!wallet.privateKey || !wallet.keyHash || !wallet.nonce) {
            throw new Error("This wallet is not created by Starglow");
        }

        const decryptedKey = await decryptPrivateKey({
            dbPart: wallet.privateKey,
            blobPart: wallet.keyHash,
            keyHash: wallet.keyHash,
            nonce: wallet.nonce,
        });

        return decryptedKey;
    } catch (error) {
        console.error("Error getting private key", error);
        throw new Error("Failed to get private key");
    }
}

/**
 * @security
 * This function handles sensitive key encryption and should not be modified
 */
