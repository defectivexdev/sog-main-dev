import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const possibleNames = [member.name];
    if (member.icName && member.icName !== member.name) {
      possibleNames.push(member.icName);
    }
    const whereClause = { memberName: { in: possibleNames } };

    const [attendances, leaves, payments, requisitions] = await Promise.all([
      prisma.attendance.count({ where: whereClause }),
      prisma.leave.count({ where: { ...whereClause, status: "approved" } }),
      prisma.payment.aggregate({ 
        where: { ...whereClause, type: "income", status: "confirmed" },
        _sum: { amount: true }
      }),
      prisma.requisition.count({ where: { ...whereClause, status: "delivered" } })
    ]);

    // Fetch latest 3 activities for history
    const recentHistoryRaw = await Promise.all([
      prisma.leave.findMany({ where: whereClause, take: 3, orderBy: { createdAt: 'desc' } }),
      prisma.payment.findMany({ where: whereClause, take: 3, orderBy: { createdAt: 'desc' } }),
      prisma.requisition.findMany({ where: whereClause, take: 3, orderBy: { createdAt: 'desc' } })
    ]);

    let history: any[] = [];
    recentHistoryRaw[0].forEach((l: any) => history.push({ type: "leave", title: `ลางาน: ${l.reason}`, date: l.createdAt, status: l.status }));
    recentHistoryRaw[1].forEach((p: any) => history.push({ type: "payment", title: `ส่งเงิน: ฿${p.amount}`, date: p.createdAt, status: p.status }));
    recentHistoryRaw[2].forEach((r: any) => history.push({ type: "requisition", title: `เบิก: ${r.itemName}`, date: r.createdAt, status: r.status }));

    history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    history = history.slice(0, 5);

    return NextResponse.json({
      data: {
        member,
        stats: {
          attendanceCount: attendances,
          leaveCount: leaves,
          totalDonated: payments._sum.amount || 0,
          requisitionsCount: requisitions
        },
        history
      }
    });
  } catch (error) {
    console.error("Member Profile Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
