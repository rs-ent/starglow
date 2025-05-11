/// components/atoms/QRCode.tsx

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { useToast } from "@/app/hooks/useToast";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface QRCodeProps {
    url: string;
    onClose: () => void;
}

export default function QRCodeModal({ url, onClose }: QRCodeProps) {
    const toast = useToast();
    const qrRef = useRef<HTMLDivElement>(null);

    const handleCopyImage = async () => {
        if (!qrRef.current) return;
        try {
            const dataUrl = await toPng(qrRef.current);
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            await navigator.clipboard.write([
                new window.ClipboardItem({ "image/png": blob }),
            ]);
            toast.success("QR Code copied to clipboard");
        } catch (e) {
            toast.error(
                "Failed to copy QR Code. Please check your browser support."
            );
        }
    };

    return (
        <div
            className="fixed top-0 left-0 z-50 w-screen h-screen bg-[rgba(0,0,0,0.6)] flex flex-col items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    ref={qrRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopyImage();
                    }}
                >
                    <QRCodeSVG value={url} size={200} />
                </div>
            </div>
            <button
                className={cn(
                    "mt-1 p-0 break-all text-center text-[6px] backdrop-blur-2xl",
                    getResponsiveClass(10).textClass
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    handleCopyImage();
                }}
            >
                Click QR Code Image to Copy
            </button>
            <div className="max-w-[180px] w-full flex gap-2 mt-3 justify-center items-center">
                <button
                    className="px-5 backdrop-blur-sm bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.5)] rounded-lg p-2 text-xs"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
