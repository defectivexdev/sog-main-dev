"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Check } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AnnouncementPopup() {
  const { data, error } = useSWR('/api/announcements/latest', fetcher, { refreshInterval: 60000 });
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    if (data?.announcement) {
      const lastReadId = localStorage.getItem('lastReadAnnouncementId');
      if (lastReadId !== data.announcement.id) {
        setAnnouncement(data.announcement);
        setIsOpen(true);
      }
    }
  }, [data]);

  const handleRead = () => {
    if (announcement) {
      localStorage.setItem('lastReadAnnouncementId', announcement.id);
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && announcement && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)" }}
            onClick={handleRead}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ 
              position: "relative", width: "90%", maxWidth: "500px", 
              background: "linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)", 
              border: "1px solid rgba(201, 162, 39, 0.3)", borderRadius: "16px", 
              boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(201,162,39,0.1)", overflow: "hidden",
              zIndex: 10000
            }}
          >
            {/* Header */}
            <div style={{ background: "rgba(201,162,39,0.1)", borderBottom: "1px solid rgba(201,162,39,0.2)", padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(201,162,39,0.2)", color: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Megaphone size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "1.2rem", fontWeight: 800 }}>ประกาศจากระดับบริหาร</h2>
                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{new Date(announcement.createdAt).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
              </div>
              <button onClick={handleRead} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 12px", color: "#c9a227", fontSize: "1.1rem", fontWeight: 700 }}>{announcement.title}</h3>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {announcement.content}
              </p>
              
              <div style={{ marginTop: "24px", color: "#64748b", fontSize: "0.85rem", textAlign: "right", fontStyle: "italic" }}>
                -- ลงชื่อ: {announcement.author}
              </div>
            </div>

            {/* Action */}
            <div style={{ padding: "16px 24px 24px", display: "flex", justifyContent: "center" }}>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleRead}
                style={{ 
                  background: "linear-gradient(90deg, #c9a227, #fde047)", border: "none", 
                  padding: "12px 32px", borderRadius: "30px", color: "#000", fontWeight: 800, 
                  fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                  boxShadow: "0 4px 15px rgba(201,162,39,0.3)"
                }}
              >
                <Check size={18} /> รับทราบและปิดประกาศ
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
