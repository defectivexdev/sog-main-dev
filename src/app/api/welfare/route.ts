import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";
import { sendDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");

    const [data, total] = await Promise.all([
      prisma.welfareItem.findMany({ 
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.welfareItem.count()
    ]);

    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/welfare error:", error);
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

    const item = await prisma.welfareItem.create({ data: body });

    // Send to Discord
    const embed: DiscordEmbed = {
      title: "🎁 เพิ่มของสวัสดิการใหม่",
      description: `**ไอเทม:** \`${item.name}\`\n**เงื่อนไข:** \`${item.condition || "-"}\`\n${item.description ? `*${item.description}*` : ""}`,
      color: 0x8b5cf6, // Purple
      image: item.imageUrl ? { url: item.imageUrl } : undefined,
      timestamp: new Date().toISOString()
    };
    await sendDiscordMessage(CHANNELS.WELFARE, [embed]);

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/welfare error:", error);
    return NextResponse.json({ success: false, error: "Failed to create welfare item", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });

    const item = await prisma.welfareItem.update({ where: { id: id }, data: update });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("PATCH /api/welfare error:", error);
    return NextResponse.json({ success: false, error: "Failed to update welfare item", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });

    await prisma.welfareItem.delete({ where: { id: id } });
    return NextResponse.json({ success: true, ok: true });
  } catch (error: any) {
    console.error("DELETE /api/welfare error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete welfare item", details: error.message }, { status: 500 });
  }
}
