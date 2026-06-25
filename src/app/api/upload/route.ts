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

    // Upload to catbox.moe
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", file, file.name);

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Catbox upload failed: ${res.statusText}`);
    }

    const url = await res.text();

    // Return the public URL
    return NextResponse.json({ success: true, url: url.trim() });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error", details: error.message }, { status: 500 });
  }
});
