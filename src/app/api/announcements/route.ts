import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return NextResponse.json({ data: announcements });
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
    const ann = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        author: session.user.icName || session.user.name || "ผู้ดูแลระบบ",
        isPinned: body.isPinned || false
      }
    });

    return NextResponse.json({ data: ann }, { status: 201 });
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
