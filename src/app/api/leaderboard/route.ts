import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // 1. Top Attendance
    const attendances = await prisma.attendance.groupBy({
      by: ['memberName'],
      _count: { memberName: true },
      orderBy: { _count: { memberName: 'desc' } },
      take: 10
    });

    const topAttendance = attendances.map(a => ({
      name: a.memberName,
      score: a._count.memberName
    }));

    // 2. Top Donators
    const payments = await prisma.payment.groupBy({
      by: ['memberName'],
      where: { type: 'income', status: 'confirmed' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    const topDonators = payments.map(p => ({
      name: p.memberName,
      score: p._sum.amount || 0
    }));

    // 3. Top Activity
    // Since participants is an array in Activity, we have to fetch and aggregate in memory
    const activities = await prisma.activity.findMany({
      where: { status: 'completed' },
      select: { participants: true }
    });

    const activityCounts: Record<string, number> = {};
    activities.forEach(act => {
      act.participants.forEach(p => {
        activityCounts[p] = (activityCounts[p] || 0) + 1;
      });
    });

    const topActivity = Object.entries(activityCounts)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      data: { topAttendance, topDonators, topActivity }
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
