"use client";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title = "ยังไม่มีข้อมูล", description = "ยังไม่มีรายการในหมวดหมู่นี้", icon }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.1)",
        borderRadius: "16px",
        gridColumn: "1/-1",
        textAlign: "center"
      }}
    >
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "rgba(201,162,39,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "16px",
        color: "#c9a227"
      }}>
        {icon || <FolderOpen size={32} />}
      </div>
      <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0, maxWidth: "300px" }}>{description}</p>
    </motion.div>
  );
}
