import React from "react";

interface RoleBadgeProps {
  icon?: React.ReactNode;
  label: string;
  color: string;
}

export default function RoleBadge({ icon, label, color }: RoleBadgeProps) {
  return (
    <span 
      style={{ 
        padding: "8px 16px", 
        borderRadius: "20px", 
        fontSize: "0.85rem", 
        fontWeight: 700, 
        color: color, 
        background: `${color}18`, 
        display: "flex", 
        alignItems: "center", 
        gap: "6px",
        width: "fit-content"
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
