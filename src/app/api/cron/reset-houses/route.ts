import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    // Vercel Cron sends a Bearer token that matches CRON_SECRET
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Validate if it is an authorized cron request (only if CRON_SECRET is set in env)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    console.log("[Cron] Resetting all houses...");

    // 1. Remove all members from houses
    await prisma.member.updateMany({
      data: { houseId: null }
    });

    // 2. Delete all houses completely
    await prisma.house.deleteMany({});

    return NextResponse.json({ success: true, message: "Houses have been reset successfully" });
  } catch (error: any) {
    console.error("[Cron] Error resetting houses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
