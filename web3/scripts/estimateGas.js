const { ethers } = require("hardhat");

async function estimateGas() {
    console.log("🔍 가스 예상치 측정 시작...\n");

    const [deployer, user1, user2] = await ethers.getSigners();

    // 1. Factory 배포
    console.log("📦 SPGNFTFactory 배포 중...");
    const Factory = await ethers.getContractFactory("SPGNFTFactory");
    const factory = await Factory.deploy();
    await factory.deployed();

    // 2. TBA Implementation 배포
    console.log("🔧 StarglowTBA Implementation 배포 중...");
    const TBA = await ethers.getContractFactory("StarglowTBA");
    const tbaImpl = await TBA.deploy();
    await tbaImpl.deployed();

    // Mock TBA Registry (실제 환경에서는 기존 레지스트리 사용)
    const mockRegistry = "0x000000006551c19487814612e58FE06813775758"; // ERC6551 Registry

    console.log("\n=== 가스 예상치 측정 ===\n");

    // 1. Factory - deployCollection 가스 측정
    console.log("1️⃣ SPGNFTFactory.deployCollection()");
    const collectionParams = {
        name: "Test Collection",
        symbol: "TEST",
        baseURI: "https://api.example.com/metadata/",
        contractURI: "https://api.example.com/contract",
        maxSupply: 10000,
        mintFee: ethers.utils.parseEther("0.01"),
        mintFeeToken: ethers.constants.AddressZero,
        mintFeeRecipient: deployer.address,
        owner: deployer.address,
        mintOpen: true,
        isPublicMinting: false,
    };

    const deployCollectionGas = await factory.estimateGas.deployCollection(
        collectionParams,
        mockRegistry,
        tbaImpl.address
    );
    console.log(
        `   예상 가스: ${deployCollectionGas.toString()} (${ethers.utils.formatUnits(
            deployCollectionGas.mul(30),
            "gwei"
        )} ETH @ 30 gwei)`
    );

    // Collection 실제 배포
    const tx = await factory.deployCollection(
        collectionParams,
        mockRegistry,
        tbaImpl.address
    );
    const receipt = await tx.wait();
    const collectionAddress = receipt.events[0].args.collection;
    const collection = await ethers.getContractAt(
        "SPGNFTCollection",
        collectionAddress
    );

    console.log("\n2️⃣ SPGNFTCollection 함수들");

    // 2-1. mint(address) - 1개 민팅
    console.log("   a) mint(address) - 1개 민팅");
    const mintOneGas = await collection.estimateGas.mint(user1.address, {
        value: ethers.utils.parseEther("0.01"),
    });
    console.log(
        `      예상 가스: ${mintOneGas.toString()} (${ethers.utils.formatUnits(
            mintOneGas.mul(30),
            "gwei"
        )} ETH @ 30 gwei)`
    );

    // 2-2. mint(address, uint256) - 5개 민팅
    console.log("   b) mint(address, uint256) - 5개 민팅");
    const mintFiveGas = await collection.estimateGas["mint(address,uint256)"](
        user1.address,
        5,
        { value: ethers.utils.parseEther("0.05") }
    );
    console.log(
        `      예상 가스: ${mintFiveGas.toString()} (${ethers.utils.formatUnits(
            mintFiveGas.mul(30),
            "gwei"
        )} ETH @ 30 gwei)`
    );

    // 2-3. mint with tokenURIs - 3개 민팅 with URI
    console.log("   c) mint(address, uint256, string[]) - 3개 민팅 with URI");
    const tokenURIs = [
        "https://api.example.com/token/1",
        "https://api.example.com/token/2",
        "https://api.example.com/token/3",
    ];
    const mintWithURIGas = await collection.estimateGas[
        "mint(address,uint256,string[])"
    ](user1.address, 3, tokenURIs, { value: ethers.utils.parseEther("0.03") });
    console.log(
        `      예상 가스: ${mintWithURIGas.toString()} (${ethers.utils.formatUnits(
            mintWithURIGas.mul(30),
            "gwei"
        )} ETH @ 30 gwei)`
    );

    // 실제로 일부 NFT 민팅 (escrow 테스트용)
    await collection.mint(user1.address, {
        value: ethers.utils.parseEther("0.01"),
    });

    // 2-4. Escrow 관련 함수들 (owner 추가 필요)
    console.log("\n   d) Escrow 관련 함수들");

    // Escrow wallet 추가
    await collection.addEscrowWallet(deployer.address);

    // EIP-712 서명 생성 (테스트용)
    const domain = {
        name: "SPGNFTCollection",
        version: "1",
        chainId: await deployer.getChainId(),
        verifyingContract: collection.address,
    };

    const types = {
        TransferPermit: [
            { name: "owner", type: "address" },
            { name: "to", type: "address" },
            { name: "tokenIds", type: "uint256[]" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간 후
    const value = {
        owner: user1.address,
        to: user2.address,
        tokenIds: [1],
        nonce: 0,
        deadline: deadline,
    };

    const signature = await user1._signTypedData(domain, types, value);
    const sig = ethers.utils.splitSignature(signature);

    console.log("   - escrowTransfer (v,r,s 서명)");
    const escrowTransferGas = await collection.estimateGas.escrowTransfer(
        user1.address,
        user2.address,
        [1],
        deadline,
        sig.v,
        sig.r,
        sig.s
    );
    console.log(
        `      예상 가스: ${escrowTransferGas.toString()} (${ethers.utils.formatUnits(
            escrowTransferGas.mul(30),
            "gwei"
        )} ETH @ 30 gwei)`
    );

    // 2-5. 관리 함수들
    console.log("\n   e) 관리 함수들");

    console.log("   - setMintFee");
    const setMintFeeGas = await collection.estimateGas.setMintFee(
        ethers.utils.parseEther("0.02")
    );
    console.log(`      예상 가스: ${setMintFeeGas.toString()}`);

    console.log("   - pause");
    const pauseGas = await collection.estimateGas.pause();
    console.log(`      예상 가스: ${pauseGas.toString()}`);

    console.log("\n3️⃣ StarglowTBA 함수들 (Proxy 통해 호출 시)");
    console.log(
        "   ⚠️  TBA는 프록시 패턴으로 배포되므로 실제 가스는 약간 더 높을 수 있습니다"
    );

    // TBA 초기화 데이터
    const initData = ethers.utils.defaultAbiCoder.encode(
        ["address[]"],
        [[deployer.address, user2.address]]
    );

    console.log("   a) initialize");
    const initializeGas = await tbaImpl.estimateGas.initialize(
        collection.address,
        1,
        0,
        initData
    );
    console.log(
        `      예상 가스: ${initializeGas.toString()} (${ethers.utils.formatUnits(
            initializeGas.mul(30),
            "gwei"
        )} ETH @ 30 gwei)`
    );

    // 실제 초기화
    await tbaImpl.initialize(collection.address, 1, 0, initData);

    console.log("   b) execute (ETH 전송)");
    const executeETHGas = await tbaImpl.estimateGas.execute(
        user2.address,
        ethers.utils.parseEther("0.1"),
        "0x"
    );
    console.log(`      예상 가스: ${executeETHGas.toString()}`);

    console.log("   c) execute (컨트랙트 호출)");
    const callData = collection.interface.encodeFunctionData("symbol");
    const executeCallGas = await tbaImpl.estimateGas.execute(
        collection.address,
        0,
        callData
    );
    console.log(`      예상 가스: ${executeCallGas.toString()}`);

    console.log("\n=== 요약 ===");
    console.log("🏭 Factory");
    console.log(
        `   - Collection 배포: ~${Math.round(deployCollectionGas / 1000)}k gas`
    );
    console.log("\n🖼️  NFT Collection");
    console.log(`   - 1개 민팅: ~${Math.round(mintOneGas / 1000)}k gas`);
    console.log(`   - 5개 민팅: ~${Math.round(mintFiveGas / 1000)}k gas`);
    console.log(
        `   - Escrow 전송: ~${Math.round(escrowTransferGas / 1000)}k gas`
    );
    console.log("\n🔐 TBA");
    console.log(`   - 초기화: ~${Math.round(initializeGas / 1000)}k gas`);
    console.log(`   - 실행: ~${Math.round(executeETHGas / 1000)}k gas`);

    console.log(
        "\n💡 참고: 실제 가스 사용량은 네트워크 상태와 데이터 크기에 따라 달라질 수 있습니다."
    );
}

estimateGas()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
