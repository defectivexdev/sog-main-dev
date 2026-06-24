import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Since we need bot token to check all members (not just the logged in user's token)
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.SOG_GUILD_ID;

export async function GET(req: Request) {
  try {
    // Basic authorization for cron endpoint (using a secret token)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, allow bypass if needed, but strict in prod
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "Missing DISCORD_BOT_TOKEN" }, { status: 500 });
    }

    // 1. Get all active members from DB
    const activeMembers = await prisma.member.findMany({
      where: {
        status: { notIn: ["left"] },
        discordId: { not: null }
      }
    });

    let leftCount = 0;
    const leftMembers = [];

    // 2. Check each member against Discord Guild
    // Note: In a massive guild, it's better to fetch all guild members once and diff.
    // For smaller guilds, checking individually or in batches is okay.
    // To avoid rate limits, we'll process in small batches or with delays.
    for (const member of activeMembers) {
      if (!member.discordId) continue;

      try {
        const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${member.discordId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          next: { revalidate: 0 } // Don't cache this request
        });

        if (res.status === 404) {
          // Member left the server
          await prisma.member.update({
            where: { id: member.id },
            data: { 
              status: "left",
              leftAt: new Date()
            }
          });
          leftCount++;
          leftMembers.push(member.name);
          
          // Add to audit log
          await prisma.auditLog.create({
            data: {
              action: "AUTO_ARCHIVE_MEMBER",
              targetId: member.id,
              actorName: "System (Auto-Sync)",
              actorRole: "system",
              details: `Member left Discord server. Auto-archived.`
            }
          });
        }
        
        // Wait a small amount to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`Error checking discord member ${member.discordId}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync complete. ${leftCount} members archived.`,
      archivedMembers: leftMembers
    });

  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
