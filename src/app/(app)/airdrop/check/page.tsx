"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, User, CheckCircle2, Users, X as XIcon, PackageOpen, Trash2 } from "lucide-react";
import Image from "next/image";

interface AirdropSession {
  id: string;
  sessionName: string;
  date: string;
  items: { name: string; quantity: number; unit: string; description?: string; imageUrl?: string }[];
  checkedMembers: string[];
  status: "open" | "closed";
}

const TIME_SLOTS = ["15:00", "20:30", "23:00", "01:00"];

export default function AirdropCheckPage() {
  const { isManager, roleIcon, roleLabel, roleColor, user } = useRole();
  const [sessions, setSessions] = useState<AirdropSession[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [selectedMember, setSelectedMember] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newSessionSlot, setNewSessionSlot] = useState(TIME_SLOTS[0]);
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split("T")[0]);

  const refresh = () => {
    Promise.all([
      fetch("/api/airdrop").then(r => r.json()),
      fetch("/api/members").then(r => r.json()),
    ]).then(([airdropData, memberData]) => {
      setSessions(airdropData.data || []);
      setMembers((memberData.data || []).map((m: any) => ({ id: m.id, name: m.icName || m.name })));
      setLoading(false);
    });
  };
  useEffect(() => { refresh(); }, []);

  const checkIn = async (sessionId: string, memberName?: string) => {
    const name = memberName || (user?.icName || user?.name);
    const res = await fetch("/api/airdrop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId, action: "check-in", memberName: name }),
    });
    if (res.ok) { setMsg(`✅ เช็คชื่อ "${name}" สำเร็จ!`); refresh(); setSelectedMember(prev => ({ ...prev, [sessionId]: "" })); }
    else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 3000);
  };

  const closeSession = async (sessionId: string) => {
    await fetch("/api/airdrop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId, status: "closed" }),
    });
    refresh();
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("ยืนยันการลบรอบแอร์ดรอปนี้? ข้อมูลการเช็คชื่อทั้งหมดในรอบนี้จะหายไป")) return;
    const res = await fetch("/api/airdrop", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId }),
    });
    if (res.ok) { setMsg("✅ ลบรอบสำเร็จ!"); refresh(); }
    else setMsg("❌ เกิดข้อผิดพลาดในการลบ");
    setTimeout(() => setMsg(""), 3000);
  };

  const createSession = async () => {
    const sessionName = `แอร์ดรอป ${newSessionSlot}`;
    const res = await fetch("/api/airdrop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionName,
        date: new Date(`${newSessionDate}T${newSessionSlot}:00`).toISOString(),
        items: [],
        checkedMembers: [],
        status: "open",
      }),
    });
    if (res.ok) { setMsg(`✅ สร้างรอบ "${sessionName}" สำเร็จ!`); refresh(); setShowCreate(false); }
    else setMsg("❌ เกิดข้อผิดพลาด");
    setTimeout(() => setMsg(""), 3000);
  };

  const openSessions = sessions.filter((s: any) => s.status === "open");
  const closedSessions = sessions.filter((s: any) => s.status === "closed");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Gift size={32} color="#c9a227" /> เช็คชื่อเข้า แอร์ดรอป / ลูป
          </h1>
          <p className="page-subtitle">เช็คชื่อสมาชิกเข้ารับของ แอร์ดรอป / ลูป ตามรอบเวลา</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40`, display: "flex", alignItems: "center", gap: "8px" }}>
            {roleIcon} {roleLabel}
          </span>
          {isManager && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-gold" onClick={() => setShowCreate(!showCreate)}>
              + สร้างรอบ แอร์ดรอป / ลูป
            </motion.button>
          )}
        </div>
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", background: msg.startsWith("✅") ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: msg.startsWith("✅") ? "#34d399" : "#f87171", border: `1px solid ${msg.startsWith("✅") ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, display: "flex", alignItems: "center", gap: "8px" }}>
          {msg.startsWith("✅") ? <CheckCircle2 size={16} /> : <XIcon size={16} />} {msg}
        </motion.div>
      )}

      {/* Create Session Panel */}
      <AnimatePresence>
        {isManager && showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card" style={{ padding: "24px", marginBottom: "24px", overflow: "hidden" }}>
            <h3 style={{ color: "#c9a227", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={20} /> สร้างรอบ แอร์ดรอป / ลูป ใหม่
            </h3>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>วันที่</label>
                <input type="date" className="sog-input" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} style={{ height: "46px", width: "180px" }} />
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>เลือกรอบเวลา</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {TIME_SLOTS.map((slot: any) => (
                    <motion.button
                      key={slot}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewSessionSlot(slot)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: newSessionSlot === slot ? "2px solid #c9a227" : "1px solid rgba(255,255,255,0.1)",
                        background: newSessionSlot === slot ? "rgba(201,162,39,0.15)" : "rgba(0,0,0,0.2)",
                        color: newSessionSlot === slot ? "#c9a227" : "#94a3b8",
                        boxShadow: newSessionSlot === slot ? "0 0 15px rgba(201,162,39,0.2)" : "none",
                      }}
                    >
                      🕐 {slot}
                    </motion.button>
                  ))}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-gold" onClick={createSession} style={{ height: "46px", padding: "0 24px" }}>
                สร้างรอบ
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><p style={{ color: "#64748b" }}>กำลังโหลดข้อมูล...</p></div>
      ) : (
        <>
          {/* Open sessions */}
          <h2 style={{ color: "#34d399", fontSize: "1.1rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            รอบที่เปิดอยู่
          </h2>
          {openSessions.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#64748b", marginBottom: "24px" }}>
              <Gift size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ margin: 0 }}>ไม่มีรอบแอร์ดรอปที่เปิดอยู่</p>
            </div>
          ) : openSessions.map((s: any) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "24px", marginBottom: "16px", borderLeft: "4px solid #34d399" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.2rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={20} color="#c9a227" /> {s.sessionName}
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>📅 {new Date(s.date).toLocaleDateString("th-TH")}</p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ padding: "6px 12px", borderRadius: "20px", background: "rgba(52,211,153,0.1)", color: "#34d399", fontSize: "0.85rem", fontWeight: 600, border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={14} /> {s.checkedMembers.length} คน
                  </span>
                  {isManager && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => closeSession(s.id)} style={{ padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", color: "#f87171", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>ปิดรอบ</motion.button>
                  )}
                </div>
              </div>

              {/* Items List (Loot) */}
              {s.items && s.items.length > 0 && (
                <div style={{ background: "rgba(201,162,39,0.05)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(201,162,39,0.15)", marginBottom: "16px" }}>
                  <p style={{ color: "#c9a227", fontSize: "0.85rem", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                    <PackageOpen size={16} /> รายการของรางวัล (Loot)
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                    {s.items.map((item: any, idx: any) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(15,22,41,0.6)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} width={40} height={40} style={{ borderRadius: "6px", objectFit: "cover", border: "1px solid rgba(201,162,39,0.2)" }} />
                        ) : (
                          <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Gift size={20} color="#64748b" />
                          </div>
                        )}
                        <div>
                          <p style={{ color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 600, margin: "0 0 2px" }}>{item.name}</p>
                          <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: 0 }}>จำนวน: {item.quantity} {item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check-in: Dropdown for manager, self check-in for members */}
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "16px" }}>
                {isManager ? (
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontWeight: 600 }}><User size={14} /> เช็คชื่อสมาชิก</label>
                      <select
                        className="sog-input"
                        value={selectedMember[s.id] || ""}
                        onChange={e => setSelectedMember(prev => ({ ...prev, [s.id]: e.target.value }))}
                        style={{ height: "46px" }}
                      >
                        <option value="">— เลือกสมาชิก (IC Name) —</option>
                        {members.filter((m: any) => !s.checkedMembers.includes(m.name)).map((m: any) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-gold"
                      onClick={() => { if (selectedMember[s.id]) checkIn(s.id, selectedMember[s.id]); }}
                      disabled={!selectedMember[s.id]}
                      style={{ height: "46px", padding: "0 24px", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <CheckCircle2 size={18} /> เช็คชื่อ
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {!s.checkedMembers.includes((user?.icName || user?.name) || "") ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-gold" style={{ padding: "12px 32px", fontSize: "1rem" }} onClick={() => checkIn(s.id)}>
                        ✅ เช็คชื่อรับของ
                      </motion.button>
                    ) : (
                      <span style={{ padding: "12px 32px", borderRadius: "10px", background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                        <CheckCircle2 size={18} /> คุณเช็คชื่อแล้ว
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Checked members */}
              {s.checkedMembers.length > 0 && (
                <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "10px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <Users size={14} /> ผู้เช็คชื่อแล้ว ({s.checkedMembers.length} คน):
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <AnimatePresence>
                      {s.checkedMembers.map((m: any) => (
                        <motion.span
                          key={m}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            background: "linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(52,211,153,0.05) 100%)",
                            color: "#34d399",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            border: "1px solid rgba(52,211,153,0.25)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <CheckCircle2 size={12} /> {m}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Closed sessions */}
          {closedSessions.length > 0 && (
            <>
              <h2 style={{ color: "#64748b", fontSize: "1.1rem", fontWeight: 800, marginBottom: "12px", marginTop: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#64748b" }} />
                รอบที่ปิดแล้ว
              </h2>
              {closedSessions.map((s: any) => (
                <div key={s.id} className="glass-card" style={{ padding: "16px 24px", marginBottom: "10px", opacity: 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Clock size={16} color="#64748b" />
                      <p style={{ color: "#94a3b8", fontWeight: 600, margin: 0 }}>{s.sessionName}</p>
                      <span style={{ color: "#475569", fontSize: "0.8rem" }}>({new Date(s.date).toLocaleDateString("th-TH")})</span>
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Users size={14} /> {s.checkedMembers.length} คน</span>
                      {isManager && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteSession(s.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#f87171",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px"
                          }}
                          title="ลบรอบแอร์ดรอป"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </span>
                  </div>

                  {s.items && s.items.length > 0 && (
                    <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {s.items.map((item: any, idx: any) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          {item.imageUrl && (
                            <Image src={item.imageUrl} alt={item.name} width={20} height={20} style={{ borderRadius: "4px", objectFit: "cover" }} />
                          )}
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{item.name} ({item.quantity})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
