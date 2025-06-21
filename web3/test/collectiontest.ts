// test/Collection.test.ts

import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

import type { CollectionFactory, Collection } from "../typechain-types";

describe("Collection Factory Test", function () {
    let owner: any;
    let addr1: any;
    let factory: CollectionFactory;
    let collection: Collection;

    const TEST_PARAMS = {
        name: "TEST_NFT",
        symbol: "TEST",
        maxSupply: ethers.parseUnits("1000", 0),
        mintPrice: ethers.parseUnits("0", "ether"),
        baseURI: "ipfs://test/",
        contractURI: "ipfs://test/contract",
    };

    beforeEach(async function () {
        // Get signers
        [owner, addr1] = await ethers.getSigners();

        // Deploy Factory
        const Factory = await ethers.getContractFactory("CollectionFactory");
        factory = (await upgrades.deployProxy(
            Factory,
            [await owner.getAddress()],
            {
                initializer: "initialize",
                kind: "uups",
            }
        )) as unknown as CollectionFactory;

        await factory.waitForDeployment();
        console.log("Factory deployed to:", await factory.getAddress());
    });

    describe("Collection Creation", function () {
        it("Should create a new collection successfully", async function () {
            // Create collection
            const tx = await factory.createCollection(
                TEST_PARAMS.name,
                TEST_PARAMS.symbol,
                TEST_PARAMS.maxSupply,
                TEST_PARAMS.mintPrice,
                TEST_PARAMS.baseURI,
                TEST_PARAMS.contractURI
            );

            // Wait for transaction
            const receipt = await tx.wait();

            // Get collection address from event
            const event = receipt?.logs.find(
                (log) =>
                    log.topics[0] ===
                    factory.interface.getEvent("CollectionCreated")?.topicHash
            );
            expect(event).to.not.be.undefined;

            const parsedLog = factory.interface.parseLog(event as any);
            const collectionAddress = parsedLog?.args[0];
            console.log("New collection deployed to:", collectionAddress);

            // Get collection instance
            collection = (await ethers.getContractAt(
                "Collection",
                collectionAddress
            )) as unknown as Collection;

            // Verify collection initialization
            expect(await collection.name()).to.equal(TEST_PARAMS.name);
            expect(await collection.symbol()).to.equal(TEST_PARAMS.symbol);
            expect(await collection.maxSupply()).to.equal(
                TEST_PARAMS.maxSupply
            );
            expect(await collection.mintPrice()).to.equal(
                TEST_PARAMS.mintPrice
            );
            expect(await collection.contractURI()).to.equal(
                TEST_PARAMS.contractURI
            );

            // Verify owner
            expect(await collection.owner()).to.equal(await owner.getAddress());

            // Verify minting is enabled
            expect(await collection.mintingEnabled()).to.be.true;

            // Verify owner is escrow wallet
            expect(await collection.isEscrowWallet(await owner.getAddress())).to
                .be.true;
        });

        it("Should not allow duplicate collection names", async function () {
            // Create first collection
            await factory.createCollection(
                TEST_PARAMS.name,
                TEST_PARAMS.symbol,
                TEST_PARAMS.maxSupply,
                TEST_PARAMS.mintPrice,
                TEST_PARAMS.baseURI,
                TEST_PARAMS.contractURI
            );

            // Try to create second collection with same name
            await expect(
                factory.createCollection(
                    TEST_PARAMS.name,
                    TEST_PARAMS.symbol,
                    TEST_PARAMS.maxSupply,
                    TEST_PARAMS.mintPrice,
                    TEST_PARAMS.baseURI,
                    TEST_PARAMS.contractURI
                )
            ).to.be.revertedWith("NAME_TAKEN");
        });

        it("Should allow minting after creation", async function () {
            // Create collection
            const tx = await factory.createCollection(
                TEST_PARAMS.name,
                TEST_PARAMS.symbol,
                TEST_PARAMS.maxSupply,
                TEST_PARAMS.mintPrice,
                TEST_PARAMS.baseURI,
                TEST_PARAMS.contractURI
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (log) =>
                    log.topics[0] ===
                    factory.interface.getEvent("CollectionCreated")?.topicHash
            );
            const parsedLog = factory.interface.parseLog(event as any);
            const collectionAddress = parsedLog?.args[0];

            collection = (await ethers.getContractAt(
                "Collection",
                collectionAddress
            )) as unknown as Collection;

            // Try minting
            const mintTx = await collection.mint(1);
            await mintTx.wait();

            expect(
                await collection.balanceOf(await owner.getAddress())
            ).to.equal(1n);
        });
    });
});
