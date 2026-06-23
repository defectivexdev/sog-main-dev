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
              position: "absolute", top: "-2px", right: "-2px", 
              background: "#ef4444", color: "white", fontSize: "0.7rem", fontWeight: "bold",
              width: "18px", height: "18px", borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)"
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
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              style={{ 
                position: "fixed", bottom: "20px", left: "280px", 
                width: "320px", background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", 
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 60, overflow: "hidden",
                transformOrigin: "bottom left"
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1rem", fontWeight: 700 }}>การแจ้งเตือน</h3>
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ maxHeight: "350px", overflowY: "auto", padding: "8px" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "30px 16px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                    ไม่มีการแจ้งเตือน
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      style={{ 
                        padding: "12px", borderRadius: "8px", marginBottom: "4px",
                        background: n.isRead ? "transparent" : "rgba(201, 162, 39, 0.05)",
                        borderLeft: n.isRead ? "3px solid transparent" : "3px solid #c9a227",
                        cursor: n.isRead ? "default" : "pointer",
                        transition: "background 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <span style={{ color: n.isRead ? "#cbd5e1" : "#f8fafc", fontSize: "0.85rem", fontWeight: n.isRead ? 500 : 700 }}>{n.title}</span>
                        {!n.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />}
                      </div>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.75rem", lineHeight: "1.4" }}>{n.message}</p>
                      <span style={{ display: "block", marginTop: "6px", color: "#64748b", fontSize: "0.65rem" }}>
                        {new Date(n.createdAt).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </div>
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
