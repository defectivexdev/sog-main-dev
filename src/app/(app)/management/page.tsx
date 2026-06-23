"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Users, Building, Save, Plus, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ManagementPage() {
  const { data: setRes, mutate: refreshSettings } = useSWR('/api/settings', fetcher);
  const { data: houseRes, mutate: refreshHouses } = useSWR('/api/houses', fetcher);
  const { data: memRes, mutate: refreshMembers } = useSWR('/api/members', fetcher);
  
  const loading = !setRes && !houseRes && !memRes;
  const houses = houseRes || [];
  
  const memData = memRes?.data || memRes || [];
  const members = Array.isArray(memData) ? memData.filter((m: any) => m.status === "active") : [];
  
  const [editSettings, setEditSettings] = useState<any>(null);

  
  useEffect(() => {
    if (setRes && !editSettings) {
      setEditSettings({
        weeklyTaxAmount: setRes.weeklyTaxAmount || 0,
        bankAccountNo: setRes.bankAccountNo || "",
        bankAccountName: setRes.bankAccountName || "",
        webhookPayment: setRes.webhookPayment || "",
        webhookLeave: setRes.webhookLeave || "",
        webhookAirdrop: setRes.webhookAirdrop || ""
      });
    }
  }, [setRes, editSettings]);
  
  const [newHouseName, setNewHouseName] = useState("");

  const fetchData = () => {
    refreshSettings();
    refreshHouses();
    refreshMembers();
  };

  const saveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSettings)
      });
      if (res.ok) toast.success("บันทึกการตั้งค่าสำเร็จ!");
      else toast.error("เกิดข้อผิดพลาด");
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ");
    }
  };

  const createHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseName) return;
    try {
      const res = await fetch("/api/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHouseName })
      });
      if (res.ok) {
        toast.success("สร้างบ้านสำเร็จ!");
        setNewHouseName("");
        fetchData();
      } else toast.error("เกิดข้อผิดพลาด");
    } catch (err) {
      toast.error("สร้างไม่สำเร็จ");
    }
  };

  const deleteHouse = async (id: string) => {
    if (!confirm("ต้องการลบบ้านนี้ใช่หรือไม่? สมาชิกในบ้านจะถูกปลดออกจากบ้าน")) return;
    try {
      const res = await fetch(`/api/houses/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบบ้านสำเร็จ");
        fetchData();
      } else toast.error("เกิดข้อผิดพลาด");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const updateHouseHead = async (houseId: string, headId: string) => {
    const house = houses.find((h: any) => h.id === houseId);
    if (!house) return;
    try {
      const res = await fetch(`/api/houses/${houseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: house.name, headId: headId || null })
      });
      if (res.ok) {
        toast.success("อัปเดตหัวหน้าบ้านสำเร็จ");
        fetchData();
      } else toast.error("อัปเดตล้มเหลว");
    } catch (err) {
      toast.error("อัปเดตล้มเหลว");
    }
  };

  const assignMemberHouse = async (memberId: string, houseId: string) => {
    try {
      const res = await fetch(`/api/members/house`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, houseId: houseId || null })
      });
      if (res.ok) {
        toast.success("อัปเดตบ้านของสมาชิกสำเร็จ");
        fetchData();
      } else toast.error("อัปเดตล้มเหลว");
    } catch (err) {
      toast.error("อัปเดตล้มเหลว");
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-400">กำลังโหลด...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="animate-fade-in" 
      style={{ paddingBottom: "40px" }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={32} color="#c9a227" /> จัดการบ้าน (Management)
        </h1>
        <p className="page-subtitle">เฉพาะหัวหน้าและรองหัวหน้าเท่านั้น</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Houses Section */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="glass-card" 
          style={{ padding: "24px" }}
        >
          <h2 style={{ color: "#c9a227", fontSize: "1.2rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Building size={20} /> จัดการบ้าน (House Management)
          </h2>
          
          <form onSubmit={createHouse} style={{ display: "flex", gap: "12px", marginBottom: "24px", maxWidth: "400px" }}>
            <input 
              type="text" 
              className="sog-input" 
              placeholder="ชื่อบ้านใหม่..." 
              value={newHouseName}
              onChange={e => setNewHouseName(e.target.value)}
            />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit" 
              className="btn-gold" 
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 16px" }}
            >
              <Plus size={16} /> เพิ่ม
            </motion.button>
          </form>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {houses.map((house: any, idx: number) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(201, 162, 39, 0.15)" }}
                key={house.id} 
                style={{ background: "rgba(15,22,41,0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(201,162,39,0.15)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{house.name}</h3>
                  <button onClick={() => deleteHouse(house.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>หัวหน้าบ้าน (House Head)</label>
                  <select 
                    className="sog-input" 
                    value={house.headId || ""} 
                    onChange={e => updateHouseHead(house.id, e.target.value)}
                    style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.icName || m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>ลูกบ้าน ({house.members.length} คน)</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {house.members.length === 0 ? <span style={{ color: "#475569", fontSize: "0.75rem" }}>ไม่มีลูกบ้าน</span> : null}
                    {house.members.map((hm: any) => (
                      <span key={hm.id} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px", color: "#cbd5e1" }}>
                        {hm.icName || hm.name}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Assign Members to Houses */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="glass-card" 
          style={{ padding: "24px" }}
        >
          <h2 style={{ color: "#c9a227", fontSize: "1.2rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={20} /> จัดสรรสมาชิกเข้าบ้าน
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: "0.85rem", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px" }}>สมาชิก</th>
                  <th style={{ padding: "12px 8px" }}>Discord / ชื่อ</th>
                  <th style={{ padding: "12px 8px" }}>สังกัดบ้าน</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px 8px", color: "#e2e8f0", fontWeight: 600 }}>{member.icName || "-"}</td>
                    <td style={{ padding: "12px 8px", color: "#94a3b8", fontSize: "0.85rem" }}>{member.name}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <select 
                        className="input-field"
                        value={member.houseId || ""}
                        onChange={e => assignMemberHouse(member.id, e.target.value)}
                        style={{ padding: "6px 12px", fontSize: "0.85rem", minWidth: "150px" }}
                      >
                        <option value="">-- ไร้สังกัด --</option>
                        {houses.map((h: any) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
