import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET() {
  const data = await prisma.activity.findMany({ orderBy: { date: 'desc' } });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
  if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const activity = await prisma.activity.create({ data: { ...body, createdBy: (session.user.icName || session.user.name) } });
  return NextResponse.json({ data: activity }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, memberName, ...update } = await req.json();

  if (action === "join") {
    const activity = await prisma.activity.update({ where: { id }, data: { participants: { push: memberName } } });
    return NextResponse.json({ data: activity });
  }

  if (action === "leave") {
    const activity = await prisma.activity.update({ where: { id }, data: { participants: { push: memberName } } });
    return NextResponse.json({ data: activity });
  }

  const role = resolveGangRole(session.user?.discordId, session.user?.discordRoles);
  if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const activity = await prisma.activity.update({ where: { id: id }, data: update });
  return NextResponse.json({ data: activity });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
  if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.activity.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}
