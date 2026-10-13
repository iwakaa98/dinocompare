export type PlanId = "free" | "pro" | "clinic";

export type UserPlan = {
  plan: PlanId;
  planStatus: string;
  planCurrentPeriodEnd: Date | null;
};

export function hasFullSearchAccess(user: UserPlan | null | undefined): boolean {
  if (!user) return false;
  if (user.plan !== "pro" && user.plan !== "clinic") return false;
  if (user.planStatus !== "active") return false;
  if (
    user.planCurrentPeriodEnd &&
    user.planCurrentPeriodEnd.getTime() < Date.now()
  ) {
    return false;
  }
  return true;
}

export function planLabel(plan: PlanId): string {
  if (plan === "pro") return "Pro";
  if (plan === "clinic") return "Clinic";
  return "Free";
}
