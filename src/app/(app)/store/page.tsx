"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import { ImageIcon } from "lucide-react";

interface StoreItem { _id?: string; id?: string; image?: string; uploadedBy?: string; createdAt: string; }

export default function StorePage() {
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: "" });
  const [msg, setMsg] = useState("");

  const refresh = () => fetch("/api/store").then(r => r.json()).then(d => { setItems(d.data || []); setLoading(false); });
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/store", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("✅ อัปโหลดรูปภาพสำเร็จ!"); setForm({ imageUrl: "" }); setShowForm(false); refresh(); }
    else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 4000);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("ลบสินค้านี้?")) return;
    await fetch("/api/store", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div><h1 className="page-title">🏪 ของร้าน</h1><p className="page-subtitle">รายการสินค้าในร้านของแก๊งค์</p></div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40` }}>{roleIcon} {roleLabel}</span>
          {isManager && <button className="btn-gold" onClick={() => setShowForm(!showForm)}>+ เพิ่มสินค้า</button>}
        </div>
      </div>

      {msg && <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", background: msg.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: msg.startsWith("✅") ? "#34d399" : "#f87171", border: `1px solid ${msg.startsWith("✅") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>{msg}</div>}

      {isManager && showForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#c9a227", fontWeight: 700, marginBottom: "20px" }}>เพิ่มสินค้าใหม่</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} label="อัปโหลดรูปภาพ" />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-gold">บันทึก</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p style={{ color: "#64748b" }}>กำลังโหลด...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "16px" }}>
          {items.length === 0 ? (
            <EmptyState title="ยังไม่มีรูปภาพ" description="กดปุ่ม + เพิ่มรูปภาพ เพื่ออัปโหลดรูปแรกของแกลลอรี่" icon={<ImageIcon size={32} />} />
          ) : items.map(item => (
            <div key={item._id || item.id} className="stat-card" style={{ padding: "16px" }}>
              {item.image ? (
                <Image src={item.image} alt="Uploaded Image" width={230} height={230} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px", background: "rgba(0,0,0,0.2)" }} />
              ) : (
                <div style={{ height: "200px", background: "rgba(201,162,39,0.06)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "12px" }}>📸</div>
              )}
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", marginTop: "10px" }}>
                <p style={{ color: "#e2e8f0", fontSize: "0.85rem", margin: "0 0 4px", fontWeight: 600 }}>อัปโหลดโดย: <span style={{ color: "#c9a227" }}>{item.uploadedBy || "Unknown"}</span></p>
                <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>
                  เวลา: {new Date(item.createdAt).toLocaleDateString("th-TH")} {new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                </p>
              </div>
              {isManager && (
                <button onClick={() => deleteItem(item._id || item.id as string)} style={{ width: "100%", marginTop: "12px", padding: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#f87171", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, transition: "0.2s" }}>ลบรูปภาพ</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
