import Button from "../atoms/Button";
import PayPalButton from "../atoms/PayPalButton";
import { useCurrencyConverter } from "@/app/hooks/usePaymentValidation";
import { PaymentExecutorProps } from "@/lib/types/payments";
import { usePaymentProcessor } from "@/app/hooks/usePaymentProcessor";

export default function PaymentExecutor(props: PaymentExecutorProps) {
    const { isLoading, processPayment } = usePaymentProcessor(props);

    // Get converted amount for PayPal
    const { convertedAmount: paypalAmount } = useCurrencyConverter(
        props.amount,
        props.currency === "CURRENCY_USD" ? "USD" : "KRW",
        "USD"
    );

    // Get the appropriate amount based on payment method and currency
    const getPaymentAmount = () => {
        if (props.method === "PAYPAL") {
            return paypalAmount?.converted.amount || 0;
        }
        return props.amount;
    };

    // Get formatted amount with currency symbol
    const getFormattedAmount = () => {
        const paymentAmount = getPaymentAmount();
        if (props.currency === "CURRENCY_USD" || props.method === "PAYPAL") {
            return `$${paymentAmount.toLocaleString()}`;
        }
        return `₩${props.amount.toLocaleString()}`;
    };

    // Use PayPal specific component for PayPal payments
    if (props.method === "PAYPAL") {
        if (props.currency !== "CURRENCY_USD") {
            return (
                <div className="text-destructive text-sm text-center">
                    PayPal payments are only available in USD currency.
                </div>
            );
        }

        return (
            <PayPalButton
                userId={props.userId}
                table={props.table}
                target={props.target}
                quantity={props.quantity}
                onSuccess={props.onSuccess}
                onError={props.onError}
                paypalOptions={props.paypalOptions}
            />
        );
    }

    return (
        <Button onClick={processPayment} className="w-full">
            {isLoading
                ? "Processing..."
                : props.buttonText || `Pay ${getFormattedAmount()}`}
        </Button>
    );
}
