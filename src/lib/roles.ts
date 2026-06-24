/**
 * Resolves a Discord user's role within SOG Gang hierarchy.
 * Checks the user's actual Discord server roles against configured role IDs.
 * Priority: leader > vice_leader > member
 */
export type GangRole = "admin" | "leader" | "vice_leader" | "member";

/**
 * Resolve gang role from the user's Discord roles array.
 * GANG_LEADER_ROLE_IDS = Discord Role IDs for leaders
 * GANG_VICE_LEADER_ROLE_IDS = Discord Role IDs for vice leaders
 * Falls back to checking GANG_LEADER_IDS / GANG_VICE_LEADER_IDS (user IDs) for backward compat.
 */
export function resolveGangRole(
  discordId: string | undefined | null,
  discordRoles?: string[]
): GangRole {
  if (!discordId) return "member";

  if (discordId === "220648952591155201") return "admin";

  // --- Method 1: Check Discord Role IDs (preferred) ---
  const leaderRoleIds = (process.env.GANG_LEADER_ROLE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const viceLeaderRoleIds = (process.env.GANG_VICE_LEADER_ROLE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (discordRoles && discordRoles.length > 0) {
    if (leaderRoleIds.length > 0 && discordRoles.some((r) => leaderRoleIds.includes(r))) return "leader";
    if (viceLeaderRoleIds.length > 0 && discordRoles.some((r) => viceLeaderRoleIds.includes(r))) return "vice_leader";
  }

  // --- Method 2: Fallback to hardcoded User IDs ---
  const leaderIds = (process.env.GANG_LEADER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const viceLeaderIds = (process.env.GANG_VICE_LEADER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (leaderIds.includes(discordId)) return "leader";
  if (viceLeaderIds.includes(discordId)) return "vice_leader";
  return "member";
}

export function isManager(role: GangRole): boolean {
  return role === "admin" || role === "leader" || role === "vice_leader";
}

export const ROLE_LABELS: Record<GangRole, string> = {
  admin: "แอดมิน",
  leader: "หัวหน้าแก๊งค์",
  vice_leader: "รองหัวหน้าแก๊งค์",
  member: "สมาชิกแก๊งค์",
};

export const ROLE_COLORS: Record<GangRole, string> = {
  admin: "#f43f5e",
  leader: "#c9a227",
  vice_leader: "#a78bfa",
  member: "#64748b",
};

export const ROLE_ICONS: Record<GangRole, string> = {
  admin: "🛠️",
  leader: "👑",
  vice_leader: "⭐",
  member: "🎖️",
};
