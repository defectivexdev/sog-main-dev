"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { Megaphone, Pin, Trash2, Plus, Clock, FileText } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  isPinned: boolean;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { isManager, roleColor } = useRole();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", isPinned: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await fetch("/api/announcements");
    const data = await res.json();
    if (data.data) setAnnouncements(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ title: "", content: "", isPinned: false });
      setIsCreating(false);
      fetchAnnouncements();
      toast.success("โพสต์ประกาศสำเร็จแล้ว! 📢");
    } else {
      toast.error("เกิดข้อผิดพลาด ไม่สามารถโพสต์ประกาศได้");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าจะลบประกาศนี้?")) return;
    const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("ลบประกาศเรียบร้อยแล้ว");
      fetchAnnouncements();
    } else {
      toast.error("ลบประกาศไม่สำเร็จ");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Megaphone size={32} color="#c9a227" /> บอร์ดประกาศข่าวสาร
          </h1>
          <p className="page-subtitle">ประกาศและกฎระเบียบของแก๊งค์ SOG</p>
        </div>
        {isManager && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsCreating(!isCreating)} style={{ padding: "10px 20px", borderRadius: "12px", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#c9a227", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            {isCreating ? "ยกเลิก" : <><Plus size={18} /> สร้างประกาศ</>}
          </motion.button>
        )}
      </div>

      {/* Create Form (Managers Only) */}
      <AnimatePresence>
        {isCreating && isManager && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: "24px" }}>
            <div className="glass-card" style={{ padding: "24px", border: "1px solid rgba(201,162,39,0.3)" }}>
              <h3 style={{ color: "#c9a227", margin: "0 0 16px", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} /> สร้างประกาศใหม่</h3>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>หัวข้อประกาศ *</label>
                  <input type="text" className="sog-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="เช่น นัดประชุมแก๊งค์วันศุกร์นี้" />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>เนื้อหาประกาศ *</label>
                  <textarea className="sog-input" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required placeholder="รายละเอียด..." style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={e => setForm({...form, isPinned: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                  <label htmlFor="isPinned" style={{ color: "#e2e8f0", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Pin size={16} color="#c9a227" /> ปักหมุดประกาศนี้
                  </label>
                </div>
                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-gold" style={{ padding: "12px", marginTop: "8px" }}>
                  {submitting ? "กำลังบันทึก..." : "โพสต์ประกาศ"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>
        ) : announcements.length === 0 ? (
          <div className="glass-card" style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>ยังไม่มีประกาศจากผู้ดูแลแก๊งค์</div>
        ) : (
          announcements.map((ann, i) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: "24px", position: "relative", borderLeft: ann.isPinned ? "4px solid #c9a227" : "1px solid rgba(255,255,255,0.05)" }}>
              {ann.isPinned && (
                <div style={{ position: "absolute", top: "24px", right: "24px", color: "#c9a227" }} title="ปักหมุด">
                  <Pin size={20} fill="currentColor" />
                </div>
              )}
              
              {isManager && !ann.isPinned && (
                <button onClick={() => handleDelete(ann.id)} style={{ position: "absolute", top: "24px", right: "24px", background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "4px" }} title="ลบประกาศ">
                  <Trash2 size={18} />
                </button>
              )}
              {isManager && ann.isPinned && (
                 <button onClick={() => handleDelete(ann.id)} style={{ position: "absolute", top: "24px", right: "54px", background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "4px" }} title="ลบประกาศ">
                 <Trash2 size={18} />
               </button>
              )}

              <h2 style={{ color: "#e2e8f0", fontSize: "1.3rem", fontWeight: 800, margin: "0 0 8px", paddingRight: "60px" }}>{ann.title}</h2>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px", color: "#64748b", fontSize: "0.85rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={14} /> {new Date(ann.createdAt).toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: roleColor }}>โดย: {ann.author}</span>
              </div>
              <div style={{ color: "#94a3b8", lineHeight: 1.6, fontSize: "0.95rem", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "10px" }}>
                {ann.content}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
