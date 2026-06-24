import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";

// GET: list all vehicles
export const GET = withAuth(async () => {
  try {
    const vehicles = await prisma.gangVehicle.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error: any) {
    console.error("GET /api/vehicles error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch vehicles" }, { status: 500 });
  }
});

// POST: create a new vehicle (Managers only)
export const POST = withManagerAuth(async ({ req }) => {
  try {
    const body = await req.json();
    if (!body.name || !body.plate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const vehicle = await prisma.gangVehicle.create({
      data: {
        name: body.name,
        plate: body.plate,
        quantity: parseInt(body.quantity) || 1,
        assignedTo: body.assignedTo || null,
        status: body.assignedTo ? "in_use" : "available",
      }
    });

    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/vehicles error:", error);
    return NextResponse.json({ success: false, error: "Failed to create vehicle" }, { status: 500 });
  }
});

// PATCH: update vehicle (Managers only)
export const PATCH = withManagerAuth(async ({ req }) => {
  try {
    const { id, ...updateData } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Vehicle ID is required" }, { status: 400 });

    // Automatically update status based on assignedTo if provided
    if (updateData.assignedTo !== undefined) {
      updateData.status = updateData.assignedTo ? "in_use" : "available";
    }

    if (updateData.quantity) {
      updateData.quantity = parseInt(updateData.quantity);
    }

    const vehicle = await prisma.gangVehicle.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error: any) {
    console.error("PATCH /api/vehicles error:", error);
    return NextResponse.json({ success: false, error: "Failed to update vehicle" }, { status: 500 });
  }
});

// DELETE: delete vehicle (Managers only)
export const DELETE = withManagerAuth(async ({ req }) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Vehicle ID is required" }, { status: 400 });

    await prisma.gangVehicle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("DELETE /api/vehicles error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete vehicle" }, { status: 500 });
  }
});
