"use client";
import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import PartyRandomizer from "@/components/ui/PartyRandomizer";

interface Activity { _id: string; name: string; description?: string; date: string; location?: string; participants: string[]; maxParticipants?: number; status: string; }

const statusColor: Record<string, string> = { upcoming: "#c9a227", ongoing: "#34d399", completed: "#64748b", cancelled: "#f87171" };
const statusLabel: Record<string, string> = { upcoming: "กำลังจะมา", ongoing: "กำลังเกิดขึ้น", completed: "เสร็จสิ้น", cancelled: "ยกเลิก" };

export default function ActivitiesPage() {
  const { isManager, roleIcon, roleLabel, roleColor, user } = useRole();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", date: "", location: "", maxParticipants: "" });
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [randomTeams, setRandomTeams] = useState<Record<string, string[][]>>({});
  const [teamSizes, setTeamSizes] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const refresh = () => {
    Promise.all([
      fetch("/api/activities").then(r => r.json()),
      fetch("/api/members").then(r => r.json()),
    ]).then(([activitiesData, membersData]) => {
      setActivities(activitiesData.data || []);
      setMembers((membersData.data || []).map((m: any) => ({ id: m.id, name: m.icName || m.name })));
      setLoading(false);
    });
  };
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined }) });
    if (res.ok) { 
      toast.success("สร้างกิจกรรมสำเร็จ!"); 
      setForm({ name: "", description: "", date: "", location: "", maxParticipants: "" }); 
      setShowForm(false); 
      refresh(); 
    } else {
      toast.error("เกิดข้อผิดพลาดในการสร้างกิจกรรม");
    }
  };

  const toggleJoin = async (id: string, participants: string[], customName?: string) => {
    const name = customName || (user?.icName || user?.name) || "";
    if (!name) return;
    const isJoined = participants.includes(name);

    // Optimistic UI Update (ทายใจอัปเดตหน้าจอก่อน API ตอบกลับ)
    setActivities(prev => prev.map(act => {
      // API might return .id or ._id depending on how it was fetched
      const actId = (act as any).id || act._id;
      if (actId === id) {
        const newParticipants = isJoined ? act.participants.filter(p => p !== name) : [...act.participants, name];
        return { ...act, participants: newParticipants };
      }
      return act;
    }));

    const res = await fetch("/api/activities", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: isJoined ? "leave" : "join", memberName: name }) });
    
    if (res.ok) {
      toast.success(isJoined ? `ถอนตัวเรียบร้อย` : `เข้าร่วมเรียบร้อย`);
      if (customName) setCustomNames(prev => ({ ...prev, [id]: "" }));
    } else {
      toast.error("เกิดข้อผิดพลาด");
      refresh(); // Rollback on error
    }
  };

  const handleRandomize = (id: string, participants: string[]) => {
    const size = teamSizes[id] || 5;
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const result: string[][] = [];
    for (let i = 0; i < shuffled.length; i += size) {
      result.push(shuffled.slice(i, i + size));
    }
    setRandomTeams(prev => ({ ...prev, [id]: result }));
  };

  const deleteActivity = async (id: string) => {
    if (!confirm("ลบกิจกรรมนี้?")) return;
    await fetch("/api/activities", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    refresh();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div><h1 className="page-title">🎮 ตี๊เล่นกิจกรรม</h1><p className="page-subtitle">กิจกรรมของแก๊งค์ SOG</p></div>
        {isManager && (
          <button className="btn-gold" onClick={() => setShowForm(!showForm)}>
            {showForm ? "ยกเลิก" : "+ สร้างกิจกรรม"}
          </button>
        )}
      </div>

      <PartyRandomizer isManager={isManager} members={members} />

      {isManager && showForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#c9a227", fontWeight: 700, marginBottom: "20px" }}>สร้างกิจกรรมใหม่</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>ชื่อกิจกรรม *</label><input className="sog-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>วันที่ *</label><input type="datetime-local" className="sog-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>สถานที่</label><input className="sog-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>จำนวนผู้เข้าร่วมสูงสุด</label><input type="number" className="sog-input" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} min={1} placeholder="ไม่จำกัด" /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>รายละเอียด</label><textarea className="sog-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-gold">สร้างกิจกรรม</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p style={{ color: "#64748b" }}>กำลังโหลด...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {activities.length === 0 ? <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>ยังไม่มีกิจกรรม</div>
          : activities.map((a: any) => {
            const isJoined = a.participants.includes((user?.icName || user?.name) || "");
            const isFull = a.maxParticipants ? a.participants.length >= a.maxParticipants : false;
            return (
              <div key={a._id} className="glass-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>{a.name}</h3>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, color: statusColor[a.status], background: `${statusColor[a.status]}18`, border: `1px solid ${statusColor[a.status]}40` }}>{statusLabel[a.status]}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", color: "#64748b", fontSize: "0.82rem", flexWrap: "wrap" }}>
                      <span>📅 {new Date(a.date).toLocaleString("th-TH")}</span>
                      {a.location && <span>📍 {a.location}</span>}
                      <span>👥 {a.participants.length}{a.maxParticipants ? `/${a.maxParticipants}` : ""} คน</span>
                    </div>
                    {a.description && <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "8px", marginBottom: 0 }}>{a.description}</p>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexDirection: "column", alignItems: "flex-end" }}>
                    {a.status !== "completed" && a.status !== "cancelled" && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          className="sog-input"
                          style={{ padding: "8px 12px", width: "160px" }}
                          placeholder="พิมพ์ชื่อ..."
                          value={customNames[a._id] || ""}
                          onChange={(e) => setCustomNames(prev => ({ ...prev, [a._id]: e.target.value }))}
                        />
                        <button
                          onClick={() => toggleJoin(a._id, a.participants, customNames[a._id])}
                          disabled={isFull && !a.participants.includes(customNames[a._id] || "")}
                          className="btn-gold"
                          style={{ padding: "8px 16px" }}
                        >
                          เพิ่มชื่อ
                        </button>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      {a.status !== "completed" && a.status !== "cancelled" && (
                        <button
                          onClick={() => toggleJoin(a._id, a.participants)}
                          disabled={!isJoined && isFull}
                          style={{ padding: "8px 18px", borderRadius: "8px", cursor: isJoined ? "pointer" : isFull ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem", background: isJoined ? "rgba(239,68,68,0.15)" : isFull ? "rgba(100,116,139,0.15)" : "rgba(16,185,129,0.15)", color: isJoined ? "#f87171" : isFull ? "#64748b" : "#34d399", border: `1px solid ${isJoined ? "rgba(239,68,68,0.3)" : isFull ? "rgba(100,116,139,0.2)" : "rgba(16,185,129,0.3)"}` }}
                        >
                          {isJoined ? "❌ ถอนตัว" : isFull ? "เต็มแล้ว" : "✅ เข้าร่วม (ชื่อคุณ)"}
                        </button>
                      )}
                      {isManager && <button onClick={() => deleteActivity(a._id)} style={{ padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", cursor: "pointer", fontSize: "0.8rem" }}>ลบ</button>}
                    </div>
                  </div>
                </div>
                {a.participants.length > 0 && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>ผู้เข้าร่วม ({a.participants.length}):</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                      {a.participants.map((p: any) => (
                         <span key={p} style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(201,162,39,0.1)", color: "#c9a227", fontSize: "0.8rem", border: "1px solid rgba(201,162,39,0.2)", display: "flex", alignItems: "center", gap: "6px" }}>
                           {p}
                           {isManager && (
                             <span style={{ cursor: "pointer", opacity: 0.5 }} onClick={() => toggleJoin(a._id, a.participants, p)}>×</span>
                           )}
                         </span>
                      ))}
                    </div>

                    {isManager && (
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <span style={{ color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 700 }}>🎲 จัดตี้สุ่ม:</span>
                          <input type="number" className="sog-input" style={{ width: "80px", padding: "6px 10px" }} min={1} value={teamSizes[a._id] || 5} onChange={e => setTeamSizes(prev => ({ ...prev, [a._id]: Number(e.target.value) }))} placeholder="คน/ตี้" />
                          <button className="btn-discord" style={{ padding: "6px 16px", fontSize: "0.85rem" }} onClick={() => handleRandomize(a._id, a.participants)}>สุ่มเลย!</button>
                        </div>

                        {randomTeams[a._id] && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                            {randomTeams[a._id].map((team: any, i: any) => (
                              <div key={i} style={{ background: "rgba(88,101,242,0.15)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(88,101,242,0.3)" }}>
                                <p style={{ color: "#a5b4fc", fontSize: "0.8rem", fontWeight: 700, margin: "0 0 6px" }}>ทีมที่ {i + 1}</p>
                                <p style={{ color: "white", margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>{team.join(", ")}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
