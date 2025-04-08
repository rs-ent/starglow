// app/actions/polygonWallets.ts

"use server";

import { ethers } from "ethers";
import { auth } from "../auth/authSettings";
import { prisma } from "@/lib/prisma/client";
import * as crypto from "crypto";
import { put, getDownloadUrl } from "@vercel/blob";
import { encrypt, decrypt } from "@/lib/utils/encryption";

export async function createPolygonWallet() {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const userId = session.user.id;

        const existingWallet = await prisma.wallet.findFirst({
            where: { userId, network: "polygon" },
        });

        if (existingWallet) {
            return { success: true, message: "Polygon wallet already exists" };
        }

        const wallet = ethers.Wallet.createRandom();
        const ecryptedParts = encryptPrivateKey(wallet.privateKey);

        const blobPath = `keys/${userId}/${wallet.address}/${ecryptedParts.keyHash}.key`;
        await put(blobPath, ecryptedParts.blobPart, {
            access: "public",
            addRandomSuffix: false,
        });

        const newWallet = await prisma.wallet.create({
            data: {
                userId: session.user.id,
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
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const userId = session.user.id;
        const wallet = await prisma.wallet.findFirst({
            where: { userId, address, network: "polygon" },
        });

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        if (!wallet.privateKey || !wallet.keyHash || !wallet.nonce) {
            throw new Error("This wallet is not created by Starglow");
        }

        const blobPath = `keys/${userId}/${address}/${wallet.keyHash}.key`;
        const url = await getDownloadUrl(blobPath);
        const response = await fetch(url);
        const encryptedPart2 = await response.text();

        const verifyHash = crypto
            .createHash("sha256")
            .update(encryptedPart2)
            .digest("hex");
        if (verifyHash !== wallet.keyHash) {
            throw new Error("Invalid key hash");
        }

        const [nonce1, keyPart1] = decrypt(wallet.privateKey).split(":");
        const [nonce2, keyPart2] = decrypt(encryptedPart2).split(":");

        if (nonce1 !== wallet.nonce || nonce2 !== wallet.nonce) {
            throw new Error("Invalid nonce");
        }

        return keyPart1 + keyPart2;
    } catch (error) {
        console.error("Error getting private key", error);
        throw new Error("Failed to get private key");
    }
}

/**
 * @security
 * This function handles sensitive key encryption and should not be modified
 */
interface KeyParts {
    dbPart: string;
    blobPart: string;
    keyHash: string;
    nonce: string;
}

/**
 * @security
 * This function handles sensitive key encryption and should not be modified
 */
function encryptPrivateKey(privateKey: string): KeyParts {
    const nonce = crypto.randomBytes(32).toString("hex");

    const midPoint = Math.floor(privateKey.length / 2);
    const keyPart1 = privateKey.slice(0, midPoint);
    const keyPart2 = privateKey.slice(midPoint);

    const encryptedKeyPart1 = encrypt(nonce + ":" + keyPart1);
    const encryptedKeyPart2 = encrypt(nonce + ":" + keyPart2);

    const keyHash = crypto
        .createHash("sha256")
        .update(encryptedKeyPart2)
        .digest("hex");

    return {
        dbPart: encryptedKeyPart1,
        blobPart: encryptedKeyPart2,
        keyHash,
        nonce,
    };
}
