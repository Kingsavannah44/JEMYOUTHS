import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ── constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const ADMIN_CREDENTIALS = { username: "admin", password: "jem2026" };

function getLastMonday(year, month) {
  const last = new Date(year, month + 1, 0);
  const dow = last.getDay();
  last.setDate(last.getDate() - (dow >= 1 ? dow - 1 : 6));
  return last;
}
function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const SEED = [
  { id: 1, name: "Amara Osei", dob: "1999-01-04" },
  { id: 2, name: "Jaylen Mwangi", dob: "2001-01-17" },
  { id: 3, name: "Priya Chege", dob: "2000-02-22" },
  { id: 4, name: "Tobias Otieno", dob: "2002-02-08" },
  { id: 5, name: "Zara Kamau", dob: "1998-03-19" },
  { id: 6, name: "Emmanuel Njoroge", dob: "2003-03-14" },
  { id: 7, name: "Fatima Wanjiru", dob: "2001-04-05" },
  { id: 8, name: "David Kariuki", dob: "2000-04-28" },
  { id: 9, name: "Grace Akinyi", dob: "1999-05-11" },
  { id: 10, name: "Samuel Muthoni", dob: "2002-05-30" },
  { id: 11, name: "Esther Nyambura", dob: "2003-06-07" },
  { id: 12, name: "Kevin Ochieng", dob: "2001-06-21" },
  { id: 13, name: "Ruth Adhiambo", dob: "2000-07-03" },
  { id: 14, name: "Michael Kimani", dob: "1998-07-15" },
  { id: 15, name: "Linda Wangui", dob: "2002-08-09" },
  { id: 16, name: "Brian Mwenda", dob: "2003-08-25" },
  { id: 17, name: "Angela Chebet", dob: "1999-09-12" },
  { id: 18, name: "Collins Mugo", dob: "2001-09-27" },
  { id: 19, name: "Diana Njeri", dob: "2000-10-06" },
  { id: 20, name: "Felix Otieno", dob: "2002-10-18" },
  { id: 21, name: "Hannah Wambua", dob: "2003-11-02" },
  { id: 22, name: "Ian Gitonga", dob: "1999-11-20" },
  { id: 23, name: "Joyce Auma", dob: "2001-12-10" },
  { id: 24, name: "Peter Ndirangu", dob: "2000-12-29" },
];

const PALETTE = [
  "#7c3aed",
  "#0ea5e9",
  "#f97316",
  "#10b981",
  "#e11d48",
  "#f59e0b",
  "#06b6d4",
  "#8b5cf6",
];
function avatarColor(name) {
  let h = 0;
  for (let c of name) h = (h + c.charCodeAt(0)) % 8;
  return PALETTE[h];
}
function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function randomParticle() {
  return {
    id: Math.random(),
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    size: 5 + Math.random() * 8,
    speed: 0.8 + Math.random() * 1.6,
    wobble: Math.random() * 4 - 2,
    rotation: Math.random() * 360,
    shape: Math.random() > 0.5 ? "rect" : "circle",
    color: ["#a855f7", "#38bdf8", "#f97316", "#34d399", "#fb7185", "#fbbf24"][
      Math.floor(Math.random() * 6)
    ],
  };
}

// ── 3-D Canvas Scene ─────────────────────────────────────────────────────────
function Scene3D() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, raf;
    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // orbs
    const orbs = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * 800,
      y: Math.random() * 500,
      z: Math.random() * 400 + 100,
      r: 18 + Math.random() * 30,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      hue: [270, 200, 25, 160, 340][i % 5],
    }));

    // stars
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random() * 0.6 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    }));

    // 3-D cross vertices (simple wireframe)
    const cross3D = { rx: 0, ry: 0, rz: 0 };

    let t = 0;
    const draw = () => {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);

      // stars
      stars.forEach((s) => {
        s.twinkle += 0.02;
        const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      // grid lines — gives 3-D floor feel
      ctx.save();
      const gAlpha = 0.07;
      const perspective = 600;
      const horizon = H * 0.65;
      for (let gx = -5; gx <= 5; gx++) {
        const wx = W / 2 + gx * 60;
        ctx.beginPath();
        ctx.moveTo(W / 2 + (wx - W / 2) * 0.01, horizon);
        ctx.lineTo(wx, H + 80);
        ctx.strokeStyle = `rgba(124,58,237,${gAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      for (let gy = 0; gy <= 8; gy++) {
        const fy = gy / 8;
        const y = horizon + (H + 80 - horizon) * fy;
        const spread = W * 0.5 * fy;
        ctx.beginPath();
        ctx.moveTo(W / 2 - spread, y);
        ctx.lineTo(W / 2 + spread, y);
        ctx.strokeStyle = `rgba(124,58,237,${gAlpha * fy})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.restore();

      // orbs with 3-D depth
      orbs.forEach((o) => {
        o.phase += 0.012;
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < 0 || o.x > 800) o.vx *= -1;
        if (o.y < 0 || o.y > 500) o.vy *= -1;
        const px = (o.x / 800) * W;
        const py = (o.y / 500) * H * 0.7;
        const depth = o.z / 500;
        const sr = o.r * depth * (W / 600);
        const pulse = 1 + 0.12 * Math.sin(o.phase);
        const fr = sr * pulse;
        const grad = ctx.createRadialGradient(
          px - fr * 0.3,
          py - fr * 0.3,
          0,
          px,
          py,
          fr * 1.4,
        );
        grad.addColorStop(0, `hsla(${o.hue},90%,75%,${0.45 * depth})`);
        grad.addColorStop(0.5, `hsla(${o.hue},80%,55%,${0.25 * depth})`);
        grad.addColorStop(1, `hsla(${o.hue},70%,40%,0)`);
        ctx.beginPath();
        ctx.arc(px, py, fr * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // specular highlight
        ctx.beginPath();
        ctx.arc(px - fr * 0.35, py - fr * 0.35, fr * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.18 * depth})`;
        ctx.fill();
      });

      // 3-D rotating cross wireframe
      cross3D.ry = t * 0.5;
      cross3D.rx = Math.sin(t * 0.3) * 0.3;
      const cx = W * 0.82,
        cy = H * 0.22,
        cScale = Math.min(W, H) * 0.07;
      const pts = [
        [-1, -3, 0],
        [1, -3, 0],
        [1, -1, 0],
        [3, -1, 0],
        [3, 1, 0],
        [1, 1, 0],
        [1, 3, 0],
        [-1, 3, 0],
        [-1, 1, 0],
        [-3, 1, 0],
        [-3, -1, 0],
        [-1, -1, 0],
      ];
      function project([x, y, z]) {
        const cos = Math.cos,
          sin = Math.sin;
        const rx = cross3D.rx,
          ry = cross3D.ry;
        let x1 = x * cos(ry) - z * sin(ry),
          z1 = x * sin(ry) + z * cos(ry);
        let y1 = y * cos(rx) - z1 * sin(rx),
          z2 = y * sin(rx) + z1 * cos(rx);
        const fov = 5;
        const pz = fov + z2 * 0.3;
        return [
          cx + (x1 / pz) * cScale * fov,
          cy + (y1 / pz) * cScale * fov,
          z2,
        ];
      }
      const projected = pts.map(project);
      ctx.save();
      ctx.beginPath();
      projected.forEach(([px, py], i) =>
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py),
      );
      ctx.closePath();
      const crossGrad = ctx.createLinearGradient(
        cx - cScale,
        cy - cScale * 3,
        cx + cScale,
        cy + cScale * 3,
      );
      crossGrad.addColorStop(0, "rgba(167,139,250,0.7)");
      crossGrad.addColorStop(0.5, "rgba(56,189,248,0.5)");
      crossGrad.addColorStop(1, "rgba(249,115,22,0.4)");
      ctx.strokeStyle = crossGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(124,58,237,0.08)";
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
}

// ── Tilt Card ────────────────────────────────────────────────────────────────
function TiltCard({ children, style }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    const ex = e.touches?.[0]?.clientX ?? e.clientX,
      ey = e.touches?.[0]?.clientY ?? e.clientY;
    const dx = (ex - cx) / (r.width / 2),
      dy = (ey - cy) / (r.height / 2);
    el.style.transform = `perspective(600px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) scale(1.03)`;
  };
  const onLeave = () => {
    if (ref.current)
      ref.current.style.transform =
        "perspective(600px) rotateY(0) rotateX(0) scale(1)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease",
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Scroll Reveal ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(36px) scale(0.97)",
        transition: `opacity 0.7s ${delay}s ease, transform 0.7s ${delay}s ease`,
      }}
    >
      {children}
    </div>
  );
}

// ── Admin Login Modal ─────────────────────────────────────────────────────────
function AdminLoginModal({ onSuccess, onClose }) {
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= 3;

  const handleLogin = async () => {
    if (locked) return;
    const errs = {};
    if (!creds.username.trim()) errs.username = "Username required";
    if (!creds.password) errs.password = "Password required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    if (
      creds.username === ADMIN_CREDENTIALS.username &&
      creds.password === ADMIN_CREDENTIALS.password
    ) {
      onSuccess();
    } else {
      setAttempts((a) => a + 1);
      setErrors({
        form:
          attempts >= 2
            ? "Too many failed attempts. Locked for this session."
            : "Invalid credentials. Try again.",
      });
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,0,15,0.88)",
        backdropFilter: "blur(14px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "linear-gradient(145deg,#13052a,#0d1a40)",
          border: "1px solid rgba(167,139,250,0.35)",
          borderRadius: 24,
          padding: "2.5rem 2rem",
          width: "92%",
          maxWidth: 400,
          boxShadow: "0 0 80px rgba(124,58,237,0.3), 0 32px 64px #0009",
          animation: shake
            ? "shake 0.5s ease"
            : "modalIn 0.4s cubic-bezier(.16,1,.3,1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* top glow bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg,#7c3aed,#0ea5e9,#f97316)",
            borderRadius: "24px 24px 0 0",
          }}
        />

        {/* 3-D shield icon */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 1rem",
              background: "linear-gradient(145deg,#7c3aed,#4c1d95)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              transform: "perspective(200px) rotateX(8deg)",
              fontSize: 32,
            }}
          >
            🛡️
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 22,
              color: "#fff",
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            Admin Access
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            JEM Youths · Restricted Area
          </div>
        </div>

        {locked && (
          <div
            style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid #f87171",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 800, color: "#f87171", fontSize: 14 }}>
              🔒 Session Locked
            </div>
            <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 4 }}>
              Too many failed attempts. Reload to try again.
            </div>
          </div>
        )}

        {errors.form && !locked && (
          <div
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: 12,
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: 13,
              color: "#f87171",
              textAlign: "center",
            }}
          >
            ⚠️ {errors.form}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "#c4b5fd",
              marginBottom: 6,
              letterSpacing: "0.06em",
            }}
          >
            USERNAME
          </label>
          <input
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${errors.username ? "#f87171" : "rgba(167,139,250,0.3)"}`,
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 15,
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Nunito',sans-serif",
              colorScheme: "dark",
            }}
            type="text"
            placeholder="Enter username"
            value={creds.username}
            disabled={locked}
            onChange={(e) => {
              setCreds((c) => ({ ...c, username: e.target.value }));
              setErrors((x) => ({ ...x, username: "", form: "" }));
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {errors.username && (
            <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
              {errors.username}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "#c4b5fd",
              marginBottom: 6,
              letterSpacing: "0.06em",
            }}
          >
            PASSWORD
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${errors.password ? "#f87171" : "rgba(167,139,250,0.3)"}`,
                borderRadius: 12,
                padding: "12px 44px 12px 16px",
                fontSize: 15,
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Nunito',sans-serif",
                colorScheme: "dark",
              }}
              type={showPw ? "text" : "password"}
              placeholder="Enter password"
              value={creds.password}
              disabled={locked}
              onChange={(e) => {
                setCreds((c) => ({ ...c, password: e.target.value }));
                setErrors((x) => ({ ...x, password: "", form: "" }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={() => setShowPw((s) => !s)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: 18,
              }}
            >
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
          {errors.password && (
            <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>
              {errors.password}
            </div>
          )}
        </div>

        <button
          disabled={loading || locked}
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 16,
            border: "none",
            cursor: locked || loading ? "not-allowed" : "pointer",
            background:
              locked || loading
                ? "rgba(124,58,237,0.3)"
                : "linear-gradient(135deg,#7c3aed,#0ea5e9)",
            color: locked || loading ? "#6b7280" : "#fff",
            fontFamily: "'Nunito',sans-serif",
            boxShadow: loading ? "none" : "0 8px 24px rgba(124,58,237,0.4)",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? "⏳ Authenticating…"
            : locked
              ? "🔒 Locked"
              : "🔐 Sign In to Dashboard"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 12,
            color: "#4b5563",
          }}
        >
          Demo: <span style={{ color: "#c4b5fd" }}>admin</span> /{" "}
          <span style={{ color: "#c4b5fd" }}>jem2025</span>
        </div>

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const CY = now.getFullYear(),
    CM = now.getMonth();
  const NM = CM === 11 ? 0 : CM + 1;
  const CELEBRATION_DATE = useMemo(() => getLastMonday(CY, CM), [CY, CM]);

  const [members, setMembers] = useState(SEED);
  const [tab, setTab] = useState("this");
  const [section, setSec] = useState(null);
  const [confetti, setConfetti] = useState(true);
  const [particles, setParticles] = useState(() =>
    Array.from({ length: 32 }, randomParticle),
  );
  const [submitted, setSubmitted] = useState(false);
  const [dupError, setDupError] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [reg, setReg] = useState({ name: "", dob: "" });
  const [regErrors, setRegErrors] = useState({});
  const [adminForm, setAdminForm] = useState({ name: "", dob: "" });
  const [adminErrors, setAdminErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Hero background carousel (local images)
  const heroImages = [
    "/Images/New.png",
    "/Images/New2.png",
    "/Images/New3.png",
    "/Images/New5.png",
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // ── Admin auth state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  const handleAdminButtonClick = () => {
    if (adminAuthenticated) {
      setSec((s) => (s === "admin" ? null : "admin"));
    } else {
      setShowAdminLogin(true);
    }
  };
  const handleAdminLoginSuccess = () => {
    setAdminAuthenticated(true);
    setShowAdminLogin(false);
    setSec("admin");
    showToast("Welcome, Admin! You have full access.", "success");
  };
  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setSec(null);
    showToast(
      "👋 Signed out of Admin Dashboard. See you soon dear admin",
      "info",
    );
  };

  // confetti
  useEffect(() => {
    if (!confetti) return;
    let frame;
    const animate = () => {
      setParticles((ps) =>
        ps.map((p) => {
          let ny = p.y + p.speed * 0.35,
            nx = p.x + Math.sin(ny * 0.05 + p.wobble) * 0.3;
          if (ny > 110) return randomParticle();
          return { ...p, y: ny, x: nx, rotation: p.rotation + p.speed };
        }),
      );
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [confetti]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4200);
  };

  const thisMonthBirths = useMemo(
    () => members.filter((m) => new Date(m.dob).getMonth() === CM),
    [members, CM],
  );
  const nextMonthBirths = useMemo(
    () => members.filter((m) => new Date(m.dob).getMonth() === NM),
    [members, NM],
  );
  const displayed = tab === "this" ? thisMonthBirths : nextMonthBirths;
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );
  const daysLeft = Math.max(0, Math.ceil((CELEBRATION_DATE - now) / 86400000));

  const validateReg = () => {
    const e = {};
    if (!reg.name.trim()) e.name = "Full name is required";
    else if (reg.name.trim().split(" ").length < 2)
      e.name = "Please enter your full name";
    if (!reg.dob) e.dob = "Birthdate is required";
    setRegErrors(e);
    return !Object.keys(e).length;
  };
  const handleRegister = async () => {
    if (submitted) {
      setDupError(true);
      return;
    }
    if (!validateReg()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setMembers((p) => [
      ...p,
      { id: Date.now(), name: reg.name.trim(), dob: reg.dob },
    ]);
    setSubmitted(true);
    setSubmitting(false);
    showToast("You're locked in! Your birthday is registered successfully.");
  };
  const validateAdmin = () => {
    const e = {};
    if (!adminForm.name.trim()) e.name = "Name required";
    if (!adminForm.dob) e.dob = "Date required";
    setAdminErrors(e);
    return !Object.keys(e).length;
  };
  const handleAdminAdd = async () => {
    if (!validateAdmin()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setMembers((p) => [
      ...p,
      { id: Date.now(), name: adminForm.name.trim(), dob: adminForm.dob },
    ]);
    setAdminForm({ name: "", dob: "" });
    setSubmitting(false);
    showToast("✅ Member added successfully!");
  };
  const handleDelete = (id) => {
    setMembers((p) => p.filter((m) => m.id !== id));
    showToast("🗑 Member removed.", "info");
  };
  const startEdit = (m) => {
    setEditId(m.id);
    setEditName(m.name);
    setEditDob(m.dob);
  };
  const saveEdit = () => {
    setMembers((p) =>
      p.map((m) =>
        m.id === editId ? { ...m, name: editName, dob: editDob } : m,
      ),
    );
    setEditId(null);
    showToast("Member updated!");
  };

  const inp = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(167,139,250,0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 15,
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
    fontFamily: "'Nunito',sans-serif",
    transition: "border-color 0.2s",
  };
  const lbl = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#c4b5fd",
    marginBottom: 6,
    letterSpacing: "0.06em",
  };
  const btnPrimary = (dis) => ({
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    fontWeight: 800,
    fontSize: 16,
    border: "none",
    cursor: dis ? "not-allowed" : "pointer",
    fontFamily: "'Nunito',sans-serif",
    background: dis
      ? "rgba(124,58,237,0.3)"
      : "linear-gradient(135deg,#7c3aed,#0ea5e9)",
    color: dis ? "#6b7280" : "#fff",
    boxShadow: dis ? "none" : "0 8px 24px rgba(124,58,237,0.35)",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07010f",
        fontFamily: "'Nunito',sans-serif",
        color: "#f1f0fe",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
        @keyframes fadeSlideDown{from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-9px)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(22px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.88) translateY(24px)}to{opacity:1;transform:none}}
        @keyframes shake{0%,100%{transform:none}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.4)}50%{box-shadow:0 0 48px rgba(124,58,237,0.8)}}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(.5)}
        input::placeholder{color:#4b5563}
        input:focus{border-color:#7c3aed!important;outline:none}
        .bcard:hover{transform:perspective(500px) translateY(-8px) scale(1.02)!important;box-shadow:0 20px 48px rgba(124,58,237,0.3)!important}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#07010f}::-webkit-scrollbar-thumb{background:#7c3aed;border-radius:99px}
        .acc-btn:hover{background:rgba(124,58,237,0.12)!important}
      `}</style>

      {/* confetti */}
      {confetti && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.shape === "rect" ? p.size * 0.5 : p.size,
                background: p.color,
                borderRadius: p.shape === "circle" ? "50%" : 3,
                transform: `rotate(${p.rotation}deg)`,
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLoginModal
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem 5rem",
          overflow: "hidden",
          backgroundImage: `linear-gradient(rgba(7,1,15,0.78), rgba(7,1,15,0.75)), url('${heroImages[heroIndex]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
        }}
      >
        {/* 3-D canvas */}
        <Scene3D />

        {/* glow blobs */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "#7c3aed18",
            filter: "blur(100px)",
            top: -120,
            left: "5%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "#0ea5e918",
            filter: "blur(80px)",
            bottom: -60,
            right: "3%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "#f9731620",
            filter: "blur(60px)",
            bottom: "20%",
            left: "20%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 3,
            textAlign: "center",
            maxWidth: 700,
            width: "100%",
          }}
        >
          {/* church name badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: "1.5rem",
              background: "rgba(124,58,237,0.18)",
              border: "1px solid rgba(167,139,250,0.45)",
              borderRadius: 99,
              padding: "8px 22px",
              fontSize: 14,
              color: "#c4b5fd",
              animation: "fadeSlideDown 0.6s ease both",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#a855f7",
                animation: "pulse 1.5s infinite",
                display: "inline-block",
              }}
            />
            ✝️ JEM Youths · Birthday Celebrations
          </div>

          <h1
            style={{
              fontSize: "clamp(2.1rem,8vw,3.8rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              margin: "0 0 1rem",
              background:
                "linear-gradient(135deg,#fff 25%,#c4b5fd 55%,#38bdf8 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "fadeSlideDown 0.7s 0.1s ease both",
              letterSpacing: "-0.02em",
            }}
          >
            Celebrating Our
            <br />
            {MONTHS[CM]} BIRTHDAY MVP! 🙌
          </h1>

          <p
            style={{
              fontSize: 17,
              color: "#94a3b8",
              margin: "0 0 2rem",
              animation: "fadeSlideDown 0.75s 0.2s ease both",
            }}
          >
            Every birthday is a blessing. We celebrate <em>you</em>.
          </p>

          {/* celebration card — 3D */}
          <TiltCard style={{ animation: "fadeSlideUp 0.8s 0.3s ease both" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 22,
                padding: "1.5rem 1.75rem",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
                boxShadow:
                  "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset",
              }}
            >
              <span style={{ fontSize: 44, lineHeight: 1 }}>📅</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 4,
                  }}
                >
                  Big Celebration & Cake Cutting
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.95rem,3.5vw,1.15rem)",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  Last Monday of {MONTHS[CM]}: {formatDate(CELEBRATION_DATE)}
                </div>
                <div style={{ fontSize: 13, color: "#c4b5fd", marginTop: 4 }}>
                  {daysLeft === 0
                    ? "🎉 It's today! See you there!"
                    : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} away. Save the date!`}
                </div>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#0ea5e9)",
                  borderRadius: 16,
                  padding: "14px 20px",
                  textAlign: "center",
                  minWidth: 78,
                  boxShadow: "0 8px 24px rgba(124,58,237,0.45)",
                  animation: "glow 2.5s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {daysLeft}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: 2,
                    letterSpacing: "0.05em",
                  }}
                >
                  DAYS
                </div>
              </div>
            </div>
          </TiltCard>

          {/* stats row */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: "1.5rem",
              flexWrap: "wrap",
              justifyContent: "center",
              animation: "fadeSlideUp 0.9s 0.5s ease both",
            }}
          >
            {[
              {
                label: `${MONTHS[CM]} Birthdays`,
                val: thisMonthBirths.length,
                icon: "🎂",
                color: "#7c3aed",
              },
              {
                label: `${MONTHS[NM]} Birthdays`,
                val: nextMonthBirths.length,
                icon: "📆",
                color: "#0ea5e9",
              },
              {
                label: "Total Members",
                val: members.length,
                icon: "👥",
                color: "#f97316",
              },
            ].map((s) => (
              <TiltCard key={s.label} style={{ flex: 1, minWidth: 90 }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${s.color}30`,
                    borderRadius: 18,
                    padding: "14px 16px",
                    textAlign: "center",
                    boxShadow: `0 0 24px ${s.color}15`,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            zIndex: 5,
            textAlign: "center",
            animation: "bounce 2s ease-in-out infinite",
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            Scroll to explore
          </div>
          <div style={{ fontSize: 22 }}>↓</div>
        </div>
      </section>

      {/* ── BIRTHDAY ROSTER ──────────────────────────────────── */}
      <section
        style={{
          background: "#0b0120",
          padding: "5rem 0 0",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* section divider */}
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg,transparent,#7c3aed,#0ea5e9,transparent)",
            marginBottom: 0,
          }}
        />
        <div
          style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.25rem 5rem" }}
        >
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#7c3aed",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Monthly Roster
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.6rem,5vw,2.3rem)",
                  fontWeight: 900,
                  color: "#fff",
                  margin: "0 0 0.5rem",
                }}
              >
                Who's Celebrating?
              </h2>
              <p style={{ fontSize: 15, color: "#94a3b8" }}>
                Birthday legends in{" "}
                <strong style={{ color: "#c4b5fd" }}>{MONTHS[CM]}</strong> and{" "}
                <strong style={{ color: "#38bdf8" }}>{MONTHS[NM]}</strong>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 18,
                padding: 5,
                gap: 4,
                marginBottom: "2rem",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              {[
                {
                  key: "this",
                  label: `🎂 ${MONTHS[CM]}`,
                  count: thisMonthBirths.length,
                },
                {
                  key: "next",
                  label: `📆 ${MONTHS[NM]}`,
                  count: nextMonthBirths.length,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "11px 0",
                    borderRadius: 13,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                    fontFamily: "'Nunito',sans-serif",
                    transition: "all 0.25s",
                    background:
                      tab === t.key
                        ? "linear-gradient(135deg,#7c3aed,#0ea5e9)"
                        : "transparent",
                    color: tab === t.key ? "#fff" : "#94a3b8",
                  }}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
          </Reveal>

          {displayed.length === 0 ? (
            <Reveal delay={0.15}>
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 1rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(167,139,250,0.25)",
                  borderRadius: 22,
                }}
              >
                <div style={{ fontSize: 52, marginBottom: 14 }}>🕊️</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  No birthdays yet!
                </div>
                <div style={{ fontSize: 15, color: "#94a3b8" }}>
                  No birthdays registered for{" "}
                  {tab === "this" ? MONTHS[CM] : MONTHS[NM]} yet!
                  <br />
                  Be the first below 👇
                </div>
              </div>
            </Reveal>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
                gap: 18,
              }}
            >
              {displayed.map((m, i) => {
                const d = new Date(m.dob),
                  color = avatarColor(m.name);
                return (
                  <Reveal key={m.id} delay={i * 0.07}>
                    <TiltCard>
                      <div
                        className="bcard"
                        style={{
                          background: `linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))`,
                          border: `1px solid ${color}30`,
                          borderRadius: 22,
                          padding: "1.75rem 1.25rem",
                          textAlign: "center",
                          transition: "transform 0.25s, box-shadow 0.25s",
                          boxShadow: `0 4px 24px ${color}15`,
                        }}
                      >
                        <div
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg,${color},${color}99)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            fontWeight: 900,
                            color: "#fff",
                            margin: "0 auto 1rem",
                            boxShadow: `0 0 0 4px ${color}25,0 0 0 8px ${color}12,0 8px 24px ${color}40`,
                          }}
                        >
                          {initials(m.name)}
                        </div>
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: "#fff",
                            marginBottom: 4,
                          }}
                        >
                          {m.name}
                        </div>
                        <div style={{ fontSize: 13, color: "#c4b5fd" }}>
                          🎂 {MONTHS[d.getMonth()]} {d.getDate()}
                        </div>
                        <div
                          style={{
                            marginTop: 14,
                            display: "inline-block",
                            background: `${color}20`,
                            border: `1px solid ${color}40`,
                            borderRadius: 99,
                            padding: "5px 16px",
                            fontSize: 12,
                            color,
                          }}
                        >
                          Birthday MVP ✨
                        </div>
                      </div>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FORMS SECTION ────────────────────────────────────── */}
      <section
        style={{
          background: "#0b0120",
          padding: "2rem 0 0",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.25rem 6rem" }}
        >
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#0ea5e9",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                📝 Get Involved
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.6rem,5vw,2.3rem)",
                  fontWeight: 900,
                  color: "#fff",
                  margin: "0 0 0.5rem",
                }}
              >
                Register & Manage
              </h2>
              <p style={{ fontSize: 15, color: "#94a3b8" }}>
                Register your birthday or contact an admin to manage the roster.
              </p>
            </div>
          </Reveal>

          {/* ─ Youth Registration ─ */}
          <Reveal delay={0.1}>
            <button
              className="acc-btn"
              onClick={() =>
                setSec((s) => (s === "register" ? null : "register"))
              }
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background:
                  section === "register"
                    ? "rgba(124,58,237,0.18)"
                    : "rgba(255,255,255,0.04)",
                border:
                  section === "register"
                    ? "1px solid rgba(167,139,250,0.45)"
                    : "1px solid rgba(255,255,255,0.09)",
                borderRadius: section === "register" ? "18px 18px 0 0" : 18,
                padding: "1.25rem 1.5rem",
                cursor: "pointer",
                transition: "all 0.3s",
                color: "#fff",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: section === "register" ? 0 : 14,
                fontFamily: "'Nunito',sans-serif",
              }}
            >
              <span>Youth Birthday Registration</span>
              <span
                style={{
                  fontSize: 22,
                  transition: "transform 0.3s",
                  transform: section === "register" ? "rotate(180deg)" : "none",
                }}
              >
                ⌄
              </span>
            </button>
            <div
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderTop: "none",
                borderRadius: "0 0 18px 18px",
                maxHeight: section === "register" ? 1200 : 0,
                overflow: "hidden",
                transition: "max-height 0.45s ease",
                marginBottom: 14,
              }}
            >
              <div style={{ padding: "1.75rem 1.5rem" }}>
                {submitted && (
                  <div
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.4)",
                      borderRadius: 14,
                      padding: "1rem 1.25rem",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 26 }}>🔒</span>
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "#34d399",
                          fontSize: 15,
                        }}
                      >
                        You're already registered!
                      </div>
                      <div style={{ fontSize: 13, color: "#6ee7b7" }}>
                        Your birthday is locked in forever. See you at the
                        celebration!
                      </div>
                    </div>
                  </div>
                )}
                {dupError && (
                  <div
                    style={{
                      background: "rgba(248,113,113,0.1)",
                      border: "1px solid rgba(248,113,113,0.35)",
                      borderRadius: 14,
                      padding: "10px 14px",
                      marginBottom: 14,
                      fontSize: 13,
                      color: "#f87171",
                    }}
                  >
                    ⚠️ You've already registered! One entry per person. 🎉
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>FULL NAME</label>
                  <input
                    style={{
                      ...inp,
                      ...(regErrors.name ? { borderColor: "#f87171" } : {}),
                    }}
                    type="text"
                    placeholder="e.g. Amara Osei"
                    value={reg.name}
                    disabled={submitted}
                    onChange={(e) => {
                      setReg((r) => ({ ...r, name: e.target.value }));
                      setRegErrors((x) => ({ ...x, name: "" }));
                    }}
                  />
                  {regErrors.name && (
                    <div
                      style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}
                    >
                      {regErrors.name}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>BIRTHDATE</label>
                  <input
                    style={{
                      ...inp,
                      ...(regErrors.dob ? { borderColor: "#f87171" } : {}),
                    }}
                    type="date"
                    value={reg.dob}
                    disabled={submitted}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setReg((r) => ({ ...r, dob: e.target.value }));
                      setRegErrors((x) => ({ ...x, dob: "" }));
                    }}
                  />
                  {regErrors.dob && (
                    <div
                      style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}
                    >
                      {regErrors.dob}
                    </div>
                  )}
                </div>
                <button
                  style={btnPrimary(submitting || submitted)}
                  onClick={handleRegister}
                  disabled={submitting || submitted}
                >
                  {submitting
                    ? "⏳ Registering…"
                    : submitted
                      ? "🔒 Already Registered"
                      : "🎉 Register My Birthday!"}
                </button>
              </div>
            </div>
          </Reveal>

          {/* ─ Admin Dashboard ─ */}
          <Reveal delay={0.15}>
            <button
              className="acc-btn"
              onClick={handleAdminButtonClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background:
                  section === "admin"
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(255,255,255,0.04)",
                border:
                  section === "admin"
                    ? "1px solid rgba(239,68,68,0.4)"
                    : "1px solid rgba(255,255,255,0.09)",
                borderRadius: section === "admin" ? "18px 18px 0 0" : 18,
                padding: "1.25rem 1.5rem",
                cursor: "pointer",
                transition: "all 0.3s",
                color: "#fff",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: section === "admin" ? 0 : 14,
                fontFamily: "'Nunito',sans-serif",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span>🛡️ Admin Dashboard</span>
                {adminAuthenticated ? (
                  <span
                    style={{
                      fontSize: 11,
                      background: "rgba(52,211,153,0.2)",
                      border: "1px solid rgba(52,211,153,0.4)",
                      color: "#34d399",
                      borderRadius: 99,
                      padding: "3px 10px",
                    }}
                  >
                    ● Authenticated
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      background: "rgba(248,113,113,0.15)",
                      border: "1px solid rgba(248,113,113,0.35)",
                      color: "#f87171",
                      borderRadius: 99,
                      padding: "3px 10px",
                    }}
                  >
                    🔒 Login Required
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {adminAuthenticated && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminLogout();
                    }}
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Sign Out
                  </span>
                )}
                <span
                  style={{
                    fontSize: 22,
                    transition: "transform 0.3s",
                    transform: section === "admin" ? "rotate(180deg)" : "none",
                  }}
                >
                  ⌄
                </span>
              </div>
            </button>

            <div
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderTop: "none",
                borderRadius: "0 0 18px 18px",
                maxHeight: section === "admin" ? 3000 : 0,
                overflow: "hidden",
                transition: "max-height 0.5s ease",
                marginBottom: 14,
              }}
            >
              {/* NOT authenticated */}
              {!adminAuthenticated && (
                <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                  {/* 3-D locked vault visual */}
                  <div style={{ perspective: 400, marginBottom: "1.5rem" }}>
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        margin: "0 auto",
                        background: "linear-gradient(145deg,#1a0533,#0d1a40)",
                        border: "2px solid rgba(248,113,113,0.4)",
                        borderRadius: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 42,
                        boxShadow:
                          "0 16px 48px rgba(248,113,113,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset",
                        transform:
                          "perspective(300px) rotateX(12deg) rotateY(-6deg)",
                        animation: "float 3s ease-in-out infinite",
                      }}
                    >
                      🔐
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#fff",
                      marginBottom: 8,
                    }}
                  >
                    Restricted Access
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#94a3b8",
                      marginBottom: "1.5rem",
                      maxWidth: 320,
                      margin: "0 auto 1.5rem",
                    }}
                  >
                    This area is for authorised JEM Youths administrators only.
                    Please sign in with your admin credentials.
                  </div>
                  <button
                    onClick={() => setShowAdminLogin(true)}
                    style={{
                      padding: "13px 32px",
                      borderRadius: 14,
                      fontWeight: 800,
                      fontSize: 15,
                      border: "1px solid rgba(248,113,113,0.4)",
                      cursor: "pointer",
                      fontFamily: "'Nunito',sans-serif",
                      background: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                      transition: "all 0.2s",
                    }}
                  >
                    🔑 Admin Sign In
                  </button>
                </div>
              )}

              {/* Authenticated admin panel */}
              {adminAuthenticated && (
                <div style={{ padding: "1.75rem 1.5rem" }}>
                  {/* welcome banner */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(52,211,153,0.12),rgba(14,165,233,0.08))",
                      border: "1px solid rgba(52,211,153,0.3)",
                      borderRadius: 16,
                      padding: "1rem 1.25rem",
                      marginBottom: "1.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>✅</span>
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "#34d399",
                          fontSize: 15,
                        }}
                      >
                        Admin Access Granted
                      </div>
                      <div style={{ fontSize: 13, color: "#6ee7b7" }}>
                        You have full control over the member roster.
                      </div>
                    </div>
                  </div>

                  {/* add member */}
                  <div
                    style={{
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(167,139,250,0.2)",
                      borderRadius: 16,
                      padding: "1.25rem",
                      marginBottom: "1.75rem",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#c4b5fd",
                        marginBottom: "1rem",
                        fontSize: 15,
                      }}
                    >
                      ➕ Add New Member
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <label style={lbl}>NAME</label>
                        <input
                          style={{
                            ...inp,
                            ...(adminErrors.name
                              ? { borderColor: "#f87171" }
                              : {}),
                          }}
                          type="text"
                          placeholder="Full name"
                          value={adminForm.name}
                          onChange={(e) => {
                            setAdminForm((f) => ({
                              ...f,
                              name: e.target.value,
                            }));
                            setAdminErrors((x) => ({ ...x, name: "" }));
                          }}
                        />
                        {adminErrors.name && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#f87171",
                              marginTop: 4,
                            }}
                          >
                            {adminErrors.name}
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={lbl}>BIRTHDATE</label>
                        <input
                          style={{
                            ...inp,
                            ...(adminErrors.dob
                              ? { borderColor: "#f87171" }
                              : {}),
                          }}
                          type="date"
                          value={adminForm.dob}
                          onChange={(e) => {
                            setAdminForm((f) => ({
                              ...f,
                              dob: e.target.value,
                            }));
                            setAdminErrors((x) => ({ ...x, dob: "" }));
                          }}
                        />
                        {adminErrors.dob && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#f87171",
                              marginTop: 4,
                            }}
                          >
                            {adminErrors.dob}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      style={{
                        ...btnPrimary(submitting),
                        width: "auto",
                        padding: "10px 28px",
                        fontSize: 14,
                      }}
                      onClick={handleAdminAdd}
                      disabled={submitting}
                    >
                      {submitting ? "Adding…" : "➕ Add Member"}
                    </button>
                  </div>

                  {/* search */}
                  <div style={{ marginBottom: "1rem" }}>
                    <input
                      style={inp}
                      type="text"
                      placeholder="🔍 Search members…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* table */}
                  <div
                    style={{
                      overflowX: "auto",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 14,
                      }}
                    >
                      <thead>
                        <tr style={{ background: "rgba(124,58,237,0.12)" }}>
                          {["MEMBER", "BIRTHDAY", "MONTH", "ACTIONS"].map(
                            (h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "12px 14px",
                                  textAlign: "left",
                                  color: "#94a3b8",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                padding: 24,
                                textAlign: "center",
                                color: "#94a3b8",
                                fontSize: 14,
                              }}
                            >
                              No members found.
                            </td>
                          </tr>
                        )}
                        {filtered.map((m, ri) => {
                          const d = new Date(m.dob),
                            color = avatarColor(m.name),
                            isEdit = editId === m.id;
                          return (
                            <tr
                              key={m.id}
                              style={{
                                background:
                                  ri % 2 === 0
                                    ? "rgba(255,255,255,0.015)"
                                    : "transparent",
                                transition: "background 0.2s",
                              }}
                            >
                              <td
                                style={{
                                  padding: "12px 14px",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.05)",
                                  color: "#e2e8f0",
                                  verticalAlign: "middle",
                                }}
                              >
                                {isEdit ? (
                                  <input
                                    style={{
                                      ...inp,
                                      padding: "7px 10px",
                                      fontSize: 13,
                                    }}
                                    value={editName}
                                    onChange={(e) =>
                                      setEditName(e.target.value)
                                    }
                                  />
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        background: `linear-gradient(135deg,${color},${color}99)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: "#fff",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {initials(m.name)}
                                    </div>
                                    <span style={{ fontWeight: 700 }}>
                                      {m.name}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "12px 14px",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.05)",
                                  color: "#e2e8f0",
                                  verticalAlign: "middle",
                                }}
                              >
                                {isEdit ? (
                                  <input
                                    style={{
                                      ...inp,
                                      padding: "7px 10px",
                                      fontSize: 13,
                                    }}
                                    type="date"
                                    value={editDob}
                                    onChange={(e) => setEditDob(e.target.value)}
                                  />
                                ) : (
                                  <span>
                                    {MONTHS[d.getMonth()]} {d.getDate()}
                                  </span>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "12px 14px",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.05)",
                                  verticalAlign: "middle",
                                }}
                              >
                                <span
                                  style={{
                                    background: `${color}18`,
                                    border: `1px solid ${color}35`,
                                    borderRadius: 99,
                                    padding: "3px 12px",
                                    fontSize: 12,
                                    color,
                                  }}
                                >
                                  {MONTHS[d.getMonth()]}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "12px 14px",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.05)",
                                  verticalAlign: "middle",
                                }}
                              >
                                <div style={{ display: "flex", gap: 6 }}>
                                  {isEdit ? (
                                    <>
                                      <button
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: 8,
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          border: "1px solid #34d39940",
                                          background: "#34d39915",
                                          color: "#34d399",
                                          fontFamily: "'Nunito',sans-serif",
                                        }}
                                        onClick={saveEdit}
                                      >
                                        Save
                                      </button>
                                      <button
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: 8,
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          border: "1px solid #f8717140",
                                          background: "#f8717115",
                                          color: "#f87171",
                                          fontFamily: "'Nunito',sans-serif",
                                        }}
                                        onClick={() => setEditId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        style={{
                                          padding: "6px 12px",
                                          borderRadius: 8,
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          border: "1px solid #38bdf840",
                                          background: "#38bdf815",
                                          color: "#38bdf8",
                                          fontFamily: "'Nunito',sans-serif",
                                        }}
                                        onClick={() => startEdit(m)}
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        style={{
                                          padding: "6px 12px",
                                          borderRadius: 8,
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          border: "1px solid #f8717140",
                                          background: "#f8717115",
                                          color: "#f87171",
                                          fontFamily: "'Nunito',sans-serif",
                                        }}
                                        onClick={() => handleDelete(m.id)}
                                      >
                                        🗑
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      marginTop: "0.75rem",
                      textAlign: "right",
                    }}
                  >
                    {filtered.length} of {members.length} members total
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── GIVE / DONATE ───────────────────────────────────── */}
      <section style={{ background:"#07010f", padding:"5rem 1.5rem", position:"relative", zIndex:2, borderTop:"1px solid rgba(124,58,237,0.15)" }}>
        <div style={{ maxWidth:820, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:12, color:"#7c3aed", fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>❤️ GIVING</div>
          <h2 style={{ fontSize:"clamp(1.8rem,5vw,2.5rem)", fontWeight:900, color:"#fff", marginBottom:"0.75rem" }}>Support the Mission</h2>
          <p style={{ color:"#94a3b8", fontSize:15, maxWidth:520, margin:"0 auto 2.5rem" }}>
            Your generous gifts help us celebrate our youth, provide resources, and strengthen our community of faith.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, maxWidth:720, margin:"0 auto" }}>
            {[
              { icon:"💳", title:"Bank Transfer", desc:"Standard Chartered • 0100 1234567 • JEM Youths Ministry", action:"Copy Details" },
              { icon:"🌍", title:"PayPal / Online", desc:"Give securely from anywhere in the world", action:"Donate Now" },
              { icon:"📱", title:"Mobile Money", desc:"M-Pesa • Paybill 123456 • Account: JEM-YOUTHS", action:"Send via M-Pesa" },
            ].map((opt,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:20, padding:"1.75rem 1.5rem", textAlign:"left" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>{opt.icon}</div>
                <div style={{ fontWeight:800, fontSize:18, color:"#fff", marginBottom:6 }}>{opt.title}</div>
                <div style={{ color:"#94a3b8", fontSize:14, lineHeight:1.5, marginBottom:16 }}>{opt.desc}</div>
                <button onClick={() => showToast("Thank you! Details copied to clipboard.", "success")} style={{ width:"100%", padding:"12px", borderRadius:12, fontWeight:700, fontSize:14, background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", color:"#fff", border:"none", cursor:"pointer" }}>
                  {opt.action}
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop:28, fontSize:13, color:"#64748b" }}>All gifts are tax-deductible. Thank you for partnering with us.</div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────── */}
      <section id="about" style={{ background:"#0b0120", padding:"5rem 1.5rem", position:"relative", zIndex:2, borderTop:"1px solid rgba(124,58,237,0.15)" }}>
        <div style={{ maxWidth:820, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:12, color:"#0ea5e9", fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>OUR STORY</div>
          <h2 style={{ fontSize:"clamp(1.8rem,5vw,2.5rem)", fontWeight:900, color:"#fff", marginBottom:"1rem" }}>About JEM Youths</h2>
          <p style={{ color:"#94a3b8", fontSize:15, lineHeight:1.7, maxWidth:620, margin:"0 auto" }}>
            JEM Youths is a vibrant faith-based community dedicated to celebrating life, nurturing young hearts and building lasting friendships through meaningful events like our monthly birthday celebrations. We believe every young person deserves to feel seen, loved and celebrated.
          </p>
          <div style={{ marginTop:"2rem", display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap", color:"#64748b", fontSize:14 }}>
            <div>Founded in Faith</div>
            <div>200+ Youth Members</div>
            <div>24+ Celebrations Yearly</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer
        style={{
          background: "#040009",
          padding: "3.5rem 1.25rem 2.5rem",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          borderTop: "1px solid rgba(124,58,237,0.2)",
        }}
      >
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg,transparent,#7c3aed50,#0ea5e950,transparent)",
            marginBottom: "2rem",
          }}
        />
        <div
          style={{
            fontSize: 36,
            marginBottom: 14,
            animation: "float 3s ease-in-out infinite",
          }}
        >
          ✝️
        </div>
        <div
          style={{
            fontWeight: 900,
            fontSize: 24,
            color: "#fff",
            marginBottom: 6,
          }}
        >
          JEM YOUTHS
        </div>
        <div style={{ fontSize: 14, color: "#4b5563", marginBottom: "1.5rem" }}>
          Celebrating life, faith, and community. One birthday at a time.
        </div>
        <div style={{ fontSize: 13, color: "#6b21a8" }}>
          Made with <span style={{ color: "#f97316", fontSize: 15 }}>♥</span> by{" "}
          <span
            style={{
              fontWeight: 900,
              fontSize: 15,
              background: "linear-gradient(135deg,#a855f7,#38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            KINGSAVANNAH44
          </span>{" "}
          · {new Date().getFullYear()}
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background:
              toast.type === "success"
                ? "linear-gradient(135deg,#7c3aed,#0ea5e9)"
                : toast.type === "info"
                  ? "rgba(56,189,248,0.92)"
                  : "rgba(248,113,113,0.92)",
            color: "#fff",
            padding: "14px 26px",
            borderRadius: 18,
            fontSize: 15,
            fontWeight: 800,
            zIndex: 999,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 40px #0009",
            animation: "toastIn 0.4s ease",
            maxWidth: "92vw",
            textAlign: "center",
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
