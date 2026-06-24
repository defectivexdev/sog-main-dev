"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRole } from "@/hooks/useRole";
import { ClipboardList, Send, CalendarDays, ShieldCheck, CheckCircle2, XCircle, Search, Clock, FileText, ImagePlus, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RoleBadge from "@/components/ui/RoleBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import FormField from "@/components/ui/FormField";
import { useToast } from "@/hooks/useToast";

interface LeaveRecord {
  id: string;
  memberName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
  imageUrl?: string;
  requestDate: string;
}

export default function LeavePage() {
  const { data: session } = useSession();
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  const [activeTab, setActiveTab] = useState<"submit" | "history" | "manage">("submit");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Form State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ memberName: "", date: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], reason: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { message, showSuccess, showError } = useToast();

  // Manage State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/leave").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([leaveData, memberData]) => {
      setRecords(leaveData.data || []);
      setMembers(
        (memberData.data || []).map((m: { id: string; name: string; icName?: string }) => ({
          id: m.id,
          name: m.icName || m.name,
        }))
      );
      setLoading(false);
    });
  };

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let imageUrl = null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.url) imageUrl = uploadData.url;
      } catch (err) {
        console.error("Upload error", err);
      }
    }

    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imageUrl }),
    });
    if (res.ok) {
      showSuccess("ส่งคำขอลาสำเร็จ!");
      setForm({ ...form, reason: "" }); // keep names and dates for convenience, reset reason
      setImageFile(null);
      refresh();
    } else {
      showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSubmitting(false);
  };

  const updateLeaveStatus = async (id: string, status: "approved" | "rejected", rjReason?: string) => {
    if (processingId) return; // Prevent double clicks
    setProcessingId(id);
    const res = await fetch("/api/leave", {
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
    setProcessingId(null);
  };

  const myHistory = records.filter((r: any) => r.memberName === (session?.user?.icName || session?.user?.name));
  const pendingRequests = records.filter((r: any) => r.status === "pending");
  const filteredHistory = records.filter((r: any) => r.memberName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <PageHeader 
        icon={ClipboardList} 
        title="แจ้งลางาน" 
        subtitle="ส่งคำขอลาและดูประวัติการลาของสมาชิก" 
        roleBadge={<RoleBadge icon={roleIcon} label={roleLabel} color={roleColor} />} 
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px", overflowX: "auto" }}>
        <button onClick={() => setActiveTab("submit")} style={{ padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: activeTab === "submit" ? "rgba(201,162,39,0.15)" : "transparent", color: activeTab === "submit" ? "#c9a227" : "#64748b", border: activeTab === "submit" ? "1px solid rgba(201,162,39,0.3)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
          <Send size={18} /> แจ้งลา
        </button>
        <button onClick={() => setActiveTab("history")} style={{ padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: activeTab === "history" ? "rgba(201,162,39,0.15)" : "transparent", color: activeTab === "history" ? "#c9a227" : "#64748b", border: activeTab === "history" ? "1px solid rgba(201,162,39,0.3)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
          <CalendarDays size={18} /> ประวัติการลา
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
              <FileText size={20} /> แบบฟอร์มแจ้งลางาน
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FormField label="ชื่อสมาชิก" required>
                <select className="sog-input" value={form.memberName} onChange={(e) => setForm({ ...form, memberName: e.target.value })} required>
                  <option value="">— เลือกชื่อของคุณ —</option>
                  {members.map((m) => (<option key={m.id} value={m.name}>{m.name}</option>))}
                </select>
              </FormField>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <FormField label="ตั้งแต่วันที่" required>
                    <input type="date" className="sog-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label="ถึงวันที่" required>
                    <input type="date" className="sog-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required min={form.date} />
                  </FormField>
                </div>
              </div>
              <FormField label="เหตุผลการลา" required>
                <textarea className="sog-input" rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="อธิบายเหตุผลการลาให้ชัดเจน เช่น ป่วยไปหาหมอ, ติดธุระครอบครัว..." style={{ resize: "vertical" }} />
              </FormField>

              {/* Image Upload */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>แนบรูปภาพ (ทางเลือก)</label>
                {imageFile ? (
                  <div style={{ position: "relative", width: "100%", maxWidth: "300px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: "100%", height: "auto", display: "block" }} />
                    <button type="button" onClick={() => setImageFile(null)} style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer" }}><X size={16} /></button>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(201,162,39,0.3)", borderRadius: "12px", padding: "32px", cursor: "pointer", background: "rgba(201,162,39,0.02)", transition: "all 0.2s" }} className="hover-bg-gold">
                    <ImagePlus size={32} color="#c9a227" style={{ marginBottom: "12px", opacity: 0.8 }} />
                    <span style={{ color: "#e2e8f0", fontSize: "0.95rem", fontWeight: 600 }}>คลิกเพื่ออัปโหลดรูปภาพ</span>
                    <span style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "4px" }}>PNG, JPG สูงสุด 5MB</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); }} />
                  </label>
                )}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gold" disabled={submitting} style={{ padding: "14px", fontSize: "1rem", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {submitting ? <Clock size={20} className="spin" /> : <Send size={20} />}
                {submitting ? "กำลังส่งคำร้อง..." : "ส่งคำร้องขอลา"}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* TAB 2: History */}
        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <h2 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarDays size={20} color="#c9a227" /> ประวัติการลาของสมาชิกแก๊งค์
              </h2>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" className="sog-input" placeholder="ค้นหาชื่อ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: "36px", height: "auto", padding: "8px 12px 8px 36px", width: "200px" }} />
              </div>
            </div>

            {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>กำลังโหลดข้อมูล...</div> : (
              <DataTable 
                columns={[
                  { header: "ชื่อสมาชิก", accessor: "memberName", width: "20%" },
                  { 
                    header: "ช่วงเวลาที่ลา", 
                    width: "25%",
                    render: (r: any) => {
                      const startDate = new Date(r.startDate).toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: '2-digit' });
                      const endDate = new Date(r.endDate).toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: '2-digit' });
                      const diffTime = Math.abs(new Date(r.endDate).getTime() - new Date(r.startDate).getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#e2e8f0" }}>{startDate === endDate ? startDate : `${startDate} - ${endDate}`}</span>
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "10px" }}>{diffDays} วัน</span>
                        </div>
                      );
                    }
                  },
                  { 
                    header: "เหตุผล", 
                    width: "40%",
                    render: (r: any) => (
                      <div style={{ color: "#94a3b8", maxWidth: "250px" }}>
                        {r.reason}
                        {r.imageUrl && (
                          <div style={{ marginTop: "8px" }}>
                            <button type="button" onClick={() => setPreviewImage(r.imageUrl!)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)", padding: "4px 10px", borderRadius: "16px", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }} className="hover-text-white hover-bg-glass">
                              <ImagePlus size={14} /> ดูรูปแนบ
                            </button>
                          </div>
                        )}
                        {r.status === "rejected" && r.rejectReason && (
                          <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#f87171", display: "flex", alignItems: "center", gap: "4px" }}>
                            ↳ เหตุผลที่ปฏิเสธ: {r.rejectReason}
                          </div>
                        )}
                      </div>
                    )
                  },
                  { 
                    header: "สถานะ", 
                    align: "center",
                    width: "15%",
                    render: (r: any) => <StatusBadge status={r.status} />
                  }
                ]}
                data={filteredHistory}
                keyExtractor={(item: any) => item.id}
                emptyText="ยังไม่มีประวัติการลา"
              />
            )}
          </motion.div>
        )}

        {/* TAB 3: Manage (Managers Only) */}
        {activeTab === "manage" && isManager && (
          <motion.div key="manage" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748b", gridColumn: "1/-1" }}>กำลังโหลดข้อมูล...</div> :
               pendingRequests.length === 0 ? (
                 <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center", color: "#64748b", gridColumn: "1/-1" }}>
                   <CheckCircle2 size={40} style={{ margin: "0 auto 16px", opacity: 0.5, color: "#34d399" }} />
                   <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>ไม่มีคำร้องที่รอดำเนินการ</p>
                   <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>คุณจัดการคำร้องครบหมดแล้ว เก่งมาก!</p>
                 </div>
               ) : (
                pendingRequests.map((r: any) => {
                  const startDate = new Date(r.startDate).toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: 'numeric' });
                  const endDate = new Date(r.endDate).toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: 'numeric' });
                  const diffTime = Math.abs(new Date(r.endDate).getTime() - new Date(r.startDate).getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: "20px", borderLeft: "4px solid #fbbf24" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <h3 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.1rem", margin: "0 0 4px" }}>{r.memberName}</h3>
                          <span style={{ fontSize: "0.75rem", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>รอดำเนินการ</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "10px", textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", marginBottom: "2px" }}>จำนวนวันลา</span>
                          <span style={{ color: "#c9a227", fontWeight: 800, fontSize: "1.1rem" }}>{diffDays} วัน</span>
                        </div>
                      </div>
                      
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "10px", marginBottom: "16px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "#94a3b8" }}>
                          <strong style={{ color: "#e2e8f0" }}>ตั้งแต่วันที่:</strong> {startDate} {startDate !== endDate && ` - ${endDate}`}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                          <strong style={{ color: "#e2e8f0" }}>เหตุผล:</strong> {r.reason}
                        </p>
                        {r.imageUrl && (
                          <div style={{ marginTop: "12px", borderRadius: "8px", overflow: "hidden", display: "inline-block" }}>
                            <button type="button" onClick={() => setPreviewImage(r.imageUrl!)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(148,163,184,0.1)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.2)", padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }} className="hover-bg-glass">
                              <ImagePlus size={16} /> ดูรูปหลักฐาน
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <motion.button whileHover={{ scale: processingId === r.id ? 1 : 1.05 }} whileTap={{ scale: processingId === r.id ? 1 : 0.95 }} onClick={() => updateLeaveStatus(r.id, "approved")} disabled={processingId === r.id} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: processingId === r.id ? "#64748b" : "#34d399", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: processingId === r.id ? "not-allowed" : "pointer" }}>
                          {processingId === r.id ? <Clock size={16} className="spin" /> : <CheckCircle2 size={16} />} อนุมัติ
                        </motion.button>
                        <motion.button whileHover={{ scale: processingId === r.id ? 1 : 1.05 }} whileTap={{ scale: processingId === r.id ? 1 : 0.95 }} onClick={() => { setSelectedLeaveId(r.id); setRejectModalOpen(true); }} disabled={processingId === r.id} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: processingId === r.id ? "#64748b" : "#f87171", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: processingId === r.id ? "not-allowed" : "pointer" }}>
                          <XCircle size={16} /> ไม่อนุมัติ
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setRejectReason(""); }} title={<span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171" }}><XCircle size={24} /> ปฏิเสธคำร้อง</span>} maxWidth="450px">
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "20px" }}>
          กรุณาระบุเหตุผลที่ไม่อนุมัติการลาครั้งนี้ (จะแสดงให้ผู้ยื่นคำร้องเห็น)
        </p>
        <textarea 
          className="sog-input" 
          rows={3} 
          value={rejectReason} 
          onChange={e => setRejectReason(e.target.value)} 
          placeholder="ระบุเหตุผล เช่น เอกสารไม่ครบ, วันลากระชั้นชิดเกินไป..." 
          style={{ resize: "vertical", marginBottom: "20px" }} 
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => updateLeaveStatus(selectedLeaveId, "rejected", rejectReason)} style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#f87171", color: "#fff", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Send size={16} /> ยืนยันการปฏิเสธ
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setRejectModalOpen(false); setRejectReason(""); }} style={{ padding: "12px 24px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer" }}>
            ยกเลิก
          </motion.button>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal open={!!previewImage} onClose={() => setPreviewImage(null)} title="ดูรูปแนบ" maxWidth="90vw">
        {previewImage && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img src={previewImage} alt="Preview full size" style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", objectFit: "contain", borderRadius: "8px" }} />
          </div>
        )}
      </Modal>

    </motion.div>
  );
}
