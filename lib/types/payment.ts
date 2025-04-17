import { PrismaClient, Events } from "@prisma/client";
import * as PortOne from "@portone/browser-sdk/v2";
import { prisma } from "@/lib/prisma/client";

export type PayMethod = PortOne.Entity.PayMethod;
export type EasyPayProvider = PortOne.Entity.EasyPayProvider;
export type CardProvider = PortOne.Entity.Country;
export type Currency = PortOne.Entity.Currency;
export type ProductTable = "events";
export type prismaTransaction =
    | PrismaClient
    | Omit<
          PrismaClient,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
      >;

export const PRODUCT_MAP = {
    product: {
        events: async ({
            productId,
            tx,
        }: {
            productId: string;
            tx?: prismaTransaction;
        }) => {
            const product = await (tx ?? prisma).events.findUnique({
                where: {
                    id: productId,
                },
            });

            if (!product) {
                throw new Error("Product not found");
            }

            return product;
        },
    },
    amountField: {
        events: "price" as keyof Events,
    },
    defaultCurrency: {
        events: "CURRENCY_KRW" as Currency,
    },
    nameField: {
        events: "title" as keyof Events,
    },
};
