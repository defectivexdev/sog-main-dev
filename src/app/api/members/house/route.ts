import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/roles";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isManager(session.user.gangRole as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { memberId, houseId } = await req.json();

    const member = await prisma.member.update({
      where: { id: memberId },
      data: { houseId }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("PUT /api/members/house error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
