import { useRef, useEffect } from "react";

// ── 3-D Canvas Scene ─────────────────────────────────────────────────────────
export default function Scene3D() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, raf;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    // orbs
    const orbs = Array.from({length:14}, (_, i) => ({
      x: Math.random() * 800, y: Math.random() * 500, z: Math.random() * 400 + 100,
      r: 18 + Math.random() * 30,
      vx: (Math.random()-.5)*0.4, vy: (Math.random()-.5)*0.3,
      phase: Math.random()*Math.PI*2,
      hue: [270,200,25,160,340][i%5],
    }));

    // stars
    const stars = Array.from({length:120}, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random()*1.4+0.2, alpha: Math.random()*0.6+0.2,
      twinkle: Math.random()*Math.PI*2,
    }));

    // 3-D cross vertices (simple wireframe)
    const cross3D = { rx:0, ry:0, rz:0 };

    let t = 0;
    const draw = () => {
      t += 0.006;
      ctx.clearRect(0,0,W,H);

      // stars
      stars.forEach(s => {
        s.twinkle += 0.02;
        const a = s.alpha * (0.6 + 0.4*Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      // grid lines — gives 3-D floor feel
      ctx.save();
      const gAlpha = 0.07;
      const perspective = 600;
      const horizon = H * 0.65;
      for (let gx = -5; gx <= 5; gx++) {
        const wx = W/2 + gx * 60;
        ctx.beginPath();
        ctx.moveTo(W/2 + (wx - W/2) * 0.01, horizon);
        ctx.lineTo(wx, H + 80);
        ctx.strokeStyle = `rgba(124,58,237,${gAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      for (let gy = 0; gy <= 8; gy++) {
        const fy = gy / 8;
        const y = horizon + (H+80-horizon)*fy;
        const spread = (W * 0.5) * fy;
        ctx.beginPath();
        ctx.moveTo(W/2 - spread, y);
        ctx.lineTo(W/2 + spread, y);
        ctx.strokeStyle = `rgba(124,58,237,${gAlpha * fy})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.restore();

      // orbs with 3-D depth
      orbs.forEach(o => {
        o.phase += 0.012;
        o.x += o.vx; o.y += o.vy;
        if (o.x < 0 || o.x > 800) o.vx *= -1;
        if (o.y < 0 || o.y > 500) o.vy *= -1;
        const px = (o.x / 800) * W;
        const py = (o.y / 500) * H * 0.7;
        const depth = (o.z / 500);
        const sr = o.r * depth * (W / 600);
        const pulse = 1 + 0.12 * Math.sin(o.phase);
        const fr = sr * pulse;
        const grad = ctx.createRadialGradient(px - fr*0.3, py - fr*0.3, 0, px, py, fr*1.4);
        grad.addColorStop(0, `hsla(${o.hue},90%,75%,${0.45*depth})`);
        grad.addColorStop(0.5, `hsla(${o.hue},80%,55%,${0.25*depth})`);
        grad.addColorStop(1, `hsla(${o.hue},70%,40%,0)`);
        ctx.beginPath();
        ctx.arc(px, py, fr*1.4, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();
        // specular highlight
        ctx.beginPath();
        ctx.arc(px - fr*0.35, py - fr*0.35, fr*0.28, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.18*depth})`;
        ctx.fill();
      });

      // 3-D rotating cross wireframe
      cross3D.ry = t * 0.5;
      cross3D.rx = Math.sin(t * 0.3) * 0.3;
      const cx = W * 0.82, cy = H * 0.22, cScale = Math.min(W,H) * 0.07;
      const pts = [
        [-1,-3,0],[1,-3,0],[1,-1,0],[3,-1,0],[3,1,0],[1,1,0],[1,3,0],
        [-1,3,0],[-1,1,0],[-3,1,0],[-3,-1,0],[-1,-1,0],
      ];
      function project([x,y,z]) {
        const cos = Math.cos, sin = Math.sin;
        const rx = cross3D.rx, ry = cross3D.ry;
        let x1=x*cos(ry)-z*sin(ry), z1=x*sin(ry)+z*cos(ry);
        let y1=y*cos(rx)-z1*sin(rx), z2=y*sin(rx)+z1*cos(rx);
        const fov = 5; const pz = fov + z2*0.3;
        return [cx + (x1/pz)*cScale*fov, cy + (y1/pz)*cScale*fov, z2];
      }
      const projected = pts.map(project);
      ctx.save();
      ctx.beginPath();
      projected.forEach(([px,py], i) => i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py));
      ctx.closePath();
      const crossGrad = ctx.createLinearGradient(cx-cScale,cy-cScale*3,cx+cScale,cy+cScale*3);
      crossGrad.addColorStop(0,"rgba(167,139,250,0.7)");
      crossGrad.addColorStop(0.5,"rgba(56,189,248,0.5)");
      crossGrad.addColorStop(1,"rgba(249,115,22,0.4)");
      ctx.strokeStyle = crossGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(124,58,237,0.08)";
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1 }} />;
}
