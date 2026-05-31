"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./components/NavBar";
import NeuralNetwork from "./components/NeuralNetwork";
import { loadData } from "./lib/store";
import type { Message } from "./lib/types";

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusText, setStatusText] = useState('Say "Fay" to wake me up');
  const [inputText, setInputText] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ followers: 0, tasks: 0, revenue: 0, accounts: [] as string[] });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wakeRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);
  const listeningRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const d = loadData();
    setStats({
      followers: d.tiktokAccounts.reduce((s,a) => s+a.followers, 0),
      tasks: d.tasks.filter(t => !t.done).length,
      revenue: d.transactions.filter(t => t.type==="income").reduce((s,t) => s+t.amount, 0) -
               d.transactions.filter(t => t.type==="expense").reduce((s,t) => s+t.amount, 0),
      accounts: d.tiktokAccounts.map(a => a.username),
    });
  }, []);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function getSR() {
    return (
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
      null
    );
  }

  const startWake = useCallback(() => {
    if (speakingRef.current || listeningRef.current) return;
    const SR = getSR();
    if (!SR) return;
    try { wakeRef.current?.abort(); } catch {}

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const said = e.results[0][0].transcript.toLowerCase();
      if (said.includes("fay") || said.includes("hey fay")) {
        setStatusText("Yes? Listening...");
        setTimeout(() => startListening(), 100);
      }
    };
    rec.onend = () => { if (!speakingRef.current && !listeningRef.current) setTimeout(startWake, 500); };
    rec.onerror = () => { setTimeout(startWake, 1500); };
    wakeRef.current = rec;
    try { rec.start(); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSpeak = useCallback(async (text: string) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      speakingRef.current = true;
      setSpeaking(true);
      setLastReply(text);

      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("speak failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      const done = () => {
        speakingRef.current = false;
        setSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setTimeout(startWake, 500);
      };

      audio.onended = done;
      audio.onerror = done;
      await audio.play();
    } catch {
      speakingRef.current = false;
      setSpeaking(false);
      setTimeout(startWake, 500);
    }
  }, [startWake]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setStatusText("Thinking...");

    try {
      const data = loadData();
      const res = await fetch("/api/fay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMsg].slice(-10),
          context: {
            tiktokAccounts: data.tiktokAccounts.map(a => ({ username: a.username, niche: a.niche, followers: a.followers })),
            pendingTasks: data.tasks.filter(t => !t.done).length,
            recentRevenue: data.transactions.filter(t => t.type === "income").slice(-5).reduce((s, t) => s + t.amount, 0),
          },
        }),
      });
      const { text: reply } = await res.json();
      const fayMsg: Message = { id: (Date.now() + 1).toString(), role: "fay", text: reply, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, fayMsg]);
      setStatusText('Say "Fay" to wake me up');
      doSpeak(reply);
    } catch {
      setStatusText('Say "Fay" to wake me up');
      setTimeout(startWake, 500);
    }
  }, [doSpeak, startWake]);

  const startListening = useCallback(() => {
    const SR = getSR();
    if (!SR) return;
    try { wakeRef.current?.abort(); } catch {}
    try { recognitionRef.current?.abort(); } catch {}

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    let timer: ReturnType<typeof setTimeout> | null = null;
    let final = "";

    const done = () => {
      if (timer) clearTimeout(timer);
      rec.stop();
      const t = final.trim();
      setTranscript("");
      setListening(false);
      listeningRef.current = false;
      if (t) sendMessage(t);
      else setTimeout(startWake, 300);
    };

    rec.onstart = () => {
      listeningRef.current = true;
      setListening(true);
      setStatusText("Listening...");
      timer = setTimeout(done, 8000);
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final || interim);
      if (timer) clearTimeout(timer);
      timer = setTimeout(done, 1500);
    };

    rec.onspeechend = () => { if (timer) clearTimeout(timer); timer = setTimeout(done, 800); };
    rec.onend = () => {
      listeningRef.current = false;
      setListening(false);
      setTranscript("");
      if (final.trim()) { sendMessage(final.trim()); }
      else setTimeout(startWake, 300);
    };
    rec.onerror = () => {
      if (timer) clearTimeout(timer);
      listeningRef.current = false;
      setListening(false);
      setTranscript("");
      setTimeout(startWake, 500);
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch {}
  }, [sendMessage, startWake]);

  // Request mic permission on first load, then start wake word
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(() => { if (!cancelled) setTimeout(startWake, 500); })
      .catch(() => { if (!cancelled) setTimeout(startWake, 500); });
    return () => { cancelled = true; try { wakeRef.current?.abort(); } catch {} };
  }, [startWake]);

  // Greeting
  useEffect(() => {
    if (!mounted) return;
    if (sessionStorage.getItem("fay_g3")) return;
    sessionStorage.setItem("fay_g3", "1");
    const h = new Date().getHours();
    const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const text = `${g}. I'm Fay. Say my name to wake me up, or use the mic button below.`;
    setMessages([{ id: "g", role: "fay", text, timestamp: new Date().toISOString() }]);
    setLastReply(text);
  }, [mounted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#020208" }}>
      <NeuralNetwork listening={listening} speaking={speaking} transcript={transcript} stats={stats} />
      <NavBar />

      <div className="relative z-10 flex flex-col flex-1 pt-16">
        {/* Top left status */}
        <div className="absolute top-20 left-4 md:left-8">
          <motion.div className="flex items-center gap-2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="w-2 h-2 rounded-full" style={{ background: speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd" }} />
            <span className="text-xs font-mono" style={{ color: speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd" }}>
              {statusText}
            </span>
          </motion.div>
        </div>

        {/* Last reply - center */}
        <div className="absolute inset-x-0 bottom-28 flex justify-center px-4 pointer-events-none">
          <AnimatePresence mode="wait">
            {lastReply && (
              <motion.div
                key={lastReply.slice(0, 20)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center max-w-xl"
              >
                <p className="text-xs font-mono mb-1" style={{ color: "#9d4edd" }}>// FAY</p>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 0 20px rgba(157,78,221,0.5)" }}>
                  {lastReply}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom input bar */}
        <div className="absolute bottom-0 inset-x-0 p-4 flex justify-center">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full max-w-lg">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none" style={{ color: "#9d4edd" }}>&gt;_</span>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type to Fay..."
                className="w-full pl-8 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none font-mono"
                style={{ background: "rgba(5,5,15,0.85)", border: "1px solid rgba(157,78,221,0.35)", backdropFilter: "blur(10px)" }}
              />
            </div>

            {/* Send */}
            <motion.button type="submit" whileTap={{ scale: 0.92 }} disabled={!inputText.trim()}
              className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "linear-gradient(135deg,#9d4edd,#e040fb)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            {/* Mic */}
            <motion.button type="button" whileTap={{ scale: 0.92 }}
              onClick={() => listening ? recognitionRef.current?.stop() : startListening()}
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: listening ? "rgba(224,64,251,0.25)" : "rgba(157,78,221,0.15)",
                border: `1px solid ${listening ? "#e040fb88" : "rgba(157,78,221,0.35)"}`,
                backdropFilter: "blur(10px)",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill={listening ? "#e040fb" : "#9d4edd"} />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke={listening ? "#e040fb" : "#9d4edd"} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
