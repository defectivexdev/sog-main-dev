"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { User, Phone, Edit3, Save, MessageCircle, DollarSign, Umbrella, Crown, CheckCircle2, ShieldCheck } from "lucide-react";
import GangIDCard from "@/components/GangIDCard";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProfilePage() {
  const { data, mutate, isLoading } = useSWR('/api/profile/stats', fetcher);
  const { roleIcon, roleLabel, roleColor } = useRole();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);



  if (isLoading) {
    return <div className="p-8 text-center" style={{ color: "#94a3b8" }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  if (!data?.member) {
    return <div className="p-8 text-center text-red-400">ไม่พบข้อมูลโปรไฟล์</div>;
  }

  const { member, stats } = data;

  const handleSave = async () => {
    setSaving(true);
    // Future editable fields can be saved here
    setTimeout(() => {
      setEditMode(false);
      setSaving(false);
      toast.success("บันทึกข้อมูลเรียบร้อย");
    }, 500);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>
          โปรไฟล์ของฉัน
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) 2fr", gap: "20px" }}>
        
        {/* Left Column: Avatar & Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="glass-card" style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              background: `linear-gradient(135deg, ${roleColor}40, rgba(255,255,255,0.1))`,
              border: `2px solid ${roleColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              marginBottom: "16px",
              boxShadow: `0 0 20px ${roleColor}20`
            }}>
              {member.avatar ? (
                <img src={member.avatar} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : roleIcon}
            </div>
            
            <h2 style={{ color: "#e2e8f0", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px" }}>
              {member.icName || member.name}
            </h2>
            <div style={{ 
              padding: "4px 12px", 
              borderRadius: "20px", 
              background: `${roleColor}15`, 
              color: roleColor, 
              fontSize: "0.85rem", 
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px"
            }}>
              {roleIcon} {roleLabel}
            </div>

            {member.house && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "0.9rem", marginTop: "8px" }}>
                <Crown size={16} color="#c9a227" /> สังกัด: <span style={{ color: "#c9a227", fontWeight: 700 }}>{member.house.name}</span>
              </div>
            )}
          </div>

          {/* Stats Boxes */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={20} color="#34d399" /> ยอดเงินส่งเข้าคลัง
            </h3>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#34d399" }}>
              ฿{stats.totalPaid.toLocaleString()}
            </div>
          </div>

          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Umbrella size={20} color="#60a5fa" /> จำนวนวันที่ลาทั้งหมด
            </h3>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#60a5fa" }}>
              {stats.totalLeaveDays} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>วัน</span>
            </div>
          </div>

        </div>

        {/* Right Column: Settings Form & Gang ID */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="glass-card" style={{ padding: "30px" }}>
            <h3 style={{ color: "#c9a227", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} /> บัตรประจำตัวชาวแก๊งค์ (Gang ID)
            </h3>
            <GangIDCard user={member} />
          </div>

          <div className="glass-card" style={{ padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
              <h3 style={{ color: "#c9a227", fontSize: "1.2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={20} /> ข้อมูล IC (ในเกม)
              </h3>
            </div>          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* IC Name (Disabled) */}
            <div>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 600 }}>
                <User size={14} /> ชื่อตัวละคร (IC Name)
              </label>
              <input 
                type="text" 
                className="sog-input" 
                value={member.icName || "-"} 
                disabled 
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <span style={{ fontSize: "0.75rem", color: "#f87171", display: "block", marginTop: "6px" }}>
                * ไม่สามารถเปลี่ยนชื่อ IC ได้ หากมีปัญหาให้ติดต่อ หัวหน้าแก๊งค์ หรือ รองหัวหน้า
              </span>
            </div>

            {/* Phone (Disabled) */}
            <div>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 600 }}>
                <Phone size={14} /> เบอร์โทรศัพท์ในเมือง (In-Game Phone)
              </label>
              <input 
                type="text" 
                className="sog-input" 
                value={member.phone || "-"} 
                disabled 
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <span style={{ fontSize: "0.75rem", color: "#f87171", display: "block", marginTop: "6px" }}>
                * ไม่สามารถเปลี่ยนเบอร์โทรได้ หากมีปัญหาให้ติดต่อ หัวหน้าแก๊งค์ หรือ รองหัวหน้า
              </span>
            </div>



          </div>
        </div>
        </div>

      </div>
    </div>
  );
}
