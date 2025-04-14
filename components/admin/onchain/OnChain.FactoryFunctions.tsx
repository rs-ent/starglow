/// components\admin\onchain\OnChain.FactoryFunctions.tsx
/// Factory Contract Functions Component

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/app/hooks/useToast";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import CreateCollection from "./OnChain.CreateCollection";
import { CreateCollectionResult } from "./OnChain.Factory";

interface FactoryFunctionsProps {
    factory: {
        address: string;
        networkId: string;
        id: string;
    };
    onClose: () => void;
    onCollectionCreated?: (collection: any) => void;
}

export default function FactoryFunctions({
    factory,
    onClose,
    onCollectionCreated,
}: FactoryFunctionsProps) {
    const [showCreateCollection, setShowCreateCollection] = useState(false);
    const [lastCreatedCollection, setLastCreatedCollection] =
        useState<CreateCollectionResult | null>(null);
    const toast = useToast();

    const handleCollectionCreated = (result: CreateCollectionResult) => {
        setLastCreatedCollection(result);
        setShowCreateCollection(false);

        if (onCollectionCreated) {
            onCollectionCreated({
                name: result.name,
                symbol: result.symbol,
                address: result.collectionAddress,
                factoryAddress: factory.address,
                networkId: factory.networkId,
                transactionHash: result.transactionHash,
            });
        }
    };

    return (
        <div className="rounded-md bg-muted/40 p-4 space-y-4">
            <h3 className="text-lg font-semibold">
                Factory Contract Functions
            </h3>
            <div className="text-sm text-muted-foreground mb-4">
                Manage and interact with this Factory contract.
                <div className="mt-2 font-mono text-xs">
                    Factory Address: {factory.address}
                </div>
            </div>

            {lastCreatedCollection && lastCreatedCollection.success && (
                <Alert className="bg-slate-900">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle>Collection Created Successfully</AlertTitle>
                    <AlertDescription>
                        Your new collection "{lastCreatedCollection.name}" (
                        {lastCreatedCollection.symbol}) has been created.
                        <div className="mt-2 grid grid-cols-1 gap-2">
                            <div>
                                <span className="font-medium">Address:</span>{" "}
                                <span className="font-mono text-sm">
                                    {lastCreatedCollection.collectionAddress}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium">
                                    Transaction:
                                </span>{" "}
                                <span className="font-mono text-sm">
                                    {lastCreatedCollection.transactionHash}
                                </span>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Collection</CardTitle>
                        <CardDescription>
                            Create a new NFT collection using this factory
                            contract
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Create an ERC-721 compatible NFT collection with
                            custom parameters.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={() => setShowCreateCollection(true)}
                            className="w-full"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Collection
                        </Button>
                    </CardFooter>
                </Card>

                {/* Add more factory functions here */}
                {/* For example: a card for deploying marketplace contracts, etc. */}
            </div>

            {showCreateCollection && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <CreateCollection
                            factory={factory}
                            onClose={() => setShowCreateCollection(false)}
                            onSuccess={handleCollectionCreated}
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
}
