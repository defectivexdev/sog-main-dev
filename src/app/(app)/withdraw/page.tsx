"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownRight, User, Image as ImageIcon, Calendar, CheckCircle2, Clock, Check, HandCoins, Download, X } from "lucide-react";

interface Payment { _id: string; memberName: string; amount: number; type: string; description?: string; image?: string; date: string; status: string; confirmedBy?: string; }

export default function WithdrawPage() {
  const { isManager, roleIcon, roleLabel, roleColor, user } = useRole();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ memberName: "", amount: 0, image: "", date: new Date().toISOString().split("T")[0] });
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = () => {
    Promise.all([
      fetch("/api/payment").then(r => r.json()),
      fetch("/api/members").then(r => r.json())
    ]).then(([payData, memData]) => {
      setPayments(payData.data || []);
      setMembers((memData.data || []).map((m: any) => ({ id: m.id, name: m.icName || m.name, role: m.role })));
      setLoading(false);
    });
  };
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("⏳ กำลังบันทึกข้อมูล...");

    let uploadedUrl = "";
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        uploadedUrl = url;
      } else {
        setMsg("❌ อัปโหลดรูปภาพล้มเหลว");
        setTimeout(() => setMsg(""), 4000);
        return;
      }
    }

    const payload = { ...form, type: "expense", image: uploadedUrl, memberName: form.memberName || (user?.icName || user?.name) };
    const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { 
      setMsg("✅ บันทึกการถอนเงินสำเร็จ!"); 
      setForm({ memberName: "", amount: 0, image: "", date: new Date().toISOString().split("T")[0] }); 
      setFile(null);
      refresh(); 
    }
    else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 4000);
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
    refresh();
  };

  const total = payments.filter((p: any) => p.status === "confirmed").reduce((acc: any, p: any) => acc + (p.type === "income" ? p.amount : -p.amount), 0);
  const totalIn = payments.filter((p: any) => p.type === "income" && p.status === "confirmed").reduce((acc: any, p: any) => acc + p.amount, 0);
  const totalOut = payments.filter((p: any) => p.type === "expense" && p.status === "confirmed").reduce((acc: any, p: any) => acc + p.amount, 0);

  const displayPayments = payments.filter((p: any) => p.type === "expense");
  const managerMembers = members.filter((m: any) => m.role === "leader" || m.role === "vice_leader");

  if (!isManager && !loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "#f87171" }}>ไม่มีสิทธิ์เข้าถึง</h2>
        <p style={{ color: "#94a3b8" }}>หน้านี้สงวนไว้สำหรับทีมบริหาร (หัวหน้า/รองหัวหน้า) เท่านั้น</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <HandCoins size={32} color="#f87171" /> ระบบเบิก/ถอนเงินแก๊งค์
          </h1>
          {isManager && (
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
          )}
        </div>
          <p className="page-subtitle">บันทึกการเบิกถอนเงินจากกองกลาง (เฉพาะทีมบริหาร)</p>
        </div>
        <span style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40`, display: "flex", alignItems: "center", gap: "8px" }}>
          {roleIcon} {roleLabel}
        </span>
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: "28px" }}>
          <h3 style={{ color: "#f87171", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem" }}>
            <HandCoins size={20} /> บันทึกการถอนเงิน
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontWeight: 600 }}><User size={14}/> ชื่อผู้ถอน *</label>
              <select className="sog-input" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} required style={{ height: "46px" }}>
                <option value="">— เลือกผู้ถอน (เฉพาะทีมบริหาร) —</option>
                <option value={user?.icName || user?.name || ""}>👤 ตัวคุณเอง ({user?.icName || user?.name})</option>
                {managerMembers.filter((m: any) => m.name !== (user?.icName || user?.name)).map((m: any) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontWeight: 600 }}><Wallet size={14}/> จำนวนเงินที่ถอน (บาท) *</label>
              <input type="number" className="sog-input" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} min={1} required style={{ height: "46px", fontSize: "1.1rem" }} placeholder="0" />
            </div>

            <div>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontWeight: 600 }}><ImageIcon size={14}/> แนบรูปภาพ (ภาพถ่าย/สกรีนช็อต) *</label>
              <input type="file" accept="image/*" onChange={handleImageChange} required className="sog-input" style={{ height: "46px", padding: "10px" }} />
              {form.image && (
                <div style={{ marginTop: "12px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "200px", display: "flex", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                  <img src={form.image} alt="Preview" style={{ maxHeight: "200px", objectFit: "contain" }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontWeight: 600 }}><Calendar size={14}/> วันที่ทำรายการ</label>
              <input type="date" className="sog-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={{ height: "46px" }} />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gold" style={{ height: "46px", marginTop: "8px", fontSize: "1rem", fontWeight: 700, background: "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)", borderColor: "#b91c1c" }}>
              บันทึกการถอนเงิน
            </motion.button>
            
            {msg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "12px", borderRadius: "8px", background: msg.startsWith("✅") ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: msg.startsWith("✅") ? "#34d399" : "#f87171", border: `1px solid ${msg.startsWith("✅") ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                {msg.startsWith("✅") ? <CheckCircle2 size={16} /> : <X size={16} />}
                {msg.replace("✅", "").replace("❌", "")}
              </motion.div>
            )}
          </form>
        </div>

        {/* Table / List */}
        <div className="glass-card" style={{ padding: "28px", overflowY: "auto", maxHeight: "800px" }}>
          <h3 style={{ color: "#e2e8f0", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem" }}>
            <Calendar size={20} color="#a5b4fc" /> ประวัติการถอนเงิน
          </h3>
          
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><p style={{ color: "#64748b" }}>กำลังโหลดข้อมูล...</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayPayments.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <Wallet size={32} color="#475569" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "#64748b", margin: 0 }}>ยังไม่มีรายการถอนเงิน</p>
                </div>
              ) : displayPayments.map((p: any, i: any) => (
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
                    borderLeft: `4px solid #f87171`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ color: "#f87171", fontWeight: 800, fontSize: "1.1rem" }}>
                        -฿{p.amount.toLocaleString()}
                      </span>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: p.status === "confirmed" ? "#34d399" : "#fbbf24",
                        background: p.status === "confirmed" ? "rgba(52,211,153,0.1)" : "rgba(245,158,11,0.1)",
                        border: `1px solid ${p.status === "confirmed" ? "rgba(52,211,153,0.3)" : "rgba(245,158,11,0.3)"}`
                      }}>
                        {p.status === "confirmed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {p.status === "confirmed" ? "ยืนยันแล้ว" : "รอยืนยัน"}
                      </span>
                    </div>
                    <p style={{ color: "#e2e8f0", fontSize: "0.95rem", margin: "0 0 6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                      <User size={14} color="#94a3b8" /> {p.memberName}
                    </p>
                    <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={12} /> {new Date(p.date).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  
                  {p.image && (
                    <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, cursor: "pointer", position: "relative" }} onClick={() => window.open(p.image, '_blank')}>
                      <img src={p.image} alt="Slip" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
