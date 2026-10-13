import { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/entitlements";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan?: PlanId;
      planStatus?: string;
    } & DefaultSession["user"];
  }
}
