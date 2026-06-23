import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || new Date().getMonth().toString()); // 0-11
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  // Define date range for the selected month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // last day of month

  try {
    // 1. Fetch all active members
    const members = await prisma.member.findMany({
      where: { status: "active" },
      select: { id: true, name: true, icName: true, role: true }
    });

    // 2. Fetch attendance in this month
    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    // 3. Fetch approved leaves overlapping this month
    const leaves = await prisma.leave.findMany({
      where: {
        status: "approved",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      }
    });

    // 4. Aggregate data per member
    const summaryMap: Record<string, any> = {};

    // Initialize map
    members.forEach(m => {
      const displayName = m.icName || m.name;
      summaryMap[displayName] = {
        name: displayName,
        role: m.role,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0,
      };
    });

    // Process attendance
    attendances.forEach(a => {
      const name = a.memberName;
      if (!summaryMap[name]) {
        summaryMap[name] = { name, role: "member", present: 0, late: 0, absent: 0, leave: 0 };
      }
      if (a.status === "present") summaryMap[name].present += 1;
      if (a.status === "late") summaryMap[name].late += 1;
      if (a.status === "absent") summaryMap[name].absent += 1;
    });

    // Process leaves
    leaves.forEach(l => {
      const name = l.memberName;
      if (!summaryMap[name]) {
        summaryMap[name] = { name, role: "member", present: 0, late: 0, absent: 0, leave: 0 };
      }
      
      // Calculate how many days of this leave fall inside the selected month
      let currentDay = new Date(l.startDate);
      if (currentDay < startDate) currentDay = new Date(startDate);
      
      let lastDay = new Date(l.endDate);
      if (lastDay > endDate) lastDay = new Date(endDate);

      // Count days (inclusive)
      const diffTime = Math.abs(lastDay.getTime() - currentDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
      
      summaryMap[name].leave += diffDays;
    });

    // Convert map to array and sort by role then name
    const data = Object.values(summaryMap).sort((a: any, b: any) => {
      if (a.role === "leader" && b.role !== "leader") return -1;
      if (a.role !== "leader" && b.role === "leader") return 1;
      if (a.role === "admin" && b.role === "member") return -1;
      if (a.role === "member" && b.role === "admin") return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
