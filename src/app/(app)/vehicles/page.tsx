"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRole } from "@/hooks/useRole";
import { Car, Plus, Edit2, Trash2, X, Search, ShieldCheck, CheckCircle2, User, Key, XCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RoleBadge from "@/components/ui/RoleBadge";
import Toast from "@/components/ui/Toast";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/hooks/useToast";

interface GangVehicle {
  id: string;
  name: string;
  plate: string;
  quantity: number;
  assignedTo: string | null;
  status: string;
}

interface Member {
  id: string;
  name: string;
}

export default function VehiclesPage() {
  const { data: session } = useSession();
  const { isManager } = useRole();
  const { message, showSuccess, showError } = useToast();
  const [vehicles, setVehicles] = useState<GangVehicle[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<GangVehicle>>({ name: "", plate: "", quantity: 1, assignedTo: "" });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([vData, mData]) => {
      setVehicles(vData.data || []);
      setMembers(
        (mData.data || []).map((m: any) => ({
          id: m.id,
          name: m.icName || m.name,
        }))
      );
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAddModal = () => {
    setForm({ name: "", plate: "", quantity: 1, assignedTo: "" });
    setEditMode(false);
    setModalOpen(true);
  };

  const openEditModal = (v: GangVehicle) => {
    setForm({ ...v, assignedTo: v.assignedTo || "" });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const method = editMode ? "PATCH" : "POST";
    
    // Convert empty string to null for DB
    const submitData = {
      ...form,
      assignedTo: form.assignedTo === "" ? null : form.assignedTo
    };

    try {
      const res = await fetch("/api/vehicles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        showSuccess(editMode ? "อัปเดตข้อมูลรถสำเร็จ" : "เพิ่มรถใหม่สำเร็จ");
        setModalOpen(false);
        refresh();
      } else {
        const errorData = await res.json();
        showError(`ข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      showError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      const res = await fetch(`/api/vehicles?id=${vehicleToDelete}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("ลบข้อมูลรถสำเร็จ");
        setDeleteConfirmOpen(false);
        refresh();
      } else {
        showError("เกิดข้อผิดพลาดในการลบรถ");
      }
    } catch (error) {
      showError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const confirmDelete = (id: string) => {
    setVehicleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.assignedTo && v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Toast message={message} />
      <PageHeader 
        icon={Car} 
        iconColor="#c9a227"
        title="รถแก๊งค์ (Gang Vehicles)" 
        subtitle="จัดการข้อมูลรถและมอบหมายรถให้กับสมาชิกในแก๊งค์"
        actions={
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" className="sog-input" placeholder="ค้นหารถ, ป้ายทะเบียน..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: "36px", height: "40px", width: "220px" }} />
            </div>
            {isManager && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAddModal} className="btn-gold" style={{ display: "flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 20px" }}>
                <Plus size={18} /> เพิ่มรถใหม่
              </motion.button>
            )}
          </div>
        }
      />

      {/* Vehicle Grid */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>กำลังโหลดข้อมูลรถ...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="glass-card" style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
          <Car size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
          <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px", color: "#e2e8f0" }}>ไม่พบข้อมูลรถ</p>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{searchQuery ? "ลองค้นหาด้วยคำอื่นดูอีกครั้ง" : "ยังไม่มีการเพิ่มรถลงในระบบ"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          <AnimatePresence>
            {filteredVehicles.map((v) => (
              <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                
                {/* Status Indicator Top Bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: v.status === "in_use" ? "#f59e0b" : "#34d399" }}></div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "#e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Car size={18} color={v.status === "in_use" ? "#f59e0b" : "#34d399"} /> {v.name}
                    </h3>
                    <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>
                      {v.plate}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <StatusBadge status={v.status === "in_use" ? "in_use" : "available"} size="sm" />
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px" }}>จำนวน: {v.quantity} คัน</div>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", alignItems: "center", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                  <Key size={16} color="#64748b" style={{ marginRight: "10px" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "2px" }}>ผู้ครอบครอง / ผู้เบิกไปใช้</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: v.assignedTo ? "#e2e8f0" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                      {v.assignedTo ? v.assignedTo : "— ยังไม่มีผู้เบิก —"}
                    </div>
                  </div>
                </div>

                {isManager && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditModal(v)} style={{ flex: 1, padding: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                      <Edit2 size={14} /> แก้ไข
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => confirmDelete(v.id)} style={{ padding: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {editMode ? <Edit2 size={24} color="#c9a227" /> : <Plus size={24} color="#c9a227" />}
            {editMode ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่ลงในระบบ"}
          </span>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <FormField label="ชื่อรถ / รุ่นรถ *" required>
            <input type="text" className="sog-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="เช่น Nissan Skyline R34" />
          </FormField>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 2 }}>
              <FormField label="ป้ายทะเบียน *" required>
                <input type="text" className="sog-input" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} required placeholder="เช่น 1กก 1234 หรือไม่มีให้ใส่ -" />
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="จำนวนรถ *" required>
                <input type="number" min="1" className="sog-input" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} required />
              </FormField>
            </div>
          </div>

          <FormField label="มอบหมายผู้ครอบครอง (ทางเลือก)">
            <select className="sog-input" value={form.assignedTo || ""} onChange={e => setForm({...form, assignedTo: e.target.value})}>
              <option value="">— ว่าง (ยังไม่มีคนใช้) —</option>
              {members.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#64748b" }}>* หากเลือกระบุชื่อ สถานะรถจะถูกเปลี่ยนเป็น "กำลังใช้งาน" ทันที</p>
          </FormField>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "12px 24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#e2e8f0", fontWeight: 600, cursor: "pointer" }} className="hover-bg-glass">
              ยกเลิก
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} className="btn-gold" style={{ padding: "12px 24px", borderRadius: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "กำลังบันทึก..." : editMode ? "บันทึกการแก้ไข" : "เพิ่มรถ"}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="ยืนยันการลบรถ" maxWidth="400px">
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(248,113,113,0.1)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <XCircle size={32} />
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: "0 0 24px" }}>
            คุณแน่ใจหรือไม่ที่จะลบรถคันนี้ออกจากระบบ? ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={() => setDeleteConfirmOpen(false)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#e2e8f0", fontWeight: 600, cursor: "pointer" }} className="hover-bg-glass">
              ยกเลิก
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete} style={{ flex: 1, padding: "12px", background: "#f87171", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(248,113,113,0.3)" }}>
              ยืนยันการลบ
            </motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
