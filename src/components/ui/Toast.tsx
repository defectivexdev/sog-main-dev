import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  const isSuccess = message.startsWith("✅");
  
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }} 
          style={{ 
            padding: "12px 16px", 
            borderRadius: "10px", 
            marginBottom: "24px", 
            background: isSuccess ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", 
            color: isSuccess ? "#34d399" : "#f87171", 
            border: `1px solid ${isSuccess ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontWeight: 500
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
