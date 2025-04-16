/// web3\scripts\checker.js

const { ethers } = require("hardhat");
const CollectionABI =
    require("../artifacts/contracts/Collection.sol/Collection.json").abi;

async function main() {
    try {
        console.log("Connecting to network...");

        // 컨트랙트 주소
        const contractAddress = "0x17453a4049c6c93d46a02b20d38320996e6bd09c";

        // 컨트랙트 인스턴스 생성
        const collection = await ethers.getContractAt(
            "Collection",
            contractAddress
        );
        console.log("Contract address:", contractAddress);

        // contractURI 확인 (변수 또는 함수로 접근)
        try {
            // 함수로 시도
            try {
                const contractURI = await collection.contractURI();
                console.log("Contract URI (함수):", contractURI);
            } catch (e) {
                // 변수로 시도
                console.log(
                    "contractURI는 함수가 아닙니다. 다른 방법으로 시도합니다."
                );
            }

            // 함수명을 직접 조회하는 방식 시도
            try {
                const contractURI = await collection.callStatic.contractURI();
                console.log("Contract URI (callStatic):", contractURI);
            } catch (e) {
                console.log(
                    "callStatic.contractURI 방식으로 접근할 수 없습니다."
                );
            }
        } catch (e) {
            console.log("Contract URI를 확인할 수 없습니다:", e.message);
        }

        // Token URI 호출
        try {
            const targetTokenId = 19;
            const tokenURI = await collection.tokenURI(targetTokenId);
            console.log(`Token URI for ID ${targetTokenId}:`, tokenURI);
        } catch (e) {
            console.log("Token URI를 확인할 수 없습니다:", e.message);
        }

        // baseURI 확인 시도
        try {
            const baseURI = await collection._baseURI();
            console.log("Base URI:", baseURI);
        } catch (error) {
            console.log(
                "Base URI 함수가 public이 아니거나 접근할 수 없습니다:",
                error.message
            );
        }

        // 민팅 활성화 상태 확인
        try {
            const mintingEnabled = await collection.mintingEnabled();
            console.log("Minting Enabled:", mintingEnabled);
        } catch (e) {
            console.log(
                "Minting Enabled 상태를 확인할 수 없습니다:",
                e.message
            );
        }

        // 컨트랙트가 일시 중지 상태인지 확인
        try {
            const paused = await collection.paused();
            console.log("Contract Paused:", paused);
        } catch (e) {
            console.log("Paused 상태를 확인할 수 없습니다:", e.message);
        }

        // 소유자 확인
        try {
            const owner = await collection.owner();
            console.log("Contract owner:", owner);
        } catch (e) {
            console.log("Contract owner를 확인할 수 없습니다:", e.message);
        }

        // 모든 가능한 함수 이름 목록 출력
        console.log("\n사용 가능한 함수 목록:");
        for (const abiItem of CollectionABI) {
            if (abiItem.type === "function") {
                console.log(`- ${abiItem.name} (${abiItem.stateMutability})`);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
