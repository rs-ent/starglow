/// components\payment\Payments.tsx

"use client";

import { Payment } from "@prisma/client";
import PayPalButton from "./PayPalButton";
import PaymentButton from "./PaymentButton";
import { PaymentResponse } from "@portone/browser-sdk/v2";
import { usePayment } from "@/app/hooks/usePayment";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { H1, H2, H3, Paragraph } from "@/components/atoms/Typography";
import { motion } from "framer-motion";
import {
    LoaderCircle,
    Receipt,
    CreditCard,
    Calendar,
    CheckCircle,
    AlertCircle,
    DollarSign,
} from "lucide-react";
import Icon from "@/components/atoms/Icon";
import Badge from "@/components/atoms/Badge";
import { cn } from "@/lib/utils/tailwind";

interface PaymentProps {
    payment: Payment;
    userId: string;
}

export default function Payments({ payment, userId }: PaymentProps) {
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

    useEffect(() => {
        setCurrentPaymentId(payment.id);
        setUserId(userId);
        setIsAlreadyPaid(payment.status === "PAID");
    }, [payment.id, userId, setCurrentPaymentId, setUserId, payment.status]);

    useEffect(() => {
        if (currentPayment && currentPayment.status === "PAID") {
            toast.success("Payment successful!");
            // router.push(`/payment/success/${payment.id}`);
        }
    }, [currentPayment, payment.id, router, toast]);

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

            verifyPayment({
                paymentId: payment.id,
                userId,
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

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.replace("CURRENCY_", ""),
            minimumFractionDigits: 2,
        }).format(amount / 100);
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
        <div className="flex items-center justify-center h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto flex items-center justify-center"
            >
                <div className="relative w-full items-center justify-center">
                    {/* Main Content */}
                    <div className="relative gradient-border bg-gradient-to-br from-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0.7)] backdrop-blur-xl rounded-3xl p-1">
                        <div className="p-8 sm:p-10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <Icon
                                            icon={Receipt}
                                            className="text-primary w-7 h-7"
                                        />
                                    </div>
                                    <div>
                                        <H2 size={30} className="mb-1">
                                            Payment Receipt
                                        </H2>
                                    </div>
                                </div>
                                {paymentStatusBadge()}
                            </div>

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
                                        <H3 size={20}>Product Details</H3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <Paragraph
                                                size={12}
                                                className="text-muted-foreground"
                                            >
                                                Product Name
                                            </Paragraph>
                                            <Paragraph
                                                size={15}
                                                className="font-medium"
                                            >
                                                {payment.productName}
                                            </Paragraph>
                                        </div>
                                        <div className="space-y-1">
                                            <Paragraph
                                                size={12}
                                                className="text-muted-foreground"
                                            >
                                                Quantity
                                            </Paragraph>
                                            <Paragraph
                                                size={15}
                                                className="font-medium"
                                            >
                                                {payment.quantity} units
                                            </Paragraph>
                                        </div>
                                        <div className="space-y-1">
                                            <Paragraph
                                                size={12}
                                                className="text-muted-foreground"
                                            >
                                                Unit Price
                                            </Paragraph>
                                            <Paragraph
                                                size={15}
                                                className="font-medium"
                                            >
                                                {formatCurrency(
                                                    payment.amount /
                                                        payment.quantity,
                                                    payment.currency
                                                )}
                                            </Paragraph>
                                        </div>
                                        <div className="space-y-1">
                                            <Paragraph
                                                size={12}
                                                className="text-muted-foreground"
                                            >
                                                Total Amount
                                            </Paragraph>
                                            <Paragraph
                                                size={20}
                                                className="font-bold text-primary"
                                            >
                                                {formatCurrency(
                                                    payment.amount,
                                                    payment.currency
                                                )}
                                            </Paragraph>
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
                                        <H3 size={20}>Payment Details</H3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <Paragraph
                                                size={12}
                                                className="text-muted-foreground"
                                            >
                                                Payment Method
                                            </Paragraph>
                                            <div className="flex items-center mt-1">
                                                <Paragraph
                                                    size={15}
                                                    className="font-medium"
                                                >
                                                    {payment.payMethod ===
                                                    "PAYPAL"
                                                        ? "PayPal"
                                                        : payment.easyPayProvider
                                                        ? `${payment.easyPayProvider.replace("EASYPAY_", "")} (Easy Pay)`
                                                        : payment.cardProvider
                                                        ? `Card`
                                                        : payment.payMethod}
                                                </Paragraph>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Paragraph
                                                size={12}
                                                className="text-muted-foreground"
                                            >
                                                Payment Status
                                            </Paragraph>
                                            <div className="flex items-center mt-1">
                                                <Icon
                                                    icon={
                                                        payment.status ===
                                                        "PAID"
                                                            ? CheckCircle
                                                            : AlertCircle
                                                    }
                                                    className={cn(
                                                        "w-4 h-4 mr-2",
                                                        payment.status ===
                                                            "PAID"
                                                            ? "text-green-500"
                                                            : "text-yellow-500"
                                                    )}
                                                />
                                                <Paragraph
                                                    size={15}
                                                    className="font-medium capitalize"
                                                >
                                                    {payment.status.toLowerCase()}
                                                </Paragraph>
                                            </div>
                                        </div>
                                        {payment.paidAt && (
                                            <div className="space-y-1">
                                                <Paragraph
                                                    size={12}
                                                    className="text-muted-foreground"
                                                >
                                                    Payment Date
                                                </Paragraph>
                                                <div className="flex items-center mt-1">
                                                    <Icon
                                                        icon={Calendar}
                                                        className="w-4 h-4 mr-2 text-muted-foreground"
                                                    />
                                                    <Paragraph
                                                        size={15}
                                                        className="font-medium"
                                                    >
                                                        {formatDate(
                                                            payment.paidAt
                                                        )}
                                                    </Paragraph>
                                                </div>
                                            </div>
                                        )}
                                        {payment.cardNumber && (
                                            <div className="space-y-1">
                                                <Paragraph
                                                    size={12}
                                                    className="text-muted-foreground"
                                                >
                                                    Card Number
                                                </Paragraph>
                                                <Paragraph
                                                    size={15}
                                                    className="font-medium font-mono"
                                                >
                                                    •••• {payment.cardNumber}
                                                </Paragraph>
                                            </div>
                                        )}
                                    </div>
                                </div>

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
                                                    <Paragraph
                                                        size={15}
                                                        className="text-muted-foreground"
                                                    >
                                                        Processing your
                                                        payment...
                                                    </Paragraph>
                                                </motion.div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex justify-center w-full">
                                                    {payment.payMethod ===
                                                    "PAYPAL" ? (
                                                        <div className="w-full my-6">
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
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
