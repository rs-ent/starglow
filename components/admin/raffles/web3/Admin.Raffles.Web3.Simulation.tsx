"use client";

import AdvancedSimulationSuite from "./simulation/AdvancedSimulationSuite";

interface InitialRaffleData {
    raffleId: string;
    title: string;
    description: string;
    entryFee: number;
    entryFeeAsset: {
        id: string;
        name: string;
        symbol: string;
        description?: string;
        iconUrl?: string;
    } | null;
    prizes: Array<{
        id: string;
        title: string;
        description: string;
        imageUrl: string;
        order: number;
        quantity: number;
        prizeType: number;
        userValue?: number;
    }>;
    networkName: string;
    contractAddress: string;
}

interface Props {
    initialRaffleData?: InitialRaffleData;
}

export default function AdminRafflesWeb3Simulation({
    initialRaffleData,
}: Props) {
    return <AdvancedSimulationSuite initialRaffleData={initialRaffleData} />;
}
