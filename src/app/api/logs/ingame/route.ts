import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Basic API Key protection (Configure API_KEY in FiveM and Vercel)
    const apiKey = req.headers.get("x-api-key");
    const validKey = process.env.INGAME_SYNC_KEY || "SOG_SECRET_123";

    if (apiKey !== validKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.action || !body.actorName || !body.details) {
      return NextResponse.json({ success: false, error: "Missing required fields: action, actorName, details" }, { status: 400 });
    }

    // Insert into AuditLog
    await prisma.auditLog.create({
      data: {
        action: body.action,
        details: body.details,
        actorName: body.actorName,
        actorRole: body.actorRole || "FiveM Server",
        targetId: body.targetId || null,
      }
    });

    return NextResponse.json({ success: true, message: "Log inserted successfully" });

  } catch (error: any) {
    console.error("POST /api/logs/ingame error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
