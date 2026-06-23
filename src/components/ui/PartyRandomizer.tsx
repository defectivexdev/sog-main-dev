"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, UserPlus, X, Users, RefreshCcw, User } from "lucide-react";

interface PartyRandomizerProps {
  isManager: boolean;
  members: { id: string; name: string }[];
}

export default function PartyRandomizer({ isManager, members }: PartyRandomizerProps) {
  const [quickPool, setQuickPool] = useState<string[]>([]);
  const [quickName, setQuickName] = useState("");
  const [quickTeamSize, setQuickTeamSize] = useState(5);
  const [quickTeams, setQuickTeams] = useState<string[][]>([]);

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickName.trim() && !quickPool.includes(quickName.trim())) {
      setQuickPool([...quickPool, quickName.trim()]);
      setQuickName("");
    }
  };

  const handleRandomize = () => {
    if (quickPool.length === 0) return;
    const shuffled = [...quickPool].sort(() => 0.5 - Math.random());
    const result = [];
    for (let i = 0; i < shuffled.length; i += quickTeamSize) {
      result.push(shuffled.slice(i, i + quickTeamSize));
    }
    setQuickTeams(result);
  };

  const clearPool = () => {
    setQuickPool([]);
    setQuickTeams([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        padding: "28px",
        marginBottom: "32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(88,101,242,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "8px", background: "rgba(88,101,242,0.15)", borderRadius: "10px", color: "#a5b4fc" }}>
            <Dices size={24} />
          </div>
          <div>
            <h3 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.2rem", margin: 0, letterSpacing: "-0.02em" }}>
              ระบบสุ่มจัดตี้ด่วน
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              Quick Party Randomizer
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          
          {/* --- LEFT: NAME POOL INPUT --- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <form onSubmit={handleAddName} style={{ display: "flex", gap: "12px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                  <User size={18} />
                </div>
                <select
                  className="sog-input"
                  style={{ paddingLeft: "42px", height: "46px", appearance: "none" }}
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                >
                  <option value="">— เลือกสมาชิกเพื่อเข้ากองสุ่ม —</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-gold"
                style={{ height: "46px", display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", flexShrink: 0 }}
                disabled={!quickName.trim()}
              >
                <UserPlus size={18} />
                <span style={{ display: "none" }} className="sm:inline">เพิ่มชื่อ</span>
              </motion.button>
            </form>

            <div style={{ background: "rgba(0,0,0,0.25)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", minHeight: "160px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={16} /> รายชื่อรอสุ่ม ({quickPool.length} คน)
                </p>
                {quickPool.length > 0 && (
                  <button
                    onClick={clearPool}
                    style={{ fontSize: "0.75rem", color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1, alignContent: "flex-start" }}>
                <AnimatePresence>
                  {quickPool.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ color: "#475569", fontSize: "0.9rem", width: "100%", textAlign: "center", marginTop: "20px" }}
                    >
                      ยังไม่มีรายชื่อในกองสุ่ม
                    </motion.p>
                  ) : (
                    quickPool.map((p) => (
                      <motion.div
                        key={p}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          background: "linear-gradient(135deg, rgba(88,101,242,0.15) 0%, rgba(88,101,242,0.05) 100%)",
                          color: "#c7d2fe",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          border: "1px solid rgba(88,101,242,0.3)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                        }}
                      >
                        {p}
                        <button
                          onClick={() => setQuickPool(quickPool.filter((name) => name !== p))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#818cf8",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* --- RIGHT: RANDOMIZER CONTROLS --- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isManager ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "8px", fontWeight: 600 }}>สุ่มกี่คนต่อ 1 ตี้?</label>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                        <Users size={18} />
                      </div>
                      <input
                        type="number"
                        className="sog-input"
                        style={{ paddingLeft: "42px", height: "46px" }}
                        value={quickTeamSize}
                        onChange={(e) => setQuickTeamSize(Math.max(1, Number(e.target.value)))}
                        min={1}
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={quickPool.length > 0 ? { scale: 1.02, boxShadow: "0 0 20px rgba(88,101,242,0.4)" } : {}}
                    whileTap={quickPool.length > 0 ? { scale: 0.98 } : {}}
                    onClick={handleRandomize}
                    className="btn-discord"
                    disabled={quickPool.length === 0}
                    style={{ height: "46px", padding: "0 24px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}
                  >
                    <RefreshCcw size={18} />
                    <span>สุ่มเลย!</span>
                  </motion.button>
                </div>

                <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", display: "flex", flexDirection: "column" }}>
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, fontWeight: 600, marginBottom: "16px" }}>ผลการสุ่ม:</p>
                  
                  {quickTeams.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "0.9rem" }}>
                      คลิกปุ่มสุ่มเพื่อดูผลลัพธ์
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                      <AnimatePresence>
                        {quickTeams.map((team: any, i: any) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                              background: "linear-gradient(90deg, rgba(201,162,39,0.15) 0%, rgba(201,162,39,0.05) 100%)",
                              padding: "16px",
                              borderRadius: "12px",
                              borderLeft: "4px solid #c9a227",
                              borderTop: "1px solid rgba(201,162,39,0.1)",
                              borderRight: "1px solid rgba(201,162,39,0.1)",
                              borderBottom: "1px solid rgba(201,162,39,0.1)",
                            }}
                          >
                            <p style={{ color: "#c9a227", fontSize: "0.8rem", fontWeight: 800, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              ตี้ที่ {i + 1}
                            </p>
                            <p style={{ color: "#f8fafc", margin: 0, fontSize: "0.95rem", lineHeight: 1.5, fontWeight: 500 }}>
                              {team.join(", ")}
                            </p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ height: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", background: "rgba(239,68,68,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", marginBottom: "16px" }}>
                  <Users size={32} />
                </div>
                <h4 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}>เฉพาะทีมบริหาร</h4>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                  ฟังก์ชั่นการสุ่มจัดตี้สงวนไว้สำหรับ<br />หัวหน้าแก๊งค์และรองหัวหน้าแก๊งค์เท่านั้น
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
