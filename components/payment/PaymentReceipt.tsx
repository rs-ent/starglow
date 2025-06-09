/// components/payment/PaymentReceipt.tsx

"use client";

import LinkButton from "@/components/atoms/LinkButton";
import Payments from "@/components/payment/Payments";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

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
                        <h2
                            className={cn(
                                "mb-4 font-semibold",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            Payment Not Found
                        </h2>
                        <p
                            className={cn(
                                "mb-6 text-destructive/70",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            The requested payment could not be found.
                        </p>
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
                    <h2
                        className={cn(
                            "mb-4 font-semibold",
                            getResponsiveClass(30).textClass
                        )}
                    >
                        Payment Complete
                    </h2>
                    <p className={cn("mb-6", getResponsiveClass(20).textClass)}>
                        This payment has already been processed successfully.
                    </p>
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
        <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden pt-[50px] pb-[100px]">
            <div className="absolute inset-0 bg-[url('/bg/scifi-round.svg')] bg-cover bg-center opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-pink-500/5"></div>
            {/* 메인 컨테이너 */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* 메인 콘텐츠 영역 */}
                <main className="flex-1 flex items-center justify-center px-3 py-4">
                    <div className="w-full max-w-[1000px]">
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
