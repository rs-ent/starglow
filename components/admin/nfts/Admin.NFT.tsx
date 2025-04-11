/// components\admin\Admin.NFT.tsx

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/app/hooks/useToast";

export default function AdminNFT({
    ESCROW_ADDRESS,
    COLLECTION_ADDRESS,
}: {
    ESCROW_ADDRESS: string;
    COLLECTION_ADDRESS: string;
}) {
    const { address } = useAccount();
    const toast = useToast();

    // 민팅 상태 관리
    const [mintQuantity, setMintQuantity] = useState<number>(1);
    const [mintTo, setMintTo] = useState(ESCROW_ADDRESS || "");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    return (
        <div className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>NFT MINTING</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mintTo">Mint To Address</Label>
                        <Input
                            id="mintTo"
                            placeholder="0x..."
                            value={mintTo}
                            onChange={(e) => setMintTo(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mintQuantity">Mint Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            value={mintQuantity}
                            onChange={(e) =>
                                setMintQuantity(Number(e.target.value))
                            }
                        />
                    </div>
                    <Button
                        className="w-full"
                        disabled={isLoading}
                        onClick={() => {}}
                    >
                        {isLoading ? "Minting..." : "Mint NFT"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
