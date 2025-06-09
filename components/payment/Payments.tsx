/// components\payment\Payments.tsx

"use client";

import { Payment, Wallet } from "@prisma/client";
import PayPalButton from "./PayPalButton";
import PaymentButton from "./PaymentButton";
import { PaymentResponse } from "@portone/browser-sdk/v2";
import { usePayment } from "@/app/hooks/usePayment";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    LoaderCircle,
    Receipt,
    CreditCard,
    Calendar,
    CheckCircle,
    AlertCircle,
    DollarSign,
    X,
} from "lucide-react";
import { Wallet as WalletIcon } from "lucide-react";
import { useWalletsByUserId } from "@/app/hooks/useWallet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/atoms/Icon";
import Badge from "@/components/atoms/Badge";
import FreePayButton from "./FreePayButton";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface PaymentProps {
    payment: Payment;
    userId: string;
    redirectUrl: string;
}

export default function Payments({
    payment,
    userId,
    redirectUrl,
}: PaymentProps) {
    const {
        verifyPayment,
        isVerifyingPayment,
        currentPayment,
        setCurrentPaymentId,
        setUserId,
    } = usePayment();
    const router = useRouter();
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const { wallets, isLoading: isLoadingWallets } = useWalletsByUserId(userId);

    const needsWalletSelection = payment.needWallet && !selectedWallet;
    const showPaymentButton = !payment.needWallet || !needsWalletSelection;

    useEffect(() => {
        setCurrentPaymentId(payment.id);
        setUserId(userId);
        setIsAlreadyPaid(payment.status === "PAID");
    }, [payment.id, userId, setCurrentPaymentId, setUserId, payment.status]);

    useEffect(() => {
        if (wallets && wallets.length > 0) {
            setSelectedWallet(wallets[0]);
        }
    }, [wallets]);

    useEffect(() => {
        if (
            currentPayment &&
            (currentPayment.status === "PAID" ||
                currentPayment.status === "FAILED")
        ) {
            router.push(
                `${currentPayment.redirectUrl}?paymentId=${currentPayment.id}`
            );
        }
    }, [currentPayment, payment.id, router]);

    useEffect(() => {
        if (!isVerifyingPayment && isProcessing) {
            setIsProcessing(false);
        }
    }, [isVerifyingPayment, isProcessing]);

    const handlePaymentProceed = async (response: PaymentResponse | Error) => {
        setIsProcessing(true);

        try {
            if (isAlreadyPaid) {
                toast.error("Payment has already been processed");
                setIsProcessing(false);
                return;
            }

            if (response instanceof Error) {
                toast.error(`Payment failed: ${response.message}`);
                setIsProcessing(false);
                return;
            }

            if (payment.needWallet && !selectedWallet) {
                toast.error("Please select a receiving wallet");
                setIsProcessing(false);
                return;
            }

            verifyPayment({
                paymentId: payment.id,
                userId,
                receiverWalletAddress: selectedWallet?.address,
            });
        } catch (error) {
            toast.error(
                `Payment processing error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
            setIsProcessing(false);
        }
    };

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleString();
    };

    const paymentStatusBadge = () => {
        switch (payment.status) {
            case "PAID":
                return (
                    <Badge variant="success" className="ml-2">
                        Paid
                    </Badge>
                );
            case "PENDING":
                return <Badge className="ml-2">Pending</Badge>;
            case "FAILED":
                return (
                    <Badge variant="danger" className="ml-2">
                        Failed
                    </Badge>
                );
            case "CANCELLED":
                return (
                    <Badge variant="secondary" className="ml-2">
                        Cancelled
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto"
        >
            {/* 프리미엄 글래스 컨테이너 */}
            <div className="relative">
                {/* 메인 컨테이너 */}
                <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/2 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl">
                    <Link
                        href={redirectUrl}
                        className={cn(
                            "p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 border border-white/20",
                            "absolute -top-2 -right-2"
                        )}
                    >
                        <Icon
                            icon={X}
                            size={20}
                            className="text-white/80 hover:text-white"
                        />
                    </Link>
                    {/* 상단 헤더 영역 */}
                    <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Icon
                                        icon={Receipt}
                                        className="text-white w-6 h-6"
                                    />
                                </div>
                                <div>
                                    <h2
                                        className={cn(
                                            "font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent",
                                            getResponsiveClass(30).textClass
                                        )}
                                    >
                                        Payment
                                    </h2>
                                    <p
                                        className={cn(
                                            "text-white/60 font-medium",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        Complete your transaction
                                    </p>
                                </div>
                            </div>
                            {paymentStatusBadge()}
                        </div>
                    </div>

                    {/* 메인 콘텐츠 */}
                    <div className="p-4">
                        <div className="space-y-8">
                            {/* Product Details */}
                            <div className="bg-card/10 backdrop-blur-md p-6 rounded-2xl border border-border/5">
                                <div className="flex items-center mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                                        <Icon
                                            icon={DollarSign}
                                            className="w-5 h-5 text-primary"
                                        />
                                    </div>
                                    <h3
                                        className={cn(
                                            "font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent",
                                            getResponsiveClass(30).textClass
                                        )}
                                    >
                                        Product Details
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                            Product Name
                                        </p>
                                        <p className="font-medium">
                                            {payment.productName}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                            Quantity
                                        </p>
                                        <p className="font-medium">
                                            {payment.quantity} units
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                            Unit Price
                                        </p>
                                        <p className="font-medium">
                                            {formatCurrency(
                                                payment.amount /
                                                    payment.quantity,
                                                payment.currency
                                            )}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                            Total Amount
                                        </p>
                                        <p className="font-bold text-primary">
                                            {formatCurrency(
                                                payment.amount,
                                                payment.currency
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="bg-card/10 backdrop-blur-md p-6 rounded-2xl border border-border/5">
                                <div className="flex items-center mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                                        <Icon
                                            icon={CreditCard}
                                            className="w-5 h-5 text-primary"
                                        />
                                    </div>
                                    <h3
                                        className={cn(
                                            "font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent",
                                            getResponsiveClass(30).textClass
                                        )}
                                    >
                                        Payment Details
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                            Payment Method
                                        </p>
                                        <div className="flex items-center mt-1">
                                            <p className="font-medium">
                                                {payment.payMethod === "PAYPAL"
                                                    ? "PayPal"
                                                    : payment.easyPayProvider
                                                    ? `${payment.easyPayProvider.replace(
                                                          "EASYPAY_",
                                                          ""
                                                      )} (Easy Pay)`
                                                    : payment.cardProvider
                                                    ? `Card`
                                                    : payment.payMethod}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">
                                            Payment Status
                                        </p>
                                        <div className="flex items-center mt-1">
                                            <Icon
                                                icon={
                                                    payment.status === "PAID"
                                                        ? CheckCircle
                                                        : AlertCircle
                                                }
                                                className={cn(
                                                    "w-4 h-4 mr-2",
                                                    payment.status === "PAID"
                                                        ? "text-green-500"
                                                        : "text-yellow-500"
                                                )}
                                            />
                                            <p className="font-medium capitalize">
                                                {payment.status.toLowerCase()}
                                            </p>
                                        </div>
                                    </div>
                                    {payment.paidAt && (
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground">
                                                Payment Date
                                            </p>
                                            <div className="flex items-center mt-1">
                                                <Icon
                                                    icon={Calendar}
                                                    className="w-4 h-4 mr-2 text-muted-foreground"
                                                />
                                                <p className="font-medium">
                                                    {formatDate(payment.paidAt)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {payment.cardNumber && (
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground">
                                                Card Number
                                            </p>
                                            <p className="font-medium font-mono">
                                                •••• {payment.cardNumber}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Wallet Selection */}
                            {payment.needWallet && (
                                <div className="bg-card/10 backdrop-blur-md p-6 rounded-2xl border border-border/5">
                                    <div className="flex items-center mb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg mr-3">
                                            <Icon
                                                icon={WalletIcon}
                                                className="w-5 h-5 text-primary"
                                            />
                                        </div>
                                        <h3
                                            className={cn(
                                                "font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent",
                                                getResponsiveClass(30).textClass
                                            )}
                                        >
                                            Receiving Wallet
                                        </h3>
                                    </div>

                                    {isLoadingWallets ? (
                                        <div className="h-10 bg-secondary/20 animate-pulse rounded-lg" />
                                    ) : wallets && wallets.length > 0 ? (
                                        <div className="space-y-2">
                                            <Select
                                                value={selectedWallet?.address}
                                                onValueChange={(value) => {
                                                    const wallet = wallets.find(
                                                        (w) =>
                                                            w.address === value
                                                    );
                                                    setSelectedWallet(
                                                        wallet || null
                                                    );
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select wallet to receive NFT" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {wallets.map((wallet) => (
                                                        <SelectItem
                                                            key={wallet.id}
                                                            value={
                                                                wallet.address
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <WalletIcon className="h-4 w-4" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {wallet.nickname ||
                                                                            "Wallet"}
                                                                        {wallet.default && (
                                                                            <span className="ml-2 text-xs text-primary">
                                                                                (Default)
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {`${wallet.address.slice(
                                                                            0,
                                                                            6
                                                                        )}...${wallet.address.slice(
                                                                            -4
                                                                        )}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedWallet && (
                                                <p className="text-xs text-muted-foreground">
                                                    Selected wallet:{" "}
                                                    {selectedWallet.address.slice(
                                                        0,
                                                        6
                                                    )}
                                                    ...
                                                    {selectedWallet.address.slice(
                                                        -4
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
                                            No wallets available. Please add a
                                            wallet first.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment Action */}
                            {payment.status !== "PAID" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-8 w-full"
                                >
                                    {isProcessing || isVerifyingPayment ? (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="p-4 bg-primary/10 rounded-full mb-4">
                                                    <Icon
                                                        icon={LoaderCircle}
                                                        className="w-8 h-8 text-primary animate-spin"
                                                    />
                                                </div>
                                                <p className="text-muted-foreground">
                                                    Processing your payment...
                                                </p>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <div>
                                            {showPaymentButton ? (
                                                <div className="flex justify-center items-center w-full">
                                                    {payment.amount === 0 ? (
                                                        <FreePayButton
                                                            payment={payment}
                                                            disabled={
                                                                isProcessing ||
                                                                isVerifyingPayment
                                                            }
                                                            onPaymentProceed={
                                                                handlePaymentProceed
                                                            }
                                                        />
                                                    ) : payment.payMethod ===
                                                      "PAYPAL" ? (
                                                        <div className="w-full flex justify-center items-center my-6">
                                                            <PayPalButton
                                                                payment={
                                                                    payment
                                                                }
                                                                disabled={
                                                                    isProcessing ||
                                                                    isVerifyingPayment
                                                                }
                                                                onPaymentProceed={
                                                                    handlePaymentProceed
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <PaymentButton
                                                            payment={payment}
                                                            disabled={
                                                                isProcessing ||
                                                                isVerifyingPayment
                                                            }
                                                            onPaymentProceed={
                                                                handlePaymentProceed
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted-foreground">
                                                    Please select a receiving
                                                    wallet to continue
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
