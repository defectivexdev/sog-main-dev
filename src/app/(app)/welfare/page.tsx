"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import { Pill } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RoleBadge from "@/components/ui/RoleBadge";
import Toast from "@/components/ui/Toast";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/hooks/useToast";

interface WelfareItem { _id: string; name: string; description?: string; quantity: number; unit: string; imageUrl?: string; category: string; status: string; }

export default function WelfarePage() {
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  const [items, setItems] = useState<WelfareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", quantity: 1 });
  const { message, showSuccess, showError } = useToast();

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
    if (res.ok) { showSuccess("เพิ่มรายการสำเร็จ!"); setForm({ name: "", description: "", quantity: 1 }); setShowForm(false); refresh(); }
    else showError("เกิดข้อผิดพลาด");
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
      showSuccess(`แจกจ่าย ${assignModal.name} สำเร็จ!`);
      setAssignModal(null);
      refresh();
    } else {
      showError("เกิดข้อผิดพลาด อาจจะของไม่พอ");
    }
  };

  return (
    <div>
      <Toast message={message} />
      <PageHeader
        icon={Pill}
        title="ของสวัสดิการ"
        subtitle="รายการของสวัสดิการสำหรับสมาชิก"
        roleBadge={<RoleBadge icon={roleIcon} label={roleLabel} color={roleColor} />}
        actions={
          isManager && <button className="btn-gold" onClick={() => setShowForm(!showForm)}>+ เพิ่มรายการ</button>
        }
      />

      {isManager && showForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#c9a227", fontWeight: 700, marginBottom: "20px" }}>เพิ่มของสวัสดิการ</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <FormField label="ชื่อ *" required><input className="sog-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></FormField>
              <FormField label="จำนวน"><input type="number" className="sog-input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} min={0} /></FormField>
              <FormField label="หน่วย"><input className="sog-input" value="ชิ้น" disabled style={{ opacity: 0.7, cursor: "not-allowed" }} /></FormField>
              <div style={{ gridColumn: "1/-1" }}><FormField label="คำอธิบาย"><input className="sog-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField></div>
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
          ) : items.map((item: any) => (
            <div key={item._id} className="stat-card" style={{ padding: "16px" }}>
              <div style={{ height: "80px", background: "rgba(201,162,39,0.06)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "12px" }}>💊</div>
              <p style={{ color: "#e2e8f0", fontWeight: 700, margin: "0 0 2px" }}>{item.name}</p>
              {item.description && <p style={{ color: "#64748b", fontSize: "0.78rem", margin: "0 0 8px" }}>{item.description}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#c9a227", fontWeight: 700 }}>{item.quantity} {item.unit}</span>
                <StatusBadge status={item.status} size="sm" />
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

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`แจกจ่าย: ${assignModal?.name}`} maxWidth="400px">
        {assignModal && (
          <>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "-10px 0 20px" }}>มีของในคลังทั้งหมด {assignModal.quantity} {assignModal.unit}</p>
            
            <form onSubmit={handleAssign}>
              <FormField label="เลือกสมาชิก" required>
                <select className="sog-input" value={assignForm.memberName} onChange={e => setAssignForm(f => ({ ...f, memberName: e.target.value }))} required>
                  <option value="" disabled>-- เลือกสมาชิก --</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.name}>{m.icName || m.name} (@{m.name})</option>
                  ))}
                </select>
              </FormField>
              <FormField label={`จำนวนที่แจก (${assignModal.unit})`} required>
                <input type="number" className="sog-input" value={assignForm.quantity} onChange={e => setAssignForm(f => ({ ...f, quantity: Number(e.target.value) }))} min={1} max={assignModal.quantity} required />
              </FormField>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button type="submit" className="btn-gold" style={{ flex: 1 }}>แจกจ่ายของ</button>
                <button type="button" onClick={() => setAssignModal(null)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>ยกเลิก</button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
