import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveGangRole, isManager } from "@/lib/roles";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.discordId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { welfareItemId, memberName, quantity } = await req.json();

    if (!welfareItemId || !memberName || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Use transaction to ensure both operations succeed
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.welfareItem.findUnique({ where: { id: welfareItemId } });
      if (!item) throw new Error("Item not found");
      
      if (item.quantity < quantity) {
        throw new Error("Not enough quantity in stock");
      }

      // 1. Deduct quantity from welfare item
      const updatedItem = await tx.welfareItem.update({
        where: { id: welfareItemId },
        data: { 
          quantity: item.quantity - quantity,
          status: (item.quantity - quantity) === 0 ? "out_of_stock" : item.status
        }
      });

      // 2. Create requisition record
      const reqRecord = await tx.requisition.create({
        data: {
          memberName,
          itemName: item.name,
          quantity,
          unit: "ชิ้น",
          reason: "จ่ายสวัสดิการโดยผู้จัดการ",
          status: "delivered",
          approvedBy: session.user.discordId
        }
      });

      return { updatedItem, reqRecord };
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
