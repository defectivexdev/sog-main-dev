import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";
import { sendDiscordMessage, editDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");
    
    const [data, total] = await Promise.all([
      prisma.airdrop.findMany({ 
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit 
      }),
      prisma.airdrop.count()
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/airdrop error:", error);
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
    if (!body.sessionName || !body.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const airdrop = await prisma.airdrop.create({ data: { ...body, createdBy: (session.user.icName || session.user.name) } });

    // Discord Bot Message
    const embed: DiscordEmbed = {
      title: "📦 แจ้งเตือน Airdrop!",
      description: `**หัวข้อ:** \`${body.sessionName}\`\n**เวลาเปิด:** \`${new Date(body.date).toLocaleString("th-TH")}\`\n\n**สร้างโดย:** \`${session.user.icName || session.user.name}\`\n\n**ผู้เข้าร่วม (0):**\nยังไม่มีผู้เข้าร่วม\n\n\`\`\`เตรียมตัวให้พร้อม ลูกแก๊งค์ทุกคน!\`\`\``,
      color: 0x60a5fa, // Blue
      timestamp: new Date().toISOString()
    };
    
    const msgId = await sendDiscordMessage(CHANNELS.AIRDROP_ATTENDANCE, [embed]);
    if (msgId) {
      await prisma.airdrop.update({ where: { id: airdrop.id }, data: { discordMessageId: msgId } });
      airdrop.discordMessageId = msgId;
    }

    return NextResponse.json({ success: true, data: airdrop }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/airdrop error:", error);
    return NextResponse.json({ success: false, error: "Failed to create airdrop", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id, action, memberName, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Airdrop ID is required" }, { status: 400 });

    if (action === "check-in") {
      // Any member can check themselves in
      if (!memberName) return NextResponse.json({ success: false, error: "Member name is required for check-in" }, { status: 400 });
      const current = await prisma.airdrop.findUnique({ where: { id } });
      const airdrop = await prisma.airdrop.update({ where: { id }, data: { checkedMembers: { push: memberName } } });
      
      // Update discord message if exists
      if (current && current.discordMessageId) {
        const newMembers = [...current.checkedMembers, memberName];
        const embed: DiscordEmbed = {
          title: "📦 แจ้งเตือน Airdrop! (กำลังเข้าร่วม)",
          description: `**หัวข้อ:** \`${current.sessionName}\`\n**เวลาเปิด:** \`${new Date(current.date).toLocaleString("th-TH")}\`\n\n**ผู้เข้าร่วม (${newMembers.length}):**\n${newMembers.map(m => `✅ ${m}`).join("\n")}\n\n\`\`\`เตรียมตัวให้พร้อม ลูกแก๊งค์ทุกคน!\`\`\``,
          color: 0x60a5fa,
          timestamp: new Date().toISOString()
        };
        await editDiscordMessage(CHANNELS.AIRDROP_ATTENDANCE, current.discordMessageId, [embed]);
      }
      
      return NextResponse.json({ success: true, data: airdrop });
    }

    // Otherwise manager only
    const role = resolveGangRole(session.user?.discordId, session.user?.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const airdrop = await prisma.airdrop.update({ where: { id: id }, data: update });
    return NextResponse.json({ success: true, data: airdrop });
  } catch (error: any) {
    console.error("PATCH /api/airdrop error:", error);
    return NextResponse.json({ success: false, error: "Failed to update airdrop", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Airdrop ID is required" }, { status: 400 });

    await prisma.airdrop.delete({ where: { id: id } });
    return NextResponse.json({ success: true, ok: true });
  } catch (error: any) {
    console.error("DELETE /api/airdrop error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete airdrop", details: error.message }, { status: 500 });
  }
}
