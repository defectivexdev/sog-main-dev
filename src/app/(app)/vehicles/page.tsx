"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRole } from "@/hooks/useRole";
import { Car, Plus, Edit2, Trash2, X, Search, ShieldCheck, CheckCircle2, User, Key, XCircle } from "lucide-react";
import { toast } from "sonner";

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
        toast.success(editMode ? "อัปเดตข้อมูลรถสำเร็จ" : "เพิ่มรถใหม่สำเร็จ");
        setModalOpen(false);
        refresh();
      } else {
        const errorData = await res.json();
        toast.error(`ข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      const res = await fetch(`/api/vehicles?id=${vehicleToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบข้อมูลรถสำเร็จ");
        setDeleteConfirmOpen(false);
        refresh();
      } else {
        toast.error("เกิดข้อผิดพลาดในการลบรถ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Car size={32} color="#c9a227" /> รถแก๊งค์ (Gang Vehicles)
          </h1>
          <p className="page-subtitle">จัดการข้อมูลรถและมอบหมายรถให้กับสมาชิกในแก๊งค์</p>
        </div>
        
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
      </div>

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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: v.status === "in_use" ? "rgba(245,158,11,0.15)" : "rgba(52,211,153,0.15)", color: v.status === "in_use" ? "#f59e0b" : "#34d399" }}>
                      {v.status === "in_use" ? <><User size={12} /> ถูกใช้งาน</> : <><CheckCircle2 size={12} /> ว่าง</>}
                    </span>
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
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card" style={{ width: "100%", maxWidth: "500px", padding: "32px", position: "relative" }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }} className="hover-text-white">
                <X size={24} />
              </button>
              
              <h2 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.4rem", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                {editMode ? <Edit2 size={24} color="#c9a227" /> : <Plus size={24} color="#c9a227" />}
                {editMode ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่ลงในระบบ"}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>ชื่อรถ / รุ่นรถ *</label>
                  <input type="text" className="sog-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="เช่น Nissan Skyline R34" />
                </div>
                
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>ป้ายทะเบียน *</label>
                    <input type="text" className="sog-input" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} required placeholder="เช่น 1กก 1234 หรือไม่มีให้ใส่ -" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>จำนวนรถ *</label>
                    <input type="number" min="1" className="sog-input" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>มอบหมายผู้ครอบครอง (ทางเลือก)</label>
                  <select className="sog-input" value={form.assignedTo || ""} onChange={e => setForm({...form, assignedTo: e.target.value})}>
                    <option value="">— ว่าง (ยังไม่มีคนใช้) —</option>
                    {members.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#64748b" }}>* หากเลือกระบุชื่อ สถานะรถจะถูกเปลี่ยนเป็น "กำลังใช้งาน" ทันที</p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "12px 24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#e2e8f0", fontWeight: 600, cursor: "pointer" }} className="hover-bg-glass">
                    ยกเลิก
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} className="btn-gold" style={{ padding: "12px 24px", borderRadius: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "กำลังบันทึก..." : editMode ? "บันทึกการแก้ไข" : "เพิ่มรถ"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card" style={{ width: "100%", maxWidth: "400px", padding: "32px", textAlign: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(248,113,113,0.1)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <XCircle size={32} />
              </div>
              <h2 style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 12px" }}>ยืนยันการลบรถ</h2>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
