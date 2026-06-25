import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import prisma from "@/lib/db";

// Discord sends interactions via POST
export async function POST(req: NextRequest) {
  try {
    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
    if (!PUBLIC_KEY) {
      console.error("Missing DISCORD_PUBLIC_KEY");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 1. Verify the signature from Discord
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");
    const bodyText = await req.text(); // Read raw text for verification

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isVerified = await verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

    if (!isVerified) {
      return NextResponse.json({ error: "Invalid request signature" }, { status: 401 });
    }

    // 2. Parse the body
    const body = JSON.parse(bodyText);

    // 3. Handle PING (Discord requires us to reply with PONG)
    if (body.type === 1) { // 1 = PING
      return NextResponse.json({ type: 1 }); // 1 = PONG
    }

    // 4. Handle Slash Commands
    if (body.type === 2) { // 2 = APPLICATION_COMMAND
      const { name, options } = body.data;

      if (name === "leave") {
        // Find user by Discord ID
        const discordId = body.member?.user?.id;
        
        if (!discordId) {
          return NextResponse.json({
            type: 4, // 4 = CHANNEL_MESSAGE_WITH_SOURCE
            data: { content: "ไม่สามารถระบุตัวตนของคุณได้ กรุณาล็อกอินผ่านเว็บไซต์ก่อน!" }
          });
        }

        const member = await prisma.member.findUnique({ where: { discordId } });

        if (!member) {
          return NextResponse.json({
            type: 4,
            data: { content: "ไม่พบข้อมูลสมาชิกของคุณในระบบ กรุณาติดต่อหัวหน้าแก๊งค์" }
          });
        }

        // Get options
        const reasonOpt = options?.find((o: any) => o.name === "reason");
        const daysOpt = options?.find((o: any) => o.name === "days");
        
        const reason = reasonOpt ? reasonOpt.value : "ลากิจ";
        const days = daysOpt ? parseInt(daysOpt.value) : 1;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + days - 1);

        // Save to Database
        await prisma.leave.create({
          data: {
            memberName: member.icName || member.name,
            startDate,
            endDate,
            reason,
            status: "pending"
          }
        });

        // Reply to user
        return NextResponse.json({
          type: 4,
          data: { content: `✅ บันทึกการลาของ **${member.icName || member.name}** สำเร็จ! (เหตุผล: ${reason}, จำนวน ${days} วัน)` }
        });
      }
    }

    // Default Fallback
    return NextResponse.json({ error: "Unknown command" }, { status: 400 });

  } catch (error) {
    console.error("Discord Interaction Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
