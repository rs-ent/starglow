#!/usr/bin/env node
// web3/scripts/fetch-wallet.js

/**
 * 배포 스크립트에서 사용하기 위한 지갑 정보를 안전하게 가져옵니다.
 * 이 스크립트는 .env 파일에 개인키를 직접 저장하지 않고
 * DB에서 암호화된 형태로 관리되는 개인키를 가져와 사용합니다.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    try {
        console.log("Fetching wallet from database...");
        const walletId = process.env.ESCROW_WALLET_ID;

        if (!walletId) {
            console.error(
                "Error: ESCROW_WALLET_ID environment variable is not set"
            );
            process.exit(1);
        }

        // 개인키 가져오기 API 호출
        const apiUrl = `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/blockchain/wallet`;
        const apiKey = process.env.DEPLOY_API_KEY;

        if (!apiKey) {
            console.error(
                "Error: DEPLOY_API_KEY environment variable is not set"
            );
            process.exit(1);
        }

        // cURL 또는 fetch 등을 사용해 API 호출
        const response = JSON.parse(
            execSync(
                `curl -s -X POST ${apiUrl} -H "Content-Type: application/json" -H "x-api-key: ${apiKey}" -d '{"walletId":"${walletId}"}'`
            ).toString()
        );

        if (!response.success) {
            console.error(`Error fetching wallet: ${response.error}`);
            process.exit(1);
        }

        const { address, privateKey } = response.data;

        // .env 파일에 임시로 저장
        const envFile = path.resolve(process.cwd(), ".env.local");

        // 기존 파일이 있으면 백업
        if (fs.existsSync(envFile)) {
            fs.copyFileSync(envFile, `${envFile}.backup`);
        }

        // 개인키를 .env.local 파일에 추가
        fs.appendFileSync(
            envFile,
            `\n# Escrow wallet - auto-generated, will be removed after deployment\n` +
                `ESCROW_ADDRESS=${address}\n` +
                `ESCROW_PRIVATE_KEY=${privateKey}\n`
        );

        console.log(`Wallet information fetched successfully!`);
        console.log(`Address: ${address}`);
        console.log(
            `Private key: ${privateKey.substring(
                0,
                6
            )}...${privateKey.substring(privateKey.length - 4)}`
        );
        console.log(`\nWallet details saved to ${envFile}`);
        console.log(
            "\nPLEASE NOTE: The private key is temporarily saved to .env.local."
        );
        console.log(
            "Make sure to run cleanup.js after deployment to remove sensitive data."
        );
    } catch (error) {
        console.error("Error fetching wallet:", error);
        process.exit(1);
    }
}

main();
