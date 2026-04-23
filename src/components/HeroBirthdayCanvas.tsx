import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

const GOLD   = "#F5A623";
const GOLD2  = "#FFD580";
const ROSE   = "#FF8FAB";
const SILVER = "#C8C8C8";
const DEEP   = "#1A1A2E";
const COLORS = [GOLD, GOLD, GOLD2, GOLD, SILVER, ROSE, GOLD2, GOLD];

type PType = "circle" | "diamond" | "ribbon" | "star";

interface P {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
  alpha: number; type: PType;
  angle: number; spin: number;
  life: number;
}

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; color: string; size: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.65, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.65, y);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, angle: number) {
  const spikes = 4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r  = i % 2 === 0 ? s : s * 0.4;
    const a  = angle + (i * Math.PI) / spikes;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function makeParticle(W: number, H: number): P {
  return {
    x:     rand(0, W),
    y:     rand(0, H),
    vx:    rand(-0.2, 0.2),
    vy:    rand(-0.55, -0.15),
    size:  rand(2, 5),
    color: pick(COLORS),
    alpha: rand(0.35, 0.9),
    type:  pick<PType>(["circle", "diamond", "ribbon", "star"]),
    angle: rand(0, Math.PI * 2),
    spin:  rand(-0.025, 0.025),
    life:  rand(0, 1),
  };
}

export default function HeroBirthdayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = 0, H = 0;
    let particles: P[]    = [];
    let sparks:    Spark[] = [];
    let tick = 0;
    let raf  = 0;
    let mouseX = -999, mouseY = -999;

    const rings = [
      { angle: 0 }, { angle: 0 }, { angle: 0 },
      { angle: 0 }, { angle: 0 }, { angle: 0 },
    ];

    const RING_DEFS = [
      { rFrac: 0.52, speed:  0.004,  dash: 6,  gap: 20, color: GOLD,   lw: 0.9, alpha: 0.35 },
      { rFrac: 0.46, speed: -0.003,  dash: 14, gap: 32, color: GOLD2,  lw: 0.7, alpha: 0.28 },
      { rFrac: 0.40, speed:  0.0025, dash: 5,  gap: 25, color: ROSE,   lw: 0.6, alpha: 0.22 },
      { rFrac: 0.34, speed: -0.005,  dash: 18, gap: 38, color: SILVER, lw: 0.5, alpha: 0.18 },
      { rFrac: 0.27, speed:  0.006,  dash: 8,  gap: 18, color: GOLD,   lw: 0.8, alpha: 0.30 },
      { rFrac: 0.20, speed: -0.007,  dash: 3,  gap: 12, color: GOLD2,  lw: 0.5, alpha: 0.20 },
    ];

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth;
      H = canvas!.height = canvas!.offsetHeight;
      const count = Math.min(70, Math.floor((W * H) / 7000));
      particles = Array.from({ length: count }, () => makeParticle(W, H));
    }

    function spawnSparks(x: number, y: number, n = 7) {
      for (let i = 0; i < n; i++) {
        const angle = rand(0, Math.PI * 2);
        const spd   = rand(1.5, 4);
        sparks.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1.5,
          life: 1, color: pick(COLORS), size: rand(1.5, 3.5),
        });
      }
    }

    function drawRingsLayer(cx: number, cy: number) {
      RING_DEFS.forEach((def, i) => {
        rings[i].angle += def.speed;
        const r = Math.min(W, H) * def.rFrac;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rings[i].angle);
        ctx.globalAlpha = def.alpha;
        ctx.strokeStyle = def.color;
        ctx.lineWidth   = def.lw;
        ctx.setLineDash([def.dash, def.gap]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // glint dots orbiting each ring
        for (let g = 0; g < 3; g++) {
          const a  = rings[i].angle + (g * Math.PI * 2) / 3;
          const gx = cx + Math.cos(a) * r;
          const gy = cy + Math.sin(a) * r;
          ctx.save();
          ctx.globalAlpha = def.alpha * 2;
          ctx.fillStyle   = def.color;
          ctx.beginPath();
          ctx.arc(gx, gy, def.lw * 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }

    function loop() {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // ── background
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      // ── ambient radial glow
      const grd = ctx.createRadialGradient(W * 0.5, H * 1.1, 0, W * 0.5, H * 0.4, H * 1.05);
      grd.addColorStop(0,    "rgba(245,166,35,0.13)");
      grd.addColorStop(0.45, "rgba(26,26,46,0)");
      grd.addColorStop(1,    "rgba(255,143,171,0.07)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // ── mouse-follow soft glow
      if (mouseX > 0) {
        const mg = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 170);
        mg.addColorStop(0, "rgba(245,166,35,0.10)");
        mg.addColorStop(1, "rgba(245,166,35,0)");
        ctx.fillStyle = mg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── rings
      drawRingsLayer(W * 0.5, H * 0.5);

      // ── particles
      for (const p of particles) {
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        p.life  += 0.0045;
        if (p.life > 1) { p.life = 0; p.x = rand(0, W); p.y = H + 10; }
        if (p.y < -20)  { p.y = H + 10; p.x = rand(0, W); }

        const alpha = p.alpha * Math.sin(p.life * Math.PI);
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        switch (p.type) {
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "diamond":
            drawDiamond(ctx, 0, 0, p.size);
            ctx.fill();
            break;
          case "star":
            drawStar(ctx, 0, 0, p.size, 0);
            ctx.fill();
            break;
          case "ribbon":
            ctx.fillRect(-p.size * 0.3, -p.size * 1.6, p.size * 0.6, p.size * 3.2);
            break;
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ── sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x   += s.vx;
        s.y   += s.vy;
        s.vy  += 0.09;
        s.life -= 0.03;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life;
        ctx.fillStyle   = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // periodic auto-sparks
      if (tick % 90 === 0) {
        spawnSparks(rand(W * 0.15, W * 0.85), rand(H * 0.25, H * 0.75), 6);
      }

      raf = requestAnimationFrame(loop);
    }

    resize();
    loop();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      if (Math.random() < 0.18) spawnSparks(mouseX, mouseY, 4);
    };
    canvas.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas?.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 0,
      }}
    />
  );
}