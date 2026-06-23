import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000"); // Default large to not break current UI
    const page = parseInt(searchParams.get("page") || "1");
    
    const [data, total] = await Promise.all([
      prisma.member.findMany({ 
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.member.count()
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/members error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

    const member = await prisma.member.create({ data: body });
    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to create member", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 });

    const member = await prisma.member.update({ where: { id }, data: update });
    return NextResponse.json({ success: true, data: member });
  } catch (error: any) {
    console.error("PATCH /api/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to update member", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 });

    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ success: true, ok: true });
  } catch (error: any) {
    console.error("DELETE /api/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete member", details: error.message }, { status: 500 });
  }
}
