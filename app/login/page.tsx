"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#050508" }}
    >
      {/* Background orbs */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #9d4edd, transparent)",
          top: "10%",
          left: "10%",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #00e5ff, transparent)",
          bottom: "10%",
          right: "10%",
          filter: "blur(80px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            className="float-anim inline-block"
            style={{ fontSize: "64px", lineHeight: 1 }}
          >
            ✦
          </motion.div>
          <h1
            className="text-5xl font-bold mt-3 gradient-text"
            style={{ letterSpacing: "-2px" }}
          >
            Fay
          </h1>
          <p style={{ color: "#8888aa", marginTop: "8px", fontSize: "14px" }}>
            Your personal AI assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-white placeholder-gray-500 outline-none transition-all"
              style={{
                background: "rgba(18,18,28,0.9)",
                border: error
                  ? "1px solid #e040fb"
                  : "1px solid rgba(42,42,64,0.8)",
                fontSize: "16px",
              }}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm mt-2 text-center"
                style={{ color: "#e040fb" }}
              >
                Wrong password. Try again.
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-2xl font-semibold text-white transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #9d4edd, #e040fb)",
              fontSize: "15px",
            }}
          >
            {loading ? "Unlocking..." : "Enter"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
