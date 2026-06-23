"use client";
import { motion } from "framer-motion";
import { ClipboardList, ShoppingCart, DollarSign, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";

export type ActivityItem = {
  id: string;
  type: "leave" | "requisition" | "payment_income" | "payment_expense";
  title: string;
  user: string;
  timestamp: Date;
  status: string;
  amount?: number;
};

interface FeedProps {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: FeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "leave": return <ClipboardList size={16} color="#c9a227" />;
      case "requisition": return <ShoppingCart size={16} color="#8b5cf6" />;
      case "payment_income": return <ArrowDownLeft size={16} color="#34d399" />;
      case "payment_expense": return <ArrowUpRight size={16} color="#f87171" />;
      default: return <Clock size={16} color="#64748b" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "leave": return "rgba(201,162,39,0.15)";
      case "requisition": return "rgba(139,92,246,0.15)";
      case "payment_income": return "rgba(52,211,153,0.15)";
      case "payment_expense": return "rgba(248,113,113,0.15)";
      default: return "rgba(255,255,255,0.05)";
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ชั่วโมงที่แล้ว";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
    return "เมื่อกี้";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.3 }}
      className="glass-card" 
      style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
    >
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
        <h3 style={{ color: "#c9a227", fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>⚡ ความเคลื่อนไหวล่าสุด</h3>
        <span style={{ fontSize: "0.75rem", color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "10px" }}>Live</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 1 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "40px 0" }}>ไม่มีความเคลื่อนไหวล่าสุด</div>
        ) : (
          items.map((item: any, i: any) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.05) }}
              style={{ 
                display: "flex", gap: "12px", alignItems: "center", 
                padding: "12px", background: "rgba(15,22,41,0.4)", 
                borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" 
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: getBgColor(item.type), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ color: "#c9a227" }}>{item.user}</span> {item.title}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{timeAgo(item.timestamp)}</span>
                  {item.amount && (
                    <span style={{ color: item.type === "payment_income" ? "#34d399" : "#f87171", fontWeight: 700, fontSize: "0.8rem" }}>
                      {item.type === "payment_income" ? "+" : "-"}฿{item.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
