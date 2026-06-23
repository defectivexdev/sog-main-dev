"use client";

import GlowingCard from "./GlowingCard";

interface ActionCardProps {
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  delay: number;
}

export default function ActionCard({ label, desc, href, icon, delay }: ActionCardProps) {
  return (
    <GlowingCard href={href} delay={delay}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ 
          background: "rgba(201,162,39,0.15)", 
          width: "48px", 
          height: "48px", 
          borderRadius: "12px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: "#c9a227",
          border: "1px solid rgba(201,162,39,0.3)"
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.05rem", margin: "0 0 4px" }}>{label}</h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>{desc}</p>
        </div>
      </div>
    </GlowingCard>
  );
}
