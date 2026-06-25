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

      if (name === "deposit") {
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
        const amountOpt = options?.find((o: any) => o.name === "amount");
        const slipUrlOpt = options?.find((o: any) => o.name === "slip_url");
        
        const amount = amountOpt ? parseFloat(amountOpt.value) : 0;
        const slipUrl = slipUrlOpt ? slipUrlOpt.value : null;

        if (amount <= 0) {
          return NextResponse.json({
            type: 4,
            data: { content: "จำนวนเงินต้องมากกว่า 0" }
          });
        }

        // Save to Database
        await prisma.payment.create({
          data: {
            memberName: member.icName || member.name,
            amount,
            type: "income",
            status: "confirmed",
            description: "ฝากเงินเข้าแก๊งค์ผ่าน Discord",
            imageUrl: slipUrl,
            date: new Date()
          }
        });

        // Reply to user
        return NextResponse.json({
          type: 4,
          data: { content: `💰 บันทึกการฝากเงินของ **${member.icName || member.name}** สำเร็จ! (จำนวน: ฿${amount.toLocaleString()})` }
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
