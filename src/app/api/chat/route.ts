import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async ({ req }) => {
  try {
    // Lazy delete messages older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // We don't need to await this if we don't want to block the response, but doing it async is fine.
    // To avoid blocking the GET request completely, we just fire and forget, or await.
    // But since Vercel Serverless might kill it if not awaited, we await it.
    await prisma.chatMessage.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo }, isPinned: false }
    });

    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    // We return descending so we can just reverse it in the frontend or DB level, 
    // but typically we want the latest 100.
    return NextResponse.json({ success: true, data: messages.reverse() });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req, session }) => {
  try {
    const body = await req.json();
    
    if (!body.content && !body.imageUrl && !body.linkUrl) {
      return NextResponse.json({ success: false, error: "Message cannot be empty" }, { status: 400 });
    }
    
    const senderName = session.user.icName || session.user.name;
    const senderAvatar = session.user.image || null;

    const message = await prisma.chatMessage.create({
      data: {
        senderName,
        senderAvatar,
        content: body.content,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl
      }
    });
    
    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
