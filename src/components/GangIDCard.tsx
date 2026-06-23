"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Download, ShieldCheck, Phone, User } from "lucide-react";
import * as htmlToImage from "html-to-image";
import Image from "next/image";

export default function GangIDCard({ user }: { user: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    try {
      // Small delay to ensure any fonts/images are loaded (though next/image might be tricky, we assume it's loaded)
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `SOG-ID-${user.icName || user.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      {/* 3D Container */}
      <motion.div
        style={{ perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          ref={cardRef}
          style={{
            rotateX,
            rotateY,
            width: "350px",
            height: "220px",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "16px",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(201, 162, 39, 0.15)",
            border: "1px solid rgba(201, 162, 39, 0.3)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Card Background Glow */}
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(201,162,39,0.2) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(20px)" }} />
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 10, transform: "translateZ(30px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201, 162, 39, 0.5)" }}>
                <ShieldCheck size={24} color="#c9a227" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#c9a227", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "1px" }}>SOG GANG</h3>
                <span style={{ color: "#94a3b8", fontSize: "0.65rem", letterSpacing: "2px" }}>OFFICIAL MEMBER</span>
              </div>
            </div>
            {/* Hologram sticker effect */}
            <div style={{ width: "24px", height: "24px", background: "linear-gradient(135deg, #fbbf24, #d97706, #fbbf24)", borderRadius: "4px", opacity: 0.8, boxShadow: "0 0 10px rgba(251, 191, 36, 0.5)" }} />
          </div>

          {/* User Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", zIndex: 10, transform: "translateZ(40px)" }}>
            {user.avatar || user.image ? (
              <img 
                src={user.avatar || user.image} 
                alt="Avatar" 
                style={{ width: "64px", height: "64px", borderRadius: "12px", border: "2px solid #c9a227", objectFit: "cover" }}
                crossOrigin="anonymous" // Important for html-to-image
              />
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", border: "2px solid #c9a227", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a227" }}>
                <User size={32} />
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "1.4rem", fontWeight: 800, textTransform: "uppercase" }}>{user.icName || user.name}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "0.8rem" }}>
                  <ShieldCheck size={14} color="#34d399" /> 
                  <span style={{ color: "#34d399", fontWeight: 600 }}>{user.role === 'admin' ? 'BOSS' : user.role === 'manager' ? 'MANAGER' : 'MEMBER'}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                  <Phone size={14} /> {user.phone || "XXX-XXXX"}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div style={{ width: "100%", height: "4px", background: "linear-gradient(90deg, transparent, #c9a227, transparent)", position: "absolute", bottom: 0, left: 0 }} />
        </motion.div>
      </motion.div>

      {/* Download Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownload}
        disabled={downloading}
        style={{
          background: "linear-gradient(90deg, rgba(201, 162, 39, 0.1), rgba(201, 162, 39, 0.2))",
          border: "1px solid rgba(201, 162, 39, 0.5)",
          padding: "10px 24px",
          borderRadius: "8px",
          color: "#c9a227",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: downloading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
        }}
      >
        <Download size={18} /> {downloading ? "กำลังบันทึก..." : "ดาวน์โหลดบัตรประจำตัว"}
      </motion.button>
    </div>
  );
}
