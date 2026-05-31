"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: string;
  trend?: number;
}

export default function StatCard({ label, value, sub, icon, color = "#9d4edd", trend }: Props) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(18,18,28,0.9)",
        border: "1px solid rgba(42,42,64,0.8)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, ${color}, transparent)`,
          filter: "blur(15px)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "#8888aa" }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: "#f0f0ff" }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1" style={{ color: "#8888aa" }}>
              {sub}
            </p>
          )}
          {trend !== undefined && (
            <p
              className="text-xs mt-1 font-medium"
              style={{ color: trend >= 0 ? "#69ff47" : "#ff4747" }}
            >
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${color}22`, color }}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
