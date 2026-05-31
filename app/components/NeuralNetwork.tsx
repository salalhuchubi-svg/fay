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

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    // Business node labels with colors
    const NODES = [
      { label: "TIKTOK", color: "#4fc3f7" },
      { label: "VIRAL", color: "#ce93d8" },
      { label: "GROWTH", color: "#80cbc4" },
      { label: "CONTENT", color: "#f48fb1" },
      { label: "HOOKS", color: "#fff176" },
      { label: "TRENDS", color: "#4fc3f7" },
      { label: "REVENUE", color: "#a5d6a7" },
      { label: "ENGAGE", color: "#ce93d8" },
      { label: "STRATEGY", color: "#80cbc4" },
      { label: "ANALYTICS", color: "#f48fb1" },
      { label: "FINANCE", color: "#a5d6a7" },
      { label: "IDEAS", color: "#fff176" },
      { label: "POSTS", color: "#4fc3f7" },
      { label: "REACH", color: "#ce93d8" },
      { label: "BRAND", color: "#80cbc4" },
      { label: "VOICE", color: "#f48fb1" },
    ];

    // Right side labels (like the reference image)
    const RIGHT_LABELS = ["TIKTOK", "CONTENT", "MOTOR", "CONCEPT", "STRATEGY", "ANALYTICS", "BRAND", "REVENUE", "FINANCE", "IDEAS", "TTS", "WEB"];

    type Node = { x: number; y: number; vx: number; vy: number; angle: number; r: number; label: string; color: string; size: number; phase: number };
    const nodes: Node[] = [];

    const cx = () => W / 2;
    const cy = () => H / 2;

    // Place nodes spreading across screen
    NODES.forEach((n, i) => {
      const layer = Math.floor(i / 4) + 1;
      const slot = i % 4;
      const baseAngle = (slot / 4) * Math.PI * 2 + layer * 0.6;
      const spread = Math.min(W, H) * 0.12 * layer;
      const jitter = (Math.random() - 0.5) * spread * 0.4;
      nodes.push({
        x: cx() + Math.cos(baseAngle) * (spread + jitter),
        y: cy() + Math.sin(baseAngle) * (spread + jitter) * 0.85,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        angle: baseAngle,
        r: spread + jitter,
        label: n.label,
        color: n.color,
        size: Math.max(4, 9 - layer * 1.2),
        phase: Math.random() * Math.PI * 2,
      });
    });

    // Connections
    const conns: [number, number][] = [];
    nodes.forEach((_, i) => {
      const layer = Math.floor(i / 4) + 1;
      if (layer === 1) {
        conns.push([-1, i]);
      } else {
        const prevBase = (layer - 2) * 4;
        conns.push([prevBase + (i % 4), i]);
        // Extra cross connections
        if (i % 4 < 3) conns.push([i, i + 1]);
      }
    });

    // Particles along connections
    type P = { conn: number; t: number; speed: number };
    const particles: P[] = conns.map((_, i) => ({ conn: i, t: Math.random(), speed: 0.003 + Math.random() * 0.006 }));

    let t = 0;

    function draw(now: number) {
      animRef.current = requestAnimationFrame(draw);
      if (now - lastFrameRef.current < 33) return; // 30fps
      lastFrameRef.current = now;

      const { listening, speaking, transcript: tr, stats } = stateRef.current;
      const ccx = W / 2, ccy = H / 2;
      const active = speaking || listening;

      // Background — deep dark blue
      ctx.fillStyle = "#010614";
      ctx.fillRect(0, 0, W, H);

      // Subtle radial bg glow
      const bgG = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, Math.max(W, H) * 0.7);
      bgG.addColorStop(0, "rgba(10,30,80,0.8)");
      bgG.addColorStop(1, "transparent");
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, W, H);

      // Move nodes gently
      nodes.forEach((n, i) => {
        const layer = Math.floor(i / 4) + 1;
        const targetX = ccx + Math.cos(n.angle + t * 0.05) * n.r;
        const targetY = ccy + Math.sin(n.angle + t * 0.05) * n.r * 0.85;
        n.phase += 0.012;
        n.x += (targetX - n.x) * 0.01 + Math.sin(n.phase) * 0.3;
        n.y += (targetY - n.y) * 0.01 + Math.cos(n.phase * 0.7) * 0.3;
      });

      // Draw connections
      conns.forEach(([ai, bi]) => {
        const na = ai === -1 ? { x: ccx, y: ccy, color: "#4fc3f7" } : nodes[ai];
        const nb = nodes[bi];
        if (!na || !nb) return;
        const g = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        g.addColorStop(0, (na as { color: string }).color + "55");
        g.addColorStop(1, nb.color + "22");
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = g; ctx.lineWidth = active ? 1.2 : 0.8; ctx.stroke();
      });

      // Draw particles
      particles.forEach((p) => {
        p.t += p.speed * (speaking ? 3 : listening ? 2 : 1);
        if (p.t > 1) p.t -= 1;
        const [ai, bi] = conns[p.conn];
        const na = ai === -1 ? { x: ccx, y: ccy, color: "#4fc3f7" } : nodes[ai];
        const nb = nodes[bi];
        if (!na || !nb) return;
        const px = na.x + (nb.x - na.x) * p.t;
        const py = na.y + (nb.y - na.y) * p.t;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 6);
        pg.addColorStop(0, nb.color + "ff");
        pg.addColorStop(1, "transparent");
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      });

      // Draw nodes
      nodes.forEach((n) => {
        const pulse = Math.sin(n.phase * 2) * (speaking ? 5 : listening ? 3 : 1.5);
        const r = n.size + pulse;

        // Glow
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
        g.addColorStop(0, n.color + "66");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2); ctx.fill();

        // Dot
        ctx.fillStyle = n.color;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();

        // Label box
        if (n.size >= 5) {
          ctx.font = "bold 9px monospace";
          const tw = ctx.measureText(n.label).width;
          const lx = n.x + r + 6, ly = n.y - 7;
          ctx.fillStyle = "rgba(1,6,20,0.85)";
          ctx.strokeStyle = n.color + "55"; ctx.lineWidth = 0.8;
          ctx.fillRect(lx - 3, ly - 2, tw + 6, 16);
          ctx.strokeRect(lx - 3, ly - 2, tw + 6, 16);
          ctx.fillStyle = n.color;
          ctx.textAlign = "left"; ctx.textBaseline = "top";
          ctx.fillText(n.label, lx, ly);
        }
      });

      // Central brain orb
      const orbR = 65 + (speaking ? Math.sin(t * 8) * 10 : listening ? Math.sin(t * 4) * 6 : Math.sin(t * 0.8) * 3);

      // Multi-layer glow
      [orbR * 4, orbR * 2.5, orbR * 1.4].forEach((gr, gi) => {
        const gg = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, gr);
        const alphas = ["20", "35", "50"];
        gg.addColorStop(0, (speaking ? "#00e5ff" : listening ? "#e040fb" : "#4488ff") + alphas[gi]);
        gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(ccx, ccy, gr, 0, Math.PI * 2); ctx.fill();
      });

      // Orb body
      const og = ctx.createRadialGradient(ccx - 20, ccy - 20, 0, ccx, ccy, orbR);
      if (speaking) { og.addColorStop(0, "#aaf0ff"); og.addColorStop(0.5, "#0088bb"); }
      else if (listening) { og.addColorStop(0, "#ff88ff"); og.addColorStop(0.5, "#aa00ee"); }
      else { og.addColorStop(0, "#88aaff"); og.addColorStop(0.5, "#2244cc"); }
      og.addColorStop(1, "#080820");
      ctx.beginPath(); ctx.arc(ccx, ccy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = og; ctx.fill();

      // Rotating rings
      [orbR + 12, orbR + 22, orbR + 36].forEach((rr, ri) => {
        ctx.beginPath();
        ctx.arc(ccx, ccy, rr, t * (ri % 2 === 0 ? 0.5 : -0.3), t * (ri % 2 === 0 ? 0.5 : -0.3) + Math.PI * 1.6);
        ctx.strokeStyle = (speaking ? "#00e5ff" : listening ? "#e040fb" : "#4488ff") + ["66", "44", "22"][ri];
        ctx.lineWidth = ri === 0 ? 1.5 : 0.8; ctx.stroke();
      });

      // Scan sweep
      const sa = t * 1.5;
      ctx.beginPath(); ctx.moveTo(ccx, ccy);
      ctx.arc(ccx, ccy, Math.min(W, H) * 0.44, sa, sa + 0.6);
      ctx.closePath();
      ctx.fillStyle = (speaking ? "#00e5ff" : "#4488ff") + "0a"; ctx.fill();

      // Outer tick ring
      const outerR = Math.min(W, H) * 0.44;
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const inn = i % 6 === 0 ? outerR - 12 : outerR - 5;
        ctx.beginPath();
        ctx.moveTo(ccx + Math.cos(a) * inn, ccy + Math.sin(a) * inn);
        ctx.lineTo(ccx + Math.cos(a) * outerR, ccy + Math.sin(a) * outerR);
        ctx.strokeStyle = "#4488ff" + (i % 6 === 0 ? "66" : "22");
        ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.5; ctx.stroke();
      }

      // "+" in center
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("+", ccx, ccy);

      // ── HUD OVERLAYS ──

      // Top left: connected status
      ctx.font = "11px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(100,200,255,0.5)";
      ctx.fillText("● CONNECTED", 12, 12);

      // Top right: LISTENING indicator
      ctx.textAlign = "right";
      ctx.fillStyle = listening ? "#88ff88" : speaking ? "#88ddff" : "rgba(100,200,255,0.4)";
      ctx.font = "bold 12px monospace";
      ctx.fillText(listening ? "● LISTENING" : speaking ? "● SPEAKING" : "LI", W - 12, 12);

      // Right side label list (like reference image)
      ctx.font = "9px monospace"; ctx.textAlign = "right";
      RIGHT_LABELS.forEach((label, i) => {
        const isActive = nodes.some(n => n.label === label);
        const lx = W - 12, ly = H * 0.2 + i * 22;
        ctx.fillStyle = isActive ? "rgba(150,220,255,0.8)" : "rgba(100,180,255,0.3)";
        ctx.fillRect(lx - ctx.measureText(label).width - 16, ly, ctx.measureText(label).width + 12, 16);
        ctx.strokeStyle = "rgba(100,200,255,0.2)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(lx - ctx.measureText(label).width - 16, ly, ctx.measureText(label).width + 12, 16);
        ctx.fillStyle = isActive ? "#ffffff" : "rgba(150,220,255,0.5)";
        ctx.fillText(label, lx - 4, ly + 3);
      });

      // Left: business stats panels
      const lsy = H * 0.25;
      ctx.textAlign = "left";

      // Accounts (white)
      ctx.font = "bold 9px monospace"; ctx.fillStyle = "rgba(100,200,255,0.6)";
      ctx.fillText("ACCOUNTS", 12, lsy);
      stats.accounts.slice(0, 3).forEach((a, i) => {
        ctx.font = "9px monospace"; ctx.fillStyle = "#ffffff";
        ctx.fillText("@" + a + "  " + stats.followers.toLocaleString() + "F", 12, lsy + 16 + i * 18);
      });
      if (stats.accounts.length === 0) { ctx.fillStyle = "#aaaaaa"; ctx.fillText("No accounts", 12, lsy + 16); }

      // Tasks (red)
      const tsy = lsy + 80;
      ctx.font = "bold 9px monospace"; ctx.fillStyle = "rgba(100,200,255,0.6)";
      ctx.fillText("PENDING TASKS", 12, tsy);
      ctx.font = "bold 18px monospace"; ctx.fillStyle = "#ff4444";
      ctx.fillText(String(stats.tasks), 12, tsy + 14);
      ctx.font = "9px monospace"; ctx.fillStyle = "#ff666688";
      ctx.fillText("TASKS DUE", 12, tsy + 34);

      // Revenue (green)
      const rsy = tsy + 60;
      ctx.font = "bold 9px monospace"; ctx.fillStyle = "rgba(100,200,255,0.6)";
      ctx.fillText("REVENUE", 12, rsy);
      ctx.font = "bold 18px monospace"; ctx.fillStyle = "#44ff88";
      ctx.fillText("$" + stats.revenue.toLocaleString(), 12, rsy + 14);
      ctx.font = "9px monospace"; ctx.fillStyle = "#66ff8888";
      ctx.fillText("NET BALANCE", 12, rsy + 34);

      // Bottom: transcript + status
      if (tr) {
        ctx.font = "14px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(tr, W / 2, H - 20);
      }

      // Bottom left: HEY FAY indicator
      ctx.font = "10px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(100,200,255,0.4)";
      ctx.fillText('"HEY FAY"', 12, H - 8);

      t += 0.016;
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}
