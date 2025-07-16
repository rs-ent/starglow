#!/usr/bin/env tsx

import { prisma } from "../lib/prisma/client";

interface MigrationResult {
    totalProcessed: number;
    successfulMigrations: number;
    skippedUsers: number;
    errors: string[];
}

async function isValidWalletAddress(address: string): Promise<boolean> {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function fixWalletUsersMigration(): Promise<MigrationResult> {
    const result: MigrationResult = {
        totalProcessed: 0,
        successfulMigrations: 0,
        skippedUsers: 0,
        errors: [],
    };

    try {
        console.log("🔍 지갑 주소가 이름으로 저장된 사용자들을 찾는 중...");

        // User 테이블에서 name이 지갑 주소 형태이고 provider가 wallet인 사용자들 찾기
        const usersWithWalletNames = await prisma.user.findMany({
            where: {
                provider: "wallet",
                name: {
                    startsWith: "0x",
                },
            },
            include: {
                wallets: true,
            },
        });

        console.log(
            `📊 총 ${usersWithWalletNames.length}명의 사용자를 발견했습니다.`
        );

        for (const user of usersWithWalletNames) {
            result.totalProcessed++;

            try {
                // 이름이 유효한 지갑 주소인지 확인
                if (!(await isValidWalletAddress(user.name || ""))) {
                    console.log(
                        `⚠️  유효하지 않은 지갑 주소: ${user.name} (사용자 ID: ${user.id})`
                    );
                    result.skippedUsers++;
                    continue;
                }

                const walletAddress = user.name!;

                // 이미 해당 지갑 주소가 Wallet 테이블에 있는지 확인
                const existingWallet = user.wallets.find(
                    (w) => w.address === walletAddress
                );

                if (existingWallet) {
                    console.log(
                        `✅ 이미 올바른 지갑이 등록됨: ${walletAddress} (사용자 ID: ${user.id})`
                    );
                    result.skippedUsers++;
                    continue;
                }

                console.log(
                    `🔧 마이그레이션 진행: ${walletAddress} (사용자 ID: ${user.id})`
                );

                await prisma.$transaction(async (tx) => {
                    // 1. 기존 기본 지갑들을 모두 기본이 아닌 상태로 변경
                    await tx.wallet.updateMany({
                        where: {
                            userId: user.id,
                            default: true,
                        },
                        data: {
                            default: false,
                        },
                    });

                    // 2. 실제 지갑 주소를 Wallet 테이블에 추가
                    await tx.wallet.create({
                        data: {
                            userId: user.id,
                            address: walletAddress,
                            network: "1", // 기본 네트워크 (Ethereum mainnet)
                            provider: "metamask", // 추정값 (대부분 MetaMask일 가능성)
                            nickname: "Imported Wallet",
                            status: "ACTIVE",
                            default: true, // 기본 지갑으로 설정
                            lastAccessedAt: new Date(),
                        },
                    });

                    console.log(`✅ 마이그레이션 완료: ${walletAddress}`);
                });

                result.successfulMigrations++;
            } catch (error) {
                const errorMsg = `❌ 사용자 ${user.id} (${
                    user.name
                }) 마이그레이션 실패: ${
                    error instanceof Error ? error.message : String(error)
                }`;
                console.error(errorMsg);
                result.errors.push(errorMsg);
            }
        }

        return result;
    } catch (error) {
        const errorMsg = `❌ 마이그레이션 중 치명적 오류: ${
            error instanceof Error ? error.message : String(error)
        }`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        return result;
    }
}

async function main() {
    console.log("🚀 지갑 사용자 마이그레이션 시작...");
    console.log("=".repeat(50));

    const result = await fixWalletUsersMigration();

    console.log("\n" + "=".repeat(50));
    console.log("📊 마이그레이션 결과:");
    console.log(`   총 처리된 사용자: ${result.totalProcessed}`);
    console.log(`   성공적으로 마이그레이션: ${result.successfulMigrations}`);
    console.log(`   건너뛴 사용자: ${result.skippedUsers}`);
    console.log(`   오류 발생: ${result.errors.length}`);

    if (result.errors.length > 0) {
        console.log("\n❌ 발생한 오류들:");
        result.errors.forEach((error) => console.log(`   ${error}`));
    }

    console.log("=".repeat(50));
    console.log("✅ 마이그레이션 완료!");

    await prisma.$disconnect();
}

// 스크립트 직접 실행 시
if (require.main === module) {
    main().catch((error) => {
        console.error("💥 스크립트 실행 중 오류:", error);
        process.exit(1);
    });
}
export { fixWalletUsersMigration };
