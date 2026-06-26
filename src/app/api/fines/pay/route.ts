import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";
import { sendDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";

export const POST = withManagerAuth(async ({ req, session }) => {
  try {
    const { fineId } = await req.json();
    if (!fineId) {
      return NextResponse.json({ success: false, error: "Missing fineId" }, { status: 400 });
    }
    
    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine) {
      return NextResponse.json({ success: false, error: "Fine not found" }, { status: 404 });
    }
    if (fine.status === "paid") {
      return NextResponse.json({ success: false, error: "Fine already paid" }, { status: 400 });
    }

    const confirmedBy = session.user.icName || session.user.name;

    // Run in transaction: mark fine as paid, and create a Payment record
    await prisma.$transaction(async (tx) => {
      await tx.fine.update({
        where: { id: fine.id },
        data: { status: "paid", paidAt: new Date() }
      });

      await tx.payment.create({
        data: {
          memberName: fine.memberName,
          amount: fine.amount,
          type: "income",
          description: `จ่ายค่าปรับ: ${fine.reason}`,
          status: "confirmed",
          confirmedBy
        }
      });
    });

    // Notify Discord
    const embed: DiscordEmbed = {
      title: "💸 ชำระค่าปรับเรียบร้อย",
      description: `**${fine.memberName}** ได้ชำระค่าปรับจำนวน **฿${fine.amount.toLocaleString()}**\nสาเหตุ: ${fine.reason}`,
      color: 0x34d399,
      footer: { text: `ยืนยันโดย: ${confirmedBy}` },
      timestamp: new Date().toISOString()
    };
    await sendDiscordMessage(CHANNELS.PAYMENT, [embed]);
    
    return NextResponse.json({ success: true, data: { ...fine, status: "paid" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
