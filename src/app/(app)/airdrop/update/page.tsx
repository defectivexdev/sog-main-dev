"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";

interface AirdropItem { name: string; quantity: number; unit: string; description?: string; imageUrl?: string; }
interface AirdropSession { _id: string; sessionName: string; date: string; items: AirdropItem[]; status: string; checkedMembers: string[]; }

const emptyItem = (): AirdropItem => ({ name: "", quantity: 1, unit: "ชิ้น", description: "", imageUrl: "" });

export default function AirdropUpdatePage() {
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  const [sessions, setSessions] = useState<AirdropSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sessionName: "", date: "", items: [emptyItem()] });
  const [msg, setMsg] = useState("");

  const refresh = () => fetch("/api/airdrop").then(r => r.json()).then(d => { setSessions(d.data || []); setLoading(false); });
  useEffect(() => { refresh(); }, []);



  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const updateItem = (i: number, field: keyof AirdropItem, val: string | number) =>
    setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/airdrop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("✅ สร้างรอบแอร์ดรอปสำเร็จ!"); setForm({ sessionName: "", date: "", items: [emptyItem()] }); setShowForm(false); refresh(); }
    else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 4000);
  };

  const deleteSession = async (id: string) => {
    if (!confirm("ลบรอบนี้?")) return;
    await fetch("/api/airdrop", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">📦 อัพเดตของ แอร์ดรอป / ลูป</h1>
          <p className="page-subtitle">จัดการรอบและรายการของรางวัล แอร์ดรอป / ลูป</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40` }}>{roleIcon} {roleLabel}</span>
          <button className="btn-gold" onClick={() => setShowForm(!showForm)}>+ สร้างรอบใหม่</button>
        </div>
      </div>

      {msg && <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", background: msg.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: msg.startsWith("✅") ? "#34d399" : "#f87171", border: `1px solid ${msg.startsWith("✅") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>{msg}</div>}

      {showForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#c9a227", fontWeight: 700, marginBottom: "20px" }}>สร้างรอบใหม่ (แอร์ดรอป / ลูป)</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>ชื่อรอบ *</label><input className="sog-input" value={form.sessionName} onChange={e => setForm(f => ({ ...f, sessionName: e.target.value }))} required placeholder="เช่น แอร์ดรอป 15:00 หรือ ลูปกัญชา" /></div>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>วันที่ *</label><input type="date" className="sog-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ color: "#94a3b8", fontSize: "0.8rem" }}>รายการของ</label>
                <button type="button" onClick={addItem} style={{ padding: "5px 12px", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "6px", color: "#c9a227", cursor: "pointer", fontSize: "0.8rem" }}>+ เพิ่มรายการ</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ padding: "16px", background: "rgba(15,22,41,0.5)", borderRadius: "10px", border: "1px solid rgba(201,162,39,0.1)", marginBottom: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", marginBottom: "10px", alignItems: "end" }}>
                    <div><label style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>ชื่อของ</label><input className="sog-input" value={item.name} onChange={e => updateItem(i, "name", e.target.value)} placeholder="ชื่อของ" required /></div>
                    <div><label style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>จำนวน</label><input type="number" className="sog-input" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} min={1} /></div>
                    <div><label style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>หน่วย</label><input className="sog-input" value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} placeholder="ชิ้น/กล่อง" /></div>
                    <button type="button" onClick={() => removeItem(i)} style={{ padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", cursor: "pointer", alignSelf: "end" }}>✕</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div><label style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>รายละเอียด</label><input className="sog-input" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="คำอธิบาย (ถ้ามี)" /></div>
                    <ImageUpload value={item.imageUrl} onChange={url => updateItem(i, "imageUrl", url)} label="รูปภาพของ" />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-gold">สร้างรอบใหม่</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions list */}
      {loading ? <p style={{ color: "#64748b" }}>กำลังโหลด...</p> : sessions.map(s => (
        <div key={s._id} className="glass-card" style={{ padding: "20px 24px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ color: "#e2e8f0", fontWeight: 700, margin: 0 }}>{s.sessionName}</h3>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 0" }}>{new Date(s.date).toLocaleDateString("th-TH")} • {s.items.length} รายการ • เช็คชื่อ {s.checkedMembers.length} คน</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, color: s.status === "open" ? "#34d399" : "#64748b", background: s.status === "open" ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.1)", border: `1px solid ${s.status === "open" ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}` }}>
                {s.status === "open" ? "🟢 เปิดอยู่" : "🔴 ปิดแล้ว"}
              </span>
              {isManager && (
                <button onClick={() => deleteSession(s._id)} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#f87171", cursor: "pointer", fontSize: "0.8rem" }}>ลบ</button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            {s.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "rgba(201,162,39,0.08)", borderRadius: "20px", border: "1px solid rgba(201,162,39,0.15)" }}>
                {item.imageUrl && <Image src={item.imageUrl} alt={item.name} width={18} height={18} style={{ borderRadius: "3px", objectFit: "cover" }} />}
                <span style={{ color: "#c9a227", fontSize: "0.78rem" }}>{item.name} ({item.quantity} {item.unit})</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
