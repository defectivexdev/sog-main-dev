"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CheckCircle,
  Gift,
  Package,
  ShoppingCart,
  Heart,
  Store,
  Gamepad2,
  DollarSign,
  HandCoins,
  LogOut,
  ChevronDown,
  Sparkles,
  Bell,
  Trophy,
  User,
  History,
  Car,
  Calendar
} from "lucide-react";
import { useRole } from "@/hooks/useRole";

const LOGO_URL =
  "/sog-logo.png";

interface NavSection {
  title: string;
  items: { label: string; href: string; icon: React.ReactNode; managerOnly?: boolean }[];
}

const navSections: NavSection[] = [
  {
    title: "COMMUNICATION",
    items: [
      { label: "ข่าวสาร (Announcements)", href: "/announcements", icon: <Bell size={18} /> },
      { label: "ปฏิทินกิจกรรม", href: "/calendar", icon: <Calendar size={18} /> }
    ]
  },
  {
    title: "หน้าหลัก",
    items: [
      { label: "แดชบอร์ด", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
      { label: "โปรไฟล์ของฉัน", href: "/profile", icon: <User size={18} /> },
      { label: "ข้อมูลบ้าน (House)", href: "/house", icon: <Users size={18} /> },
      { label: "จัดการบ้าน", href: "/management", icon: <LayoutDashboard size={18} />, managerOnly: true },
      { label: "ทำเนียบผู้นำ (Leaderboard)", href: "/leaderboard", icon: <Trophy size={18} /> },
      { label: "ข้อมูลสมาชิก", href: "/members", icon: <Users size={18} /> }
    ],
  },
  {
    title: "จัดการสมาชิก",
    items: [
      { label: "แจ้งลา", href: "/leave", icon: <ClipboardList size={18} /> },
      { label: "เช็คชื่อคนขาด / มาสาย", href: "/attendance", icon: <CheckCircle size={18} /> },
    ],
  },
  {
    title: "แอร์ดรอป",
    items: [
      { label: "เช็คชื่อแอร์ดรอป", href: "/airdrop/check", icon: <Gift size={18} /> },
      { label: "อัพเดตของแอร์ดรอป", href: "/airdrop/update", icon: <Package size={18} /> },
    ],
  },
  {
    title: "คลังและการเงิน",
    items: [
      { label: "เบิกของ", href: "/requisition", icon: <ShoppingCart size={18} /> },
      { label: "ของสวัสดิการ", href: "/welfare", icon: <Heart size={18} /> },
      { label: "ของร้าน", href: "/store", icon: <Store size={18} /> },
      { label: "ส่งเงินแก๊งค์", href: "/payment", icon: <DollarSign size={18} /> },
      { label: "ถอนเงินแก๊งค์", href: "/withdraw", icon: <HandCoins size={18} />, managerOnly: true },
      { label: "รถแก๊งค์", href: "/vehicles", icon: <Car size={18} /> },
    ],
  },
  {
    title: "กิจกรรม",
    items: [
      { label: "ตี๊เล่นกิจกรรม", href: "/activities", icon: <Gamepad2 size={18} /> },
    ],
  },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isManager, roleLabel, roleColor, roleIcon } = useRole();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const displayName = session?.user?.icName || session?.user?.name || "สมาชิก";

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="mobile-menu-btn"
        style={{
          display: "none",
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 50,
          background: "rgba(10,15,30,0.9)",
          border: "1px solid rgba(201,162,39,0.2)",
          borderRadius: "10px",
          color: "#c9a227",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <LayoutDashboard size={20} />
      </button>

      {/* Sidebar */}
      <motion.aside
        initial="visible"
        animate="visible"
        variants={sidebarVariants}
        className={mobileOpen ? "" : "sidebar-desktop"}
        style={{
          position: "fixed",
          left: "16px",
          top: "16px",
          bottom: "16px",
          width: "260px",
          background: "linear-gradient(180deg, rgba(10,15,29,0.7) 0%, rgba(15,22,41,0.85) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(201,162,39,0.15)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* ——— Logo Section ——— */}
        <div
          style={{
            padding: "16px 20px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderBottom: "1px solid rgba(201,162,39,0.06)",
            position: "relative",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              top: "-30px",
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{
              width: "48px",
              height: "48px",
              background: "radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 70%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(201,162,39,0.18)",
              boxShadow: "0 0 30px rgba(201,162,39,0.1), inset 0 0 15px rgba(201,162,39,0.03)",
              marginBottom: "10px",
              position: "relative",
            }}
          >
            <Image
              src={LOGO_URL}
              alt="SOG Logo"
              width={32}
              height={32}
              style={{ objectFit: "contain", mixBlendMode: "screen" }}
              priority
            />
          </motion.div>
          <h2
            className="gradient-gold"
            style={{
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "-0.01em",
            }}
          >
            SOG Gang
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "4px",
            }}
          >
            <Sparkles size={10} style={{ color: "rgba(201,162,39,0.4)" }} />
            <p
              style={{
                color: "rgba(201,162,39,0.35)",
                fontSize: "0.58rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              Son of God
            </p>
            <Sparkles size={10} style={{ color: "rgba(201,162,39,0.4)" }} />
          </div>
        </div>

        {/* ——— Navigation Sections ——— */}
        <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
          {navSections.map((section: any, sIdx: any) => {
            const isCollapsed = collapsed[section.title];
            return (
              <div key={section.title} style={{ marginBottom: "2px" }}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "4px 12px",
                    background: "transparent",
                    border: "none",
                    color: "rgba(201,162,39,0.45)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    marginBottom: "2px",
                    borderRadius: "6px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "rgba(201,162,39,0.7)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(201,162,39,0.45)")
                  }
                >
                  <span>{section.title}</span>
                  <motion.span
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "flex" }}
                  >
                    <ChevronDown size={12} />
                  </motion.span>
                </button>

                {/* Section items */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      {section.items.map((item: any, i: any) => {
                        if (item.managerOnly && !isManager) return null;
                        const isActive =
                          pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            style={{ textDecoration: "none" }}
                          >
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03, duration: 0.2 }}
                              whileHover={{ x: 4 }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "7px 12px",
                                borderRadius: "10px",
                                marginBottom: "0px",
                                position: "relative",
                                cursor: "pointer",
                                color: isActive ? "#c9a227" : "#7a8ca3",
                                fontWeight: isActive ? 600 : 400,
                                fontSize: "0.8rem",
                                background: isActive
                                  ? "rgba(201,162,39,0.08)"
                                  : "transparent",
                                border: isActive
                                  ? "1px solid rgba(201,162,39,0.15)"
                                  : "1px solid transparent",
                                transition:
                                  "background 0.2s, color 0.2s, border-color 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background =
                                    "rgba(201,162,39,0.04)";
                                  e.currentTarget.style.color = "#b8c4d6";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.color = "#7a8ca3";
                                }
                              }}
                            >
                              {/* Active indicator bar */}
                              {isActive && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "20%",
                                    bottom: "20%",
                                    width: "3px",
                                    borderRadius: "0 4px 4px 0",
                                    background:
                                      "linear-gradient(180deg, #c9a227, #dbb83a)",
                                    boxShadow: "0 0 12px rgba(201,162,39,0.5)",
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                  }}
                                />
                              )}
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: isActive ? 1 : 0.7,
                                  filter: isActive
                                    ? "drop-shadow(0 0 6px rgba(201,162,39,0.4))"
                                    : "none",
                                  transition: "opacity 0.2s, filter 0.2s",
                                }}
                              >
                                {item.icon}
                              </span>
                              <span style={{ flex: 1 }}>{item.label}</span>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  style={{
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "50%",
                                    background: "#c9a227",
                                    boxShadow: "0 0 8px #c9a227",
                                  }}
                                />
                              )}
                            </motion.div>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* ——— User Profile + Logout ——— */}
        <div
          style={{
            padding: "8px 10px 8px",
            borderTop: "1px solid rgba(201,162,39,0.06)",
          }}
        >
          {session?.user && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 10px",
                background:
                  "linear-gradient(135deg, rgba(88,101,242,0.06) 0%, rgba(88,101,242,0.02) 100%)",
                border: "1px solid rgba(88,101,242,0.12)",
                borderRadius: "12px",
                marginBottom: "8px",
              }}
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={displayName}
                  width={34}
                  height={34}
                  style={{
                    borderRadius: "50%",
                    border: "2px solid rgba(88,101,242,0.35)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    background:
                      "linear-gradient(135deg, #5865f2, #4752c4)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    color: "#e2e8f0",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {displayName}
                </p>
                <p
                  style={{
                    color: roleColor,
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {roleIcon} {roleLabel}
                </p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                <NotificationBell />
              </div>
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "7px 12px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.12)",
              color: "#f87171",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.82rem",
              fontWeight: 500,
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.06)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.12)";
            }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 30,
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
