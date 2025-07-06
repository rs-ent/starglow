import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const contractName = "SPGNFTCollection";
    const contractPath = "contracts/SPGNFTCollection.sol";

    console.log("Generating Standard JSON for", contractName);

    // 컴파일 실행
    await hre.run("compile");

    // Build info 가져오기
    const buildInfo = await hre.artifacts.getBuildInfo(
        `${contractPath}:${contractName}`
    );

    if (!buildInfo) {
        throw new Error(
            "Build info not found. Make sure the contract is compiled."
        );
    }

    // Standard JSON 생성
    const standardJson = {
        language: "Solidity",
        sources: buildInfo.input.sources,
        settings: buildInfo.input.settings,
    };

    // JSON 파일로 저장
    const outputPath = path.join(__dirname, "../standard-json-input.json");
    fs.writeFileSync(outputPath, JSON.stringify(standardJson, null, 2));

    console.log("✅ Standard JSON generated successfully!");
    console.log("📁 File saved to:", outputPath);
    console.log("\n📋 컴파일러 설정 정보:");
    console.log("- Solidity Version:", buildInfo.solcVersion);
    console.log(
        "- Optimization:",
        buildInfo.input.settings.optimizer?.enabled ? "Enabled" : "Disabled"
    );
    console.log("- Runs:", buildInfo.input.settings.optimizer?.runs || "N/A");
    console.log("- Via IR:", buildInfo.input.settings.viaIR ? "Yes" : "No");

    console.log("\n🔗 Etherscan/Polygonscan에서 사용법:");
    console.log("1. Contract 주소 입력");
    console.log("2. 'Via Standard JSON-Input' 선택");
    console.log("3. 생성된 standard-json-input.json 파일 업로드");
    console.log("4. Constructor arguments 입력");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
