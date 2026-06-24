import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

// Helper to check if user is Leader or Vice Leader
async function isLeaderOrViceLeader(session: any) {
  const { resolveGangRole } = await import("@/lib/roles");
  const role = resolveGangRole(session.user.discordId, session.user.discordRoles);
  return role === "admin" || role === "leader" || role === "vice_leader";
}

// GET: list all events
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const events = await prisma.gangEvent.findMany({
      orderBy: { startDate: "asc" }
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST: create a new event (Leader/Vice Leader only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    if (!(await isLeaderOrViceLeader(session))) {
      return NextResponse.json({ success: false, error: "Forbidden - Requires Leader or Vice Leader" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.startDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.gangEvent.create({
      data: {
        title: body.title,
        description: body.description || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        type: body.type || "event",
        createdBy: session.user.icName || session.user.name
      }
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/calendar error:", error);
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}

// DELETE: delete event (Leader/Vice Leader only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!(await isLeaderOrViceLeader(session))) {
      return NextResponse.json({ success: false, error: "Forbidden - Requires Leader or Vice Leader" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });

    await prisma.gangEvent.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/calendar error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}
