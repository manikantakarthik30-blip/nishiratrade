import { useEffect, useRef } from "react";

/**
 * Cinematic space scene rendered on HTML5 canvas.
 * Full-viewport, positioned absolute behind content.
 */
export function SpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = width < 768;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Stars
    const starCount = isMobile ? 150 : 500;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7,
      offset: Math.random() * Math.PI * 2,
      drift: 0.02 + Math.random() * 0.03,
    }));

    // Nebulae (static)
    const nebulae = [
      { x: width * 0.2, y: height * 0.4, r: 280, color: "rgba(100, 50, 200, 0.05)" },
      { x: width * 0.75, y: height * 0.65, r: 250, color: "rgba(0, 100, 255, 0.04)" },
      { x: width * 0.5, y: height * 0.15, r: 220, color: "rgba(200, 80, 180, 0.03)" },
    ];

    // Shooting stars
    type Shooter = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    const shooters: Shooter[] = [];
    let nextShoot = performance.now() + 2000 + Math.random() * 3000;

    // Satellites
    const satellites = isMobile
      ? []
      : [
          { angle: 0, speed: (2 * Math.PI) / (20 * 60), rx: width * 0.4, ry: height * 0.3, cx: width * 0.5, cy: height * 0.5, size: 1 },
          { angle: Math.PI, speed: -(2 * Math.PI) / (25 * 60), rx: width * 0.35, ry: height * 0.28, cx: width * 0.5, cy: height * 0.5, size: 0.75 },
        ];

    // Ship state
    const ship = { x: -80, y: height * 0.3, speed: width / (15 * 60), trail: [] as { x: number; y: number }[] };

    let raf = 0;
    let start = performance.now();

    const drawStar = (s: typeof stars[number], t: number) => {
      const twinkle = 0.5 + 0.5 * Math.sin(t * 0.002 + s.offset);
      const op = s.opacity * (0.4 + 0.6 * twinkle);
      ctx.globalAlpha = op;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawGasGiant = (t: number) => {
      const cx = width * 0.15;
      const cy = height * 0.75;
      const r = 80;
      // Body
      const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, r);
      grad.addColorStop(0, "#e29a52");
      grad.addColorStop(0.6, "#c17f3a");
      grad.addColorStop(1, "#5a3a12");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // Rings
      const rot = t * 0.0001;
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot + i * 0.15);
        ctx.strokeStyle = `rgba(220, 180, 120, ${0.35 - i * 0.08})`;
        ctx.lineWidth = 3 - i;
        ctx.beginPath();
        ctx.ellipse(0, 0, r + 30 + i * 12, 10 + i * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawBluePlanet = (t: number) => {
      const cx = width * 0.8;
      const cy = height * 0.2;
      const r = 45;
      // Atmosphere glow
      const atm = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 20);
      atm.addColorStop(0, "rgba(100,150,255,0.35)");
      atm.addColorStop(1, "rgba(100,150,255,0)");
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
      ctx.fill();
      // Body
      const g = ctx.createRadialGradient(cx - 12, cy - 12, 5, cx, cy, r);
      g.addColorStop(0, "#4d7dff");
      g.addColorStop(0.7, "#1a4fcc");
      g.addColorStop(1, "#081f5c");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // Moon
      const angle = t * 0.0008;
      const mx = cx + Math.cos(angle) * 70;
      const my = cy + Math.sin(angle) * 70 * 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawPurpleDwarf = () => {
      const cx = width * 0.9;
      const cy = height * 0.55;
      const r = 25;
      const g = ctx.createRadialGradient(cx - 7, cy - 7, 3, cx, cy, r);
      g.addColorStop(0, "#a855e6");
      g.addColorStop(0.7, "#6b21a8");
      g.addColorStop(1, "#2a0554");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawShip = (t: number) => {
      ship.x += ship.speed;
      if (ship.x > width + 100) {
        ship.x = -100;
        ship.y = height * (0.2 + Math.random() * 0.3);
      }
      // Trail
      ship.trail.unshift({ x: ship.x - 30, y: ship.y });
      if (ship.trail.length > 10) ship.trail.pop();
      ship.trail.forEach((p, i) => {
        ctx.globalAlpha = (1 - i / 10) * 0.5;
        ctx.fillStyle = "#00d4ff";
        ctx.beginPath();
        ctx.arc(p.x - i * 4, p.y, 2 - i * 0.15, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      const x = ship.x;
      const y = ship.y;
      // Wings
      ctx.fillStyle = "#7a8090";
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x - 25, y - 14);
      ctx.lineTo(x - 15, y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x - 25, y + 14);
      ctx.lineTo(x - 15, y);
      ctx.closePath();
      ctx.fill();
      // Body
      const bg = ctx.createLinearGradient(x - 30, y, x + 30, y);
      bg.addColorStop(0, "#8a8fa0");
      bg.addColorStop(0.5, "#e0e2ee");
      bg.addColorStop(1, "#c0c0d0");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(x, y, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cockpit accent
      ctx.fillStyle = "#00d4ff";
      ctx.beginPath();
      ctx.ellipse(x + 8, y, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Engine glow
      const pulse = 0.7 + 0.3 * Math.sin(t * 0.01);
      const eg = ctx.createRadialGradient(x - 30, y, 1, x - 30, y, 10 * pulse);
      eg.addColorStop(0, "rgba(180,230,255,0.95)");
      eg.addColorStop(1, "rgba(0,150,255,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(x - 30, y, 10 * pulse, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawUFO = (t: number) => {
      const cx = width * 0.6;
      const cy = height * 0.25 + Math.sin(t * 0.001) * 20;
      // Disc
      const g = ctx.createLinearGradient(cx - 20, cy, cx + 20, cy);
      g.addColorStop(0, "#4a6a5a");
      g.addColorStop(0.5, "#a8c0b0");
      g.addColorStop(1, "#4a6a5a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Dome
      const dg = ctx.createRadialGradient(cx, cy - 4, 2, cx, cy - 4, 12);
      dg.addColorStop(0, "rgba(180,255,220,0.9)");
      dg.addColorStop(1, "rgba(80,180,140,0.5)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 11, Math.PI, 0);
      ctx.fill();
      // Rim lights
      const colors = ["#ff3b3b", "#ffcc00", "#00ff88"];
      const phase = Math.floor(t * 0.005) % 3;
      for (let i = 0; i < 6; i++) {
        const lx = cx + Math.cos((i / 6) * Math.PI * 2) * 22;
        const ly = cy + Math.sin((i / 6) * Math.PI * 2) * 6;
        ctx.fillStyle = colors[(i + phase) % 3];
        ctx.beginPath();
        ctx.arc(lx, ly, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawSatellite = (sat: (typeof satellites)[number]) => {
      sat.angle += sat.speed;
      const x = sat.cx + Math.cos(sat.angle) * sat.rx;
      const y = sat.cy + Math.sin(sat.angle) * sat.ry;
      const s = sat.size;
      // Solar panels
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(x - 25 * s, y - 4 * s, 15 * s, 8 * s);
      ctx.fillRect(x + 10 * s, y - 4 * s, 15 * s, 8 * s);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - 25 * s, y - 4 * s, 15 * s, 8 * s);
      ctx.strokeRect(x + 10 * s, y - 4 * s, 15 * s, 8 * s);
      // Body
      ctx.fillStyle = "#c0c0d0";
      ctx.fillRect(x - 10 * s, y - 5 * s, 20 * s, 10 * s);
      // Antenna
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 5 * s);
      ctx.lineTo(x, y - 12 * s);
      ctx.stroke();
    };

    const spawnShooter = () => {
      const y = Math.random() * height * 0.5;
      shooters.push({
        x: width + 40,
        y,
        vx: -10,
        vy: 6,
        life: 0,
        max: 60,
      });
    };

    const drawShooters = () => {
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const alpha = 1 - s.life / s.max;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x + 80, s.y - 48);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + 80, s.y - 48);
        ctx.stroke();
        if (s.life >= s.max || s.x < -100) shooters.splice(i, 1);
      }
    };

    const render = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, width, height);
      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#050418");
      bg.addColorStop(0.5, "#0a0625");
      bg.addColorStop(1, "#02010c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Nebulae
      nebulae.forEach((n) => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Stars
      stars.forEach((s) => {
        s.x += s.drift * 0.3;
        if (s.x > width) s.x = 0;
        drawStar(s, t);
      });
      ctx.globalAlpha = 1;

      // Planets
      drawGasGiant(t);
      drawBluePlanet(t);
      drawPurpleDwarf();

      // Satellites
      satellites.forEach(drawSatellite);

      // UFO
      drawUFO(t);

      // Ship
      drawShip(t);

      // Shooting stars
      if (now > nextShoot) {
        spawnShooter();
        nextShoot = now + 3000 + Math.random() * 2000;
      }
      drawShooters();

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
