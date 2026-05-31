"use client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  listening: boolean;
  speaking: boolean;
  onClick: () => void;
}

export default function VoiceOrb({ listening, speaking, onClick }: Props) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Pulse rings when listening */}
      <AnimatePresence>
        {listening && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 120,
                  height: 120,
                  border: "1px solid rgba(157,78,221,0.6)",
                }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.8, opacity: 0 }}
                transition={{
                  duration: 2,
                  delay: i * 0.6,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Pulse rings when speaking */}
      <AnimatePresence>
        {speaking && (
          <>
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 120,
                  height: 120,
                  border: "1px solid rgba(0,229,255,0.5)",
                }}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main orb button */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={
          speaking
            ? { scale: [1, 1.08, 1] }
            : listening
            ? { scale: [1, 1.04, 1] }
            : {}
        }
        transition={
          speaking || listening
            ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        className="relative rounded-full flex items-center justify-center cursor-pointer"
        style={{
          width: 120,
          height: 120,
          background: listening
            ? "radial-gradient(circle at 35% 35%, #b565f0, #6a0dad)"
            : speaking
            ? "radial-gradient(circle at 35% 35%, #00e5ff, #0070a8)"
            : "radial-gradient(circle at 35% 35%, #1a1a2e, #0d0d18)",
          boxShadow: listening
            ? "0 0 40px rgba(157,78,221,0.6), 0 0 80px rgba(157,78,221,0.2)"
            : speaking
            ? "0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2)"
            : "0 0 20px rgba(157,78,221,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Wave bars when speaking */}
        {speaking ? (
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 24,
                  borderRadius: 2,
                  background: "#fff",
                  animation: `wave 0.8s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        ) : listening ? (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              fill="white"
            />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <span style={{ fontSize: 32 }}>✦</span>
        )}
      </motion.button>
    </div>
  );
}
