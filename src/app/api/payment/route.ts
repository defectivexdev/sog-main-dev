import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendDiscordWebhook } from "@/lib/discordWebhook";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");
    
    const [data, total] = await Promise.all([
      prisma.payment.findMany({ 
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit 
      }),
      prisma.payment.count()
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/payment error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.memberName || !body.amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const payment = await prisma.payment.create({ data: {
      memberName: body.memberName,
      amount: Number(body.amount),
      type: body.type || "income",
      description: body.description || "",
      image: body.image,
      date: body.date ? new Date(body.date) : new Date(),
    } });

    // Discord Webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_PAYMENT;
    
    if (webhookUrl) {
      const isIncome = payment.type === "income";
      await sendDiscordWebhook(webhookUrl, {
        title: isIncome ? "💰 นำส่งเงินเข้าคลัง" : "💸 เบิกเงินจากคลัง",
        description: `**ผู้ทำรายการ:** \`${payment.memberName}\`\n**จำนวนเงิน:** \`฿${payment.amount.toLocaleString()}\`\n\n**หมายเหตุ:**\n\`\`\`\n${payment.description || "-"}\n\`\`\``,
        color: isIncome ? 0x34d399 : 0xf87171, // Green for income, Red for expense
        imageUrl: payment.image || undefined,
      });
    }

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Payment ID is required" }, { status: 400 });

    const actorName = session.user.icName || session.user.name;
    const payment = await prisma.payment.update({
      where: { id: id },
      data: { ...update, confirmedBy: actorName }
    });

    // Record Audit Log
    if (prisma.auditLog) {
      try {
        await prisma.auditLog.create({
          data: {
            action: update.status === "confirmed" ? "APPROVE_PAYMENT" : "REJECT_PAYMENT",
            details: `${actorName} ${update.status === "confirmed" ? "อนุมัติ" : "ปฏิเสธ"} การ${payment.type === "income" ? "นำส่งเงิน" : "เบิกเงิน"} จำนวน ฿${payment.amount} ของ ${payment.memberName}`,
            actorName: actorName || "Unknown",
            actorRole: resolveGangRole(session.user.discordId, session.user.discordRoles),
            targetId: payment.id
          }
        });
      } catch (e) {
        console.error("Failed to create audit log", e);
      }
    }

    // Create Notification if confirmed
    if (update.status === "confirmed") {
      const member = await prisma.member.findFirst({
        where: { OR: [{ name: payment.memberName }, { icName: payment.memberName }] }
      });
      if (member && member.discordId) {
        await prisma.notification.create({
          data: {
            userId: member.discordId,
            title: "✅ ยืนยันยอดเงินสำเร็จ",
            message: `ยอดเงิน ฿${payment.amount} (ประเภท: ${payment.type === 'income' ? 'นำส่ง' : 'เบิก'}) ของคุณได้รับการยืนยันแล้ว`,
            type: "payment"
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    console.error("PATCH /api/payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update payment", details: error.message }, { status: 500 });
  }
}
