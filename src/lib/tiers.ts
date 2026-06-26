export type TierType = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface TierInfo {
  name: string;
  type: TierType;
  color: string;
  bgColor: string;
  icon: string;
}

export function getDonatorTier(amount: number): TierInfo {
  if (amount >= 500000) return { name: "Diamond", type: "diamond", color: "#60a5fa", bgColor: "rgba(96,165,250,0.1)", icon: "💎" };
  if (amount >= 100000) return { name: "Platinum", type: "platinum", color: "#a78bfa", bgColor: "rgba(167,139,250,0.1)", icon: "💠" };
  if (amount >= 50000) return { name: "Gold", type: "gold", color: "#fbbf24", bgColor: "rgba(251,191,36,0.1)", icon: "🏆" };
  if (amount >= 10000) return { name: "Silver", type: "silver", color: "#94a3b8", bgColor: "rgba(148,163,184,0.1)", icon: "🥈" };
  return { name: "Bronze", type: "bronze", color: "#b45309", bgColor: "rgba(180,83,9,0.1)", icon: "🥉" };
}

export function getAttendanceTier(count: number): TierInfo {
  if (count >= 50) return { name: "Diamond", type: "diamond", color: "#60a5fa", bgColor: "rgba(96,165,250,0.1)", icon: "💎" };
  if (count >= 30) return { name: "Platinum", type: "platinum", color: "#a78bfa", bgColor: "rgba(167,139,250,0.1)", icon: "💠" };
  if (count >= 15) return { name: "Gold", type: "gold", color: "#fbbf24", bgColor: "rgba(251,191,36,0.1)", icon: "🏆" };
  if (count >= 5) return { name: "Silver", type: "silver", color: "#94a3b8", bgColor: "rgba(148,163,184,0.1)", icon: "🥈" };
  return { name: "Bronze", type: "bronze", color: "#b45309", bgColor: "rgba(180,83,9,0.1)", icon: "🥉" };
}
