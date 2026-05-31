"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./components/NavBar";
import VoiceOrb from "./components/VoiceOrb";
import { loadData } from "./lib/store";
import type { Message } from "./lib/types";

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wakeActive, setWakeActive] = useState(false);
  const [statusText, setStatusText] = useState('Say "Fay" to wake me up');
  const [inputText, setInputText] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Clean text — remove any markdown or special chars before speaking
    const cleanText = text
      .replace(/[#*_~`]/g, "")
      .replace(/\n+/g, ". ")
      .trim();

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    // Priority order — most natural sounding voices
    const preferred =
      voices.find(v => v.name === "Google UK English Female") ||
      voices.find(v => v.name === "Samantha") ||
      voices.find(v => v.name === "Karen") ||
      voices.find(v => v.name === "Ava") ||
      voices.find(v => v.name === "Victoria") ||
      voices.find(v => v.name === "Allison") ||
      voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find(v => v.lang === "en-GB" && !v.name.includes("Male")) ||
      voices.find(v => v.lang === "en-US" && !v.name.includes("Male")) ||
      voices.find(v => v.lang.startsWith("en"));

    if (preferred) utter.voice = preferred;
    synthRef.current = utter;
    setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setStatusText("Thinking...");

      try {
        const data = loadData();
        const res = await fetch("/api/fay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].slice(-10),
            context: {
              tiktokAccounts: data.tiktokAccounts.map((a) => ({
                username: a.username,
                niche: a.niche,
                followers: a.followers,
              })),
              pendingTasks: data.tasks.filter((t) => !t.done).length,
              recentRevenue: data.transactions
                .filter((t) => t.type === "income")
                .slice(-5)
                .reduce((s, t) => s + t.amount, 0),
            },
          }),
        });

        const { text: reply } = await res.json();
        const fayMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "fay",
          text: reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fayMsg]);
        setStatusText("Listening...");
        speak(reply);
      } catch {
        setStatusText('Say "Fay" to wake me up');
      }
    },
    [messages, speak]
  );

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window))
      return;

    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let capturedFinal = "";

    const stopAndSend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      rec.stop();
      if (capturedFinal.trim()) {
        sendMessage(capturedFinal.trim());
        capturedFinal = "";
      }
      setTranscript("");
    };

    rec.onstart = () => {
      setListening(true);
      setStatusText("Listening...");
      // auto-stop after 8 seconds max
      silenceTimer = setTimeout(stopAndSend, 8000);
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) capturedFinal += final;
      setTranscript(capturedFinal || interim);

      // reset silence timer — stop 1.2s after last speech
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(stopAndSend, 1200);
    };

    rec.onspeechend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(stopAndSend, 600);
    };

    rec.onend = () => {
      setListening(false);
      setTranscript("");
      if (capturedFinal.trim()) {
        sendMessage(capturedFinal.trim());
        capturedFinal = "";
      }
    };

    rec.onerror = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      setListening(false);
      setTranscript("");
    };

    recognitionRef.current = rec;
    rec.start();
  }, [sendMessage]);

  // Wake word listener
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window))
      return;

    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;

    let active = true;

    const startWake = () => {
      if (!active) return;
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const said = e.results[0][0].transcript.toLowerCase().trim();
        if (said.includes("fay") || said.includes("hey fay")) {
          setWakeActive(true);
          setStatusText("Yes? I'm listening...");
          setTimeout(() => setWakeActive(false), 200);
          setTimeout(() => startListening(), 300);
        }
      };

      rec.onend = () => {
        if (active && !listening) setTimeout(startWake, 500);
      };

      rec.onerror = () => {
        if (active) setTimeout(startWake, 1000);
      };

      wakeRecognitionRef.current = rec;
      try {
        rec.start();
      } catch {}
    };

    const t = setTimeout(startWake, 1000);
    return () => {
      active = false;
      clearTimeout(t);
      wakeRecognitionRef.current?.abort();
    };
  }, [listening, startListening]);

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  }

  // Greeting on first load
  useEffect(() => {
    const hasGreeted = sessionStorage.getItem("fay_greeted");
    if (!hasGreeted) {
      sessionStorage.setItem("fay_greeted", "1");
      const hour = new Date().getHours();
      const greeting =
        hour < 12
          ? "Good morning"
          : hour < 17
          ? "Good afternoon"
          : "Good evening";
      const greetMsg: Message = {
        id: "greeting",
        role: "fay",
        text: `${greeting}! I'm Fay, your personal business assistant. Say my name to wake me up, or type below. I'm here to help you track your TikTok accounts, manage your business, and grow. What do you need today?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([greetMsg]);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#050508" }}
    >
      {/* Background orbs */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(157,78,221,0.12), transparent)",
          top: "-100px",
          left: "-100px",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.08), transparent)",
          bottom: "-50px",
          right: "-50px",
          filter: "blur(60px)",
        }}
      />

      <NavBar />

      <div className="flex flex-col flex-1 pt-20 pb-6 max-w-2xl mx-auto w-full px-4">
        {/* Orb + wake text */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <motion.div
            animate={wakeActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <VoiceOrb
              listening={listening}
              speaking={speaking}
              onClick={listening ? () => recognitionRef.current?.stop() : startListening}
            />
          </motion.div>

          <motion.p
            className="mt-4 text-sm"
            style={{ color: listening ? "#9d4edd" : "#8888aa" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {statusText}
          </motion.p>

          {transcript && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm italic"
              style={{ color: "#b0b0cc" }}
            >
              "{transcript}"
            </motion.p>
          )}
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background:
                            "linear-gradient(135deg, #9d4edd, #e040fb)",
                          color: "#fff",
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: "rgba(18,18,28,0.9)",
                          border: "1px solid rgba(42,42,64,0.8)",
                          color: "#e0e0f0",
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.role === "fay" && (
                    <span
                      className="text-xs font-semibold block mb-1 gradient-text"
                    >
                      Fay
                    </span>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Text input */}
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center gap-3 mt-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 outline-none transition-all"
            style={{
              background: "rgba(18,18,28,0.8)",
              border: "1px solid rgba(42,42,64,0.8)",
            }}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #9d4edd, #e040fb)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </form>
      </div>
    </div>
  );
}
