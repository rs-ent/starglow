import { prisma } from "@/lib/prisma/client";

import type * as PortOne from "@portone/browser-sdk/v2";
import type { Events, Story_spg } from "@prisma/client";

export type PayMethod = PortOne.Entity.PayMethod;
export type EasyPayProvider = PortOne.Entity.EasyPayProvider;
export type CardProvider = PortOne.Entity.Country;
export type Currency = PortOne.Entity.Currency;
export type prismaTransaction = any;

export type ProductTableMap = {
    events: Events;
    nfts: Story_spg;
};
export type ProductTable = keyof ProductTableMap;

type ProductFields<T extends ProductTable> = {
    amountField: keyof ProductTableMap[T];
    currencyField: keyof ProductTableMap[T];
    nameField: keyof ProductTableMap[T];
};

type ProductFetcher<T extends ProductTable> = (params: {
    productId: string;
    tx?: prismaTransaction;
}) => Promise<ProductTableMap[T]>;

export const PRODUCT_MAP: {
    product: { [K in ProductTable]: ProductFetcher<K> };
    amountField: { [K in ProductTable]: ProductFields<K>["amountField"] };
    defaultCurrency: { [K in ProductTable]: Currency };
    nameField: { [K in ProductTable]: ProductFields<K>["nameField"] };
} = {
    product: {
        events: async ({ productId, tx }) => {
            const client = (tx ?? prisma) as typeof prisma;
            const product = await client.events.findUnique({
                where: { id: productId },
            });
            if (!product) throw new Error("Product not found");
            return product;
        },
        nfts: async ({ productId, tx }) => {
            const client = (tx ?? prisma) as typeof prisma;
            const product = await client.story_spg.findUnique({
                where: { id: productId },
            });
            if (!product) throw new Error("Product not found");
            return product;
        },
    },
    amountField: {
        events: "price",
        nfts: "price",
    },
    defaultCurrency: {
        events: "CURRENCY_KRW",
        nfts: "CURRENCY_USD",
    },
    nameField: {
        events: "title",
        nfts: "name",
    },
} as const;
