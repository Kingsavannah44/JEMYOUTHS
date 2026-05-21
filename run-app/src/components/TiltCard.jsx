import { useRef } from "react";

// ── Tilt Card ────────────────────────────────────────────────────────────────
export default function TiltCard({ children, style }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const ex = (e.touches?.[0]?.clientX ?? e.clientX), ey = (e.touches?.[0]?.clientY ?? e.clientY);
    const dx = (ex-cx)/(r.width/2), dy = (ey-cy)/(r.height/2);
    el.style.transform = `perspective(600px) rotateY(${dx*8}deg) rotateX(${-dy*6}deg) scale(1.03)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = "perspective(600px) rotateY(0) rotateX(0) scale(1)"; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onTouchMove={onMove} onTouchEnd={onLeave}
      style={{ transformStyle:"preserve-3d", transition:"transform 0.15s ease", willChange:"transform", ...style }}>
      {children}
    </div>
  );
}
