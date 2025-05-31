"use strict";
// test/Collection.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("Collection Factory Test", function () {
    let owner;
    let addr1;
    let factory;
    let collection;
    const TEST_PARAMS = {
        name: "TEST_NFT",
        symbol: "TEST",
        maxSupply: hardhat_1.ethers.parseUnits("1000", 0),
        mintPrice: hardhat_1.ethers.parseUnits("0", "ether"),
        baseURI: "ipfs://test/",
        contractURI: "ipfs://test/contract",
    };
    beforeEach(async function () {
        // Get signers
        [owner, addr1] = await hardhat_1.ethers.getSigners();
        // Deploy Factory
        const Factory = await hardhat_1.ethers.getContractFactory("CollectionFactory");
        factory = (await hardhat_1.upgrades.deployProxy(Factory, [await owner.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        }));
        await factory.waitForDeployment();
        console.log("Factory deployed to:", await factory.getAddress());
    });
    describe("Collection Creation", function () {
        it("Should create a new collection successfully", async function () {
            // Create collection
            const tx = await factory.createCollection(TEST_PARAMS.name, TEST_PARAMS.symbol, TEST_PARAMS.maxSupply, TEST_PARAMS.mintPrice, TEST_PARAMS.baseURI, TEST_PARAMS.contractURI);
            // Wait for transaction
            const receipt = await tx.wait();
            // Get collection address from event
            const event = receipt?.logs.find((log) => log.topics[0] ===
                factory.interface.getEvent("CollectionCreated")?.topicHash);
            (0, chai_1.expect)(event).to.not.be.undefined;
            const parsedLog = factory.interface.parseLog(event);
            const collectionAddress = parsedLog?.args[0];
            console.log("New collection deployed to:", collectionAddress);
            // Get collection instance
            collection = (await hardhat_1.ethers.getContractAt("Collection", collectionAddress));
            // Verify collection initialization
            (0, chai_1.expect)(await collection.name()).to.equal(TEST_PARAMS.name);
            (0, chai_1.expect)(await collection.symbol()).to.equal(TEST_PARAMS.symbol);
            (0, chai_1.expect)(await collection.maxSupply()).to.equal(TEST_PARAMS.maxSupply);
            (0, chai_1.expect)(await collection.mintPrice()).to.equal(TEST_PARAMS.mintPrice);
            (0, chai_1.expect)(await collection.contractURI()).to.equal(TEST_PARAMS.contractURI);
            // Verify owner
            (0, chai_1.expect)(await collection.owner()).to.equal(await owner.getAddress());
            // Verify minting is enabled
            (0, chai_1.expect)(await collection.mintingEnabled()).to.be.true;
            // Verify owner is escrow wallet
            (0, chai_1.expect)(await collection.isEscrowWallet(await owner.getAddress())).to
                .be.true;
        });
        it("Should not allow duplicate collection names", async function () {
            // Create first collection
            await factory.createCollection(TEST_PARAMS.name, TEST_PARAMS.symbol, TEST_PARAMS.maxSupply, TEST_PARAMS.mintPrice, TEST_PARAMS.baseURI, TEST_PARAMS.contractURI);
            // Try to create second collection with same name
            await (0, chai_1.expect)(factory.createCollection(TEST_PARAMS.name, TEST_PARAMS.symbol, TEST_PARAMS.maxSupply, TEST_PARAMS.mintPrice, TEST_PARAMS.baseURI, TEST_PARAMS.contractURI)).to.be.revertedWith("NAME_TAKEN");
        });
        it("Should allow minting after creation", async function () {
            // Create collection
            const tx = await factory.createCollection(TEST_PARAMS.name, TEST_PARAMS.symbol, TEST_PARAMS.maxSupply, TEST_PARAMS.mintPrice, TEST_PARAMS.baseURI, TEST_PARAMS.contractURI);
            const receipt = await tx.wait();
            const event = receipt?.logs.find((log) => log.topics[0] ===
                factory.interface.getEvent("CollectionCreated")?.topicHash);
            const parsedLog = factory.interface.parseLog(event);
            const collectionAddress = parsedLog?.args[0];
            collection = (await hardhat_1.ethers.getContractAt("Collection", collectionAddress));
            // Try minting
            const mintTx = await collection.mint(1);
            await mintTx.wait();
            (0, chai_1.expect)(await collection.balanceOf(await owner.getAddress())).to.equal(1n);
        });
    });
});
