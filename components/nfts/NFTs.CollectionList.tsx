/// components\organisms\NFTs.CollectionList.tsx

"use client";


import CollectionCard from "@/components/nfts/NFTs.CollectionCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { CollectionContract } from "@prisma/client";

interface CollectionListProps {
    collections: CollectionContract[];
}

export default function CollectionList({ collections }: CollectionListProps) {
    return (
        <Tabs defaultValue="grid" className="w-full">
            <div className="flex items-center justify-between mb-6">
                <TabsList>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                    <TabsTrigger value="scroll">Scroll</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {collections.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                        />
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="scroll" className="mt-0">
                <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex w-max space-x-6 p-1">
                        {collections.map((collection) => (
                            <div
                                key={collection.id}
                                className="w-[300px] shrink-0"
                            >
                                <CollectionCard collection={collection} />
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );
}
