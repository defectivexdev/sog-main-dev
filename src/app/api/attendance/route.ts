import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const data = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      orderBy: { date: 'desc' },
    });
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
    if (!isManager(role)) return NextResponse.json({ error: "Forbidden — managers only" }, { status: 403 });

    const body = await req.json();
    const rec = await prisma.attendance.create({ data: { ...body, recordedBy: (session.user.icName || session.user.name) } });
    return NextResponse.json({ data: rec }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...update } = await req.json();
    const rec = await prisma.attendance.update({ where: { id: id }, data: update });
    return NextResponse.json({ data: rec });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
  if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.attendance.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}
