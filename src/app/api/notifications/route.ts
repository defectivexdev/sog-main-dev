import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if notification model exists on the prisma instance
    if (!prisma.notification) {
      console.warn("Notification model not available on Prisma client. Please restart dev server after running 'npx prisma generate'.");
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.discordId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    // Graceful fallback if table doesn't exist yet
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json({ notifications: [] });
    }
    console.error("Notifications API Error:", error);
    return NextResponse.json({ notifications: [] });
  }
}
