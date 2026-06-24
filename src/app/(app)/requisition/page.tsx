"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRole } from "@/hooks/useRole";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import { ShoppingCart, Send, ClipboardList, ShieldCheck, CheckCircle2, XCircle, Search, Clock, Box, PackageCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RoleBadge from "@/components/ui/RoleBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/hooks/useToast";

interface ReqRecord {
  id: string; // Prisma mapped `id`
  memberName: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "delivered";
  imageUrl?: string;
  rejectReason?: string;
  createdAt: string;
}

export default function RequisitionPage() {
  const { data: session } = useSession();
  const { isManager, roleIcon, roleLabel, roleColor, user } = useRole();
  const [activeTab, setActiveTab] = useState<"submit" | "history" | "manage">("submit");
  
  const [records, setRecords] = useState<ReqRecord[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const limit = 20;
  const [pagination, setPagination] = useState<any>(null);
  
  // Submit Form State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ memberName: "", itemName: "", quantity: 1, unit: "ชิ้น", reason: "", imageUrl: "" });
  const { message, showSuccess, showError } = useToast();

  // Manage State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/requisition?page=${page}&limit=${limit}`).then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([reqData, memberData]) => {
      // API returns id or _id depending on old/new records
      const mapped = (reqData.data || []).map((r: any) => ({ ...r, id: r.id || r._id }));
      setRecords(mapped);
      setPagination(reqData.pagination);
      setMembers(
        (memberData.data || []).map((m: { id: string; name: string; icName?: string }) => ({
          id: m.id,
          name: m.icName || m.name,
        }))
      );
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, memberName: form.memberName || (user?.icName || user?.name) };
    const res = await fetch("/api/requisition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showSuccess("ส่งคำขอเบิกของสำเร็จ!");
      setForm({ ...form, itemName: "", reason: "", imageUrl: "", quantity: 1 });
      refresh();
    } else {
      showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSubmitting(false);
  };

  const updateReqStatus = async (id: string, status: "approved" | "rejected" | "delivered", rjReason?: string) => {
    const res = await fetch("/api/requisition", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, rejectReason: rjReason }),
    });
    if (res.ok) {
      showSuccess(`ทำรายการสำเร็จ!`);
      setRejectModalOpen(false);
      setRejectReason("");
      refresh();
    } else {
      showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  const pendingRequests = records.filter((r: any) => r.status === "pending" || r.status === "approved"); // Mangers see pending & approved (to mark delivered)
  const filteredHistory = records.filter((r: any) => r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || r.itemName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <PageHeader
        icon={ShoppingCart}
        title="ระบบเบิกของ"
        subtitle="ขอเบิกสินค้า อาวุธ หรืออุปกรณ์ส่วนกลาง"
        roleBadge={<RoleBadge icon={roleIcon} label={roleLabel} color={roleColor} />}
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px", overflowX: "auto" }}>
        <button onClick={() => setActiveTab("submit")} style={{ padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: activeTab === "submit" ? "rgba(201,162,39,0.15)" : "transparent", color: activeTab === "submit" ? "#c9a227" : "#64748b", border: activeTab === "submit" ? "1px solid rgba(201,162,39,0.3)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
          <Send size={18} /> ขอเบิกของ
        </button>
        <button onClick={() => setActiveTab("history")} style={{ padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: activeTab === "history" ? "rgba(201,162,39,0.15)" : "transparent", color: activeTab === "history" ? "#c9a227" : "#64748b", border: activeTab === "history" ? "1px solid rgba(201,162,39,0.3)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
          <ClipboardList size={18} /> ประวัติการเบิก
        </button>
        {isManager && (
          <button onClick={() => setActiveTab("manage")} style={{ padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: activeTab === "manage" ? "rgba(167,139,250,0.15)" : "transparent", color: activeTab === "manage" ? "#a78bfa" : "#64748b", border: activeTab === "manage" ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
            <ShieldCheck size={18} /> จัดการคำร้อง {pendingRequests.length > 0 && <span style={{ background: "#f87171", color: "#fff", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem", marginLeft: "4px" }}>{pendingRequests.length}</span>}
          </button>
        )}
      </div>

      <Toast message={message} />

      {/* Content */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: Submit */}
        {activeTab === "submit" && (
          <motion.div key="submit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="glass-card" style={{ padding: "32px", maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ color: "#c9a227", fontWeight: 800, fontSize: "1.2rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Box size={20} /> แบบฟอร์มขอเบิกของ
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FormField label="ชื่อผู้ขอ" required>
                <select className="sog-input" value={form.memberName} onChange={(e) => setForm({ ...form, memberName: e.target.value })} required>
                  <option value="">— เลือกชื่อของคุณ —</option>
                  {members.map((m) => (<option key={m.id} value={m.name}>{m.name}</option>))}
                </select>
              </FormField>
              <FormField label="ชื่อของที่ต้องการเบิก" required>
                <input type="text" className="sog-input" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required placeholder="เช่น อาวุธ, ยา, วิทยุ..." />
              </FormField>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <FormField label="จำนวน" required>
                    <input type="number" className="sog-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required min={1} />
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label="หน่วย" required>
                    <input type="text" className="sog-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required placeholder="ชิ้น, กล่อง, กระบอก..." />
                  </FormField>
                </div>
              </div>
              <FormField label="เหตุผลการเบิก" required>
                <textarea className="sog-input" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="อธิบายเหตุผลให้ชัดเจน..." style={{ resize: "vertical" }} />
              </FormField>
              <ImageUpload value={form.imageUrl} onChange={url => setForm({ ...form, imageUrl: url })} label="แนบรูปภาพอ้างอิง (ถ้ามี)" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gold" disabled={submitting} style={{ padding: "14px", fontSize: "1rem", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {submitting ? <Clock size={20} className="spin" /> : <Send size={20} />}
                {submitting ? "กำลังส่งคำร้อง..." : "ส่งคำขอเบิก"}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* TAB 2: History */}
        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <h2 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <ClipboardList size={20} color="#c9a227" /> ประวัติการเบิกของ
              </h2>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" className="sog-input" placeholder="ค้นหาชื่อหรือของ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: "36px", height: "auto", padding: "8px 12px 8px 36px", width: "220px" }} />
              </div>
            </div>

            {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>กำลังโหลดข้อมูล...</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredHistory.length === 0 ? <div style={{ textAlign: "center", color: "#64748b", padding: "32px" }}>ยังไม่มีประวัติการเบิกของ</div> : filteredHistory.map((r: any, i: any) => (
                  <motion.div key={r.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "16px", background: "rgba(15,22,41,0.5)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    {r.imageUrl ? (
                      <Image src={r.imageUrl} alt={r.itemName} width={64} height={64} style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                      <div style={{ width: "64px", height: "64px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}><Box size={24} /></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <p style={{ color: "#e2e8f0", fontWeight: 700, margin: "0 0 4px", fontSize: "1.05rem" }}>{r.itemName} <span style={{ color: "#c9a227" }}>×{r.quantity} {r.unit}</span></p>
                          <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{r.memberName}</span> 
                            <span style={{ opacity: 0.5 }}>|</span> 
                            <span>{new Date(r.createdAt).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                          </p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}><strong>เหตุผล:</strong> {r.reason}</p>
                        {r.status === "rejected" && r.rejectReason && (
                          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#f87171", display: "flex", alignItems: "center", gap: "4px" }}>
                            ↳ เหตุผลที่ปฏิเสธ: {r.rejectReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {pagination && pagination.totalPages > 1 && (
                  <div style={{ marginTop: "24px" }}>
                    <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: Manage (Managers Only) */}
        {activeTab === "manage" && isManager && (
          <motion.div key="manage" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748b", gridColumn: "1/-1" }}>กำลังโหลดข้อมูล...</div> :
               pendingRequests.length === 0 ? (
                 <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center", color: "#64748b", gridColumn: "1/-1" }}>
                   <CheckCircle2 size={40} style={{ margin: "0 auto 16px", opacity: 0.5, color: "#34d399" }} />
                   <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>ไม่มีคำร้องที่รอดำเนินการ</p>
                 </div>
               ) : (
                pendingRequests.map((r: any) => (
                  <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: "20px", borderLeft: r.status === "pending" ? "4px solid #fbbf24" : "4px solid #34d399", display: "flex", flexDirection: "column" }}>
                    
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      {r.imageUrl ? (
                        <Image src={r.imageUrl} alt={r.itemName} width={50} height={50} style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                      ) : (
                        <div style={{ width: "50px", height: "50px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}><Box size={20} /></div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h3 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.05rem", margin: "0 0 4px" }}>{r.memberName}</h3>
                          <span style={{ fontSize: "0.7rem", color: r.status === "pending" ? "#fbbf24" : "#34d399", background: r.status === "pending" ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)", padding: "2px 8px", borderRadius: "10px", border: `1px solid ${r.status === "pending" ? "rgba(251,191,36,0.2)" : "rgba(52,211,153,0.2)"}` }}>
                            {r.status === "pending" ? "รออนุมัติ" : "รอส่งมอบ"}
                          </span>
                        </div>
                        <p style={{ color: "#c9a227", margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{r.itemName} <span style={{ color: "#e2e8f0" }}>×{r.quantity} {r.unit}</span></p>
                      </div>
                    </div>
                    
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "10px", marginBottom: "16px", flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                        <strong style={{ color: "#e2e8f0" }}>เหตุผล:</strong> {r.reason}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>วันที่ยื่น: {new Date(r.createdAt).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {r.status === "pending" ? (
                      <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => updateReqStatus(r.id, "approved")} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                          <CheckCircle2 size={16} /> อนุมัติ
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedReqId(r.id); setRejectModalOpen(true); }} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                          <XCircle size={16} /> ปฏิเสธ
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => updateReqStatus(r.id, "delivered")} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#c9a227", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", marginTop: "auto" }}>
                        <PackageCheck size={18} /> กดเมื่อส่งมอบของให้สมาชิกแล้ว
                      </motion.button>
                    )}
                  </motion.div>
                ))
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setRejectReason(""); }} title={<span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171" }}><XCircle size={24} /> ปฏิเสธคำขอเบิกของ</span>} maxWidth="450px">
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "20px" }}>
          กรุณาระบุเหตุผลที่ปฏิเสธ (เช่น ของหมด, ไม่จำเป็นต้องใช้...)
        </p>
        <textarea 
          className="sog-input" 
          rows={3} 
          value={rejectReason} 
          onChange={e => setRejectReason(e.target.value)} 
          placeholder="ระบุเหตุผลที่ปฏิเสธ..." 
          style={{ resize: "vertical", marginBottom: "20px" }} 
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => updateReqStatus(selectedReqId, "rejected", rejectReason)} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#f87171", color: "#fff", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Send size={16} /> ยืนยันการปฏิเสธ
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setRejectModalOpen(false); setRejectReason(""); }} style={{ padding: "12px 24px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer" }}>
            ยกเลิก
          </motion.button>
        </div>
      </Modal>

    </motion.div>
  );
}
