import hre from "hardhat";
import { parseArgs } from "util";

async function main() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            address: { type: "string" },
            network: { type: "string" },
            name: { type: "string" },
            symbol: { type: "string" },
            baseURI: { type: "string" },
            contractURI: { type: "string" },
            maxSupply: { type: "string" },
            mintFee: { type: "string" },
            mintFeeToken: { type: "string" },
            mintFeeRecipient: { type: "string" },
            owner: { type: "string" },
            mintOpen: { type: "string" },
            isPublicMinting: { type: "string" },
            tbaRegistry: { type: "string" },
            tbaImplementation: { type: "string" },
        },
    });

    if (!values.address) {
        console.error("Please provide contract address with --address");
        process.exit(1);
    }

    // 생성자 인자 구성
    const initParams = {
        name: values.name || "Starglow Collection",
        symbol: values.symbol || "SGC",
        baseURI: values.baseURI || "https://api.starglow.com/metadata/",
        contractURI:
            values.contractURI || "https://api.starglow.com/contract-metadata",
        maxSupply: values.maxSupply || "1000",
        mintFee: values.mintFee || "0",
        mintFeeToken:
            values.mintFeeToken || "0x0000000000000000000000000000000000000000",
        mintFeeRecipient:
            values.mintFeeRecipient ||
            "0x0000000000000000000000000000000000000000",
        owner: values.owner || "0x0000000000000000000000000000000000000000",
        mintOpen: values.mintOpen === "true" || true,
        isPublicMinting: values.isPublicMinting === "true" || false,
    };

    const tbaRegistry =
        values.tbaRegistry || "0x000000006551c19487814612e58FE06813775758";
    const tbaImplementation =
        values.tbaImplementation ||
        "0x0000000000000000000000000000000000000000";

    const constructorArgs = [initParams, tbaRegistry, tbaImplementation];

    console.log("Verifying SPGNFTCollection contract...");
    console.log("Contract address:", values.address);
    console.log("Network:", values.network || hre.network.name);
    console.log("Constructor args:", JSON.stringify(constructorArgs, null, 2));

    // ABI 인코딩된 생성자 인자 생성
    const abiCoder = new hre.ethers.AbiCoder();
    const encoded = abiCoder.encode(
        [
            "tuple(string,string,string,string,uint256,uint256,address,address,address,bool,bool)",
            "address",
            "address",
        ],
        [
            [
                initParams.name,
                initParams.symbol,
                initParams.baseURI,
                initParams.contractURI,
                initParams.maxSupply,
                initParams.mintFee,
                initParams.mintFeeToken,
                initParams.mintFeeRecipient,
                initParams.owner,
                initParams.mintOpen,
                initParams.isPublicMinting,
            ],
            tbaRegistry,
            tbaImplementation,
        ]
    );

    console.log("\n📋 Verification Information:");
    console.log("Contract Address:", values.address);
    console.log("Constructor Arguments (ABI-encoded):");
    console.log(encoded);

    try {
        await hre.run("verify:verify", {
            address: values.address,
            constructorArguments: constructorArgs,
        });
        console.log("✅ Contract verified successfully!");
    } catch (error) {
        console.error("❌ Automatic verification failed:", error);
        console.log("\n🔧 Manual verification options:");
        console.log("\n1️⃣ Standard JSON method (Recommended):");
        console.log(
            "   - Run: npx hardhat run scripts/generate-standard-json.ts"
        );
        console.log("   - Upload the generated standard-json-input.json file");
        console.log("   - Use the constructor arguments above");

        console.log("\n2️⃣ Flattened source method:");
        console.log(
            "   - Run: npx hardhat flatten contracts/SPGNFTCollection.sol > flattened.sol"
        );
        console.log(
            "   - Compiler: v0.8.28, Optimization: Yes, Runs: 500, Via IR: Yes"
        );
        console.log("   - Use the constructor arguments above");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
