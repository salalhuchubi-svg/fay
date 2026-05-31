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

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onResize);

    const LABELS = [
      ["TIKTOK","#e040fb"],["VIRAL","#00e5ff"],["GROWTH","#69ff47"],["CONTENT","#9d4edd"],
      ["HOOKS","#e040fb"],["TRENDS","#00e5ff"],["REVENUE","#69ff47"],["ENGAGE","#9d4edd"],
      ["STRATEGY","#e040fb"],["ANALYTICS","#00e5ff"],["FINANCE","#69ff47"],["IDEAS","#9d4edd"],
      ["POSTS","#e040fb"],["REACH","#00e5ff"],["BRAND","#69ff47"],["VOICE","#9d4edd"],
    ];

    type N = { x:number; y:number; tx:number; ty:number; label:string; color:string; size:number; phase:number; speed:number };
    const nodes: N[] = [];

    const buildNodes = () => {
      nodes.length = 0;
      const cx = W/2, cy = H/2;
      LABELS.forEach((lg, i) => {
        const layer = Math.floor(i / 4) + 1;
        const inLayer = i % 4;
        const angle = (inLayer / 4) * Math.PI*2 + layer*0.8 + i*0.15;
        const r = layer * Math.min(W,H) * 0.15 + 20;
        const tx = cx + Math.cos(angle)*r;
        const ty = cy + Math.sin(angle)*r;
        nodes.push({ x:tx, y:ty, tx, ty, label:lg[0], color:lg[1], size: Math.max(3, 8-layer*1.5), phase: Math.random()*Math.PI*2, speed: 0.01+Math.random()*0.015 });
      });
    };
    buildNodes();
    window.addEventListener("resize", buildNodes);

    // Build connections
    const conns: [number,number][] = [];
    nodes.forEach((_, i) => {
      const layer = Math.floor(i/4)+1;
      if (layer === 1) conns.push([-1, i]); // -1 = center
      else {
        // connect to prev layer
        const prevStart = (layer-2)*4;
        const nearest = prevStart + (i%4);
        conns.push([nearest, i]);
      }
    });

    // Particles
    type P = { conn: number; t: number; speed: number };
    const particles: P[] = [];
    conns.forEach((_, i) => { for(let j=0;j<2;j++) particles.push({conn:i, t:Math.random(), speed:0.005+Math.random()*0.008}); });

    let time = 0;
    const FPS = 30;
    const FRAME_MS = 1000/FPS;

    function draw(now: number) {
      animRef.current = requestAnimationFrame(draw);
      if (now - lastFrameRef.current < FRAME_MS) return;
      lastFrameRef.current = now;

      const { listening, speaking, transcript: tr, stats } = stateRef.current;
      const cx = W/2, cy = H/2;
      const mainColor = speaking ? "#00e5ff" : listening ? "#e040fb" : "#9d4edd";

      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = "#020208";
      ctx.fillRect(0,0,W,H);

      // Grid
      ctx.strokeStyle = "rgba(157,78,221,0.04)";
      ctx.lineWidth = 1;
      for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

      // Center glow
      const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(W,H)*0.55);
      bg.addColorStop(0, mainColor+"14");
      bg.addColorStop(0.6, mainColor+"05");
      bg.addColorStop(1,"transparent");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // Move nodes
      nodes.forEach(n => {
        n.phase += n.speed;
        n.x += (n.tx - n.x)*0.02 + Math.sin(n.phase)*0.4;
        n.y += (n.ty - n.y)*0.02 + Math.cos(n.phase*0.7)*0.4;
      });

      // Connections
      conns.forEach(([ai, bi], ci) => {
        const na = ai === -1 ? {x:cx,y:cy,color:mainColor} : nodes[ai];
        const nb = nodes[bi];
        if(!na||!nb) return;
        const grad = ctx.createLinearGradient(na.x,na.y,nb.x,nb.y);
        grad.addColorStop(0, (na as {color:string}).color+"33");
        grad.addColorStop(1, nb.color+"18");
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y);
        ctx.strokeStyle=grad; ctx.lineWidth=0.8; ctx.stroke();

        // Particles
        particles.filter(p=>p.conn===ci).forEach(p=>{
          p.t += p.speed*(speaking?3:listening?2:1);
          if(p.t>1) p.t-=1;
          const px = na.x+(nb.x-na.x)*p.t;
          const py = na.y+(nb.y-na.y)*p.t;
          const pg=ctx.createRadialGradient(px,py,0,px,py,5);
          pg.addColorStop(0,nb.color+"cc"); pg.addColorStop(1,"transparent");
          ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
          ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(px,py,1.5,0,Math.PI*2); ctx.fill();
        });
      });

      // Nodes
      nodes.forEach(n=>{
        const pulse = Math.sin(n.phase*2)*(speaking?5:listening?3:1.5);
        const r = n.size+pulse;
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*5);
        g.addColorStop(0,n.color+"44"); g.addColorStop(1,"transparent");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x,n.y,r*5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=n.color; ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();

        if(n.size>3){
          const pad=3;
          ctx.font="8px monospace";
          const tw=ctx.measureText(n.label).width;
          const lx=n.x+r+5, ly=n.y-6;
          ctx.fillStyle="rgba(2,2,12,0.88)";
          ctx.fillRect(lx-pad,ly-pad,tw+pad*2,14+pad*2);
          ctx.strokeStyle=n.color+"44"; ctx.lineWidth=0.5;
          ctx.strokeRect(lx-pad,ly-pad,tw+pad*2,14+pad*2);
          ctx.fillStyle=n.color; ctx.textAlign="left"; ctx.textBaseline="top";
          ctx.fillText(n.label,lx,ly);
        }
      });

      // Center orb
      const orbR = 55 + (speaking?Math.sin(time*8)*8:listening?Math.sin(time*4)*5:Math.sin(time*0.8)*2);
      [orbR*3.5, orbR*2, orbR*1.3].forEach((gr,gi)=>{
        const gg=ctx.createRadialGradient(cx,cy,0,cx,cy,gr);
        gg.addColorStop(0, mainColor+["18","28","40"][gi]);
        gg.addColorStop(1,"transparent");
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(cx,cy,gr,0,Math.PI*2); ctx.fill();
      });

      const og=ctx.createRadialGradient(cx-15,cy-15,0,cx,cy,orbR);
      og.addColorStop(0, speaking?"#aaffff":listening?"#ff88ff":"#cc88ff");
      og.addColorStop(0.5, speaking?"#0088bb":listening?"#aa00dd":"#7700bb");
      og.addColorStop(1,"#08041a");
      ctx.beginPath(); ctx.arc(cx,cy,orbR,0,Math.PI*2); ctx.fillStyle=og; ctx.fill();

      // Rings
      [orbR+10,orbR+20,orbR+32].forEach((rr,ri)=>{
        ctx.beginPath();
        ctx.arc(cx,cy,rr,time*(ri%2===0?0.6:-0.4), time*(ri%2===0?0.6:-0.4)+Math.PI*1.6);
        ctx.strokeStyle=mainColor+["55","33","22"][ri]; ctx.lineWidth=ri===0?1.5:0.8; ctx.stroke();
      });

      // Scan sweep
      const sa=time*1.2;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,Math.min(W,H)*0.42,sa,sa+0.55); ctx.closePath();
      ctx.fillStyle=mainColor+"08"; ctx.fill();

      // Tick marks
      const tr2=Math.min(W,H)*0.42;
      for(let i=0;i<60;i++){
        const a=(i/60)*Math.PI*2;
        const inn=i%5===0?tr2-12:tr2-5;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*inn,cy+Math.sin(a)*inn);
        ctx.lineTo(cx+Math.cos(a)*tr2,cy+Math.sin(a)*tr2);
        ctx.strokeStyle=mainColor+(i%5===0?"55":"22"); ctx.lineWidth=i%5===0?1.5:0.5; ctx.stroke();
      }

      // FAY label
      ctx.font="bold 14px monospace"; ctx.fillStyle="rgba(255,255,255,0.95)";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("FAY",cx,cy);

      // ── HUD PANELS ──

      // Top left: TikTok accounts
      const hudX = 16, hudY = 70;
      ctx.fillStyle="rgba(2,2,12,0.75)";
      ctx.strokeStyle=mainColor+"44"; ctx.lineWidth=1;
      roundRect(ctx, hudX, hudY, 170, stats.accounts.length*22+50, 8);
      ctx.fill(); ctx.stroke();
      ctx.font="9px monospace"; ctx.fillStyle=mainColor; ctx.textAlign="left"; ctx.textBaseline="top";
      ctx.fillText("TIKTOK ACCOUNTS",hudX+10,hudY+10);
      ctx.fillStyle="rgba(157,78,221,0.5)"; ctx.fillRect(hudX+10,hudY+22,150,1);
      stats.accounts.forEach((a,i)=>{
        ctx.fillStyle="#e0e0f0"; ctx.fillText("@"+a, hudX+10, hudY+30+i*22);
      });
      if(stats.accounts.length===0){ ctx.fillStyle="#8888aa"; ctx.fillText("No accounts linked",hudX+10,hudY+30); }
      ctx.fillStyle="#9d4edd"; ctx.fillText("FOLLOWERS: "+stats.followers.toLocaleString(), hudX+10, hudY+30+Math.max(1,stats.accounts.length)*22);

      // Top right: Business stats
      const bx = W-186, by = 70;
      ctx.fillStyle="rgba(2,2,12,0.75)";
      ctx.strokeStyle=mainColor+"44"; ctx.lineWidth=1;
      roundRect(ctx,bx,by,170,100,8); ctx.fill(); ctx.stroke();
      ctx.font="9px monospace"; ctx.fillStyle=mainColor; ctx.textAlign="left"; ctx.textBaseline="top";
      ctx.fillText("BUSINESS STATUS",bx+10,by+10);
      ctx.fillStyle="rgba(157,78,221,0.5)"; ctx.fillRect(bx+10,by+22,150,1);
      ctx.fillStyle="#69ff47"; ctx.fillText("REVENUE  $"+stats.revenue.toLocaleString(), bx+10,by+30);
      ctx.fillStyle="#00e5ff"; ctx.fillText("TASKS    "+stats.tasks+" PENDING", bx+10,by+52);
      ctx.fillStyle=mainColor; ctx.fillText("STATUS   ONLINE", bx+10,by+74);

      // Bottom: status + transcript
      ctx.font="10px monospace"; ctx.textAlign="right"; ctx.textBaseline="bottom";
      ctx.fillStyle=speaking?"#00e5ff":listening?"#e040fb":"#9d4edd55";
      ctx.fillText(speaking?"// TRANSMITTING":listening?"// RECEIVING":"// STANDBY", W-16, H-110);

      if(tr){
        ctx.font="13px monospace"; ctx.textAlign="center"; ctx.fillStyle="rgba(255,255,255,0.8)";
        ctx.fillText(`"${tr}"`, W/2, H-110);
      }

      time += 0.016;
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", buildNodes);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{zIndex:0}} />;
}

function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}
