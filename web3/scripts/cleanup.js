#!/usr/bin/env node
// web3/scripts/cleanup.js

/**
 * 배포 후 민감한 정보를 제거하는 스크립트
 * fetch-wallet.js에서 임시로 저장한 개인키를 안전하게 제거합니다.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    try {
        console.log("Cleaning up sensitive information...");
        const envFile = path.resolve(process.cwd(), ".env.local");

        if (!fs.existsSync(envFile)) {
            console.log("No .env.local file found. Nothing to clean up.");
            return;
        }

        // .env.local 파일 읽기
        let envContent = fs.readFileSync(envFile, "utf8");

        // 민감한 정보 제거
        envContent = envContent
            .replace(/\n# Escrow wallet - auto-generated.*$/m, "")
            .replace(/\nESCROW_ADDRESS=.*$/m, "")
            .replace(/\nESCROW_PRIVATE_KEY=.*$/m, "");

        // 파일 쓰기
        fs.writeFileSync(envFile, envContent);

        console.log("Sensitive information removed from .env.local");

        // 백업 파일 확인 및 복원
        const backupFile = `${envFile}.backup`;
        if (fs.existsSync(backupFile)) {
            console.log("Restoring .env.local from backup...");
            fs.copyFileSync(backupFile, envFile);
            fs.unlinkSync(backupFile);
            console.log("Backup file restored and removed.");
        }

        console.log("\nCleanup completed successfully!");
        console.log("All sensitive information has been removed.");
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
}

main();
