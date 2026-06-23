import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!prisma.auditLog) {
       console.warn("AuditLog model not available on Prisma client. Please restart dev server.");
       return NextResponse.json({ logs: [] });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100 // Limit to latest 100 for performance
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json({ logs: [] });
    }
    console.error("Audit API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
