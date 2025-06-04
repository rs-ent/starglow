/// components/nfts/NFT.Contents.Payment.tsx

"use client";

import { Collection } from "@/app/actions/factoryContracts";
import { useMemo, useState, useCallback } from "react";
import { H3 } from "../atoms/Typography";
import { Ticket, AlertCircle, CheckCircle2 } from "lucide-react";
import PaymentModule from "../payment/PaymentModule";
import { Currency } from "@/lib/types/payment";
import { formatCurrency } from "@/lib/utils/format";
import { Payment } from "@prisma/client";
import React from "react";
import { PaymentPostProcessorDetails } from "@/app/hooks/usePaymentPostProcessor";
interface NFTContentsPaymentProps {
    collection: Collection;
    onPurchase?: (quantity: number) => void;
    collectionStock:
        | {
              remain: number;
              total: number;
          }
        | undefined;
    onPaymentSuccess?: (payment: Payment) => void;
    onPaymentComplete?: (result?: PaymentPostProcessorDetails) => void;
    onPaymentError?: (error?: Error) => void;
}

const initialCurrency = "CURRENCY_USD" as Currency;

export default React.memo(function NFTContentsPayment({
    collection,
    onPurchase,
    onPaymentSuccess,
    onPaymentComplete,
    onPaymentError,
    collectionStock = {
        remain: 0,
        total: 0,
    },
}: NFTContentsPaymentProps) {
    const [quantity, setQuantity] = useState(1);
    const [displayPrice, setDisplayPrice] = useState<number>(
        collection.price ?? 0
    );
    const [currency, setCurrency] = useState<Currency>(initialCurrency);

    const handleDisplayPriceChange = useCallback((displayPrice: number) => {
        setDisplayPrice(displayPrice);
    }, []);

    const { isSoldOut, isNotActive, canPurchase } = useMemo(() => {
        const isSoldOut = collectionStock.remain <= 0;
        const isNotActive = collection.isListed !== true;
        const canPurchase = !isSoldOut && !isNotActive;

        return { isSoldOut, isNotActive, canPurchase };
    }, [collectionStock, collection]);

    const handleIncrease = useCallback(() => {
        setQuantity((prev) => Math.min(prev + 1, collectionStock.remain));
    }, [collectionStock.remain]);

    const handleDecrease = useCallback(() => {
        setQuantity((prev) => Math.max(1, prev - 1));
    }, []);

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 p-4 sm:p-6 md:p-8">
            <div className="flex items-center mb-5 md:mb-6">
                <Ticket className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-primary" />
                <H3 className="text-lg md:text-xl">Purchase NFT</H3>
            </div>

            {/* Price info */}
            <div className="mb-5 md:mb-6 text-sm md:text-base">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground/70">Price per NFT</span>
                    <span className="font-main text-base md:text-lg">
                        {displayPrice ? (
                            <>
                                {formatCurrency(
                                    displayPrice * quantity,
                                    currency,
                                    1
                                )}
                            </>
                        ) : (
                            "Free"
                        )}
                    </span>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground/70">Available NFTs</span>
                    <span className="font-main">
                        {collectionStock.remain}
                        {" of "}
                        {collectionStock.total}
                    </span>
                </div>
            </div>

            {/* Purchase section */}
            {canPurchase ? (
                <>
                    {/* Quantity selector */}
                    <div className="mb-5 md:mb-6">
                        <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                            Quantity
                        </label>
                        <div className="flex items-center">
                            <button
                                onClick={handleDecrease}
                                disabled={quantity <= 1}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-border/50 rounded-l-lg disabled:opacity-50"
                                aria-label="Decrease quantity"
                            >
                                -
                            </button>
                            <div className="w-12 h-8 sm:w-14 sm:h-10 flex items-center justify-center border-t border-b border-border/50 bg-secondary/20 text-sm md:text-base">
                                {quantity}
                            </div>
                            <button
                                onClick={handleIncrease}
                                disabled={quantity >= collectionStock.remain}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-border/50 rounded-r-lg disabled:opacity-50"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Payment processor */}
                    <PaymentModule
                        productTable="nfts"
                        productId={collection.id}
                        quantity={quantity}
                        buttonText={
                            quantity > 1
                                ? `Purchase ${quantity} NFTs`
                                : "Purchase 1 NFT"
                        }
                        needWallet={true}
                        productInitialCurrencyForDisplay={initialCurrency}
                        productInitialPriceForDisplay={collection.price ?? 0}
                        onDisplayPriceChange={handleDisplayPriceChange}
                        onCurrencyChange={setCurrency}
                        onPaymentSuccess={onPaymentSuccess}
                        onPaymentComplete={onPaymentComplete}
                        onPaymentError={onPaymentError}
                    />
                </>
            ) : (
                <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg text-sm md:text-base mb-2">
                    {isSoldOut ? (
                        <div className="flex items-center text-destructive">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>Sold out</span>
                        </div>
                    ) : isNotActive ? (
                        <div className="flex items-center text-foreground/60">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>This collection is not active</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-foreground/60">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>NFTs are not available for purchase</span>
                        </div>
                    )}
                </div>
            )}

            {/* Terms */}
            <div className="mt-4 md:mt-6 text-xs text-foreground/50">
                <p>
                    By purchasing NFTs, you agree to our Terms and Conditions.
                    All sales are final and non-refundable.
                </p>
            </div>
        </div>
    );
});
