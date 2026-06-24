"use client";
import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/useToast";
import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownRight, User, Calendar, Check, Download } from "lucide-react";
import useSWR from "swr";

import PageHeader from "@/components/ui/PageHeader";
import RoleBadge from "@/components/ui/RoleBadge";
import Toast from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import FormField from "@/components/ui/FormField";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PaymentPage() {
  const { isManager, roleIcon, roleLabel, roleColor, user } = useRole();
  const { message, showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: payData, mutate: refreshPayments, isLoading: payLoading } = useSWR(`/api/payment?page=${page}&limit=${limit}&type=${activeTab}`, fetcher);
  const { data: memData, isLoading: memLoading } = useSWR('/api/members', fetcher);
  
  const rawPayments = payData?.data || payData || [];
  const payments = Array.isArray(rawPayments) ? rawPayments : [];
  
  const rawMembers = memData?.data || memData || [];
  const membersList = Array.isArray(rawMembers) ? rawMembers : [];
  const members = membersList.map((m: any) => ({ id: m.id, name: m.icName || m.name }));
  const loading = payLoading || memLoading;
  
  const [form, setForm] = useState({ memberName: "", amount: 0, description: "", image: "", date: new Date().toISOString().split("T")[0] });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    let uploadedUrl = "";
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        uploadedUrl = url;
      } else {
        showError("❌ อัปโหลดรูปภาพล้มเหลว");
        setSubmitting(false);
        return;
      }
    }

    const payload = { 
      ...form, 
      type: activeTab, 
      image: uploadedUrl, 
      memberName: form.memberName || (user?.icName || user?.name) 
    };
    
    const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { 
      showSuccess(activeTab === "income" ? "✅ บันทึกการส่งเงินสำเร็จ!" : "✅ บันทึกการเบิกจ่ายสำเร็จ!"); 
      setForm({ memberName: "", amount: 0, description: "", image: "", date: new Date().toISOString().split("T")[0] }); 
      setFile(null);
      refreshPayments(); 
    } else {
      showError("❌ เกิดข้อผิดพลาด");
    }
    setSubmitting(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setForm(f => ({ ...f, image: URL.createObjectURL(selectedFile) }));
    }
  };

  const confirm = async (id: string) => {
    await fetch("/api/payment", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "confirmed" }) });
    refreshPayments();
  };

  const total = payData?.totals?.balance || 0;
  const totalIn = payData?.totals?.totalIn || 0;
  const totalOut = payData?.totals?.totalOut || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        icon={Wallet}
        title="ระบบบัญชีแก๊งค์"
        subtitle="จัดการการเงินและการโอนของสมาชิกแก๊งค์ SOG"
        roleBadge={<RoleBadge icon={roleIcon} label={roleLabel} color={roleColor} />}
        actions={
          isManager ? (
            <a 
              href="/api/payment/export" 
              target="_blank"
              style={{ 
                background: "rgba(52, 211, 153, 0.1)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)",
                padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px",
                fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", cursor: "pointer"
              }}
            >
              <Download size={16} /> รายงาน (CSV)
            </a>
          ) : undefined
        }
      />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "28px" }}>
        <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "20px", borderTop: "4px solid #c9a227" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(201,162,39,0.15)", padding: "8px", borderRadius: "10px", color: "#c9a227" }}><Wallet size={20} /></div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>ยอดเงินกองกลางคงเหลือ</p>
          </div>
          <p style={{ color: total >= 0 ? "#34d399" : "#f87171", fontSize: "2rem", fontWeight: 800, margin: 0 }}>฿{Math.abs(total).toLocaleString()}</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "20px", borderTop: "4px solid #34d399" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(52,211,153,0.15)", padding: "8px", borderRadius: "10px", color: "#34d399" }}><ArrowDownRight size={20} /></div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>รายรับทั้งหมด</p>
          </div>
          <p style={{ color: "#34d399", fontSize: "2rem", fontWeight: 800, margin: 0 }}>+฿{totalIn.toLocaleString()}</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "20px", borderTop: "4px solid #f87171" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(248,113,113,0.15)", padding: "8px", borderRadius: "10px", color: "#f87171" }}><ArrowUpRight size={20} /></div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>รายจ่ายทั้งหมด</p>
          </div>
          <p style={{ color: "#f87171", fontSize: "2rem", fontWeight: 800, margin: 0 }}>-฿{totalOut.toLocaleString()}</p>
        </motion.div>
      </div>

      <div style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
        <button 
          onClick={() => { setActiveTab("income"); setPage(1); }}
          style={{ 
            padding: "10px 20px", borderRadius: "12px", fontWeight: 700, 
            background: activeTab === "income" ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.05)",
            color: activeTab === "income" ? "#34d399" : "#94a3b8",
            border: `1px solid ${activeTab === "income" ? "rgba(52, 211, 153, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
            cursor: "pointer"
          }}
        >
          รายรับ (Income)
        </button>
        <button 
          onClick={() => { setActiveTab("expense"); setPage(1); }}
          style={{ 
            padding: "10px 20px", borderRadius: "12px", fontWeight: 700, 
            background: activeTab === "expense" ? "rgba(248, 113, 113, 0.2)" : "rgba(255, 255, 255, 0.05)",
            color: activeTab === "expense" ? "#f87171" : "#94a3b8",
            border: `1px solid ${activeTab === "expense" ? "rgba(248, 113, 113, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
            cursor: "pointer"
          }}
        >
          รายจ่าย (Expense)
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3 style={{ color: activeTab === "income" ? "#34d399" : "#f87171", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem" }}>
            <Wallet size={20} /> {activeTab === "income" ? "บันทึกการรับเงิน" : "บันทึกการเบิกจ่าย"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <FormField label="ชื่อสมาชิก" required>
              <select className="sog-input" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} required style={{ height: "46px", width: "100%" }}>
                <option value="">— เลือกสมาชิก —</option>
                <option value={user?.icName || user?.name || ""}>👤 ตัวคุณเอง ({user?.icName || user?.name})</option>
                {members.filter((m: any) => m.name !== (user?.icName || user?.name)).map((m: any) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="จำนวนเงิน (บาท)" required>
              <input type="number" className="sog-input" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} min={1} required style={{ height: "46px", fontSize: "1.1rem", width: "100%" }} placeholder="0" />
            </FormField>

            {activeTab === "expense" && (
              <FormField label="รายละเอียด / เหตุผลที่เบิก" required>
                <input type="text" className="sog-input" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ height: "46px", width: "100%" }} placeholder="เช่น ซื้อของแต่งรถ, ค่าปรับ" />
              </FormField>
            )}

            <FormField label="แนบรูปภาพ (ภาพถ่าย/สกรีนช็อต)" required>
              <input type="file" accept="image/*" onChange={handleImageChange} required className="sog-input" style={{ height: "46px", padding: "10px", width: "100%" }} />
              {form.image && (
                <div style={{ marginTop: "12px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "200px", display: "flex", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                  <img src={form.image} alt="Preview" style={{ maxHeight: "200px", objectFit: "contain" }} loading="lazy" />
                </div>
              )}
            </FormField>

            <FormField label="วันที่ทำรายการ">
              <input type="date" className="sog-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={{ height: "46px", width: "100%" }} />
            </FormField>

            <motion.button disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gold" style={{ height: "46px", marginTop: "8px", fontSize: "1rem", fontWeight: 700, opacity: submitting ? 0.7 : 1, width: "100%" }}>
              {submitting ? "กำลังบันทึก..." : "บันทึกรายการ"}
            </motion.button>
          </form>
        </div>

        {/* Table / List */}
        <div className="glass-card" style={{ padding: "28px", overflowY: "auto", maxHeight: "800px" }}>
          <h3 style={{ color: "#e2e8f0", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem" }}>
            <Calendar size={20} color="#a5b4fc" /> ประวัติการทำรายการล่าสุด ({activeTab === "income" ? "รายรับ" : "รายจ่าย"})
          </h3>
          
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><p style={{ color: "#64748b" }}>กำลังโหลดข้อมูล...</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {payments.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <Wallet size={32} color="#475569" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "#64748b", margin: 0 }}>ยังไม่มีรายการบัญชี</p>
                </div>
              ) : payments.map((p: any, i: number) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: "16px 20px",
                    background: "rgba(15,22,41,0.6)",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderLeft: `4px solid ${p.type === "income" ? "#34d399" : "#f87171"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ color: p.type === "income" ? "#34d399" : "#f87171", fontWeight: 800, fontSize: "1.1rem" }}>
                        {p.type === "income" ? "+" : "-"}฿{p.amount.toLocaleString()}
                      </span>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <p style={{ color: "#e2e8f0", fontSize: "0.95rem", margin: "0 0 6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                      <User size={14} color="#94a3b8" /> {p.memberName}
                    </p>
                    {p.description && (
                      <p style={{ color: "#a5b4fc", fontSize: "0.85rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "6px" }}>
                        📝 {p.description}
                      </p>
                    )}
                    <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={12} /> {new Date(p.date).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  
                  {p.image && (
                    <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, cursor: "pointer", position: "relative" }} onClick={() => window.open(p.image, '_blank')}>
                      <img src={p.image} alt="Slip" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        <span style={{ fontSize: "0.75rem", color: "white", fontWeight: 600, padding: "2px 6px", background: "rgba(0,0,0,0.5)", borderRadius: "4px" }}>ดูหลักฐาน</span>
                      </div>
                    </div>
                  )}
                  
                  {isManager && p.status === "pending" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => confirm(p._id)}
                      style={{
                        padding: "10px 16px",
                        background: "rgba(52,211,153,0.15)",
                        border: "1px solid rgba(52,211,153,0.3)",
                        borderRadius: "10px",
                        color: "#34d399",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <Check size={16} /> ยืนยันยอด
                    </motion.button>
                  )}
                </motion.div>
              ))}

              {payData?.pagination && payData.pagination.totalPages > 1 && (
                <div style={{ marginTop: "24px" }}>
                  <Pagination page={page} totalPages={payData.pagination.totalPages} onPageChange={setPage} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Toast message={message} />
    </motion.div>
  );
}
