import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Chart Data: 7 days of income
    const payments = await prisma.payment.findMany({
      where: {
        status: "confirmed",
        type: "income",
        date: { gte: sevenDaysAgo, lte: today }
      },
      select: { amount: true, date: true }
    });

    // Group by Date string "YYYY-MM-DD"
    const groupedData: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      // Format as "DD MMM" (e.g. "22 Jun") for UI
      const label = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
      groupedData[label] = 0;
    }

    payments.forEach((p: any) => {
      const d = new Date(p.date);
      const label = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
      if (groupedData[label] !== undefined) {
        groupedData[label] += p.amount;
      }
    });

    const chartData = Object.keys(groupedData).map(label => ({
      name: label,
      income: groupedData[label]
    }));

    // 2. Timeline Data: Recent 5 Activities
    // We'll combine recent payments and leaves to create a diverse timeline
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, memberName: true, amount: true, type: true, createdAt: true }
    });

    const recentLeaves = await prisma.leave.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, memberName: true, status: true, createdAt: true }
    });

    const timeline = [
      ...recentPayments.map((p: any) => ({
        id: `pay-${p.id}`,
        type: p.type === "income" ? "PAYMENT_IN" : "PAYMENT_OUT",
        user: p.memberName,
        desc: p.type === "income" ? `ส่งเงินเข้าคลัง ฿${p.amount}` : `ถอนเงิน ฿${p.amount}`,
        date: p.createdAt
      })),
      ...recentLeaves.map((l: any) => ({
        id: `leave-${l.id}`,
        type: "LEAVE",
        user: l.memberName,
        desc: l.status === "approved" ? "ลางาน (อนุมัติแล้ว)" : "ขอแจ้งลางาน",
        date: l.createdAt
      }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // 3. Top Donators (Last 7 Days)
    const topDonatorsRaw = await prisma.payment.groupBy({
      by: ['memberName'],
      _sum: { amount: true },
      where: { type: 'income', status: 'confirmed', date: { gte: sevenDaysAgo, lte: today } },
      orderBy: { _sum: { amount: 'desc' } },
      take: 3
    });
    const topDonators = topDonatorsRaw.map((t: any) => ({ name: t.memberName, amount: t._sum.amount || 0 }));

    // 4. Server Time (Next Airdrop/Activity)
    const upcomingActivity = await prisma.activity.findFirst({
      where: { status: 'upcoming', date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      select: { name: true, date: true }
    });

    return NextResponse.json({ chartData, timeline, topDonators, upcomingActivity });

  } catch (error) {
    console.error("Dashboard Widgets API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
