import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";
import { rateLimit } from "@/lib/rateLimit";

export async function GET() {
  try {
    const data = await prisma.activity.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const activity = await prisma.activity.create({ data: { ...body, createdBy: (session.user.icName || session.user.name) } });
    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 10, 60000)) { // 10 requests per minute per IP
      return NextResponse.json({ error: "ส่งคำขอเร็วเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const { id, action, memberName, ...update } = await req.json();

    if (action === "join") {
      const activity = await prisma.activity.update({ where: { id }, data: { participants: { push: memberName } } });
      return NextResponse.json({ data: activity });
    }

    if (action === "leave") {
      const current = await prisma.activity.findUnique({ where: { id } });
      if (current) {
        const activity = await prisma.activity.update({ 
          where: { id }, 
          data: { participants: { set: current.participants.filter(p => p !== memberName) } } 
        });
        return NextResponse.json({ data: activity });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const role = resolveGangRole(session.user?.discordId, session.user?.discordRoles);
    if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const activity = await prisma.activity.update({ where: { id: id }, data: update });
    return NextResponse.json({ data: activity });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    await prisma.activity.delete({ where: { id: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
