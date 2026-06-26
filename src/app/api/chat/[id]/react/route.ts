import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const POST = withAuth(async ({ req, session }, params) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ success: false, error: "Emoji required" }, { status: 400 });
    }

    const message = await prisma.chatMessage.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const memberName = session.user.icName || session.user.name;
    let reactions: Record<string, string[]> = message.reactions as Record<string, string[]> || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIndex = reactions[emoji].indexOf(memberName);
    if (userIndex > -1) {
      // Remove reaction
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji].push(memberName);
    }

    await prisma.chatMessage.update({
      where: { id },
      data: { reactions: reactions as any }
    });

    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
