"use client";
import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Link2, MessageSquare, Loader2, Smile } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import EmojiPicker, { Theme } from 'emoji-picker-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ChatPage() {
  const { data: session } = useSession();
  const { showSuccess, showError } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll every 3 seconds
  const { data: fetchRes, mutate } = useSWR('/api/chat', fetcher, { refreshInterval: 3000 });
  const messages = fetchRes?.data || [];

  const currentUser = session?.user?.name || "";
  const currentIcName = (session?.user as any)?.icName || "";
  const matchName = currentIcName || currentUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim() && !linkUrl.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim(),
          linkUrl: linkUrl.trim()
        })
      });

      if (res.ok) {
        setContent("");
        setImageUrl("");
        setLinkUrl("");
        setShowExtras(false);
        setShowEmoji(false);
        mutate();
        setTimeout(scrollToBottom, 100);
      } else {
        showError("ไม่สามารถส่งข้อความได้");
      }
    } catch (err) {
      showError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
    setSending(false);
  };

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ marginBottom: "16px", flexShrink: 0 }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MessageSquare size={32} color="#c9a227" /> สภากาแฟ (Chat Room)
        </h1>
        <p className="page-subtitle">พูดคุยแลกเปลี่ยนข่าวสารในแก๊งค์ (อัปเดตเรียลไทม์)</p>
      </div>

      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.length === 0 ? (
            <div style={{ margin: "auto", color: "#64748b", textAlign: "center" }}>
              <MessageSquare size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
              ยังไม่มีข้อความ เริ่มคุยกันได้เลย!
            </div>
          ) : (
            messages.map((msg: any, i: number) => {
              const isMe = msg.senderName === matchName;
              
              // Ensure URL strings are clean, or extract first URL if necessary
              const cleanLinkUrl = msg.linkUrl && msg.linkUrl.startsWith('http') ? msg.linkUrl : (msg.linkUrl ? `https://${msg.linkUrl}` : null);
              
              return (
                <motion.div 
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: isMe ? "rgba(255,255,255,0.02)" : "transparent",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isMe ? "rgba(255,255,255,0.02)" : "transparent")}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {msg.senderAvatar ? <Image src={msg.senderAvatar} alt="avatar" width={40} height={40} /> : <div style={{ fontSize: "1.2rem" }}>👤</div>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1rem", color: isMe ? "#c9a227" : "#e2e8f0", fontWeight: 700 }}>
                        {msg.senderName}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {new Date(msg.createdAt).toLocaleDateString("th-TH")} {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    
                    <div style={{
                      color: "#cbd5e1",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      {msg.content && <div style={{ lineHeight: "1.5", wordBreak: "break-word", whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>{msg.content}</div>}
                      
                      {msg.imageUrl && (
                        <div style={{ marginTop: msg.content ? "8px" : "0" }}>
                          <img src={msg.imageUrl} alt="attachment" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                        </div>
                      )}
                      
                      {cleanLinkUrl && (
                        <a href={cleanLinkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(56,189,248,0.1)",
                          color: "#38bdf8",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          textDecoration: "none",
                          marginTop: "4px",
                          border: "1px solid rgba(56,189,248,0.2)",
                          width: "fit-content"
                        }}>
                          <Link2 size={14} /> เปิดลิ้งค์ที่แนบมา
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ background: "rgba(15,22,41,0.8)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px", position: "relative" }}>
          
          <AnimatePresence>
            {showEmoji && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }} 
                style={{ position: "absolute", bottom: "100%", right: "16px", marginBottom: "12px", zIndex: 100 }}
              >
                <EmojiPicker 
                  theme={Theme.DARK}
                  onEmojiClick={(emojiObject) => {
                    setContent(prev => prev + emojiObject.emoji);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showExtras && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: "12px", display: "flex", gap: "12px" }}>
                <input 
                  type="text" 
                  className="sog-input" 
                  placeholder="ลิ้งค์รูปภาพ (URL)" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  className="sog-input" 
                  placeholder="ลิ้งค์เว็บไซต์ (URL)" 
                  value={linkUrl} 
                  onChange={(e) => setLinkUrl(e.target.value)} 
                  style={{ flex: 1 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} style={{ display: "flex", gap: "12px", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "24px", padding: "4px" }}>
            <button 
              type="button" 
              onClick={() => setShowExtras(!showExtras)}
              style={{ 
                width: "44px", height: "44px", borderRadius: "20px", 
                background: "transparent", 
                border: "none", color: showExtras ? "#c9a227" : "#94a3b8", 
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <ImageIcon size={20} />
            </button>
            
            <input 
              type="text" 
              className="sog-input" 
              placeholder="พูดคุยเรื่องทั่วไปในแก๊งค์..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              style={{ flex: 1, borderRadius: "24px", padding: "12px", background: "transparent", border: "none", outline: "none", color: "#fff" }}
            />
            
            <button 
              type="button" 
              onClick={() => setShowEmoji(!showEmoji)}
              style={{ 
                width: "40px", height: "40px", borderRadius: "50%", 
                background: "transparent", 
                border: "none", color: showEmoji ? "#c9a227" : "#94a3b8", 
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Smile size={20} />
            </button>

            <button 
              type="submit" 
              disabled={sending || (!content && !imageUrl && !linkUrl)}
              style={{ 
                width: "44px", height: "44px", borderRadius: "20px", 
                background: (!content && !imageUrl && !linkUrl) ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #c9a227, #b45309)", 
                border: "none", color: (!content && !imageUrl && !linkUrl) ? "#94a3b8" : "#fff", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                cursor: sending ? "not-allowed" : "pointer",
                opacity: sending ? 0.7 : 1,
                transition: "all 0.2s"
              }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
