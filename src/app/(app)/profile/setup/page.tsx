"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [icName, setIcName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!icName.trim()) {
      setError("กรุณากรอกชื่อ IC ของคุณ");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icName, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        // Trigger NextAuth session update so the new icName is fetched
        await update();
        router.push("/");
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการบันทึกชื่อ IC");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-animate flex flex-col items-center justify-center p-4">
      <div className="glass-card" style={{ maxWidth: "450px", width: "100%", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎭</div>
          <h1 style={{ color: "#c9a227", fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>
            ตั้งค่าชื่อ In-Character
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
            เพื่อการเล่น Roleplay ที่สมจริง กรุณากำหนดชื่อ IC ของคุณที่ใช้ในเมือง
            ระบบจะใช้ชื่อนี้ในการบันทึกกิจกรรมทั้งหมดของแก๊งค์
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", color: "#e2e8f0", fontSize: "0.9rem", marginBottom: "8px", fontWeight: 600 }}>
              ชื่อ IC (In-Character Name)
            </label>
            <input
              type="text"
              className="sog-input"
              value={icName}
              onChange={(e) => setIcName(e.target.value)}
              placeholder="เช่น Somchai Jaidee"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#e2e8f0", fontSize: "0.9rem", marginBottom: "8px", fontWeight: 600 }}>
              เบอร์โทรศัพท์ในเมือง (In-Game Phone)
            </label>
            <input
              type="text"
              className="sog-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="เช่น 123456"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-gold"
            style={{ width: "100%", padding: "14px", marginTop: "10px", fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "ยืนยันและเข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
