/// lib\utils\encryption.ts
import crypto from "crypto";
import { env } from "@/lib/config/env";
import { put } from "@vercel/blob";

const algorithm = env.ENCRYPTION_METHOD;
const secretKey = crypto.scryptSync(env.ENCRYPTION_SECRET!, "salt", 32);
const ivLength = 16;

export function encrypt(text: string) {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(hash: string) {
    const [iv, encrypted] = hash.split(":");
    const decipher = crypto.createDecipheriv(
        algorithm,
        secretKey,
        Buffer.from(iv, "hex")
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, "hex")),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}

export interface KeyParts {
    dbPart: string;
    blobPart: string;
    keyHash: string;
    nonce: string;
}

export async function encryptPrivateKey(privateKey: string): Promise<KeyParts> {
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

    const blobPath = `${keyHash}.key`;
    await put(blobPath, encryptedKeyPart2, {
        access: "public",
        addRandomSuffix: false,
        token: process.env.BLOB_PK_READ_WRITE_TOKEN,
    });

    return {
        dbPart: encryptedKeyPart1,
        blobPart: encryptedKeyPart2,
        keyHash,
        nonce,
    };
}

export async function decryptPrivateKey(keyParts: KeyParts): Promise<string> {
    const baseUrl = process.env.BLOB_PK_URL;
    const blobPath = `${baseUrl}/${keyParts.keyHash}.key`;
    const response = await fetch(blobPath);
    const encryptedPart2 = await response.text();

    const verifyHash = crypto
        .createHash("sha256")
        .update(encryptedPart2)
        .digest("hex");
    if (verifyHash !== keyParts.keyHash) {
        throw new Error("Invalid key hash");
    }

    const [nonce1, keyPart1] = decrypt(keyParts.dbPart).split(":");
    const [nonce2, keyPart2] = decrypt(encryptedPart2).split(":");

    if (nonce1 !== keyParts.nonce || nonce2 !== keyParts.nonce) {
        throw new Error("Invalid nonce");
    }

    return keyPart1 + keyPart2;
}
