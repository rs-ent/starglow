/// app\payment\[id]\page.tsx

import { requireAuthUser } from "@/app/auth/authUtils";
import Payments from "@/components/payment/Payments";
import { getPayment, updatePaymentUserId } from "@/app/actions/payment";
import { revalidatePath } from "next/cache";
import { H1, Paragraph } from "@/components/atoms/Typography";
import LinkButton from "@/components/atoms/LinkButton";
import Icon from "@/components/atoms/Icon";
import { X } from "lucide-react";

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
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full px-4 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-lg backdrop-blur-sm max-w-md mx-auto text-center">
                    <H1 size={25} className="mb-4">
                        Payment Not Found
                    </H1>
                    <Paragraph size={15} className="mb-6">
                        The requested payment could not be found.
                    </Paragraph>
                    <LinkButton
                        href="/"
                        className="inline-block px-4 py-2 bg-secondary/50 hover:bg-secondary/70 text-foreground rounded-lg border border-border/30"
                    >
                        Return Home
                    </LinkButton>
                </div>
            </div>
        );
    }

    /*
    const paymentResult = {
        code: searchParams.get("code"),
        message: searchParams.get("message"),
        paymentId: searchParams.get("paymentId"),
        pgCode: searchParams.get("pgCode"),
        pgMessage: searchParams.get("pgMessage"),
        transactionType: searchParams.get("transactionType"),
        txId: searchParams.get("txId"),
    };
    */

    if (!payment.userId) {
        await updatePaymentUserId(id, user.id!);
        revalidatePath(`/payment/${id}`);
    } else if (payment.userId !== user.id) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full px-4 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-lg backdrop-blur-sm max-w-md mx-auto text-center">
                    <H1 size={25} className="mb-4">
                        Unauthorized Access
                    </H1>
                    <Paragraph size={15} className="mb-6">
                        You do not have permission to access this payment.
                    </Paragraph>
                    <LinkButton
                        href="/"
                        className="inline-block px-4 py-2 bg-secondary/50 hover:bg-secondary/70 text-foreground rounded-lg border border-border/30"
                    >
                        Return Home
                    </LinkButton>
                </div>
            </div>
        );
    }

    if (payment.status === "PAID") {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full px-4 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center">
                <div className="bg-card border border-border/30 text-card-foreground px-6 py-4 rounded-lg backdrop-blur-sm max-w-md mx-auto text-center">
                    <H1 size={25} className="mb-4">
                        Payment Complete
                    </H1>
                    <Paragraph size={15} className="mb-6">
                        This payment has already been processed successfully.
                    </Paragraph>
                    <LinkButton
                        href="/"
                        className="inline-block px-4 py-2 bg-secondary/50 hover:bg-secondary/70 text-foreground rounded-lg border border-border/30"
                    >
                        Return Home
                    </LinkButton>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full py-6 sm:py-8 md:py-10 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center">
            <div className="w-full max-w-7xl px-4 relative">
                <LinkButton
                    href={payment.redirectUrl || "/"}
                    className="absolute -top-2 right-6 z-10 p-2 rounded-full bg-card/20 hover:bg-card/40 backdrop-blur-sm transition-colors"
                >
                    <Icon
                        icon={X}
                        size={24}
                        className="text-foreground/80 hover:text-foreground"
                    />
                </LinkButton>
                <Payments payment={payment} userId={user.id!} />
            </div>
        </div>
    );
}
