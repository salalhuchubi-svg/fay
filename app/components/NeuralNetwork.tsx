"use client";
import { useEffect, useRef } from "react";

interface Props {
  listening: boolean;
  speaking: boolean;
  transcript: string;
}

export default function NeuralNetwork({ listening, speaking, transcript }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ listening, speaking, transcript });
  const animRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current = { listening, speaking, transcript };
  }, [listening, speaking, transcript]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    // Node labels themed around business/tiktok
    const labelGroups = [
      ["TIKTOK", "#e040fb"],
      ["CONTENT", "#9d4edd"],
      ["VIRAL", "#00e5ff"],
      ["GROWTH", "#69ff47"],
      ["REVENUE", "#69ff47"],
      ["HOOKS", "#e040fb"],
      ["TRENDS", "#00e5ff"],
      ["TASKS", "#9d4edd"],
      ["ANALYTICS", "#e040fb"],
      ["ENGAGE", "#00e5ff"],
      ["STRATEGY", "#9d4edd"],
      ["FINANCE", "#69ff47"],
      ["IDEAS", "#e040fb"],
      ["VOICE", "#00e5ff"],
      ["POSTS", "#9d4edd"],
      ["REACH", "#69ff47"],
      ["BRAND", "#e040fb"],
      ["METRICS", "#00e5ff"],
    ];

    type Node = {
      x: number; y: number;
      label: string; color: string;
      vx: number; vy: number;
      size: number;
      t: number; speed: number;
      isCenter: boolean;
    };

    const nodes: Node[] = [];
    const cx = W / 2;
    const cy = H / 2;

    // Center node
    nodes.push({ x: cx, y: cy, label: "FAY", color: "#b565f0", vx: 0, vy: 0, size: 14, t: 0, speed: 0.02, isCenter: true });

    // Surrounding nodes in layers
    labelGroups.forEach((lg, i) => {
      const layers = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4];
      const layer = layers[i] || 3;
      const baseR = layer * (Math.min(W, H) / 9);
      const angle = (i / labelGroups.length) * Math.PI * 2 + layer * 0.4;
      const r = baseR + (Math.random() - 0.5) * 50;
      nodes.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        label: lg[0],
        color: lg[1],
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.max(3, 8 - layer * 1.2),
        t: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.02,
        isCenter: false,
      });
    });

    // Build connections (each non-center node connects to nearest node closer to center)
    type Conn = { a: number; b: number; particles: { t: number; speed: number }[] };
    const conns: Conn[] = [];

    nodes.forEach((n, i) => {
      if (i === 0) return;
      // Find nearest node with smaller index (closer to center)
      let best = 0;
      let bestD = Infinity;
      nodes.forEach((m, j) => {
        if (j >= i) return;
        const d = Math.hypot(n.x - m.x, n.y - m.y);
        if (d < bestD) { bestD = d; best = j; }
      });
      conns.push({
        a: best, b: i,
        particles: Array.from({ length: 3 }, () => ({ t: Math.random(), speed: 0.004 + Math.random() * 0.006 }))
      });
    });

    let time = 0;

    function draw() {
      if (!ctx) return;
      const { listening, speaking, transcript: tr } = stateRef.current;

      ctx.clearRect(0, 0, W, H);

      // Deep dark background
      ctx.fillStyle = "#020208";
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(157,78,221,0.035)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Subtle radial glow from center
      const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.6);
      const glowColor = speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd";
      bgGlow.addColorStop(0, glowColor + "18");
      bgGlow.addColorStop(0.5, glowColor + "06");
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      // Update node positions
      nodes.forEach((n, i) => {
        if (i === 0) return;
        n.t += n.speed;
        n.x += n.vx + Math.sin(n.t) * 0.3;
        n.y += n.vy + Math.cos(n.t * 0.7) * 0.3;
        n.vx *= 0.98;
        n.vy *= 0.98;
        // Drift back toward original position
        const targetAngle = (i / nodes.length) * Math.PI * 2;
        const targetR = Math.min(W, H) / 9 * Math.ceil(i / 4.5);
        const tx = cx + Math.cos(targetAngle) * targetR;
        const ty = cy + Math.sin(targetAngle) * targetR;
        n.vx += (tx - n.x) * 0.0002;
        n.vy += (ty - n.y) * 0.0002;
      });

      // Draw connections
      conns.forEach(conn => {
        const na = nodes[conn.a];
        const nb = nodes[conn.b];
        if (!na || !nb) return;

        const grad = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        grad.addColorStop(0, na.color + "40");
        grad.addColorStop(1, nb.color + "20");
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Particles along connection
        conn.particles.forEach(p => {
          p.t += p.speed * (speaking ? 3 : listening ? 2 : 1);
          if (p.t > 1) p.t -= 1;
          const px = na.x + (nb.x - na.x) * p.t;
          const py = na.y + (nb.y - na.y) * p.t;

          // Particle glow
          const pg = ctx.createRadialGradient(px, py, 0, px, py, 5);
          pg.addColorStop(0, nb.color + "ee");
          pg.addColorStop(1, "transparent");
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
        });
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        if (n.isCenter) return; // drawn separately below

        const pulse = Math.sin(n.t * 2) * (speaking ? 4 : listening ? 3 : 1.5);
        const r = n.size + pulse;

        // Glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5);
        glow.addColorStop(0, n.color + "55");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2);
        ctx.fill();

        // Node dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Label (only if not too small)
        if (n.size > 3) {
          const pad = 3;
          ctx.font = "8px monospace";
          const tw = ctx.measureText(n.label).width;
          const lx = n.x + r + 5;
          const ly = n.y - 6;

          ctx.fillStyle = "rgba(2,2,12,0.85)";
          ctx.fillRect(lx - pad, ly - pad, tw + pad * 2, 13 + pad * 2);
          ctx.strokeStyle = n.color + "55";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(lx - pad, ly - pad, tw + pad * 2, 13 + pad * 2);

          ctx.fillStyle = n.color;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(n.label, lx, ly);
        }
      });

      // Center FAY orb
      const c = nodes[0];
      const orbPulse = speaking ? Math.sin(time * 8) * 10 : listening ? Math.sin(time * 4) * 6 : Math.sin(time) * 3;
      const orbR = 50 + orbPulse;

      // Multi-layer glow
      [orbR * 4, orbR * 2.5, orbR * 1.5].forEach((gr, gi) => {
        const gg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, gr);
        const alpha = ["15", "25", "35"][gi];
        gg.addColorStop(0, glowColor + alpha);
        gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(c.x, c.y, gr, 0, Math.PI * 2);
        ctx.fill();
      });

      // Orb body
      const orbGrad = ctx.createRadialGradient(c.x - 12, c.y - 12, 0, c.x, c.y, orbR);
      orbGrad.addColorStop(0, speaking ? "#aaffff" : listening ? "#ff80ff" : "#cc88ff");
      orbGrad.addColorStop(0.4, speaking ? "#00aabb" : listening ? "#cc00ee" : "#8822cc");
      orbGrad.addColorStop(1, "#0d0620");
      ctx.beginPath();
      ctx.arc(c.x, c.y, orbR, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Rotating rings around orb
      [orbR + 12, orbR + 22, orbR + 35].forEach((rr, ri) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, rr, time * (ri % 2 === 0 ? 0.5 : -0.3), time * (ri % 2 === 0 ? 0.5 : -0.3) + Math.PI * 1.5);
        ctx.strokeStyle = glowColor + ["66", "44", "22"][ri];
        ctx.lineWidth = ri === 0 ? 1.5 : 1;
        ctx.stroke();
      });

      // Scan sweep
      const scanA = time * 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.arc(c.x, c.y, Math.min(W, H) * 0.45, scanA, scanA + 0.6);
      ctx.closePath();
      ctx.fillStyle = glowColor + "08";
      ctx.fill();

      // Tick marks on outer ring
      const outerR = Math.min(W, H) * 0.45;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const inner = i % 5 === 0 ? outerR - 12 : outerR - 6;
        ctx.beginPath();
        ctx.moveTo(c.x + Math.cos(a) * inner, c.y + Math.sin(a) * inner);
        ctx.lineTo(c.x + Math.cos(a) * outerR, c.y + Math.sin(a) * outerR);
        ctx.strokeStyle = glowColor + (i % 5 === 0 ? "55" : "22");
        ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.5;
        ctx.stroke();
      }

      // FAY text in center
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("FAY", c.x, c.y);

      // Status top right
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd66";
      ctx.fillText(speaking ? "// TRANSMITTING" : listening ? "// RECEIVING" : "// STANDBY", W - 20, 70);

      // Transcript bottom center
      if (tr) {
        ctx.font = "13px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(`"${tr}"`, W / 2, H - 100);
      }

      time += 0.016;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}
