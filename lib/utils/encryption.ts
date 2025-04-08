/// lib\utils\encryption.ts
import crypto from "crypto";
import { env } from "@/lib/config/env";

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
