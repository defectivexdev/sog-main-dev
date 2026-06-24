"use client";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1c" }}>
      <div className="glass-card" style={{ padding: "40px", textAlign: "center", maxWidth: "400px" }}>
        <AlertCircle size={64} color="#f87171" style={{ margin: "0 auto 20px" }} />
        <h1 style={{ color: "#fff", fontSize: "2rem", margin: "0 0 10px", fontWeight: 800 }}>404</h1>
        <p style={{ color: "#94a3b8", marginBottom: "24px" }}>ไม่พบหน้าที่คุณต้องการเข้าถึง</p>
        <Link href="/" className="btn-gold" style={{ display: "inline-block", textDecoration: "none" }}>
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
