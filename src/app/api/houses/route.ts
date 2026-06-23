import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/roles";

export async function GET() {
  try {
    const data = await prisma.house.findMany({
      include: {
        members: { select: { id: true, name: true, icName: true, discordId: true, role: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/houses error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isManager(session.user.gangRole as any)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { name, headId } = await req.json();
    if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });

    const allowedNames = ["บ้าน 1", "บ้าน 2", "บ้าน 3", "บ้าน 4", "บ้าน 5"];
    if (!allowedNames.includes(name)) {
      return NextResponse.json({ success: false, error: "ไม่อนุญาตให้ใช้ชื่อนี้ (อนุญาตเฉพาะ บ้าน 1 - บ้าน 5 เท่านั้น)" }, { status: 400 });
    }

    const house = await prisma.house.create({
      data: { name, headId }
    });

    return NextResponse.json({ success: true, data: house }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/houses error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
