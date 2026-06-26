import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withManagerAuth } from "@/lib/apiAuth";

export const POST = withManagerAuth(async ({ req }) => {
  try {
    const body = await req.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    // Find the latest 'amount' messages
    const messagesToDelete = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: amount,
      select: { id: true }
    });

    if (messagesToDelete.length > 0) {
      const ids = messagesToDelete.map(m => m.id);
      await prisma.chatMessage.deleteMany({
        where: { id: { in: ids } }
      });
    }

    return NextResponse.json({ success: true, count: messagesToDelete.length });
  } catch (error) {
    console.error("Clear Chat Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
