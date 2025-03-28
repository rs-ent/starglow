/// lib\solana\createWallet.ts

import { Keypair } from "@solana/web3.js";
import { encrypt } from "../utils";

export function createSolanaWallet() {
    const keypair = Keypair.generate();

    return {
        publicKey: keypair.publicKey.toBase58(),
        privateKey: encrypt(Buffer.from(keypair.secretKey).toString("hex")),
    }
}