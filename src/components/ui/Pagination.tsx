import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" }}>
      <button 
        onClick={() => onPageChange(Math.max(1, page - 1))} 
        disabled={page === 1} 
        style={{ 
          padding: "8px 16px", 
          background: "rgba(255,255,255,0.05)", 
          border: "1px solid rgba(255,255,255,0.1)", 
          borderRadius: "8px", 
          color: page === 1 ? "#64748b" : "#e2e8f0", 
          cursor: page === 1 ? "not-allowed" : "pointer", 
          fontWeight: 600 
        }}
      >
        ก่อนหน้า
      </button>
      
      <span style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: 600 }}>
        หน้า {page} จาก {totalPages}
      </span>
      
      <button 
        onClick={() => onPageChange(Math.min(totalPages, page + 1))} 
        disabled={page === totalPages} 
        style={{ 
          padding: "8px 16px", 
          background: "rgba(255,255,255,0.05)", 
          border: "1px solid rgba(255,255,255,0.1)", 
          borderRadius: "8px", 
          color: page === totalPages ? "#64748b" : "#e2e8f0", 
          cursor: page === totalPages ? "not-allowed" : "pointer", 
          fontWeight: 600 
        }}
      >
        ถัดไป
      </button>
    </div>
  );
}
