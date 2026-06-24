"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application Error Caught by Boundary:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1c", padding: "20px" }}>
      <div className="glass-card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px" }}>
        <AlertTriangle size={64} color="#fbbf24" style={{ margin: "0 auto 20px" }} />
        <h1 style={{ color: "#fff", fontSize: "1.5rem", margin: "0 0 10px", fontWeight: 800 }}>เกิดข้อผิดพลาดบางอย่าง</h1>
        <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "0.9rem" }}>
          {error.message || "ระบบทำงานขัดข้อง กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ"}
        </p>
        <button onClick={() => reset()} className="btn-gold">
          ลองใหม่อีกครั้ง (Retry)
        </button>
      </div>
    </div>
  );
}
