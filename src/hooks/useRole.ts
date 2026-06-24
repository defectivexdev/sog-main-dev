"use client";
import { useSession } from "next-auth/react";
import { type GangRole, isManager, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "@/lib/roles";

export function useRole() {
  const { data: session, status } = useSession();

  const gangRole: GangRole = (session?.user?.gangRole as GangRole) ?? "member";
  const discordId = session?.user?.discordId ?? "";

  return {
    gangRole,
    isManager: isManager(gangRole),
    isAdmin: gangRole === "admin",
    isLeader: gangRole === "leader",
    isViceLeader: gangRole === "vice_leader",
    isMember: gangRole === "member",
    roleLabel: ROLE_LABELS[gangRole],
    roleColor: ROLE_COLORS[gangRole],
    roleIcon: ROLE_ICONS[gangRole],
    discordId,
    user: session?.user,
    loading: status === "loading",
  };
}
