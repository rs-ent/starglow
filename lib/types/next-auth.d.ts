/// lib/types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";
import type { Player } from "@prisma/client";

declare module "next-auth" {
    interface Session extends DefaultSession {
        player?: Player | null;
    }
}
