import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  hasFullSearchAccess,
  type PlanId,
  type UserPlan,
} from "@/lib/entitlements";

export async function getCurrentUserPlan(): Promise<UserPlan | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planStatus: true,
      planCurrentPeriodEnd: true,
    },
  });
  if (!user) return null;

  return {
    plan: user.plan as PlanId,
    planStatus: user.planStatus,
    planCurrentPeriodEnd: user.planCurrentPeriodEnd,
  };
}

export async function userHasFullSearchAccess(): Promise<boolean> {
  const plan = await getCurrentUserPlan();
  return hasFullSearchAccess(plan);
}
