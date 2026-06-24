import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");
    
    // By default, only get this month's leaves unless specified otherwise
    const filterAll = searchParams.get("all") === "true";
    let whereClause = {};

    if (!filterAll) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      whereClause = {
        startDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        }
      };
    }

    const [data, total] = await Promise.all([
      prisma.leave.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.leave.count({ where: whereClause })
    ]);

    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/leave error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.memberName || !body.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const leave = await prisma.leave.create({
      data: {
        memberName: body.memberName,
        startDate: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : new Date(body.date),
        reason: body.reason || "",
        imageUrl: body.imageUrl || null,
      },
    });

    // Discord Bot Message
    const embed: DiscordEmbed = {
      title: "🛎️ แจ้งลาใหม่",
      description: `**ผู้แจ้ง:** \`${body.memberName}\`\n**ระยะเวลา:** \`${new Date(body.date).toLocaleDateString("th-TH")}\` ถึง \`${body.endDate ? new Date(body.endDate).toLocaleDateString("th-TH") : "-"}\`\n\n**เหตุผลการลา:**\n\`\`\`\n${body.reason || "-"}\n\`\`\``,
      color: 0xffaa00,
      image: body.imageUrl ? { url: body.imageUrl } : undefined,
      timestamp: new Date().toISOString()
    };
    await sendDiscordMessage(CHANNELS.LEAVE, [embed]);

    return NextResponse.json({ success: true, data: leave }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/leave error:", error);
    return NextResponse.json({ success: false, error: "Failed to create leave", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { resolveGangRole } = await import("@/lib/roles");

    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Leave ID is required" }, { status: 400 });

    const existingLeave = await prisma.leave.findUnique({ where: { id } });
    if (!existingLeave) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    
    // Prevent double processing
    if (existingLeave.status !== "pending") {
      return NextResponse.json({ success: false, error: "Leave request already processed" }, { status: 400 });
    }

    const leave = await prisma.leave.update({ where: { id: id }, data: update });
    const actorName = session.user.icName || session.user.name;

    // Record Audit Log
    if (prisma.auditLog && (update.status === "approved" || update.status === "rejected")) {
      try {
        await prisma.auditLog.create({
          data: {
            action: update.status === "approved" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
            details: `${actorName} ${update.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"} การลางานของ ${leave.memberName}`,
            actorName: actorName || "Unknown",
            actorRole: resolveGangRole(session.user.discordId, session.user.discordRoles),
            targetId: leave.id
          }
        });
      } catch (e) {
        console.error("Failed to create audit log", e);
      }
    }

    // Create Notification if approved/rejected
    if (update.status === "approved" || update.status === "rejected") {
      const member = await prisma.member.findFirst({
        where: { OR: [{ name: leave.memberName }, { icName: leave.memberName }] }
      });
      if (member && member.discordId) {
        await prisma.notification.create({
          data: {
            userId: member.discordId,
            title: update.status === "approved" ? "✅ อนุมัติการลางาน" : "❌ ปฏิเสธการลางาน",
            message: update.status === "approved" 
              ? `การลางานของคุณวันที่ ${new Date(leave.startDate).toLocaleDateString('th-TH')} ได้รับการอนุมัติแล้ว`
              : `การลางานของคุณถูกปฏิเสธ ${leave.rejectReason ? `(เหตุผล: ${leave.rejectReason})` : ''}`,
            type: "leave"
          }
        });
      }

      // Update discord log
      const embed: DiscordEmbed = {
        title: update.status === "approved" ? "✅ อนุมัติการลางาน" : "❌ ปฏิเสธการลางาน",
        description: `การลางานของ **${leave.memberName}**\n**ผลการพิจารณา:** ${update.status === "approved" ? "อนุมัติ" : "ไม่อนุมัติ"}\n${update.rejectReason ? `*เหตุผล: ${update.rejectReason}*` : ''}`,
        color: update.status === "approved" ? 0x34d399 : 0xf87171,
        image: leave.imageUrl ? { url: leave.imageUrl } : undefined,
        footer: { text: `ตรวจสอบโดย: ${actorName}` },
        timestamp: new Date().toISOString()
      };
      await sendDiscordMessage(CHANNELS.LEAVE, [embed]);
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error: any) {
    console.error("PATCH /api/leave error:", error);
    return NextResponse.json({ success: false, error: "Failed to update leave", details: error.message }, { status: 500 });
  }
}
