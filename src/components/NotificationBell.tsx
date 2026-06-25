"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationBell() {
  const { data, mutate } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 }); // Refresh every 30s
  const [isOpen, setIsOpen] = useState(false);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    mutate({ notifications: notifications.map((n: any) => n.id === id ? { ...n, isRead: true } : n) }, false);
    
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
          borderRadius: "50%", width: "40px", height: "40px", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          color: "#e2e8f0", cursor: "pointer", position: "relative"
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ 
              position: "absolute", top: "-4px", right: "-4px", 
              background: "#ef4444", color: "white", fontSize: "0.75rem", fontWeight: "bold",
              width: "22px", height: "22px", borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #0f1629", // Matches sidebar/navbar background
              boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              style={{ position: "fixed", inset: 0, zIndex: 40 }} 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.95 }}
              animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.95 }}
              style={{ 
                position: "fixed", top: "50%", left: "50%", 
                width: "90%", maxWidth: "360px", 
                background: "rgba(15, 23, 42, 0.98)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", 
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 60, overflow: "hidden"
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1rem", fontWeight: 700 }}>การแจ้งเตือน</h3>
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "30px 16px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                    ไม่มีการแจ้งเตือน
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <motion.div 
                      key={n.id} 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      style={{ 
                        padding: "14px", borderRadius: "12px", marginBottom: "10px",
                        background: n.isRead ? "rgba(255,255,255,0.03)" : "rgba(201, 162, 39, 0.1)",
                        border: n.isRead ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(201, 162, 39, 0.3)",
                        cursor: n.isRead ? "default" : "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ color: n.isRead ? "#cbd5e1" : "#f8fafc", fontSize: "0.9rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                          {n.title}
                        </span>
                        {!n.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", flexShrink: 0, marginTop: "6px", boxShadow: "0 0 8px #ef4444" }} />}
                      </div>
                      <p style={{ margin: 0, color: n.isRead ? "#64748b" : "#94a3b8", fontSize: "0.8rem", lineHeight: "1.5" }}>{n.message}</p>
                      <span style={{ display: "block", marginTop: "10px", color: "#475569", fontSize: "0.7rem", fontWeight: 600 }}>
                        {new Date(n.createdAt).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
