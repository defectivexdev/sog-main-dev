"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRole } from "@/hooks/useRole";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GangEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  createdBy: string;
}

const typeColors: Record<string, string> = {
  event: "#c9a227",
  meeting: "#3b82f6",
  war: "#ef4444",
};

const typeLabels: Record<string, string> = {
  event: "กิจกรรม",
  meeting: "นัดประชุม",
  war: "ตีเมือง / วอร์",
};

export default function CalendarPage() {
  const { data: session } = useSession();
  const { isManager, roleLabel } = useRole();
  const isLeaderOrVice = roleLabel === "หัวหน้าแก๊งค์" || roleLabel === "รองหัวหน้า" || roleLabel === "แอดมิน";
  
  const [events, setEvents] = useState<GangEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", time: "", type: "event" });
  const [submitting, setSubmitting] = useState(false);

  // Selected Day state
  const [selectedDayEvents, setSelectedDayEvents] = useState<GangEvent[]>([]);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (e) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Combine date and time
    const dateTimeString = `${form.startDate}T${form.time || "00:00"}:00`;

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startDate: dateTimeString,
          type: form.type
        })
      });

      if (res.ok) {
        toast.success("เพิ่มกิจกรรมเรียบร้อย");
        setModalOpen(false);
        refresh();
      } else {
        const errorData = await res.json();
        toast.error(`ข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (e) {
      toast.error("การเชื่อมต่อล้มเหลว");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบกิจกรรมนี้?")) return;
    try {
      const res = await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบสำเร็จ");
        refresh();
        setDayModalOpen(false);
      }
    } catch (e) {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' });

    const days = [];
    // Empty slots for days before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Calculate local today string in YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const dayEvents = events.filter(e => {
        const localDate = new Date(e.startDate);
        const localDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        return localDateStr === dateStr;
      });

      const isToday = dateStr === todayStr;

      days.push(
        <div 
          key={`day-${i}`} 
          className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
          onClick={() => {
            if (dayEvents.length > 0) {
              setSelectedDayEvents(dayEvents);
              setDayModalOpen(true);
            }
          }}
        >
          <span className="day-number">{i}</span>
          <div className="day-events-container">
            {dayEvents.slice(0, 3).map((e, idx) => (
              <div key={e.id} className="day-event-badge" style={{ borderLeftColor: typeColors[e.type] || typeColors.event }}>
                {e.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="day-event-more">+{dayEvents.length - 3} เพิ่มเติม</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-container glass-card">
        <div className="calendar-header">
          <button onClick={prevMonth} className="btn-icon"><ChevronLeft /></button>
          <h2>{monthName}</h2>
          <button onClick={nextMonth} className="btn-icon"><ChevronRight /></button>
        </div>
        <div className="calendar-grid">
          {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(d => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarIcon size={32} color="#c9a227" /> ปฏิทินกิจกรรม (Gang Calendar)
          </h1>
          <p className="page-subtitle">ติดตามตารางนัดหมาย กิจกรรม และการวอร์ของแก๊งค์</p>
        </div>
        
        {isLeaderOrVice && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
            setForm({ title: "", description: "", startDate: new Date().toISOString().split("T")[0], time: "20:00", type: "event" });
            setModalOpen(true);
          }} className="btn-gold" style={{ display: "flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 20px" }}>
            <Plus size={18} /> สร้างนัดหมายใหม่
          </motion.button>
        )}
      </div>

      {/* Calendar */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>กำลังโหลดปฏิทิน...</div>
      ) : (
        <>
          {renderCalendar()}
        </>
      )}

      {/* Styles for Calendar directly here for simplicity */}
      <style dangerouslySetInnerHTML={{__html: `
        .calendar-container { padding: 24px; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .calendar-header h2 { margin: 0; color: #e2e8f0; font-size: 1.5rem; font-weight: 800; }
        .btn-icon { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; border-radius: 8px; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-icon:hover { background: rgba(255,255,255,0.1); }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .calendar-weekday { text-align: center; font-weight: 700; color: #94a3b8; padding: 10px 0; font-size: 0.9rem; }
        .calendar-day { min-height: 100px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 8px; position: relative; transition: all 0.2s; }
        .calendar-day.empty { background: transparent; border-color: transparent; }
        .calendar-day.today { border-color: #c9a227; background: rgba(201,162,39,0.05); }
        .calendar-day.has-events { cursor: pointer; }
        .calendar-day.has-events:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
        .day-number { display: inline-block; width: 24px; height: 24px; text-align: center; line-height: 24px; border-radius: 50%; font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
        .today .day-number { background: #c9a227; color: #fff; }
        .day-events-container { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
        .day-event-badge { font-size: 0.7rem; padding: 4px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #cbd5e1; }
        .day-event-more { font-size: 0.7rem; color: #64748b; text-align: center; margin-top: 2px; }
        
        @media (max-width: 768px) {
          .calendar-day { min-height: 80px; padding: 4px; }
          .day-event-badge { display: none; }
          .day-events-container { position: absolute; bottom: 8px; right: 8px; left: auto; flex-direction: row; }
          .has-events .day-events-container::after { content: ''; width: 8px; height: 8px; background: #c9a227; border-radius: 50%; display: block; }
          .day-event-more { display: none; }
        }
      `}} />

      {/* Add Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card" style={{ width: "100%", maxWidth: "500px", padding: "32px", position: "relative" }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }} className="hover-text-white">
                <X size={24} />
              </button>
              
              <h2 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.4rem", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Plus size={24} color="#c9a227" /> สร้างนัดหมายใหม่
              </h2>

              <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>หัวข้อ / ชื่อกิจกรรม *</label>
                  <input type="text" className="sog-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="เช่น ประชุมแก๊งค์ประจำสัปดาห์" />
                </div>
                
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>วันที่ *</label>
                    <input type="date" className="sog-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>เวลา *</label>
                    <input type="time" className="sog-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>ประเภท *</label>
                  <select className="sog-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="event">กิจกรรมทั่วไป</option>
                    <option value="meeting">นัดประชุม</option>
                    <option value="war">ตีเมือง / นัดวอร์</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                  <textarea className="sog-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="สถานที่ หรือสิ่งที่ต้องเตรียมมา..." style={{ resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "12px 24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#e2e8f0", fontWeight: 600, cursor: "pointer" }} className="hover-bg-glass">
                    ยกเลิก
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} className="btn-gold" style={{ padding: "12px 24px", borderRadius: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "กำลังบันทึก..." : "เพิ่มลงปฏิทิน"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Events Modal */}
      <AnimatePresence>
        {dayModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card" style={{ width: "100%", maxWidth: "450px", padding: "32px", position: "relative" }}>
              <button type="button" onClick={() => setDayModalOpen(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }} className="hover-text-white">
                <X size={24} />
              </button>
              
              <h2 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.4rem", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <CalendarIcon size={24} color="#c9a227" /> กิจกรรมวันที่ {new Date(selectedDayEvents[0]?.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {selectedDayEvents.map(e => {
                  const dateObj = new Date(e.startDate);
                  const timeString = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={e.id} style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", borderLeft: `4px solid ${typeColors[e.type] || typeColors.event}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#e2e8f0", fontWeight: 700 }}>{e.title}</h3>
                        <span style={{ fontSize: "0.75rem", padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", color: typeColors[e.type] || typeColors.event, fontWeight: 700 }}>
                          {typeLabels[e.type] || "กิจกรรม"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "0.85rem", marginBottom: e.description ? "8px" : 0 }}>
                        <Clock size={14} /> เวลา: {timeString} น.
                      </div>
                      {e.description && (
                        <div style={{ fontSize: "0.9rem", color: "#cbd5e1", marginTop: "8px", background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "8px" }}>
                          {e.description}
                        </div>
                      )}
                      
                      <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>สร้างโดย: {e.createdBy}</div>
                        {isLeaderOrVice && (
                          <button onClick={() => handleDelete(e.id)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 600 }} className="hover-text-white">
                            <Trash2 size={14} /> ลบ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
