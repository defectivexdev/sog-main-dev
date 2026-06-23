"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

const LOGO_URL = "https://cdn.discordapp.com/attachments/1442213274492997693/1517461986403942470/D5DC735D-0A70-4597-9245-C3B3C5CD5D24.png?ex=6a39a9da&is=6a38585a&hm=a62cf0ade0085c4c2c8cb1ef36cff07c46cc5a7d02b9a1ffd0d2462bd6e160fc&";
export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-animate flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(88,101,242,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "2px",
            height: "2px",
            background: "#c9a227",
            borderRadius: "50%",
            top: `${15 + i * 14}%`,
            left: `${8 + i * 15}%`,
            opacity: 0.4,
            animation: `pulse ${2 + i * 0.5}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Login card */}
      <div
        className="glass-card"
        style={{
          padding: "48px 40px",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* SOG Logo */}
        <div
          style={{
            marginBottom: "28px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "110px",
              height: "110px",
              background: "rgba(201,162,39,0.08)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(201,162,39,0.2)",
              boxShadow: "0 0 30px rgba(201,162,39,0.15)",
            }}
          >
            <Image
              src={LOGO_URL}
              alt="SOG Logo"
              width={80}
              height={80}
              style={{ objectFit: "contain", filter: "brightness(1.1)", mixBlendMode: "screen" }}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="gradient-gold"
          style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}
        >
          SOG Gang
        </h1>
        <p style={{ color: "#c9a227", fontSize: "0.75rem", letterSpacing: "0.25em", marginBottom: "8px", opacity: 0.7 }}>
          SON OF GOD
        </p>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "32px" }}>
          เข้าสู่ระบบด้วยบัญชี Discord ของคุณ
        </p>

        {/* Discord login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-discord"
          style={{ width: "100%", justifyContent: "center", fontSize: "1rem" }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg
                style={{ animation: "spin 1s linear infinite", width: "20px", height: "20px" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.3} />
                <path d="M3 12a9 9 0 019-9" strokeLinecap="round" />
              </svg>
              กำลังเข้าสู่ระบบ...
            </span>
          ) : (
            <>
              {/* Discord icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.004.032.019.063.041.082a19.96 19.96 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.461-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .041-.083c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              เข้าสู่ระบบด้วย Discord
            </>
          )}
        </button>

        {/* Warning */}
        <div
          style={{
            marginTop: "24px",
            padding: "12px 16px",
            background: "rgba(201,162,39,0.06)",
            border: "1px solid rgba(201,162,39,0.15)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.6 }}>
            🔒 เฉพาะสมาชิกแก๊งค์ SOG ที่มีสิทธิ์เข้าถึงเท่านั้น
            <br />
            ต้องอยู่ใน Discord server และมีบทบาทที่กำหนด
          </p>
        </div>

        <p style={{ color: "#1e293b", fontSize: "0.72rem", marginTop: "20px" }}>
          SOG Gang © {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          from { transform: scale(1); opacity: 0.3; }
          to { transform: scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
