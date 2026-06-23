import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { icName, phone } = await req.json();

    if (!icName || typeof icName !== "string" || icName.trim() === "") {
      return NextResponse.json({ error: "Invalid IC Name" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return NextResponse.json({ error: "Invalid Phone Number" }, { status: 400 });
    }


    // Update the user's IC Name and Phone
    const member = await prisma.member.update({ 
      where: { discordId: session.user.discordId }, 
      data: { icName: icName.trim(), phone: phone.trim() } 
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found in database" }, { status: 404 });
    }

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
