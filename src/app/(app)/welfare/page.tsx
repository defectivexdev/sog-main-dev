"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import { Pill } from "lucide-react";

interface WelfareItem { _id: string; name: string; description?: string; quantity: number; unit: string; imageUrl?: string; category: string; status: string; }

export default function WelfarePage() {
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  const [items, setItems] = useState<WelfareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", quantity: 1 });
  const [msg, setMsg] = useState("");

  const [members, setMembers] = useState<{name: string, id: string, icName?: string}[]>([]);
  const [assignModal, setAssignModal] = useState<WelfareItem | null>(null);
  const [assignForm, setAssignForm] = useState({ memberName: "", quantity: 1 });

  const refresh = () => {
    fetch("/api/welfare").then(r => r.json()).then(d => { setItems(d.data || []); setLoading(false); });
    fetch("/api/members").then(r => r.json()).then(d => setMembers(d.data || []));
  };
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/welfare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("✅ เพิ่มรายการสำเร็จ!"); setForm({ name: "", description: "", quantity: 1 }); setShowForm(false); refresh(); }
    else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 4000);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch("/api/welfare", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refresh();
  };

  const toggleStatus = async (item: WelfareItem) => {
    const newStatus = item.status === "available" ? "out_of_stock" : "available";
    await fetch("/api/welfare", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item._id || (item as any).id, status: newStatus }) });
    refresh();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    const res = await fetch("/api/welfare/assign", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ welfareItemId: assignModal._id || (assignModal as any).id, memberName: assignForm.memberName, quantity: assignForm.quantity }) 
    });
    if (res.ok) {
      setMsg(`✅ แจกจ่าย ${assignModal.name} สำเร็จ!`);
      setAssignModal(null);
      refresh();
    } else {
      setMsg("❌ เกิดข้อผิดพลาด อาจจะของไม่พอ");
    }
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div><h1 className="page-title">💊 ของสวัสดิการ</h1><p className="page-subtitle">รายการของสวัสดิการสำหรับสมาชิก</p></div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40` }}>{roleIcon} {roleLabel}</span>
          {isManager && <button className="btn-gold" onClick={() => setShowForm(!showForm)}>+ เพิ่มรายการ</button>}
        </div>
      </div>

      {msg && <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", background: msg.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: msg.startsWith("✅") ? "#34d399" : "#f87171", border: `1px solid ${msg.startsWith("✅") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>{msg}</div>}

      {isManager && showForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#c9a227", fontWeight: 700, marginBottom: "20px" }}>เพิ่มของสวัสดิการ</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>ชื่อ *</label><input className="sog-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>จำนวน</label><input type="number" className="sog-input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} min={0} /></div>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>หน่วย</label><input className="sog-input" value="ชิ้น" disabled style={{ opacity: 0.7, cursor: "not-allowed" }} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>คำอธิบาย</label><input className="sog-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-gold">บันทึก</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p style={{ color: "#64748b" }}>กำลังโหลด...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
          {items.length === 0 ? (
            <EmptyState title="ยังไม่มีสวัสดิการ" description="กดปุ่ม + เพิ่มรายการ เพื่อสร้างสวัสดิการแรกของแก๊งค์" icon={<Pill size={32} />} />
          ) : items.map(item => (
            <div key={item._id} className="stat-card" style={{ padding: "16px" }}>
              <div style={{ height: "80px", background: "rgba(201,162,39,0.06)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "12px" }}>💊</div>
              <p style={{ color: "#e2e8f0", fontWeight: 700, margin: "0 0 2px" }}>{item.name}</p>
              {item.description && <p style={{ color: "#64748b", fontSize: "0.78rem", margin: "0 0 8px" }}>{item.description}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#c9a227", fontWeight: 700 }}>{item.quantity} {item.unit}</span>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, color: item.status === "available" ? "#34d399" : "#f87171", background: item.status === "available" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${item.status === "available" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}` }}>{item.status === "available" ? "มีพร้อม" : "หมด"}</span>
              </div>
              {isManager && (
                <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
                  <button onClick={() => { setAssignModal(item); setAssignForm({ memberName: members[0]?.name || "", quantity: 1 }); }} style={{ flex: 1, minWidth: "100%", marginBottom: "6px", padding: "6px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "6px", color: "#34d399", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>
                    แจกจ่ายให้สมาชิก
                  </button>
                  <button onClick={() => toggleStatus(item)} style={{ flex: 1, padding: "6px", background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "6px", color: "#c9a227", cursor: "pointer", fontSize: "0.75rem" }}>
                    {item.status === "available" ? "ทำเครื่องหมายหมด" : "มีสินค้า"}
                  </button>
                  <button onClick={() => deleteItem(item._id || (item as any).id)} style={{ padding: "6px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#f87171", cursor: "pointer", fontSize: "0.75rem" }}>ลบ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {assignModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="glass-card" style={{ padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ color: "#c9a227", fontWeight: 700, marginBottom: "8px" }}>แจกจ่าย: {assignModal.name}</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "20px" }}>มีของในคลังทั้งหมด {assignModal.quantity} {assignModal.unit}</p>
            
            <form onSubmit={handleAssign}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#e2e8f0", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>เลือกสมาชิก</label>
                <select className="sog-input" value={assignForm.memberName} onChange={e => setAssignForm(f => ({ ...f, memberName: e.target.value }))} required>
                  <option value="" disabled>-- เลือกสมาชิก --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.icName || m.name} (@{m.name})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: "#e2e8f0", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>จำนวนที่แจก ({assignModal.unit})</label>
                <input type="number" className="sog-input" value={assignForm.quantity} onChange={e => setAssignForm(f => ({ ...f, quantity: Number(e.target.value) }))} min={1} max={assignModal.quantity} required />
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>แจกจ่ายของ</button>
                <button type="button" onClick={() => setAssignModal(null)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
