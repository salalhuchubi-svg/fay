"use client";
import { useEffect, useRef } from "react";

interface Props {
  listening: boolean;
  speaking: boolean;
}

export default function ParticleOrb({ listening, speaking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ listening, speaking });

  useEffect(() => {
    stateRef.current = { listening, speaking };
  }, [listening, speaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 400;
    const H = 400;
    canvas.width = W;
    canvas.height = H;
    const cx = W / 2;
    const cy = H / 2;

    const NUM = 180;
    const particles = Array.from({ length: NUM }, (_, i) => {
      const angle = (i / NUM) * Math.PI * 2;
      const r = 80 + Math.random() * 60;
      return {
        angle,
        r,
        baseR: r,
        speed: 0.003 + Math.random() * 0.004,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        layer: Math.floor(Math.random() * 3),
      };
    });

    let t = 0;

    function draw() {
      if (!ctx || !canvas) return;
      const { listening, speaking } = stateRef.current;

      ctx.clearRect(0, 0, W, H);

      // Outer glow ring
      const gradient = ctx.createRadialGradient(cx, cy, 60, cx, cy, 180);
      const color = speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd";
      gradient.addColorStop(0, `${color}33`);
      gradient.addColorStop(0.5, `${color}11`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fill();

      // Rings
      [100, 130, 160].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(t * 2 + i) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}${i === 0 ? "44" : i === 1 ? "22" : "11"}`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Particles
      particles.forEach((p) => {
        p.angle += p.speed * (speaking ? 2 : listening ? 1.5 : 1);
        const pulse = speaking
          ? Math.sin(t * 8 + p.angle * 3) * 20
          : listening
          ? Math.sin(t * 4 + p.angle * 2) * 12
          : Math.sin(t * 1.5 + p.angle) * 5;
        const r = p.baseR + pulse;
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.floor(p.opacity * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();

        // Connecting lines between nearby particles
        if (p.layer === 0) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `${color}08`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // Center orb
      const cg = ctx.createRadialGradient(cx - 15, cy - 15, 0, cx, cy, 55);
      cg.addColorStop(0, speaking ? "#00e5ff" : listening ? "#e040fb" : "#b565f0");
      cg.addColorStop(0.5, speaking ? "#0070a8" : listening ? "#9d4edd" : "#6a0dad");
      cg.addColorStop(1, "#1a0a2e");
      ctx.beginPath();
      ctx.arc(cx, cy, 50 + (speaking ? Math.sin(t * 6) * 5 : listening ? Math.sin(t * 3) * 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      // Center symbol
      ctx.font = "bold 28px serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✦", cx, cy);

      // Scan line
      const scanAngle = t * 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 160, scanAngle, scanAngle + 0.4);
      ctx.closePath();
      ctx.fillStyle = `${color}15`;
      ctx.fill();

      // HUD tick marks
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const inner = i % 3 === 0 ? 168 : 172;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * 178, cy + Math.sin(a) * 178);
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.5;
        ctx.stroke();
      }

      t += 0.016;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 300, height: 300 }}
      className="cursor-pointer"
    />
  );
}
