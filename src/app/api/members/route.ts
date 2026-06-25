import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth, withManagerAuth } from "@/lib/apiAuth";

async function fetchDiscordAvatar(discordId: string): Promise<string | null> {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return null;
    const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.avatar) {
      const ext = data.avatar.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${discordId}/${data.avatar}.${ext}?size=256`;
    } else if (data.id) {
      // Handle default avatar
      const defaultAvatarIndex = (BigInt(data.id) >> BigInt(22)) % BigInt(6);
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }
  } catch (e) {
    console.error("Failed to fetch discord avatar", e);
  }
  return null;
}

export const GET = withAuth(async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000"); // Default large to not break current UI
    const page = parseInt(searchParams.get("page") || "1");
    
    const [data, total] = await Promise.all([
      prisma.member.findMany({ 
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.member.count()
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error("GET /api/members error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
});

export const POST = withManagerAuth(async ({ req }) => {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

    if (body.discordId) {
      const avatarUrl = await fetchDiscordAvatar(body.discordId);
      if (avatarUrl) body.avatar = avatarUrl;
    }

    const member = await prisma.member.create({ data: body });
    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to create member", details: error.message }, { status: 500 });
  }
});

// Added sync-avatars endpoint to help sync all missing avatars
export const PUT = async (req: NextRequest) => {
  try {
    const members = await prisma.member.findMany({ 
      where: { avatar: null, discordId: { not: null } } 
    });
    let updated = 0;
    for (const m of members) {
      if (m.discordId) {
        const url = await fetchDiscordAvatar(m.discordId);
        if (url) {
          await prisma.member.update({ where: { id: m.id }, data: { avatar: url } });
          updated++;
        }
      }
    }
    return NextResponse.json({ success: true, message: `Synced ${updated} avatars` });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
};

export const PATCH = withManagerAuth(async ({ req }) => {
  try {
    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 });

    if (update.discordId) {
      const avatarUrl = await fetchDiscordAvatar(update.discordId);
      if (avatarUrl) update.avatar = avatarUrl;
    }

    const member = await prisma.member.update({ where: { id }, data: update });
    return NextResponse.json({ success: true, data: member });
  } catch (error: any) {
    console.error("PATCH /api/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to update member", details: error.message }, { status: 500 });
  }
});

export const DELETE = withManagerAuth(async ({ req }) => {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 });

    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("DELETE /api/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete member", details: error.message }, { status: 500 });
  }
});
