"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useRole } from "@/hooks/useRole";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Skeleton from "@/components/ui/Skeleton";
import { Users, Search, Plus, X, Shield, Calendar, Activity, ClipboardList, DollarSign, PackageCheck, Phone, MessageSquare, Fingerprint, Wallet, Umbrella } from "lucide-react";

interface Member {
  id: string;
  name: string;
  icName?: string;
  nickname: string;
  role: string;
  avatar?: string;
  status: string;
  joinDate: string;
  phone?: string;
  discordId?: string;
}

interface ProfileStats {
  attendanceCount: number;
  leaveCount: number;
  totalDonated: number;
  requisitionsCount: number;
}

const roleLabel: Record<string, string> = { admin: "แอดมิน", leader: "หัวหน้า", vice_leader: "รองหัวหน้า", member: "สมาชิก" };
const roleColor: Record<string, string> = { admin: "#f43f5e", leader: "#c9a227", vice_leader: "#a78bfa", member: "#94a3b8" };

function MembersContent() {
  const { isManager } = useRole();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams?.get("search") || "");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nickname: "", role: "member", phone: "", lineId: "" });

  // Profile Modal State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [profileHistory, setProfileHistory] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetch("/api/members").then((r) => r.json()).then((d) => {
      // Map both `_id` and `id` to `id` for consistency
      const mapped = (d.data || []).map((m: any) => ({ ...m, id: m.id || m._id }));
      setMembers(mapped);
      setLoading(false);
      const initMemberId = searchParams?.get("memberId");
      if (initMemberId) {
        const found = mapped.find((m: any) => m.id === initMemberId || m.discordId === initMemberId);
        if (found) {
          // fetch stats and history using the correct API
          fetch(`/api/members/${found.id}`).then(r => r.json()).then(d => {
            if (d.data) {
              setProfileStats(d.data.stats);
              setProfileHistory(d.data.history);
            }
          });
          setSelectedMember(found);
        }
      }
    });
  }, [searchParams]);

  const filtered = members.filter((m) =>
    (m.icName || m.name).toLowerCase().includes(search.toLowerCase()) || m.nickname.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const d = await fetch("/api/members").then((r) => r.json());
      const mapped = (d.data || []).map((m: any) => ({ ...m, id: m.id || m._id }));
      setMembers(mapped);
      setShowForm(false);
      setForm({ name: "", nickname: "", role: "member", phone: "", lineId: "" });
      toast.success("เพิ่มสมาชิกใหม่สำเร็จแล้ว! 🎉");
    } else {
      toast.error("เกิดข้อผิดพลาด ไม่สามารถเพิ่มสมาชิกได้");
    }
  };

  const openProfile = async (member: Member) => {
    setSelectedMember(member);
    window.history.pushState(null, '', `?memberId=${member.discordId || member.id}`);
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/members/${member.id}`);
      const d = await res.json();
      if (d.data) {
        setProfileStats(d.data.stats);
        setProfileHistory(d.data.history);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingProfile(false);
  };

  const closeProfile = () => {
    setSelectedMember(null);
    window.history.pushState(null, '', '/members');
    setProfileStats(null);
    setProfileHistory([]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={32} color="#c9a227" /> รายชื่อสมาชิก
          </h1>
          <p className="page-subtitle">ข้อมูลและสถิติของสมาชิกทั้งหมดในแก๊งค์ SOG</p>
        </div>
        {isManager && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", borderRadius: "12px", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#c9a227", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            {showForm ? "ยกเลิก" : <><Plus size={18} /> เพิ่มสมาชิกใหม่</>}
          </motion.button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && isManager && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: "24px" }}>
            <div className="glass-card" style={{ padding: "24px", border: "1px solid rgba(201,162,39,0.3)" }}>
              <h3 style={{ color: "#c9a227", margin: "0 0 16px", fontSize: "1.1rem" }}>เพิ่มสมาชิกใหม่</h3>
              <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><label className="sog-label">ชื่อ Discord *</label><input className="sog-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="sog-label">ชื่อเล่น *</label><input className="sog-input" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} required /></div>
                <div><label className="sog-label">บทบาท</label><select className="sog-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="member">สมาชิก</option><option value="admin">แอดมิน</option><option value="leader">หัวหน้า</option></select></div>
                <div><label className="sog-label">เบอร์โทร</label><input className="sog-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div style={{ gridColumn: "1/-1", display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button type="submit" className="btn-gold" style={{ flex: 1, padding: "10px" }}>บันทึก</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: "relative", marginBottom: "24px", maxWidth: "400px" }}>
        <Search size={18} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
        <input className="sog-input" placeholder="ค้นหาชื่อหรือชื่อเล่น..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "40px" }} />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {Array.from({ length: 8 }).map((_: any, i: any) => (
            <div key={i} className="glass-card" style={{ padding: "24px 16px", textAlign: "center" }}>
              <Skeleton width="70px" height="70px" borderRadius="50%" style={{ margin: "0 auto 16px" }} />
              <Skeleton width="60%" height="20px" style={{ margin: "0 auto 8px" }} />
              <Skeleton width="40%" height="14px" style={{ margin: "0 auto 16px" }} />
              <Skeleton width="80px" height="24px" borderRadius="20px" style={{ margin: "0 auto" }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {filtered.map((m: any, i: any) => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
              onClick={() => openProfile(m)}
              className="glass-card" 
              style={{ textAlign: "center", padding: "24px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: roleColor[m.role] }} />
              
              <div style={{ width: "70px", height: "70px", background: "rgba(15,22,41,0.8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `2px solid ${roleColor[m.role]}`, fontSize: "1.8rem" }}>
                {m.avatar ? <Image src={m.avatar} alt={m.icName || m.name} width={66} height={66} style={{ borderRadius: "50%" }} /> : "👤"}
              </div>
              
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.1rem", margin: "0 0 4px" }}>{m.icName || m.name}</h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 12px" }}>@{m.name} {m.nickname && m.nickname !== m.name ? `(${m.nickname})` : ""}</p>
              
              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, color: roleColor[m.role], background: `${roleColor[m.role]}18`, border: `1px solid ${roleColor[m.role]}40`, display: "inline-block" }}>
                {roleLabel[m.role]}
              </span>
            </motion.div>
          ))}
          {filtered.length === 0 && <p style={{ color: "#64748b", gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>ไม่พบสมาชิกที่ค้นหา</p>}
        </div>
      )}

      {/* Member Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-card" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
              
              {/* Modal Header */}
              <div style={{ background: `linear-gradient(135deg, ${roleColor[selectedMember.role]}20 0%, transparent 100%)`, padding: "32px 24px 24px", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={closeProfile} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(0,0,0,0.3)", border: "none", color: "#e2e8f0", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={18} />
                </button>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ width: "80px", height: "80px", background: "rgba(15,22,41,0.8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${roleColor[selectedMember.role]}`, fontSize: "2rem", flexShrink: 0 }}>
                    {selectedMember.avatar ? <Image src={selectedMember.avatar} alt={selectedMember.icName || selectedMember.name} width={76} height={76} style={{ borderRadius: "50%" }} /> : "👤"}
                  </div>
                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{selectedMember.icName || selectedMember.name}</h2>
                    <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: "0.9rem" }}>@{selectedMember.name} {selectedMember.nickname && selectedMember.nickname !== selectedMember.name ? `• ${selectedMember.nickname}` : ""}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, color: roleColor[selectedMember.role], background: `${roleColor[selectedMember.role]}20` }}>{roleLabel[selectedMember.role]}</span>
                      <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", color: "#64748b", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={12} /> เข้าแก๊งค์: {new Date(selectedMember.joinDate || Date.now()).toLocaleDateString("th-TH", { month: "short", year: "numeric" })}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ background: "rgba(255,255,255,0.1)", padding: "6px", borderRadius: "8px", display: "flex" }}><Phone size={14} color="#94a3b8" /></div>
                        <div>
                          <div style={{ color: "#64748b", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>เบอร์โทร</div>
                          <div style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600 }}>{selectedMember.phone || "ไม่ระบุ"}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(88,101,242,0.05)", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(88,101,242,0.1)" }}>
                        <div style={{ background: "rgba(88,101,242,0.15)", padding: "6px", borderRadius: "8px", display: "flex" }}><MessageSquare size={14} color="#a78bfa" /></div>
                        <div>
                          <div style={{ color: "#8b98a5", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Discord</div>
                          <div style={{ color: "#c4b5fd", fontSize: "0.85rem", fontWeight: 600 }}>@{selectedMember.name}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ background: "rgba(255,255,255,0.1)", padding: "6px", borderRadius: "8px", display: "flex" }}><Fingerprint size={14} color="#94a3b8" /></div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ color: "#64748b", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Discord ID</div>
                          <div style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 500, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedMember.discordId || "ไม่ระบุ"}</div>
                        </div>
                      </div>

                      {profileStats && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(201,162,39,0.05)", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(201,162,39,0.1)" }}>
                            <div style={{ background: "rgba(201,162,39,0.15)", padding: "6px", borderRadius: "8px", display: "flex" }}><Wallet size={14} color="#fbbf24" /></div>
                            <div>
                              <div style={{ color: "#a18228", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>ยอดส่งคลังรวม</div>
                              <div style={{ color: "#fbbf24", fontSize: "0.9rem", fontWeight: 800 }}>฿{(profileStats.totalDonated || 0).toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(248,113,113,0.05)", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.1)", gridColumn: "1 / -1" }}>
                            <div style={{ background: "rgba(248,113,113,0.15)", padding: "6px", borderRadius: "8px", display: "flex" }}><Umbrella size={14} color="#f87171" /></div>
                            <div>
                              <div style={{ color: "#994747", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>จำนวนการลาทั้งหมด</div>
                              <div style={{ color: "#fca5a5", fontSize: "0.9rem", fontWeight: 800 }}>{profileStats.leaveCount} <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>ครั้ง</span></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px", overflowY: "auto" }}>
                {loadingProfile ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>กำลังโหลดข้อมูลสถิติ...</div>
                ) : profileStats ? (
                  <>
                    <h3 style={{ color: "#e2e8f0", fontSize: "1rem", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}><Activity size={18} color="#c9a227" /> สถิติภาพรวม</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
                      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ color: "#34d399", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>เช็คชื่อทั้งหมด</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{profileStats.attendanceCount} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#64748b" }}>ครั้ง</span></div>
                      </div>
                      <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>ลางานทั้งหมด</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{profileStats.leaveCount} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#64748b" }}>ครั้ง</span></div>
                      </div>
                      <div style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ color: "#fbbf24", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>ส่งเงินเข้าคลัง</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>฿{profileStats.totalDonated.toLocaleString()}</div>
                      </div>
                      <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ color: "#a78bfa", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>เบิกของทั้งหมด</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{profileStats.requisitionsCount} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#64748b" }}>ครั้ง</span></div>
                      </div>
                    </div>

                    <h3 style={{ color: "#e2e8f0", fontSize: "1rem", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}><ClipboardList size={18} color="#c9a227" /> ประวัติล่าสุด (5 รายการ)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {profileHistory.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#64748b", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "10px" }}>ยังไม่มีประวัติการทำรายการ</div>
                      ) : (
                        profileHistory.map((h: any, i: any) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(0,0,0,0.3)", borderRadius: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: h.type === "payment" ? "rgba(16,185,129,0.2)" : h.type === "leave" ? "rgba(248,113,113,0.2)" : "rgba(139,92,246,0.2)", color: h.type === "payment" ? "#34d399" : h.type === "leave" ? "#f87171" : "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {h.type === "payment" ? <DollarSign size={16} /> : h.type === "leave" ? <ClipboardList size={16} /> : <PackageCheck size={16} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 600 }}>{h.title}</div>
                              <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{new Date(h.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                            </div>
                            <div style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>{h.status}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
      <MembersContent />
    </Suspense>
  );
}
