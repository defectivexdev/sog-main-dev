import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label 
        style={{ 
          color: "#94a3b8", 
          fontSize: "0.85rem", 
          display: "block", 
          marginBottom: "6px", 
          fontWeight: 600 
        }}
      >
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
