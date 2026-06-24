import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";
import { sendDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";
import { rateLimit } from "@/lib/rateLimit";

export const GET = withAuth(async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");
    
    const [data, total, incomeSumRaw, expenseSumRaw] = await Promise.all([
      prisma.payment.findMany({ 
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit 
      }),
      prisma.payment.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { type: "income", status: "confirmed" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { type: "expense", status: "confirmed" } })
    ]);
    
    const totalIn = incomeSumRaw._sum.amount || 0;
    const totalOut = expenseSumRaw._sum.amount || 0;

    return NextResponse.json({ 
      success: true, 
      data,
      totals: { totalIn, totalOut, balance: totalIn - totalOut },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/payment error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req }) => {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 5, 60000)) { // 5 requests per minute per IP
      return NextResponse.json({ success: false, error: "ส่งคำขอเร็วเกินไป กรุณารอสักครู่ (Rate Limit Exceeded)" }, { status: 429 });
    }

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

    // Discord Bot Message
    const isIncome = payment.type === "income";
    const embed: DiscordEmbed = {
      title: isIncome ? "💰 นำส่งเงินเข้าคลัง" : "💸 เบิกเงินจากคลัง",
      description: `**ผู้ทำรายการ:** \`${payment.memberName}\`\n**จำนวนเงิน:** \`฿${payment.amount.toLocaleString()}\`\n\n**หมายเหตุ:**\n\`\`\`\n${payment.description || "-"}\n\`\`\``,
      color: isIncome ? 0x34d399 : 0xf87171,
      image: payment.image ? { url: payment.image } : undefined,
      timestamp: new Date().toISOString()
    };
    await sendDiscordMessage(CHANNELS.PAYMENT, [embed]);

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment", details: error.message }, { status: 500 });
  }
});

export const PATCH = withManagerAuth(async ({ req, session, role }) => {
  try {
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
            actorRole: role,
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

      // Send to Discord
      const isIncome = payment.type === "income";
      const embed: DiscordEmbed = {
        title: update.status === "confirmed" ? (isIncome ? "✅ ยืนยันรับเงิน" : "✅ ยืนยันจ่ายเงิน") : "❌ ปฏิเสธรายการบัญชี",
        description: `รายการของ **${payment.memberName}** จำนวน **฿${payment.amount.toLocaleString()}**\n${update.status === "confirmed" ? "ได้รับการยืนยันแล้ว" : "ถูกปฏิเสธ"}\n${update.rejectReason ? `*เหตุผล: ${update.rejectReason}*` : ""}`,
        color: update.status === "confirmed" ? 0x34d399 : 0xf87171,
        footer: { text: `ตรวจสอบโดย: ${actorName}` },
        timestamp: new Date().toISOString()
      };
      await sendDiscordMessage(CHANNELS.PAYMENT, [embed]);
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    console.error("PATCH /api/payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update payment", details: error.message }, { status: 500 });
  }
});
