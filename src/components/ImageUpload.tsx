"use client";
import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "อัพโหลดรูปภาพ" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      onChange(data.url);
    } else {
      setError(data.error || "อัพโหลดไม่สำเร็จ");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "6px" }}>{label}</label>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: `2px dashed ${value ? "rgba(201,162,39,0.4)" : "rgba(201,162,39,0.2)"}`,
          borderRadius: "10px",
          padding: "16px",
          cursor: "pointer",
          background: "rgba(15,22,41,0.5)",
          textAlign: "center",
          transition: "all 0.2s",
          position: "relative",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,39,0.6)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = value ? "rgba(201,162,39,0.4)" : "rgba(201,162,39,0.2)"; }}
      >
        {uploading ? (
          <div style={{ color: "#c9a227", fontSize: "0.85rem" }}>⏳ กำลังอัพโหลด...</div>
        ) : value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              width={120}
              height={80}
              style={{ objectFit: "cover", borderRadius: "6px", maxHeight: "80px", width: "auto" }}
            />
            <p style={{ color: "#64748b", fontSize: "0.75rem" }}>คลิกเพื่อเปลี่ยนรูป</p>
          </>
        ) : (
          <>
            <span style={{ fontSize: "1.8rem" }}>📷</span>
            <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>คลิกหรือลากไฟล์มาวาง</p>
            <p style={{ color: "#475569", fontSize: "0.7rem", margin: 0 }}>JPG, PNG, WEBP — สูงสุด 5MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}
