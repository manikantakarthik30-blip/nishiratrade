import { useEffect, useRef } from "react";

interface StarfieldProps {
  density?: number;
  className?: string;
}

/**
 * Canvas-based animated starfield. Renders behind content.
 */
export function Starfield({ density = 140, className = "" }: StarfieldProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stars: {
      x: number;
      y: number;
      r: number;
      a: number;
      da: number;
      vy: number;
      hue: number;
    }[] = [];

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.7 + 0.2,
        da: (Math.random() - 0.5) * 0.008,
        vy: Math.random() * 0.05 + 0.01,
        hue: Math.random() > 0.8 ? 280 : 220,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      for (const s of stars) {
        s.a += s.da;
        if (s.a < 0.15 || s.a > 1) s.da = -s.da;
        s.y += s.vy;
        if (s.y > canvas.clientHeight) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        const color =
          s.hue === 280
            ? `rgba(180,140,255,${s.a})`
            : `rgba(180,230,255,${s.a})`;
        ctx.fillStyle = color;
        ctx.shadowBlur = s.r * 4;
        ctx.shadowColor = color;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    setup();
    draw();
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none fixed inset-0 h-full w-full -z-10 ${className}`}
    />
  );
}
