import React from "react";
import { Clock, CheckCircle2, XCircle, PackageCheck } from "lucide-react";

export type StatusType = "pending" | "approved" | "rejected" | "delivered" | "confirmed" | "open" | "closed" | "upcoming" | "completed" | "cancelled" | "active" | "inactive" | "left" | "present" | "absent" | "late";

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; colorClass: string; icon: React.ReactNode }> = {
  // Requisition / Leave / General
  pending: { label: "รอดำเนินการ", colorClass: "badge-pending", icon: <Clock size={14} /> },
  approved: { label: "อนุมัติแล้ว", colorClass: "badge-approved", icon: <CheckCircle2 size={14} /> },
  rejected: { label: "ปฏิเสธอนุมัติ", colorClass: "badge-rejected", icon: <XCircle size={14} /> },
  delivered: { label: "ส่งมอบแล้ว", colorClass: "badge-approved", icon: <PackageCheck size={14} /> },
  
  // Vehicles
  in_use: { label: "ถูกใช้งาน", colorClass: "badge-pending", icon: <Clock size={14} /> },
  
  // Welfare
  available: { label: "มีพร้อม", colorClass: "badge-approved", icon: <CheckCircle2 size={14} /> },
  out_of_stock: { label: "หมด", colorClass: "badge-rejected", icon: <XCircle size={14} /> },
  
  // Payment
  confirmed: { label: "ยืนยันแล้ว", colorClass: "badge-approved", icon: <CheckCircle2 size={14} /> },
  
  // Airdrop
  open: { label: "เปิดลงทะเบียน", colorClass: "badge-approved", icon: <CheckCircle2 size={14} /> },
  closed: { label: "ปิดแล้ว", colorClass: "badge-rejected", icon: <XCircle size={14} /> },
  
  // Activity
  upcoming: { label: "กำลังจะมาถึง", colorClass: "badge-pending", icon: <Clock size={14} /> },
  completed: { label: "เสร็จสิ้น", colorClass: "badge-approved", icon: <CheckCircle2 size={14} /> },
  cancelled: { label: "ยกเลิก", colorClass: "badge-rejected", icon: <XCircle size={14} /> },
  
  // Member
  active: { label: "ปกติ", colorClass: "badge-approved", icon: <CheckCircle2 size={14} /> },
  inactive: { label: "พักคูลดาวน์", colorClass: "badge-pending", icon: <Clock size={14} /> },
  left: { label: "ออกจากแก๊งค์", colorClass: "badge-rejected", icon: <XCircle size={14} /> },
  
  // Attendance
  present: { label: "มา", colorClass: "badge-present", icon: <CheckCircle2 size={14} /> },
  absent: { label: "ขาด", colorClass: "badge-absent", icon: <XCircle size={14} /> },
  late: { label: "มาสาย", colorClass: "badge-late", icon: <Clock size={14} /> },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status, 
    colorClass: "badge-pending", 
    icon: <Clock size={14} /> 
  };

  return (
    <span 
      className={config.colorClass} 
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: "4px", 
        padding: size === "sm" ? "2px 8px" : "4px 12px", 
        borderRadius: "20px", 
        fontSize: size === "sm" ? "0.7rem" : "0.75rem", 
        fontWeight: 700 
      }}
    >
      {config.icon} {config.label}
    </span>
  );
}
