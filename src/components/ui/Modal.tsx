import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = "500px" }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.8)", 
            backdropFilter: "blur(4px)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000,
            padding: "16px"
          }} 
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            className="glass-card" 
            style={{ 
              padding: "24px", 
              width: "100%", 
              maxWidth: maxWidth, 
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto"
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose} 
              style={{ 
                position: "absolute", 
                top: "16px", 
                right: "16px", 
                background: "transparent", 
                border: "none", 
                color: "#94a3b8", 
                cursor: "pointer" 
              }}
            >
              <X size={20} />
            </button>
            <h2 style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 700, margin: "0 0 20px" }}>
              {title}
            </h2>
            
            {children}
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
