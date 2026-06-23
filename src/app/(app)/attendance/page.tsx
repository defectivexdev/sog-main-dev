"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, CalendarDays, UserX, FileText, Calendar as CalendarIcon, User, Search } from "lucide-react";
import { useRole } from "@/hooks/useRole";

interface AttendanceRecord {
  id: string; // Updated from _id
  memberName: string;
  date: string;
  status: "present" | "absent" | "late";
  note?: string;
}

interface SummaryRecord {
  name: string;
  role: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

const statusMap = { present: "badge-present", absent: "badge-absent", late: "badge-late" };
const statusLabel = { present: "มา", absent: "ขาด", late: "มาสาย" };

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function AttendancePage() {
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  
  // Daily State
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ memberName: "", date: new Date().toISOString().split("T")[0], status: "present", note: "" });
  const [msg, setMsg] = useState("");

  // Monthly State
  const [summaryData, setSummaryData] = useState<SummaryRecord[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Daily Data
  useEffect(() => {
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([attendanceData, memberData]) => {
      setRecords(attendanceData.data?.map((r:any) => ({...r, id: r.id || r._id})) || []);
      setMembers(
        (memberData.data || []).map((m: { id: string; name: string; icName?: string }) => ({
          id: m.id,
          name: m.icName || m.name,
        }))
      );
      setLoading(false);
    });
  }, []);

  // Fetch Monthly Data
  useEffect(() => {
    if (activeTab === "monthly") {
      setSummaryLoading(true);
      fetch(`/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`)
        .then(r => r.json())
        .then(d => {
          setSummaryData(d.data || []);
          setSummaryLoading(false);
        });
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setMsg("✅ บันทึกสำเร็จ!");
      const d = await fetch("/api/attendance").then((r) => r.json());
      setRecords(d.data?.map((r:any) => ({...r, id: r.id || r._id})) || []);
      setForm(prev => ({...prev, memberName: "", note: ""})); // Reset form partially
    } else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 3000);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.date.startsWith(todayStr));

  const filteredSummary = summaryData.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarDays size={32} color="#c9a227" /> ระบบเช็คชื่อ
          </h1>
          <p className="page-subtitle">เช็คชื่อรายวันและสรุปข้อมูลประจำเดือน</p>
        </div>
        <span style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40`, display: "flex", alignItems: "center", gap: "8px" }}>
          {roleIcon} {roleLabel}
        </span>
      </div>

      {/* Custom Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
        <button 
          onClick={() => setActiveTab("daily")}
          style={{ 
            padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "daily" ? "rgba(201,162,39,0.15)" : "transparent",
            color: activeTab === "daily" ? "#c9a227" : "#64748b",
            border: activeTab === "daily" ? "1px solid rgba(201,162,39,0.3)" : "1px solid transparent",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          <CheckCircle2 size={18} /> เช็คชื่อประจำวัน
        </button>
        <button 
          onClick={() => setActiveTab("monthly")}
          style={{ 
            padding: "10px 24px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "monthly" ? "rgba(201,162,39,0.15)" : "transparent",
            color: activeTab === "monthly" ? "#c9a227" : "#64748b",
            border: activeTab === "monthly" ? "1px solid rgba(201,162,39,0.3)" : "1px solid transparent",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          <FileText size={18} /> สรุปประจำเดือน
        </button>
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "24px", background: msg.startsWith("✅") ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: msg.startsWith("✅") ? "#34d399" : "#f87171", border: `1px solid ${msg.startsWith("✅") ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}` }}>
          {msg}
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "daily" ? (
          <motion.div key="daily" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            
            {/* Form Section */}
            {isManager ? (
              <div className="glass-card" style={{ padding: "24px", height: "fit-content" }}>
                <h3 style={{ color: "#c9a227", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={18} /> บันทึกการเช็คชื่อ
                </h3>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>ชื่อสมาชิก *</label>
                    <select className="sog-input" value={form.memberName} onChange={(e) => setForm({ ...form, memberName: e.target.value })} required>
                      <option value="">— เลือกสมาชิก —</option>
                      {members.map((m) => (<option key={m.id} value={m.name}>{m.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>วันที่ *</label>
                    <input type="date" className="sog-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>สถานะ *</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {[
                        { val: "present", icon: "✅", label: "มา", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
                        { val: "late", icon: "⏰", label: "มาสาย", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
                        { val: "absent", icon: "❌", label: "ขาด", color: "#f87171", bg: "rgba(248,113,113,0.1)" }
                      ].map((s: any) => (
                        <div key={s.val} onClick={() => setForm({...form, status: s.val})} style={{ flex: 1, padding: "10px", textAlign: "center", borderRadius: "10px", cursor: "pointer", border: form.status === s.val ? `1px solid ${s.color}` : "1px solid rgba(255,255,255,0.1)", background: form.status === s.val ? s.bg : "rgba(0,0,0,0.2)", transition: "all 0.2s" }}>
                          <span style={{ fontSize: "1.2rem", display: "block", marginBottom: "4px" }}>{s.icon}</span>
                          <span style={{ color: form.status === s.val ? s.color : "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>หมายเหตุ</label>
                    <input className="sog-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="เช่น รถติด, ป่วย (ถ้ามี)" />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-gold" style={{ marginTop: "8px", padding: "12px" }}>
                    บันทึกข้อมูล
                  </motion.button>
                </form>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: "32px", textAlign: "center", color: "#64748b", height: "fit-content" }}>
                <UserX size={40} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                <p>เฉพาะหัวหน้าและรองหัวหน้าเท่านั้นที่สามารถบันทึกการเช็คชื่อได้</p>
              </div>
            )}

            {/* List Section */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, padding: "14px 20px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "10px", background: "rgba(52,211,153,0.2)", borderRadius: "10px" }}><CheckCircle2 size={24} color="#34d399" /></div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, display: "block" }}>มาวันนี้</span>
                    <span style={{ color: "#34d399", fontWeight: 800, fontSize: "1.5rem" }}>{todayRecords.filter((r: any) =>r.status==="present").length}</span>
                  </div>
                </div>
                <div style={{ flex: 1, padding: "14px 20px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "10px", background: "rgba(251,191,36,0.2)", borderRadius: "10px" }}><Clock size={24} color="#fbbf24" /></div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, display: "block" }}>มาสาย</span>
                    <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: "1.5rem" }}>{todayRecords.filter((r: any) =>r.status==="late").length}</span>
                  </div>
                </div>
                <div style={{ flex: 1, padding: "14px 20px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "10px", background: "rgba(248,113,113,0.2)", borderRadius: "10px" }}><UserX size={24} color="#f87171" /></div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, display: "block" }}>ขาด</span>
                    <span style={{ color: "#f87171", fontWeight: 800, fontSize: "1.5rem" }}>{todayRecords.filter((r: any) =>r.status==="absent").length}</span>
                  </div>
                </div>
              </div>

              {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>กำลังโหลด...</div> : (
                <div style={{ overflowX: "auto" }}>
                  <table className="sog-table">
                    <thead><tr><th>ชื่อสมาชิก</th><th>วันที่</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead>
                    <tbody>
                      {records.length === 0 ? <tr><td colSpan={4} style={{ textAlign: "center", color: "#64748b", padding: "32px" }}>ยังไม่มีประวัติการเช็คชื่อ</td></tr>
                      : records.slice(0,50).map((r) => (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <td style={{ fontWeight: 600 }}>{r.memberName}</td>
                          <td style={{ color: "#94a3b8" }}>{new Date(r.date).toLocaleDateString("th-TH")}</td>
                          <td><span className={statusMap[r.status]} style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>{statusLabel[r.status]}</span></td>
                          <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{r.note || "—"}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Monthly Summary Tab */
          <motion.div key="monthly" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="glass-card" style={{ padding: "24px" }}>
            
            {/* Summary Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <CalendarIcon size={20} color="#c9a227" />
                <select className="sog-input" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ width: "160px", padding: "8px 12px", height: "auto" }}>
                  {THAI_MONTHS.map((m: any, i: any) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className="sog-input" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: "120px", padding: "8px 12px", height: "auto" }}>
                  {[...Array(5)].map((_: any, i: any) => {
                    const y = new Date().getFullYear() - 2 + i;
                    return <option key={y} value={y}>{y + 543}</option>; // Display Thai year
                  })}
                </select>
              </div>

              <div style={{ position: "relative" }}>
                <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="text" 
                  className="sog-input" 
                  placeholder="ค้นหาสมาชิก..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "36px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", height: "auto", width: "220px" }}
                />
              </div>

            </div>

            {/* Summary Table */}
            {summaryLoading ? <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>กำลังประมวลผลข้อมูล...</div> : (
              <div style={{ overflowX: "auto" }}>
                <table className="sog-table" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "16px", background: "rgba(0,0,0,0.3)" }}>ชื่อ IC Name</th>
                      <th style={{ padding: "16px", background: "rgba(52,211,153,0.1)", color: "#34d399", textAlign: "center" }}>มาปกติ (วัน)</th>
                      <th style={{ padding: "16px", background: "rgba(251,191,36,0.1)", color: "#fbbf24", textAlign: "center" }}>มาสาย (วัน)</th>
                      <th style={{ padding: "16px", background: "rgba(248,113,113,0.1)", color: "#f87171", textAlign: "center" }}>ขาด (วัน)</th>
                      <th style={{ padding: "16px", background: "rgba(167,139,250,0.1)", color: "#a78bfa", textAlign: "center" }}>ลา (วัน)</th>
                      <th style={{ padding: "16px", background: "rgba(0,0,0,0.3)", textAlign: "center" }}>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummary.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>ไม่มีข้อมูลในเดือนนี้</td></tr>
                    : filteredSummary.map((s: any, i: any) => {
                      const isWarning = s.absent >= 3 || (s.late + s.absent >= 5);
                      
                      return (
                        <motion.tr 
                          key={s.name} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: i * 0.05 }}
                          style={{ 
                            background: isWarning ? "rgba(248,113,113,0.05)" : "rgba(255,255,255,0.02)",
                            boxShadow: isWarning ? "inset 2px 0 0 #f87171" : "none"
                          }}
                        >
                          <td style={{ padding: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(201,162,39,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a227", fontSize: "0.8rem" }}>
                              {s.name.substring(0, 2).toUpperCase()}
                            </div>
                            {s.name}
                            {s.role === "leader" && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(201,162,39,0.1)", color: "#c9a227", borderRadius: "4px", border: "1px solid rgba(201,162,39,0.2)" }}>หัวหน้า</span>}
                            {s.role === "admin" && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(167,139,250,0.1)", color: "#a78bfa", borderRadius: "4px", border: "1px solid rgba(167,139,250,0.2)" }}>รอง</span>}
                          </td>
                          <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: s.present > 0 ? "#e2e8f0" : "#475569" }}>{s.present}</td>
                          <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: s.late > 0 ? "#fbbf24" : "#475569" }}>{s.late}</td>
                          <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: s.absent > 0 ? "#f87171" : "#475569" }}>{s.absent}</td>
                          <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: s.leave > 0 ? "#a78bfa" : "#475569" }}>{s.leave}</td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            {s.absent >= 3 ? <span style={{ color: "#f87171", fontSize: "0.75rem", fontWeight: 700, background: "rgba(248,113,113,0.1)", padding: "4px 8px", borderRadius: "12px" }}>⚠️ ขาดบ่อย</span> : 
                             (s.late >= 3 ? <span style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700, background: "rgba(251,191,36,0.1)", padding: "4px 8px", borderRadius: "12px" }}>⚠️ สายบ่อย</span> : 
                             <span style={{ color: "#34d399", fontSize: "0.75rem" }}>—</span>)}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
