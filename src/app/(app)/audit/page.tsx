"use client";

import { useRole } from "@/hooks/useRole";
import { ShieldCheck, History, User, Calendar, Tag } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface AuditLog {
  id: string;
  action: string;
  details: string;
  actorName: string;
  actorRole: string;
  targetId?: string;
  createdAt: string;
}

export default function AuditPage() {
  const { isManager, roleIcon, roleLabel, roleColor } = useRole();
  const { data, isLoading } = useSWR('/api/audit', fetcher);
  
  if (!isManager && !isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
        <ShieldCheck size={64} color="#f87171" />
        <h2 style={{ color: "#f87171", margin: 0 }}>ไม่มีสิทธิ์เข้าถึง</h2>
        <p style={{ color: "#94a3b8" }}>เฉพาะระดับบริหารเท่านั้นที่สามารถดูประวัติการทำรายการได้</p>
      </div>
    );
  }

  const logs: AuditLog[] = data?.logs || [];

  const getActionColor = (action: string) => {
    if (action.includes("APPROVE") || action.includes("INCOME")) return "#34d399";
    if (action.includes("REJECT") || action.includes("EXPENSE") || action.includes("DELETE")) return "#f87171";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "#60a5fa";
    return "#c9a227";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "APPROVE_PAYMENT": "อนุมัติเงิน",
      "REJECT_PAYMENT": "ปฏิเสธเงิน",
      "APPROVE_LEAVE": "อนุมัติลา",
      "REJECT_LEAVE": "ปฏิเสธลา",
      "APPROVE_REQUISITION": "อนุมัติเบิกของ",
      "REJECT_REQUISITION": "ปฏิเสธเบิกของ",
    };
    return labels[action] || action;
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <History size={32} color="#c9a227" /> ประวัติการทำรายการ (Audit Log)
          </h1>
          <p className="page-subtitle">ตรวจสอบประวัติการอนุมัติและการแก้ไขข้อมูลทั้งหมด</p>
        </div>
        <span style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}40`, display: "flex", alignItems: "center", gap: "8px" }}>
          {roleIcon} {roleLabel}
        </span>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>กำลังโหลดข้อมูล...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>ยังไม่มีประวัติการทำรายการ</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={14} /> วันเวลา</div>
                  </th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Tag size={14} /> ประเภท</div>
                  </th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>รายละเอียด</th>
                  <th style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><User size={14} /> ผู้ทำรายการ</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover:bg-white/5">
                    <td style={{ padding: "16px 20px", fontSize: "0.9rem", color: "#cbd5e1", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ 
                        padding: "4px 10px", 
                        borderRadius: "12px", 
                        fontSize: "0.75rem", 
                        fontWeight: 700, 
                        color: getActionColor(log.action), 
                        background: `${getActionColor(log.action)}15`,
                        border: `1px solid ${getActionColor(log.action)}30`,
                        whiteSpace: "nowrap"
                      }}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: "0.9rem", color: "#f8fafc" }}>
                      {log.details}
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: "0.9rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{log.actorName}</span>
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{log.actorRole}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
