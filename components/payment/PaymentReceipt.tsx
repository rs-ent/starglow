/// components/payment/PaymentReceipt.tsx

"use client";

import { H1, Paragraph } from "@/components/atoms/Typography";
import LinkButton from "@/components/atoms/LinkButton";
import Payments from "@/components/payment/Payments";

interface PaymentReceiptProps {
    payment: any;
    userId: string;
    redirectUrl: string;
}

export default function PaymentReceipt({
    payment,
    userId,
    redirectUrl,
}: PaymentReceiptProps) {
    if (!payment) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full px-4 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center">
                <div className="bg-gradient-to-br from-destructive/5 via-destructive/10 to-destructive/5 border border-destructive/20 shadow-lg shadow-destructive/10 text-destructive/90 px-8 py-6 rounded-2xl backdrop-blur-xl max-w-md mx-auto text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>
                    <div className="relative z-10">
                        <H1 size={25} className="mb-4 font-semibold">
                            Payment Not Found
                        </H1>
                        <Paragraph
                            size={15}
                            className="mb-6 text-destructive/70"
                        >
                            The requested payment could not be found.
                        </Paragraph>
                        <LinkButton
                            href="/"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-secondary/40 to-secondary/60 hover:from-secondary/60 hover:to-secondary/80 text-foreground rounded-xl border border-border/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                        >
                            Return Home
                        </LinkButton>
                    </div>
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
        <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden p-20">
            <div className="absolute inset-0 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-pink-500/5"></div>
            {/* 메인 컨테이너 */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* 메인 콘텐츠 영역 */}
                <main className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-4xl">
                        <Payments
                            payment={payment}
                            userId={userId}
                            redirectUrl={redirectUrl}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
