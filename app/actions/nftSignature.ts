"use client";

import { signMessage } from "@wagmi/core";
import { useToast } from "@/app/hooks/useToast";
import { generateMessageHashForNFT } from "./nftTransfer";

/**
 * NFT 에스크로 전송을 위한 메시지 서명을 생성합니다.
 * 클라이언트 측에서 사용하는 함수입니다.
 *
 * @param fromAddress 전송자 지갑 주소
 * @param toAddress 수신자 지갑 주소
 * @param tokenId 전송할 토큰 ID
 * @returns 서명된 메시지 또는 오류 발생 시 null
 */
export async function signNFTTransfer(
    fromAddress: string,
    toAddress: string,
    tokenId: number
): Promise<string | null> {
    try {
        // 1. 메시지 해시 생성 (서버 사이드 함수 호출)
        const messageHash = await generateMessageHashForNFT(
            fromAddress,
            toAddress,
            tokenId
        );

        // 2. 메시지에 서명 (클라이언트 측 함수 - wagmi 사용)
        const signature = await signMessage({
            message: { raw: messageHash as `0x${string}` },
        });

        return signature;
    } catch (error) {
        console.error("Failed to sign NFT transfer:", error);
        return null;
    }
}

/**
 * NFT 에스크로 전송 서명 및 전송 실행
 * UI 컴포넌트에서 호출할 수 있는 함수입니다.
 *
 * @param paymentId 결제 ID
 * @param userId 사용자 ID
 * @param fromAddress 전송자 지갑 주소
 * @param toAddress 수신자 지갑 주소
 * @param tokenId 전송할 토큰 ID
 * @returns 성공 여부
 */
export async function signAndTransferNFT(
    paymentId: string,
    userId: string,
    fromAddress: string,
    toAddress: string,
    tokenId: number
): Promise<boolean> {
    const toast = useToast();

    try {
        // 1. 서명 생성
        const signature = await signNFTTransfer(
            fromAddress,
            toAddress,
            tokenId
        );

        if (!signature) {
            toast.error("서명 생성에 실패했습니다.");
            return false;
        }

        // 2. 서버 액션 호출하여 에스크로 전송 실행
        const response = await fetch("/api/nft/escrow-transfer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                paymentId,
                userId,
                signature,
            }),
        });

        const result = await response.json();

        if (result.success) {
            toast.success("NFT 전송이 성공적으로 요청되었습니다.");
            return true;
        } else {
            toast.error(
                result.error?.message || "NFT 전송 요청에 실패했습니다."
            );
            return false;
        }
    } catch (error) {
        console.error("NFT 전송 요청 중 오류 발생:", error);
        toast.error("NFT 전송 요청 중 오류가 발생했습니다.");
        return false;
    }
}
