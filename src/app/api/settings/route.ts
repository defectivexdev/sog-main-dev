import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { isManager, resolveGangRole } from "@/lib/roles";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "global" }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "global", weeklyTaxAmount: 0 }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.discordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
    if (!isManager(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    
    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      update: {
        weeklyTaxAmount: data.weeklyTaxAmount,
        bankAccountNo: data.bankAccountNo,
        bankAccountName: data.bankAccountName,
        webhookPayment: data.webhookPayment,
        webhookLeave: data.webhookLeave,
        webhookAirdrop: data.webhookAirdrop
      },
      create: {
        id: "global",
        weeklyTaxAmount: data.weeklyTaxAmount || 0,
        bankAccountNo: data.bankAccountNo,
        bankAccountName: data.bankAccountName,
        webhookPayment: data.webhookPayment,
        webhookLeave: data.webhookLeave,
        webhookAirdrop: data.webhookAirdrop
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
