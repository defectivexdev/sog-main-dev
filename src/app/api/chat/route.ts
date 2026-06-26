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
    
    // Fetch replied messages
    const replyIds = messages.map(m => m.replyToId).filter(Boolean) as string[];
    let replyMap: Record<string, any> = {};
    if (replyIds.length > 0) {
      const repliedMessages = await prisma.chatMessage.findMany({
        where: { id: { in: replyIds } },
        select: { id: true, senderName: true, content: true, imageUrl: true }
      });
      repliedMessages.forEach(rm => replyMap[rm.id] = rm);
    }
    
    const messagesWithReplies = messages.map(m => ({
      ...m,
      replyToMessage: m.replyToId ? replyMap[m.replyToId] : null
    }));
    
    return NextResponse.json({ success: true, data: messagesWithReplies.reverse() });
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
        linkUrl: body.linkUrl,
        replyToId: body.replyToId || null
      }
    });
    
    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
