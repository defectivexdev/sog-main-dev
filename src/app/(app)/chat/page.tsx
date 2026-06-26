"use client";
import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Link2, MessageSquare, Loader2, Smile, Volume2, VolumeX, Reply, Pin, SmilePlus, X } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import EmojiPicker, { Theme } from 'emoji-picker-react';

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥"];

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousMessagesCount = useRef(0);
  
  const isManager = ["admin", "leader", "vice_leader"].includes((session?.user as any)?.gangRole || (session?.user as any)?.role || "");

  // Play a simple pop sound using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

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
    if (messages.length > 0) {
      const isNewMessage = messages.length > previousMessagesCount.current;
      
      // If there are new messages, check the latest one
      if (isNewMessage && previousMessagesCount.current !== 0) {
        const latestMessage = messages[messages.length - 1];
        // Play sound only if it's not from me
        if (latestMessage.senderName !== matchName) {
          playNotificationSound();
        }
      }
      
      previousMessagesCount.current = messages.length;
    }
    scrollToBottom();
  }, [messages, matchName, soundEnabled]);

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
          linkUrl: linkUrl.trim(),
          replyToId: replyTo?.id
        })
      });

      if (res.ok) {
        setContent("");
        setImageUrl("");
        setLinkUrl("");
        setShowExtras(false);
        setShowEmoji(false);
        setReplyTo(null);
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

  const handleReact = async (msgId: string, emoji: string) => {
    setActiveReactionId(null);
    try {
      await fetch(`/api/chat/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji })
      });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePin = async (msgId: string) => {
    try {
      await fetch(`/api/chat/${msgId}/pin`, { method: "POST" });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.url);
        setShowExtras(true);
        showSuccess("อัปโหลดรูปภาพสำเร็จ");
      } else {
        showError(data.error || "อัปโหลดรูปภาพล้มเหลว");
      }
    } catch (err) {
      showError("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ marginBottom: "16px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MessageSquare size={32} color="#c9a227" /> สภากาแฟ (Chat Room)
          </h1>
          <p className="page-subtitle">พูดคุยแลกเปลี่ยนข่าวสารในแก๊งค์ (อัปเดตเรียลไทม์)</p>
        </div>
        
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: soundEnabled ? "#34d399" : "#94a3b8",
            padding: "8px 12px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            {soundEnabled ? "เปิดเสียง" : "ปิดเสียง"}
          </span>
        </button>
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; setHoveredMessageId(msg.id); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isMe ? "rgba(255,255,255,0.02)" : "transparent"; setHoveredMessageId(null); }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {msg.senderAvatar ? <Image src={msg.senderAvatar} alt="avatar" width={40} height={40} /> : <div style={{ fontSize: "1.2rem" }}>👤</div>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
                    
                    {msg.replyToMessage && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.85rem", marginBottom: "4px", paddingLeft: "12px", borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
                        <Reply size={12} />
                        <span style={{ fontWeight: 600 }}>{msg.replyToMessage.senderName}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px", opacity: 0.8 }}>
                          {msg.replyToMessage.content || (msg.replyToMessage.imageUrl ? "รูปภาพ" : "ข้อความ")}
                        </span>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1rem", color: isMe ? "#c9a227" : "#e2e8f0", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                        {msg.senderName}
                        {msg.isPinned && <span title="Pinned"><Pin size={12} color="#f43f5e" /></span>}
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
                      {msg.content && <div style={{ lineHeight: "1.5", wordBreak: "break-word", whiteSpace: "pre-wrap", fontSize: "0.95rem", background: msg.isPinned ? "rgba(244,63,94,0.1)" : "transparent", padding: msg.isPinned ? "4px 8px" : 0, borderRadius: "4px", borderLeft: msg.isPinned ? "2px solid #f43f5e" : "none" }}>{msg.content}</div>}
                      
                      {msg.imageUrl && (
                        <div style={{ marginTop: msg.content ? "8px" : "0" }}>
                          <img 
                            src={msg.imageUrl} 
                            alt="attachment" 
                            style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "transform 0.2s" }} 
                            onClick={() => setSelectedImage(msg.imageUrl)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          />
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
                      
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                          {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => {
                            const hasReacted = users.includes(matchName);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                title={users.join(", ")}
                                style={{
                                  display: "flex", alignItems: "center", gap: "4px",
                                  padding: "2px 6px",
                                  borderRadius: "12px",
                                  border: hasReacted ? "1px solid #c9a227" : "1px solid rgba(255,255,255,0.1)",
                                  background: hasReacted ? "rgba(201,162,39,0.15)" : "rgba(0,0,0,0.2)",
                                  fontSize: "0.85rem",
                                  cursor: "pointer",
                                  color: hasReacted ? "#c9a227" : "#94a3b8"
                                }}
                              >
                                <span>{emoji}</span>
                                <span>{users.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {hoveredMessageId === msg.id && (
                    <div style={{
                      position: "absolute",
                      right: "16px",
                      top: "-12px",
                      background: "rgba(15,22,41,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      padding: "4px",
                      gap: "4px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                    }}>
                      <button onClick={() => setActiveReactionId(activeReactionId === msg.id ? null : msg.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "4px" }} title="React">
                        <SmilePlus size={16} />
                      </button>
                      <button onClick={() => setReplyTo(msg)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "4px" }} title="Reply">
                        <Reply size={16} />
                      </button>
                      {isManager && (
                        <button onClick={() => handlePin(msg.id)} style={{ background: "transparent", border: "none", color: msg.isPinned ? "#f43f5e" : "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "4px" }} title={msg.isPinned ? "Unpin" : "Pin"}>
                          <Pin size={16} />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {activeReactionId === msg.id && (
                    <div style={{
                      position: "absolute",
                      right: "16px",
                      top: "24px",
                      background: "rgba(15,22,41,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "24px",
                      display: "flex",
                      padding: "8px",
                      gap: "8px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                      zIndex: 10
                    }}>
                      {QUICK_REACTIONS.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "4px", transition: "transform 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ background: "rgba(15,22,41,0.8)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px", position: "relative" }}>
          
          <AnimatePresence>
            {replyTo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "8px 16px", borderRadius: "8px 8px 0 0", marginBottom: "-8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>
                  <Reply size={14} />
                  <span>กำลังตอบกลับ <b>{replyTo.senderName}</b>: {replyTo.content || "ไฟล์แนบ"}</span>
                </div>
                <button type="button" onClick={() => setReplyTo(null)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              style={{ 
                width: "44px", height: "44px", borderRadius: "20px", 
                background: "transparent", 
                border: "none", color: imageUrl ? "#c9a227" : "#94a3b8", 
                display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingImage ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {uploadingImage ? <Loader2 size={20} className="spin" /> : <ImageIcon size={20} />}
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

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: "40px" }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }} 
              src={selectedImage} 
              alt="preview" 
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "12px", cursor: "default", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }} 
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              onClick={() => setSelectedImage(null)} 
              style={{ position: "absolute", top: "30px", right: "30px", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >
              <X size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
