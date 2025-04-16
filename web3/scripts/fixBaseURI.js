/// web3\scripts\fixBaseURI.js

const { ethers } = require("hardhat");

async function main() {
    try {
        console.log("시작: BaseURI 수정...");

        // 컨트랙트 주소
        const contractAddress = "0x17453a4049c6c93d46a02b20d38320996e6bd09c";

        // 컨트랙트 인스턴스 생성
        const collection = await ethers.getContractAt(
            "Collection",
            contractAddress
        );
        console.log("컨트랙트 주소:", contractAddress);

        // 현재 토큰 URI 확인
        const currentTokenURI = await collection.tokenURI(13);
        console.log("현재 Token URI (ID 13):", currentTokenURI);

        // 새 baseURI 설정
        // 올바른 형식의 URL로 변경 (끝에 슬래시(/) 포함되어야 함)
        const newBaseURI =
            "https://fq4f5nrzsw1rth14.public.blob.vercel-storage.com/m9intav7r4ploe4c/";

        console.log("설정할 새 Base URI:", newBaseURI);
        console.log("트랜잭션 전송 중...");

        // setBaseURI 함수 호출
        const tx = await collection.setBaseURI(newBaseURI);
        console.log("트랜잭션 해시:", tx.hash);

        // 트랜잭션 대기
        console.log("트랜잭션 확인 대기 중...");
        await tx.wait();
        console.log("트랜잭션 확인 완료!");

        // 변경 후 토큰 URI 확인
        const newTokenURI = await collection.tokenURI(13);
        console.log("변경된 Token URI (ID 13):", newTokenURI);

        console.log("\n성공적으로 baseURI가 업데이트되었습니다!");
        console.log(
            "이제 https://testnets.opensea.io/assets/sepolia/0x17453a4049c6c93d46a02b20d38320996e6bd09c/13에서 메타데이터가 올바르게 표시되는지 확인하세요."
        );
        console.log(
            "OpenSea에서 메타데이터가 업데이트되는 데 시간이 걸릴 수 있습니다. '새로고침 메타데이터' 옵션을 사용해보세요."
        );
    } catch (error) {
        console.error("오류:", error);

        // 권한 오류인지 확인
        if (error.message.includes("ESCROW_ROLE")) {
            console.log(
                "\n권한 오류: setBaseURI 함수는 ESCROW_ROLE이 있는 계정에서만 호출할 수 있습니다."
            );
            console.log(
                "계정에 ESCROW_ROLE이 있는지 확인하고, 소유자 계정의 개인 키를 환경 변수에 설정했는지 확인하세요."
            );
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
