/// lib\utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Custom Encryption
export function encrypt(text: string) {
  const algorithm = "aes-256-cbc";
  const secretKey = crypto.scryptSync(process.env.ENCRYPTION_SECRET!, "salt", 32);
  const ivLength = 16;
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

// Custom Decryption
export function decrypt(hash: string) {
  const algorithm = "aes-256-cbc";
  const secretKey = crypto.scryptSync(process.env.ENCRYPTION_SECRET!, "salt", 32);
  const [iv, encrypted] = hash.split(":");
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}