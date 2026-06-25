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
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "รองรับเฉพาะไฟล์รูปภาพเท่านั้น" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Upload to Imgur
    const imgurFormData = new FormData();
    imgurFormData.append("image", file);

    const res = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: "Client-ID 546c25a59c58ad7"
      },
      body: imgurFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Imgur upload failed:", errText);
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    const json = await res.json();
    if (!json.success || !json.data || !json.data.link) {
      throw new Error("Invalid response from Imgur");
    }

    // Return the public URL
    return NextResponse.json({ success: true, url: json.data.link });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error", details: error.message }, { status: 500 });
  }
});
