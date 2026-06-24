import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";

export const GET = withAuth(async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");
    const page = parseInt(searchParams.get("page") || "1");

    const [data, total] = await Promise.all([
      prisma.storeItem.findMany({ 
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.storeItem.count()
    ]);

    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/store error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
});

export const POST = withManagerAuth(async ({ req, session, discordId }) => {
  try {
    const body = await req.json();
    if (!body.imageUrl) return NextResponse.json({ success: false, error: "Image URL is required" }, { status: 400 });

    const member = await prisma.member.findUnique({ where: { discordId: discordId } });
    const uploaderName = member ? (member.icName || member.name) : (session.user.name || "Unknown");

    const item = await prisma.storeItem.create({ 
      data: {
        image: body.imageUrl,
        uploadedBy: uploaderName
      } 
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/store error:", error);
    return NextResponse.json({ success: false, error: "Failed to create store item", details: error.message }, { status: 500 });
  }
});

export const PATCH = withManagerAuth(async ({ req }) => {
  try {
    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });

    const item = await prisma.storeItem.update({ where: { id: id }, data: update });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("PATCH /api/store error:", error);
    return NextResponse.json({ success: false, error: "Failed to update store item", details: error.message }, { status: 500 });
  }
});

export const DELETE = withManagerAuth(async ({ req }) => {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });

    await prisma.storeItem.delete({ where: { id: id } });
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("DELETE /api/store error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete store item", details: error.message }, { status: 500 });
  }
});
