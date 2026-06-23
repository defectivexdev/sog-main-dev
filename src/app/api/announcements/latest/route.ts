import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const latestAnnouncement = await prisma.announcement.findFirst({
      orderBy: { createdAt: "desc" }
    });

    if (!latestAnnouncement) {
      return NextResponse.json({ announcement: null });
    }

    return NextResponse.json({ announcement: latestAnnouncement });
  } catch (error) {
    console.error("Announcements API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
