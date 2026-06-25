import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "@/lib/apiAuth";

export const POST = withAuth(async ({ req }) => {
  try {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    
    // Basic file validation
    if (!file.type.startsWith("image/") && !file.type.startsWith("application/pdf")) {
      return NextResponse.json({ success: false, error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 15MB)" }, { status: 400 });
    }

    // Upload to Discord Channel (using Payment channel or a general one)
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    if (!BOT_TOKEN) {
      throw new Error("Discord Bot Token is not configured");
    }

    const discordFormData = new FormData();
    discordFormData.append('payload_json', JSON.stringify({ content: 'Slip Uploaded via Web' }));
    discordFormData.append('files[0]', file, file.name);

    // Using the payment channel ID
    const CHANNEL_ID = "1458476344898883646";
    const res = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`
      },
      body: discordFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Discord upload failed:", errText);
      throw new Error(`Discord upload failed: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.attachments || json.attachments.length === 0) {
      throw new Error("No attachment returned from Discord");
    }

    const url = json.attachments[0].url;

    // Return the public URL
    return NextResponse.json({ success: true, url: url });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error", details: error.message }, { status: 500 });
  }
});
