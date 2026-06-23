import Link from "next/link";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-animate flex items-center justify-center">
      <div className="glass-card" style={{ padding: "48px 40px", maxWidth: "440px", width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🚫</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f87171", marginBottom: "8px" }}>
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "24px", lineHeight: 1.7 }}>
          {params.reason === "unauthorized"
            ? "บัญชี Discord ของคุณไม่ได้อยู่ใน SOG Gang server หรือไม่มีบทบาทที่ได้รับอนุญาต"
            : "คุณไม่มีสิทธิ์เข้าถึงระบบนี้"}
        </p>
        <div
          style={{
            padding: "14px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            marginBottom: "28px",
          }}
        >
          <p style={{ color: "#fca5a5", fontSize: "0.82rem", lineHeight: 1.7 }}>
            ระบบนี้เปิดให้เฉพาะสมาชิก SOG Gang ที่มีบทบาทที่กำหนดใน Discord server เท่านั้น
            <br />
            หากคิดว่านี่เป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
        <Link href="/login">
          <button className="btn-gold" style={{ width: "100%" }}>
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </Link>
      </div>
    </div>
  );
}
