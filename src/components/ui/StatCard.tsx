"use client";

import { motion } from "framer-motion";
import NumberTicker from "./NumberTicker";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

export default function StatCard({ label, value, icon, color, delay = 0 }: StatCardProps) {
  const numericValue = typeof value === "string" ? parseInt(value.replace(/[^0-9]/g, ""), 10) : value;
  const prefix = typeof value === "string" && value.startsWith("฿") ? "฿" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="glass-card group"
      style={{
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "110px",
        border: `1px solid ${color}30`,
        background: `linear-gradient(135deg, rgba(15,22,41,0.8) 0%, rgba(15,22,41,0.4) 100%)`
      }}
    >
      {/* Background Glow */}
      <div style={{
        position: "absolute",
        top: "-50%",
        right: "-20%",
        width: "150px",
        height: "150px",
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        borderRadius: "50%",
        pointerEvents: "none",
        transition: "all 0.4s ease",
      }} className="group-hover:scale-150 group-hover:opacity-80 opacity-50" />
      
      {/* Top bar (Icon + Label) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", position: "relative", zIndex: 1 }}>
        <span style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: 600, letterSpacing: "0.02em" }}>
          {label}
        </span>
        <div style={{ 
          color, 
          padding: "8px", 
          background: `${color}15`, 
          borderRadius: "12px",
          boxShadow: `0 0 15px ${color}30, inset 0 0 8px ${color}10`,
          border: `1px solid ${color}20`
        }}>
          {icon}
        </div>
      </div>
      
      {/* Value */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "baseline", gap: "4px" }}>
        {prefix && <span style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 800 }}>{prefix}</span>}
        <span style={{ 
          color: "#fff", 
          fontSize: "2rem", 
          fontWeight: 800, 
          textShadow: `0 0 20px ${color}40`
        }}>
          {isNaN(numericValue as number) ? (
            value
          ) : (
            <NumberTicker value={numericValue as number} delay={delay} />
          )}
        </span>
      </div>
    </motion.div>
  );
}
