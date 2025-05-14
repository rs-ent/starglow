/// components\organisms\NFTs.Collection.tsx

"use client";

import { CollectionContract, Metadata } from "@prisma/client";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { useState } from "react";
import NFTsCollectionDetails from "../molecules/NFTs.CollectionDetails";
import NFTsCollectionPayment from "../molecules/NFTs.CollectionPayment";

interface CollectionProps {
    collection: CollectionContract & { metadata: Metadata };
}

export default function Collection({ collection }: CollectionProps) {
    const metadata = collection.metadata.metadata as METADATA_TYPE;
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

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    {/* Collection Description Section */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <NFTsCollectionDetails
                            collection={collection}
                            metadata={metadata}
                        />
                    </div>

                    {/* Payment Section */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="lg:sticky lg:top-8">
                            <NFTsCollectionPayment
                                collection={collection}
                                metadata={metadata}
                                onPurchase={handlePurchase}
                            />
                        </div>
                    </div>
                </div>

                {/* Back button - mobile only */}
                <div className="mt-8 flex justify-center lg:hidden">
                    <a
                        href="/collections"
                        className="px-4 py-2 bg-secondary/50 hover:bg-secondary/70 text-foreground rounded-lg border border-border/30 text-sm transition-colors"
                    >
                        Back to Collections
                    </a>
                </div>
            </div>
        </div>
    );
}
