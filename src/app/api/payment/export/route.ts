import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      orderBy: { date: "desc" },
    });

    // Convert to CSV
    const headers = ["วันที่", "ประเภท", "ผู้ทำรายการ", "จำนวนเงิน", "สถานะ", "ผู้อนุมัติ", "หมายเหตุ"];
    
    const rows = payments.map(p => {
      const typeText = p.type === "income" ? "นำส่งเข้าคลัง" : "เบิกจากคลัง";
      const statusText = p.status === "confirmed" ? "อนุมัติแล้ว" : p.status === "rejected" ? "ปฏิเสธ" : "รอตรวจสอบ";
      const dateText = new Date(p.date).toLocaleDateString("th-TH", { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      return [
        dateText,
        typeText,
        p.memberName,
        p.amount.toString(),
        statusText,
        p.confirmedBy || "-",
        (p.description || "-").replace(/"/g, '""') // Escape quotes for CSV
      ].map(field => `"${field}"`).join(","); // Wrap fields in quotes
    });

    // Add BOM for Excel UTF-8 compatibility
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sog-payment-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
