/// app\payment\[id]\page.tsx

import { requireAuthUser } from "@/app/auth/authUtils";
import { getPayment, updatePaymentUserId } from "@/app/actions/payment";
import PaymentReceipt from "@/components/payment/PaymentReceipt";

export default async function PaymentPage({
    params,
}: {
    params: { id: string };
}) {
    const { id } = await params;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/${id}`;

    const [payment, user] = await Promise.all([
        getPayment({ paymentId: id }),
        requireAuthUser(callbackUrl),
    ]);

    if (!payment) {
        return <PaymentReceipt payment={null} userId="" redirectUrl="/" />;
    }

    if (!payment.userId) {
        await updatePaymentUserId(id, user.id!);
    } else if (payment.userId !== user.id) {
        return <PaymentReceipt payment={null} userId="" redirectUrl="/" />;
    }

    return (
        <PaymentReceipt
            payment={payment}
            userId={user.id!}
            redirectUrl={payment.redirectUrl || "/"}
        />
    );
}
