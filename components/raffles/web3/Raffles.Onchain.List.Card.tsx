/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo } from "react";

interface RafflesOnchainListCardProps {
    contractAddress: string;
    raffleId: string;
}

function RafflesOnchainListCard({
    contractAddress,
    raffleId,
}: RafflesOnchainListCardProps) {
    return (
        <div
            style={{ border: "1px solid gray", padding: "16px", margin: "8px" }}
        >
            <h3>Raffle Card</h3>
            <p>Contract: {contractAddress}</p>
            <p>Raffle ID: {raffleId}</p>
            <p>Status: Simple test component working!</p>
        </div>
    );
}

export default memo(RafflesOnchainListCard);
