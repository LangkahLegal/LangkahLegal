"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ChatHeader from "@/components/ai/ChatHeader";
import ChatMessage from "@/components/ai/ChatMessage";
import ChatInput from "@/components/ai/ChatInput";
import { MaterialIcon } from "@/components/ui/Icons";

export default function TanyaAIPage() {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Halo! Saya Kia, asisten hukum pintar Anda. Ada yang bisa saya bantu hari ini?",
      time: "10:00 AM",
    },
    // ... data mock lainnya
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulasi respons AI
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: "Terima kasih. Berdasarkan hukum di Indonesia, pendaftaran HAKI dapat dilakukan melalui Dirjen KI.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <ChatHeader
          name="Visi"
          avatarUrl="/images/visi.png" 
          status="Online"
        />

        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
        >
          <div className="max-w-5xl mx-auto w-full space-y-8">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex justify-start items-center gap-3 animate-pulse">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#1f1d35] flex items-center justify-center border border-white/10 shrink-0">
                  <MaterialIcon
                    name="smart_toy"
                    className="text-[#ada3ff] text-sm"
                  />
                </div>
                <div className="bg-[#e8e2fc]/10 px-6 py-4 rounded-full flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-[#ada3ff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#ada3ff] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#ada3ff] rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        </main>

        <ChatInput input={input} setInput={setInput} onSend={handleSend} />

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
