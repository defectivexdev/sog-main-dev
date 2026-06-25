import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async () => {
  try {
    const limit = 20;

    // Fetch from all relevant tables
    const [auditLogs, payments, leaves, attendance] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
      prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
      prisma.leave.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
      prisma.attendance.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
    ]);

    // Format all logs into a unified structure
    const unifiedLogs: any[] = [];

    // 1. Audit Logs
    auditLogs.forEach(log => {
      unifiedLogs.push({
        id: `audit-${log.id}`,
        timestamp: log.createdAt,
        type: "SYSTEM",
        actor: log.actorName,
        action: log.action,
        message: log.details,
        color: "#60a5fa" // Blue
      });
    });

    // 2. Payments
    payments.forEach(p => {
      unifiedLogs.push({
        id: `payment-${p.id}`,
        timestamp: p.createdAt,
        type: p.type === "income" ? "FINANCE_IN" : "FINANCE_OUT",
        actor: p.memberName,
        action: p.type === "income" ? "ฝากเงิน" : "เบิกเงิน",
        message: `จำนวน ฿${p.amount.toLocaleString()} (${p.description || "ไม่ระบุ"})`,
        color: p.type === "income" ? "#34d399" : "#f87171" // Green or Red
      });
    });

    // 3. Leaves
    leaves.forEach(l => {
      unifiedLogs.push({
        id: `leave-${l.id}`,
        timestamp: l.createdAt,
        type: "LEAVE",
        actor: l.memberName,
        action: `แจ้งลา (${l.status})`,
        message: `เหตุผล: ${l.reason}`,
        color: l.status === "approved" ? "#34d399" : l.status === "rejected" ? "#f87171" : "#fbbf24" // Yellow for pending
      });
    });

    // 4. Attendance
    attendance.forEach(a => {
      unifiedLogs.push({
        id: `att-${a.id}`,
        timestamp: a.createdAt,
        type: "ATTENDANCE",
        actor: a.memberName,
        action: "เข้าเมือง",
        message: `สถานะ: ${a.status === "present" ? "มา" : a.status === "late" ? "สาย" : "ขาด"}`,
        color: a.status === "present" ? "#34d399" : a.status === "late" ? "#fbbf24" : "#f87171"
      });
    });

    // Sort by timestamp DESC (newest first)
    unifiedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return only the top 'limit' logs
    return NextResponse.json({ success: true, logs: unifiedLogs.slice(0, limit) });

  } catch (error: any) {
    console.error("GET /api/logs/live error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});
