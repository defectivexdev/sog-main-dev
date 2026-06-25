import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only logged-in users with a discordId can ping
    if (!session || !session.user || !session.user.discordId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Update their Member record with the current timestamp
    await prisma.member.update({
      where: { discordId: session.user.discordId },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/ping error:", error);
    // Silent fail so we don't spam the client console
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
