import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";
import { sendDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";

export const GET = withAuth(async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");
    
    const [data, total] = await Promise.all([
      prisma.requisition.findMany({ 
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.requisition.count()
    ]);
    
    return NextResponse.json({ 
      success: true,
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/requisition error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req }) => {
  try {
    const body = await req.json();
    const qty = Number(body.quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: "จำนวนเบิกต้องมากกว่า 0" }, { status: 400 });
    }

    const req_ = await prisma.requisition.create({ 
      data: {
        memberName: body.memberName,
        itemName: body.itemName,
        quantity: qty,
        unit: body.unit,
        reason: body.reason,
        imageUrl: body.imageUrl,
      } 
    });

    // Send Discord message
    const embed: DiscordEmbed = {
      title: "📦 แจ้งขอเบิกของใหม่",
      description: `**ผู้เบิก:** \`${req_.memberName}\`\n**ไอเทม:** \`${req_.itemName}\`\n**จำนวน:** \`${req_.quantity} ${req_.unit}\`\n\n**เหตุผล:**\n\`\`\`\n${req_.reason || "-"}\n\`\`\``,
      color: 0xc9a227,
      image: req_.imageUrl ? { url: req_.imageUrl } : undefined,
      timestamp: new Date().toISOString()
    };
    await sendDiscordMessage(CHANNELS.REQUISITION, [embed]);

    return NextResponse.json({ success: true, data: req_ }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/requisition error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const PATCH = withManagerAuth(async ({ req, session, role }) => {
  try {
    const { id, ...update } = await req.json();
    const actorName = session.user.icName || session.user.name;
    const rec = await prisma.requisition.update({ where: { id: id }, data: { ...update, approvedBy: actorName } });

    // Record Audit Log
    if (prisma.auditLog && (update.status === "approved" || update.status === "rejected")) {
      try {
        await prisma.auditLog.create({
          data: {
            action: update.status === "approved" ? "APPROVE_REQUISITION" : "REJECT_REQUISITION",
            details: `${actorName} ${update.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"} การเบิก ${rec.itemName} จำนวน ${rec.quantity} ${rec.unit} ของ ${rec.memberName}`,
            actorName: actorName || "Unknown",
            actorRole: role,
            targetId: rec.id
          }
        });
      } catch (e) {
        console.error("Failed to create audit log", e);
      }
    }

    // Create Notification if approved/rejected
    if (update.status === "approved" || update.status === "rejected") {
      try {
        const member = await prisma.member.findFirst({
          where: { OR: [{ name: rec.memberName }, { icName: rec.memberName }] }
        });
        if (member && member.discordId) {
          await prisma.notification.create({
            data: {
              userId: member.discordId,
              title: update.status === "approved" ? "✅ อนุมัติการเบิกของ" : "❌ ปฏิเสธการเบิกของ",
              message: update.status === "approved" 
                ? `คำขอเบิก ${rec.itemName} จำนวน ${rec.quantity} ${rec.unit} ได้รับการอนุมัติแล้ว`
                : `คำขอเบิก ${rec.itemName} ถูกปฏิเสธ ${rec.rejectReason ? `(เหตุผล: ${rec.rejectReason})` : ''}`,
              type: "requisition"
            }
          });
        }
      } catch (e) {
        console.error("Failed to create notification", e);
      }

      // Send to Discord
      const embed: DiscordEmbed = {
        title: update.status === "approved" ? "✅ อนุมัติการเบิกของ" : "❌ ปฏิเสธการเบิกของ",
        description: `รายการขอเบิก **${rec.itemName} (${rec.quantity} ${rec.unit})** ของ **${rec.memberName}**\n${update.status === "approved" ? "ได้รับการอนุมัติแล้ว" : "ถูกปฏิเสธ"}\n${update.rejectReason ? `*เหตุผล: ${update.rejectReason}*` : ""}`,
        color: update.status === "approved" ? 0x34d399 : 0xf87171,
        footer: { text: `ตรวจสอบโดย: ${actorName}` },
        timestamp: new Date().toISOString()
      };
      await sendDiscordMessage(CHANNELS.REQUISITION, [embed]);
    }

    return NextResponse.json({ success: true, data: rec });
  } catch (error: any) {
    console.error("PATCH /api/requisition error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const DELETE = withManagerAuth(async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.requisition.delete({ where: { id } });
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("DELETE /api/requisition error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
