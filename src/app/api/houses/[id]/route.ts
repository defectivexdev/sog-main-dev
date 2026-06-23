import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/roles";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !isManager(session.user.gangRole as any)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await props.params;
    const { name, headId } = await req.json();

    if (name) {
      const allowedNames = ["บ้าน 1", "บ้าน 2", "บ้าน 3", "บ้าน 4", "บ้าน 5"];
      if (!allowedNames.includes(name)) {
        return NextResponse.json({ success: false, error: "ไม่อนุญาตให้ใช้ชื่อนี้ (อนุญาตเฉพาะ บ้าน 1 - บ้าน 5 เท่านั้น)" }, { status: 400 });
      }
    }

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
    if (!session || !isManager(session.user.gangRole as any)) {
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
