import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/roles";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !isManager(session.user.gangRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;
    const { name, headId } = await req.json();

    const house = await prisma.house.update({
      where: { id },
      data: { name, headId }
    });

    return NextResponse.json({ success: true, data: house });
  } catch (error: any) {
    console.error("PUT /api/houses/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !isManager(session.user.gangRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;

    // Remove houseId from all members first
    await prisma.member.updateMany({
      where: { houseId: id },
      data: { houseId: null }
    });

    await prisma.house.delete({ where: { id } });

    return NextResponse.json({ success: true, ok: true });
  } catch (error: any) {
    console.error("DELETE /api/houses/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
