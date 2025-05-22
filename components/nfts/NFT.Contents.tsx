/// components\organisms\NFTs.Collection.tsx

"use client";

import { useState } from "react";
import NFTContentsDetails from "./NFT.Contents.Details";
import NFTContentsPayment from "./NFT.Contents.Payment";
import type { Collection } from "@/app/actions/factoryContracts";
import { METADATA_TYPE } from "@/app/actions/metadata";

interface NFTContentsProps {
    collection: Collection;
}

export default function NFTContents({ collection }: NFTContentsProps) {
    const metadata = collection?.metadata?.metadata as METADATA_TYPE;
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    const handlePurchase = (quantity: number) => {
        console.log(
            `Purchasing ${quantity} NFTs from collection ${collection.address}`
        );
        setTimeout(() => {
            setPurchaseSuccess(true);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center w-full py-6 sm:py-8 md:py-10">
            <div className="w-full max-w-7xl px-4">
                {purchaseSuccess && (
                    <div className="bg-chart-1/20 border border-chart-1/30 text-chart-1 p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 max-w-3xl mx-auto">
                        <p className="font-main text-center text-sm md:text-base">
                            Your purchase was successful! Check your wallet for
                            the NFT.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 mt-[50px] mb-[50px] lg:grid-cols-3 lg:gap-8 lg:mt-[0px] lg:mb-[0px]">
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <NFTContentsDetails
                            collection={collection}
                            metadata={metadata}
                        />
                    </div>

                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="lg:sticky lg:top-8">
                            <NFTContentsPayment
                                collection={collection}
                                onPurchase={handlePurchase}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
