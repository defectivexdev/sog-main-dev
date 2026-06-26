import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const POST = withAuth(async ({ req, session }, params) => {
  try {
    const { id } = await params;
    
    // Check if user is manager
    if (!["admin", "leader", "vice_leader"].includes((session.user as any).gangRole || (session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const message = await prisma.chatMessage.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { isPinned: !message.isPinned }
    });

    return NextResponse.json({ success: true, isPinned: updated.isPinned });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
