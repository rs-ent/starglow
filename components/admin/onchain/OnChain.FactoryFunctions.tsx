/// components\admin\onchain\OnChain.FactoryFunctions.tsx
/// Factory Contract Functions Component

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Check,
    AlertTriangle,
    Plus,
    RefreshCw,
    X,
} from "lucide-react";
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
import { Factory } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        <div className="rounded-2xl bg-gradient-to-b from-muted/10 to-muted/5 p-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Factory className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">
                        Factory Management
                    </h2>
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Manage and interact with this Factory contract
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg font-mono text-xs">
                        <span className="text-muted-foreground">
                            Contract Address:
                        </span>
                        <code className="text-primary">{factory.address}</code>
                    </div>
                </div>
            </div>

            {/* Success Alert */}
            {lastCreatedCollection && lastCreatedCollection.success && (
                <Alert className="bg-green-500/5 border border-green-500/20">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <AlertTitle className="text-green-500 font-semibold text-lg">
                                Collection Created Successfully
                            </AlertTitle>
                            <AlertDescription>
                                <div className="space-y-4">
                                    <p className="text-sm">
                                        Your new collection "
                                        {lastCreatedCollection.name}" has been
                                        created and is ready to use.
                                    </p>
                                    <div className="grid gap-4 text-sm">
                                        <div className="space-y-1.5">
                                            <span className="text-muted-foreground text-xs">
                                                Collection Address
                                            </span>
                                            <code className="block w-full p-2 bg-muted/30 rounded-md font-mono">
                                                {
                                                    lastCreatedCollection.collectionAddress
                                                }
                                            </code>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-muted-foreground text-xs">
                                                Transaction Hash
                                            </span>
                                            <code className="block w-full p-2 bg-muted/30 rounded-md font-mono">
                                                {
                                                    lastCreatedCollection.transactionHash
                                                }
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Create Collection Card */}
            <div className="grid gap-6">
                <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    Create New Collection
                                </CardTitle>
                                <CardDescription className="text-base mt-1">
                                    Deploy a new ERC-721 compatible NFT
                                    collection
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Create a customizable NFT collection with
                                advanced features and metadata support.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant="outline"
                                    className="bg-muted/30"
                                >
                                    ERC-721
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="bg-muted/30"
                                >
                                    Metadata Support
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="bg-muted/30"
                                >
                                    Customizable
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={() => setShowCreateCollection(true)}
                            className="w-full relative overflow-hidden group"
                            size="lg"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Plus className="h-4 w-4" />
                                Start Collection Creation
                            </span>
                            <div className="absolute inset-0 bg-primary/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Create Collection Modal */}
            {showCreateCollection && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border">
                        <CreateCollection
                            factory={factory}
                            onClose={() => setShowCreateCollection(false)}
                            onSuccess={handleCollectionCreated}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-6 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="px-6 hover:bg-muted/50 transition-colors"
                >
                    <X className="h-4 w-4 mr-2" />
                    Close Factory Manager
                </Button>
            </div>
        </div>
    );
}
