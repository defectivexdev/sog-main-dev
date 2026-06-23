"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Search, User, Users, ClipboardList, DollarSign, 
  PackageCheck, TrendingUp, Building, Settings, Home, X
} from "lucide-react";

interface PaletteItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  url: string;
  type: "route" | "member";
  description?: string;
}

const STATIC_ROUTES: PaletteItem[] = [
  { id: "route-dashboard", name: "หน้าแรก (Dashboard)", icon: <Home size={18} />, url: "/dashboard", type: "route", description: "ภาพรวมของแก๊งค์" },
  { id: "route-profile", name: "ข้อมูลส่วนตัว (Profile)", icon: <User size={18} />, url: "/profile", type: "route", description: "ดูบัตรแก๊งค์และสถิติส่วนตัว" },
  { id: "route-members", name: "จัดการสมาชิก", icon: <Users size={18} />, url: "/members", type: "route", description: "ดูรายชื่อและข้อมูลสมาชิกทั้งหมด" },
  { id: "route-leave", name: "ระบบลางาน", icon: <ClipboardList size={18} />, url: "/leave", type: "route", description: "แจ้งลา / อนุมัติการลา" },
  { id: "route-financial", name: "รายรับรายจ่าย", icon: <DollarSign size={18} />, url: "/financial", type: "route", description: "นำส่งเงินและเบิกจ่าย" },
  { id: "route-airdrop", name: "กิจกรรม & Airdrop", icon: <PackageCheck size={18} />, url: "/airdrop", type: "route", description: "ตารางกิจกรรมและกล่อง Airdrop" },
  { id: "route-leaderboard", name: "สถิติแก๊งค์", icon: <TrendingUp size={18} />, url: "/leaderboard", type: "route", description: "อันดับผลงานสมาชิก" },
  { id: "route-house", name: "จัดการบ้าน", icon: <Building size={18} />, url: "/house", type: "route", description: "ดูข้อมูลและสมาชิกบ้าน" },
  { id: "route-management", name: "จัดการแก๊งค์", icon: <Settings size={18} />, url: "/management", type: "route", description: "ตั้งค่าเว็บ, Webhook, แอดมิน" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<PaletteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load members lazily when opened
  useEffect(() => {
    if (isOpen && members.length === 0) {
      fetch("/api/members")
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data)) {
            const mapped = data.data.map((m: any) => ({
              id: `member-${m.id}`,
              name: m.icName || m.name,
              description: `@${m.name} ${m.nickname ? `(${m.nickname})` : ""}`,
              url: `/members?memberId=${m.id}`,
              type: "member",
              icon: <User size={18} className="text-slate-400" />
            }));
            setMembers(mapped);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = [...STATIC_ROUTES, ...members].filter((item) => {
    const lowerQuery = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerQuery))
    );
  }).slice(0, 10); // Show max 10 results

  useEffect(() => {
    setSelectedIndex(0); // Reset selection when query changes
  }, [query]);

  const handleSelect = (item: PaletteItem) => {
    setIsOpen(false);
    router.push(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(10, 15, 30, 0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 9999,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              top: "15vh",
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "600px",
              background: "rgba(15, 22, 41, 0.95)",
              border: "1px solid rgba(201, 162, 39, 0.3)",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(201, 162, 39, 0.15)",
              zIndex: 10000,
              overflow: "hidden",
            }}
          >
            {/* Input Area */}
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px" }}>
              <Search size={22} color="#c9a227" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ค้นหาเมนู หรือพิมพ์ชื่อลูกแก๊งค์..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: "1.1rem",
                }}
              />
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ 
                  background: "rgba(255,255,255,0.1)", 
                  border: "none", 
                  color: "#94a3b8", 
                  borderRadius: "6px", 
                  padding: "4px 8px", 
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                ESC
              </button>
            </div>

            {/* Results Area */}
            <div style={{ maxHeight: "350px", overflowY: "auto", padding: "8px" }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                  ไม่พบผลลัพธ์ที่ตรงกับ "{query}"
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {filteredItems.map((item: any, idx: any) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            background: isSelected ? "rgba(201, 162, 39, 0.15)" : "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            textAlign: "left",
                            color: isSelected ? "#fff" : "#cbd5e1",
                            transition: "background 0.1s",
                          }}
                        >
                          <div style={{ color: isSelected ? "#c9a227" : "#64748b" }}>
                            {item.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.95rem", fontWeight: isSelected ? 600 : 500 }}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: "0.75rem", color: isSelected ? "#94a3b8" : "#64748b", marginTop: "2px" }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: "10px" }}>
                            {item.type === "route" ? "Menu" : "Member"}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
