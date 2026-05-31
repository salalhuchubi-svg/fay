"use client";
import { useEffect, useRef } from "react";

interface Props {
  listening: boolean;
  speaking: boolean;
  transcript: string;
  stats: { followers: number; tasks: number; revenue: number; accounts: string[] };
}

export default function NeuralNetwork({ listening, speaking, transcript, stats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ listening, speaking, transcript, stats });
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef(0);

  useEffect(() => { stateRef.current = { listening, speaking, transcript, stats }; }, [listening, speaking, transcript, stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; initParticles(); };
    window.addEventListener("resize", onResize);

    // ── Oval particle cloud ──
    type Particle = { ax: number; ay: number; x: number; y: number; vx: number; vy: number; size: number; opacity: number; };
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const cx = W / 2, cy = H / 2;
      const rx = Math.min(W, H) * 0.28;
      const ry = Math.min(W, H) * 0.38;
      for (let i = 0; i < 1800; i++) {
        // Random point inside oval with gaussian-ish distribution
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const noise = 0.3 + Math.random() * 0.7;
        const ax = cx + Math.cos(angle) * rx * r * noise;
        const ay = cy + Math.sin(angle) * ry * r * noise;
        particles.push({ ax, ay, x: ax, y: ay, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: 0.5 + Math.random() * 1.5, opacity: 0.3 + Math.random() * 0.7 });
      }
    };
    initParticles();

    // ── Radar ──
    let radarAngle = 0;
    let radarBlips: { angle: number; r: number; life: number }[] = [];
    for (let i = 0; i < 6; i++) radarBlips.push({ angle: Math.random() * Math.PI * 2, r: Math.random() * 0.8 + 0.1, life: Math.random() });

    // ── Waveform data ──
    const waveData = Array.from({ length: 40 }, () => Math.random());

    let time = 0;
    const FPS = 30;

    function draw(now: number) {
      animRef.current = requestAnimationFrame(draw);
      if (now - lastFrameRef.current < 1000 / FPS) return;
      lastFrameRef.current = now;

      const { listening, speaking, transcript: tr, stats } = stateRef.current;
      const cx = W / 2, cy = H / 2;
      const accent = speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd";
      const accentDim = accent + "88";

      // ── Background ──
      ctx.fillStyle = "#020210";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = accent + "18";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── Particles ──
      const speed = speaking ? 2.5 : listening ? 1.8 : 1;
      particles.forEach(p => {
        p.vx += (p.ax - p.x) * 0.003 + (Math.random() - 0.5) * 0.1;
        p.vy += (p.ay - p.y) * 0.003 + (Math.random() - 0.5) * 0.1;
        p.vx *= 0.95; p.vy *= 0.95;
        p.x += p.vx * speed; p.y += p.vy * speed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = accent + Math.floor(p.opacity * (speaking ? 255 : listening ? 200 : 160)).toString(16).padStart(2, "0");
        ctx.fill();
      });

      // ── Oval rings ──
      const rx = Math.min(W, H) * 0.28, ry = Math.min(W, H) * 0.38;
      [1, 1.15, 1.32, 1.5].forEach((scale, i) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * scale, ry * scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = accent + ["44", "28", "18", "10"][i];
        ctx.lineWidth = i === 0 ? 1.5 : 0.8;
        ctx.setLineDash(i > 1 ? [4, 6] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Tick marks on outer oval
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const ox = Math.cos(a) * rx * 1.5, oy = Math.sin(a) * ry * 1.5;
        const len = i % 9 === 0 ? 10 : i % 3 === 0 ? 6 : 3;
        const nx = Math.cos(a), ny = Math.sin(a) * (ry / rx);
        const nlen = Math.hypot(nx, ny);
        ctx.beginPath();
        ctx.moveTo(cx + ox, cy + oy);
        ctx.lineTo(cx + ox + (nx / nlen) * len, cy + oy + (ny / nlen) * len);
        ctx.strokeStyle = accent + (i % 9 === 0 ? "88" : "44");
        ctx.lineWidth = i % 9 === 0 ? 1.5 : 0.7;
        ctx.stroke();
      }

      // Central glow
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.5);
      cg.addColorStop(0, accent + "cc");
      cg.addColorStop(0.3, accent + "44");
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2); ctx.fill();

      // ── TOP LEFT: System info ──
      const tlx = 16, tly = 16;
      ctx.font = "10px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillStyle = accentDim;
      ctx.fillText("S.A.R.A.S — DEEP AI NEURAL INTELLIGENCE SYSTEM", tlx, tly);
      ctx.fillStyle = accent + "44"; ctx.fillRect(tlx, tly + 14, 300, 0.5);

      // Mini buttons
      ["NEURAL", "VOICE", "SYNC", "INTEL"].forEach((label, i) => {
        const bx = tlx + i * 58, by = tly + 18;
        ctx.fillStyle = i === 0 ? accent + "33" : "rgba(0,0,20,0.6)";
        ctx.strokeStyle = accentDim; ctx.lineWidth = 0.7;
        ctx.fillRect(bx, by, 50, 14); ctx.strokeRect(bx, by, 50, 14);
        ctx.fillStyle = i === 0 ? accent : accent + "88";
        ctx.font = "7px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(label, bx + 25, by + 7);
      });

      ctx.font = "9px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";

      // System stats left panel
      const lx = 16, ly = tly + 50;
      ctx.fillStyle = "rgba(2,2,20,0.75)";
      roundRect(ctx, lx, ly, 160, 180, 6); ctx.fill();
      ctx.strokeStyle = accent + "33"; ctx.lineWidth = 0.8; roundRect(ctx, lx, ly, 160, 180, 6); ctx.stroke();

      ctx.fillStyle = accent;
      ctx.fillText("SYSTEM STATUS", lx + 8, ly + 8);
      ctx.fillStyle = accent + "44"; ctx.fillRect(lx + 8, ly + 20, 144, 0.5);

      const sysStats = [
        ["FOLLOWERS", stats.followers.toLocaleString()],
        ["ACCOUNTS", String(stats.accounts.length)],
        ["TASKS", stats.tasks + " PENDING"],
        ["REVENUE", "$" + stats.revenue.toLocaleString()],
        ["AI MODEL", "CLAUDE"],
        ["VOICE", "LILY"],
        ["STATUS", "ONLINE"],
      ];
      sysStats.forEach(([k, v], i) => {
        ctx.fillStyle = accent + "88"; ctx.fillText(k, lx + 8, ly + 28 + i * 21);
        ctx.fillStyle = k === "STATUS" ? "#69ff47" : k === "REVENUE" ? "#69ff47" : "#e0e0f0";
        ctx.textAlign = "right"; ctx.fillText(v, lx + 152, ly + 28 + i * 21);
        ctx.textAlign = "left";
      });

      // ── TOP RIGHT: Clock + coords ──
      const now2 = new Date();
      const timeStr = now2.toTimeString().slice(0, 8);
      const dateStr = now2.toDateString().toUpperCase();
      const trx = W - 16, try2 = 16;
      ctx.textAlign = "right"; ctx.textBaseline = "top";
      ctx.font = "bold 22px monospace"; ctx.fillStyle = accent;
      ctx.fillText(timeStr, trx, try2);
      ctx.font = "9px monospace"; ctx.fillStyle = accentDim;
      ctx.fillText(dateStr, trx, try2 + 26);
      ctx.fillText("LAT 48.8566 // LONG 2.3522", trx, try2 + 40);
      ctx.fillText("ALT 35M // BEARING 045", trx, try2 + 54);

      // Radar
      const radCx = W - 85, radCy = try2 + 120, radR = 60;
      ctx.fillStyle = "rgba(2,2,20,0.8)"; ctx.strokeStyle = accent + "44"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(radCx, radCy, radR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      [0.33, 0.66, 1].forEach(s => {
        ctx.beginPath(); ctx.arc(radCx, radCy, radR * s, 0, Math.PI * 2);
        ctx.strokeStyle = accent + "33"; ctx.lineWidth = 0.5; ctx.stroke();
      });
      // Cross hairs
      ctx.strokeStyle = accent + "44"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(radCx - radR, radCy); ctx.lineTo(radCx + radR, radCy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(radCx, radCy - radR); ctx.lineTo(radCx, radCy + radR); ctx.stroke();
      // Sweep
      radarAngle += 0.04;
      const sweepGrad = ctx.createConicalGradient ? null : null;
      ctx.beginPath(); ctx.moveTo(radCx, radCy);
      ctx.arc(radCx, radCy, radR, radarAngle - 0.8, radarAngle);
      ctx.closePath(); ctx.fillStyle = accent + "22"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(radCx, radCy);
      ctx.lineTo(radCx + Math.cos(radarAngle) * radR, radCy + Math.sin(radarAngle) * radR);
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.stroke();
      // Blips
      radarBlips.forEach(b => {
        b.life -= 0.01;
        if (b.life <= 0) { b.angle = Math.random() * Math.PI * 2; b.r = Math.random() * 0.8 + 0.1; b.life = 0.8 + Math.random() * 0.5; }
        const bx2 = radCx + Math.cos(b.angle) * radR * b.r;
        const by2 = radCy + Math.sin(b.angle) * radR * b.r;
        ctx.beginPath(); ctx.arc(bx2, by2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = accent + Math.floor(b.life * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });
      ctx.font = "8px monospace"; ctx.fillStyle = accent + "66"; ctx.textAlign = "center";
      ctx.fillText("PROXIMITY", radCx, try2 + 72);

      // Waveform
      const wvx = W - 175, wvy = try2 + 195, wvW = 160, wvH = 30;
      ctx.fillStyle = "rgba(2,2,20,0.7)"; roundRect(ctx, wvx - 5, wvy - 5, wvW + 10, wvH + 15, 4); ctx.fill();
      ctx.strokeStyle = accent + "33"; ctx.lineWidth = 0.5; roundRect(ctx, wvx - 5, wvy - 5, wvW + 10, wvH + 15, 4); ctx.stroke();
      if (speaking || listening) waveData.forEach((_, i) => { waveData[i] = 0.2 + Math.random() * 0.8; });
      ctx.beginPath();
      waveData.forEach((v, i) => {
        const wx = wvx + (i / waveData.length) * wvW;
        const wy = wvy + wvH / 2 - v * wvH / 2 * (speaking ? 1 : listening ? 0.7 : 0.3);
        i === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
      });
      ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = "7px monospace"; ctx.fillStyle = accent + "66"; ctx.textAlign = "left";
      ctx.fillText("AUDIO I/O", wvx, wvy + wvH + 5);
      ctx.textAlign = "right"; ctx.fillText(speaking ? "TX" : listening ? "RX" : "--", wvx + wvW, wvy + wvH + 5);

      // Right stats
      const rstats = ["SOLARLINK: 1.33v/s", "UPTIME: " + Math.floor(time / 60) + "m " + Math.floor(time % 60) + "s", "SYNC: ACTIVE", "BUFFER: 0.2ms", "NEURAL: LIVE"];
      ctx.font = "8px monospace"; ctx.textAlign = "right"; ctx.textBaseline = "top";
      rstats.forEach((s, i) => {
        ctx.fillStyle = i === 3 ? "#ff4747" : accentDim;
        ctx.fillText(s, W - 16, try2 + 245 + i * 16);
      });

      // ── BOTTOM CENTER: Financial stats ──
      const bcY = H - 90;
      ctx.fillStyle = "rgba(2,2,20,0.8)";
      roundRect(ctx, W / 2 - 200, bcY, 400, 70, 6); ctx.fill();
      ctx.strokeStyle = accent + "44"; ctx.lineWidth = 0.8;
      roundRect(ctx, W / 2 - 200, bcY, 400, 70, 6); ctx.stroke();

      ctx.font = "9px monospace"; ctx.fillStyle = accentDim; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("REVENUE OBJECTIVE", W / 2, bcY + 6);
      ctx.fillStyle = accent + "44"; ctx.fillRect(W / 2 - 180, bcY + 18, 360, 0.5);

      const income = stats.revenue > 0 ? stats.revenue : 0;
      const cols = [
        { label: "TOTAL INCOME", val: "$" + income.toLocaleString(), color: "#69ff47" },
        { label: "THIS MONTH", val: "$" + Math.round(income * 0.48).toLocaleString(), color: accent },
        { label: "NET PROFIT", val: "$" + Math.round(income * 0.32).toLocaleString(), color: "#69ff47" },
      ];
      cols.forEach((c, i) => {
        const x2 = W / 2 - 120 + i * 120;
        ctx.fillStyle = c.color; ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
        ctx.fillText(c.val, x2, bcY + 26);
        ctx.fillStyle = accentDim; ctx.font = "7px monospace";
        ctx.fillText(c.label, x2, bcY + 46);
      });

      // Bottom left: TikTok accounts
      const blx = 16, bly = H - 120;
      ctx.fillStyle = "rgba(2,2,20,0.8)"; roundRect(ctx, blx, bly, 180, 100, 6); ctx.fill();
      ctx.strokeStyle = accent + "33"; ctx.lineWidth = 0.8; roundRect(ctx, blx, bly, 180, 100, 6); ctx.stroke();
      ctx.font = "9px monospace"; ctx.fillStyle = accent; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("TIKTOK ACCOUNTS", blx + 8, bly + 8);
      ctx.fillStyle = accent + "44"; ctx.fillRect(blx + 8, bly + 20, 164, 0.5);
      if (stats.accounts.length === 0) { ctx.fillStyle = accent + "66"; ctx.fillText("No accounts linked", blx + 8, bly + 28); }
      stats.accounts.slice(0, 3).forEach((a, i) => {
        ctx.fillStyle = "#e0e0f0"; ctx.fillText("@" + a, blx + 8, bly + 28 + i * 18);
        ctx.fillStyle = accentDim; ctx.textAlign = "right";
        ctx.fillText(stats.followers.toLocaleString() + " F", blx + 172, bly + 28 + i * 18);
        ctx.textAlign = "left";
      });

      // Bottom right: misc stats
      const brx = W - 196, bry = H - 120;
      const brstats = [
        "SPL/DB: -1.33v/s",
        "NEURAL: 0.28A",
        "PACKET LOSS: 0%",
        "PING: 42MS",
      ];
      ctx.fillStyle = "rgba(2,2,20,0.8)"; roundRect(ctx, brx, bry, 180, 100, 6); ctx.fill();
      ctx.strokeStyle = accent + "33"; ctx.lineWidth = 0.8; roundRect(ctx, brx, bry, 180, 100, 6); ctx.stroke();
      ctx.font = "9px monospace"; ctx.fillStyle = accent; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("DIAGNOSTICS", brx + 8, bry + 8);
      ctx.fillStyle = accent + "44"; ctx.fillRect(brx + 8, bry + 20, 164, 0.5);
      brstats.forEach((s2, i) => {
        ctx.fillStyle = accentDim; ctx.fillText(s2, brx + 8, bry + 28 + i * 18);
      });

      // Status bar bottom
      ctx.font = "10px monospace"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillStyle = speaking ? "#00e5ff" : listening ? "#e040fb" : accent + "55";
      ctx.fillText(speaking ? "// TRANSMITTING" : listening ? "// RECEIVING VOICE INPUT" : "// STANDBY — SAY \"FAY\" TO ACTIVATE", W - 200, H - 8);

      if (tr) {
        ctx.font = "13px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(`"${tr}"`, W / 2, H - 100);
      }

      time += 0.016;
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}
