import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { discordId: session.user.discordId },
      include: { house: true }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Calculate total money sent
    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        memberName: member.icName || member.name,
        type: "income",
        status: "confirmed"
      }
    });

    // Calculate total leave days
    // We fetch all approved leaves and sum up the days between startDate and endDate
    const leaves = await prisma.leave.findMany({
      where: {
        memberName: member.icName || member.name,
        status: "approved"
      }
    });

    let totalLeaveDays = 0;
    leaves.forEach(leave => {
      const diffTime = Math.abs(new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      totalLeaveDays += diffDays;
    });

    return NextResponse.json({
      member,
      stats: {
        totalPaid: payments._sum.amount || 0,
        totalLeaveDays
      }
    });

  } catch (error: any) {
    console.error("Profile Stats API error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
