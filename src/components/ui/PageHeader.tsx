import React from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  roleBadge?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = "#c9a227",
  roleBadge,
  actions
}: PageHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Icon size={32} color={iconColor} /> {title}
          </h1>
          {actions}
        </div>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {roleBadge}
    </div>
  );
}
