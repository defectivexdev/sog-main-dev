import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";
import { sendDiscordMessage, editDiscordMessage, CHANNELS, DiscordEmbed } from "@/lib/discordBot";

export const GET = withAuth(async () => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const data = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const POST = withManagerAuth(async ({ req, session }) => {
  try {
    const body = await req.json();
    const recordedBy = session.user.icName || session.user.name;
    const rec = await prisma.attendance.create({ data: { ...body, recordedBy } });

    // Send Discord Message
    const statusText = rec.status === "late" ? "🟡 มาสาย" : (rec.status === "absent" ? "🔴 ขาด" : "🟢 มา");
    const statusColor = rec.status === "late" ? 0xfbbf24 : (rec.status === "absent" ? 0xf87171 : 0x34d399);
    
    const embed: DiscordEmbed = {
      title: "📋 บันทึกการเข้างาน",
      description: `**${rec.memberName}** ได้รับการบันทึกสถานะ: ${statusText}\n${rec.note ? `*หมายเหตุ: ${rec.note}*` : ""}`,
      color: statusColor,
      footer: { text: `บันทึกโดย: ${recordedBy}` },
      timestamp: new Date().toISOString()
    };

    const msgId = await sendDiscordMessage(CHANNELS.ATTENDANCE, [embed]);
    if (msgId) {
      await prisma.attendance.update({ where: { id: rec.id }, data: { discordMessageId: msgId } });
      rec.discordMessageId = msgId;
    }

    return NextResponse.json({ success: true, data: rec }, { status: 201 });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const PATCH = withManagerAuth(async ({ req }) => {
  try {
    const { id, ...update } = await req.json();
    const rec = await prisma.attendance.update({ where: { id: id }, data: update });

    // Edit Discord Message if it exists
    if (rec.discordMessageId) {
      const statusText = rec.status === "late" ? "🟡 มาสาย" : (rec.status === "absent" ? "🔴 ขาด" : "🟢 มา");
      const statusColor = rec.status === "late" ? 0xfbbf24 : (rec.status === "absent" ? 0xf87171 : 0x34d399);
      
      const embed: DiscordEmbed = {
        title: "📋 บันทึกการเข้างาน (อัปเดตแล้ว ✅)",
        description: `**${rec.memberName}** อัปเดตสถานะเป็น: ${statusText} ✅\n${rec.note ? `*หมายเหตุ: ${rec.note}*` : ""}`,
        color: statusColor,
        footer: { text: `อัปเดตล่าสุดโดยระบบ` },
        timestamp: new Date().toISOString()
      };
      await editDiscordMessage(CHANNELS.ATTENDANCE, rec.discordMessageId, [embed]);
    }

    return NextResponse.json({ success: true, data: rec });
  } catch (error) {
    console.error("Attendance PATCH error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const DELETE = withManagerAuth(async ({ req }) => {
  try {
    const { id } = await req.json();
    await prisma.attendance.delete({ where: { id: id } });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Attendance DELETE error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
