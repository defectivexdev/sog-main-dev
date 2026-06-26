import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";

export const GET = withAuth(async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const memberName = searchParams.get("memberName");
    const status = searchParams.get("status");
    
    let whereClause: any = {};
    if (memberName) whereClause.memberName = memberName;
    if (status) whereClause.status = status;
    
    const fines = await prisma.fine.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ success: true, data: fines });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});

export const POST = withManagerAuth(async ({ req, session }) => {
  try {
    const body = await req.json();
    if (!body.memberName || !body.amount || !body.reason) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }
    
    const issuedBy = session.user.icName || session.user.name;
    
    const fine = await prisma.fine.create({
      data: {
        memberName: body.memberName,
        amount: Number(body.amount),
        reason: body.reason,
        status: "unpaid",
        issuedBy
      }
    });
    
    return NextResponse.json({ success: true, data: fine });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
});
