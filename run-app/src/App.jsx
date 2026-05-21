import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, setDoc, getDocs,
} from "firebase/firestore";

import Scene3D from "./components/Scene3D";
import TiltCard from "./components/TiltCard";
import Reveal from "./components/Reveal";

// ── constants ────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const ADMIN_CREDENTIALS = { username: "admin", password: "jem2025" };

function getLastMonday(year, month) {
  const last = new Date(year, month + 1, 0);
  const dow = last.getDay();
  last.setDate(last.getDate() - (dow >= 1 ? dow - 1 : 6));
  return last;
}
function formatDate(d) { return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }

const SEED = [
  { id:"seed-1",  name:"Amara Osei",       dob:"1999-01-04" }, { id:"seed-2",  name:"Jaylen Mwangi",    dob:"2001-01-17" },
  { id:"seed-3",  name:"Priya Chege",      dob:"2000-02-22" }, { id:"seed-4",  name:"Tobias Otieno",    dob:"2002-02-08" },
  { id:"seed-5",  name:"Zara Kamau",       dob:"1998-03-19" }, { id:"seed-6",  name:"Emmanuel Njoroge", dob:"2003-03-14" },
  { id:"seed-7",  name:"Fatima Wanjiru",   dob:"2001-04-05" }, { id:"seed-8",  name:"David Kariuki",    dob:"2000-04-28" },
  { id:"seed-9",  name:"Grace Akinyi",     dob:"1999-05-11" }, { id:"seed-10", name:"Samuel Muthoni",   dob:"2002-05-30" },
  { id:"seed-11", name:"Esther Nyambura",  dob:"2003-06-07" }, { id:"seed-12", name:"Kevin Ochieng",    dob:"2001-06-21" },
  { id:"seed-13", name:"Ruth Adhiambo",    dob:"2000-07-03" }, { id:"seed-14", name:"Michael Kimani",   dob:"1998-07-15" },
  { id:"seed-15", name:"Linda Wangui",     dob:"2002-08-09" }, { id:"seed-16", name:"Brian Mwenda",     dob:"2003-08-25" },
  { id:"seed-17", name:"Angela Chebet",    dob:"1999-09-12" }, { id:"seed-18", name:"Collins Mugo",     dob:"2001-09-27" },
  { id:"seed-19", name:"Diana Njeri",      dob:"2000-10-06" }, { id:"seed-20", name:"Felix Otieno",     dob:"2002-10-18" },
  { id:"seed-21", name:"Hannah Wambua",    dob:"2003-11-02" }, { id:"seed-22", name:"Ian Gitonga",      dob:"1999-11-20" },
  { id:"seed-23", name:"Joyce Auma",       dob:"2001-12-10" }, { id:"seed-24", name:"Peter Ndirangu",   dob:"2000-12-29" },
];

const PALETTE = ["#7c3aed","#0ea5e9","#f97316","#10b981","#e11d48","#f59e0b","#06b6d4","#8b5cf6"];
function avatarColor(name) { let h=0; for(let c of name) h=(h+c.charCodeAt(0))%8; return PALETTE[h]; }
function initials(name) { return name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(); }
function randomParticle() {
  return {
    id:Math.random(), x:Math.random()*100, y:-10-Math.random()*20,
    size:5+Math.random()*8, speed:0.8+Math.random()*1.6, wobble:Math.random()*4-2,
    rotation:Math.random()*360, shape:Math.random()>0.5?"rect":"circle",
    color:["#a855f7","#38bdf8","#f97316","#34d399","#fb7185","#fbbf24"][Math.floor(Math.random()*6)],
  };
}

// ── Admin Login Modal ─────────────────────────────────────────────────────────
function AdminLoginModal({ onSuccess, onClose }) {
  const [creds, setCreds] = useState({ username:"", password:"" });
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
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    if (creds.username === ADMIN_CREDENTIALS.username && creds.password === ADMIN_CREDENTIALS.password) {
      onSuccess();
    } else {
      setAttempts(a => a+1);
      setErrors({ form: attempts >= 2 ? "Too many failed attempts. Locked for this session." : "Invalid credentials. Try again." });
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(5,0,15,0.88)", backdropFilter:"blur(14px)",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"linear-gradient(145deg,#13052a,#0d1a40)", border:"1px solid rgba(167,139,250,0.35)",
        borderRadius:24, padding:"2.5rem 2rem", width:"92%", maxWidth:400,
        boxShadow:"0 0 80px rgba(124,58,237,0.3), 0 32px 64px #0009",
        animation: shake ? "shake 0.5s ease" : "modalIn 0.4s cubic-bezier(.16,1,.3,1)",
        position:"relative", overflow:"hidden",
      }}>
        {/* top glow bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#7c3aed,#0ea5e9,#f97316)", borderRadius:"24px 24px 0 0" }} />

        {/* 3-D shield icon */}
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{
            width:72, height:72, margin:"0 auto 1rem",
            background:"linear-gradient(145deg,#7c3aed,#4c1d95)",
            borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            transform:"perspective(200px) rotateX(8deg)",
            fontSize:32,
          }}>🛡️</div>
          <div style={{ fontWeight:900, fontSize:22, color:"#fff", fontFamily:"'Nunito',sans-serif" }}>Admin Access</div>
          <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>JEM Youths · Restricted Area</div>
        </div>

        {locked && (
          <div style={{ background:"rgba(248,113,113,0.12)", border:"1px solid #f87171", borderRadius:12, padding:"12px 16px", marginBottom:16, textAlign:"center" }}>
            <div style={{ fontWeight:800, color:"#f87171", fontSize:14 }}>🔒 Session Locked</div>
            <div style={{ color:"#fca5a5", fontSize:12, marginTop:4 }}>Too many failed attempts. Reload to try again.</div>
          </div>
        )}

        {errors.form && !locked && (
          <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.4)", borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#f87171", textAlign:"center" }}>
            ⚠️ {errors.form}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#c4b5fd", marginBottom:6, letterSpacing:"0.06em" }}>USERNAME</label>
          <input
            style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${errors.username?"#f87171":"rgba(167,139,250,0.3)"}`, borderRadius:12, padding:"12px 16px", fontSize:15, color:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"'Nunito',sans-serif", colorScheme:"dark" }}
            type="text" placeholder="Enter username" value={creds.username} disabled={locked}
            onChange={e => { setCreds(c=>({...c, username:e.target.value})); setErrors(x=>({...x, username:"", form:""})); }}
            onKeyDown={e => e.key==="Enter" && handleLogin()}
          />
          {errors.username && <div style={{ fontSize:12, color:"#f87171", marginTop:4 }}>{errors.username}</div>}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#c4b5fd", marginBottom:6, letterSpacing:"0.06em" }}>PASSWORD</label>
          <div style={{ position:"relative" }}>
            <input
              style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${errors.password?"#f87171":"rgba(167,139,250,0.3)"}`, borderRadius:12, padding:"12px 44px 12px 16px", fontSize:15, color:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"'Nunito',sans-serif", colorScheme:"dark" }}
              type={showPw?"text":"password"} placeholder="Enter password" value={creds.password} disabled={locked}
              onChange={e => { setCreds(c=>({...c, password:e.target.value})); setErrors(x=>({...x, password:"", form:""})); }}
              onKeyDown={e => e.key==="Enter" && handleLogin()}
            />
            <button onClick={() => setShowPw(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:18 }}>
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
          {errors.password && <div style={{ fontSize:12, color:"#f87171", marginTop:4 }}>{errors.password}</div>}
        </div>

        <button
          disabled={loading || locked}
          onClick={handleLogin}
          style={{
            width:"100%", padding:"14px", borderRadius:14, fontWeight:800, fontSize:16, border:"none",
            cursor: locked||loading ? "not-allowed" : "pointer",
            background: locked||loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#0ea5e9)",
            color: locked||loading ? "#6b7280" : "#fff", fontFamily:"'Nunito',sans-serif",
            boxShadow: loading ? "none" : "0 8px 24px rgba(124,58,237,0.4)",
            transition:"all 0.2s",
          }}>
          {loading ? "⏳ Authenticating…" : locked ? "🔒 Locked" : "🔐 Sign In to Dashboard"}
        </button>

        <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#4b5563" }}>
          Demo: <span style={{ color:"#c4b5fd" }}>admin</span> / <span style={{ color:"#c4b5fd" }}>jem2025</span>
        </div>

        <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", color:"#94a3b8", fontSize:20, cursor:"pointer" }}>✕</button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const CY = now.getFullYear(), CM = now.getMonth();
  const NM = CM === 11 ? 0 : CM + 1;
  const CELEBRATION_DATE = useMemo(() => getLastMonday(CY, CM), [CY, CM]);

  const [members, setMembers]           = useState([]);
  const [dbLoading, setDbLoading]       = useState(true);
  const [tab, setTab]                   = useState("this");
  const [section, setSec]               = useState(null);
  const [confetti, setConfetti]         = useState(true);
  const [particles, setParticles]       = useState(() => Array.from({length:32}, randomParticle));
  const [submitted, setSubmitted]       = useState(false);
  const [dupError, setDupError]         = useState(false);
  const [toast, setToast]               = useState(null);
  const [reg, setReg]                   = useState({ name:"", dob:"" });
  const [regErrors, setRegErrors]       = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [showAdminLogin, setShowAdminLogin]         = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [heroIndex, setHeroIndex]       = useState(0);
  const [heroFade, setHeroFade]         = useState(true);

  const heroImages = ["/Images/New.png","/Images/New2.png","/Images/New3.png","/Images/New5.png","/Images/New6.png","/Images/New7.png","/Images/New8.png"];

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4200); };

  useEffect(() => {
    const col = collection(db, "members");
    getDocs(col).then(snap => { if (snap.empty) return Promise.all(SEED.map(m => setDoc(doc(db,"members",m.id),{name:m.name,dob:m.dob}))); }).catch(()=>{});
    const unsub = onSnapshot(col, snap => { setMembers(snap.docs.map(d=>({id:d.id,...d.data()}))); setDbLoading(false); }, err => { console.warn(err.message); setDbLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const iv = setInterval(() => { setHeroFade(false); setTimeout(()=>{ setHeroIndex(i=>(i+1)%heroImages.length); setHeroFade(true); },700); }, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!confetti) return;
    let frame;
    const animate = () => { setParticles(ps=>ps.map(p=>{ let ny=p.y+p.speed*0.35,nx=p.x+Math.sin(ny*0.05+p.wobble)*0.3; if(ny>110) return randomParticle(); return {...p,y:ny,x:nx,rotation:p.rotation+p.speed}; })); frame=requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [confetti]);

  const handleAdminLoginSuccess = () => { setAdminAuthenticated(true); setShowAdminLogin(false); showToast("🛡️ Welcome, Admin!","success"); };
  const handleAdminLogout       = () => { setAdminAuthenticated(false); showToast("👋 Signed out.","info"); };
  const handleAdminButtonClick  = () => setShowAdminLogin(true);

  const handleAdminAdd = async (name, dob) => {
    const opt = { id:`temp-${Date.now()}`, name, dob };
    setMembers(p=>[...p,opt]); showToast("✅ Member added!");
    try { await addDoc(collection(db,"members"),{name,dob}); }
    catch { setMembers(p=>p.filter(m=>m.id!==opt.id)); showToast("Failed to add.","error"); }
  };
  const handleAdminDelete = async id => {
    const prev = members.find(m=>m.id===id);
    setMembers(p=>p.filter(m=>m.id!==id)); showToast("🗑 Removed.","info");
    try { await deleteDoc(doc(db,"members",id)); }
    catch { setMembers(p=>[...p,prev]); showToast("Failed to delete.","error"); }
  };
  const handleAdminEdit = async (id, name, dob) => {
    const prev = members.find(m=>m.id===id);
    setMembers(p=>p.map(m=>m.id===id?{...m,name,dob}:m)); showToast("✏️ Updated!");
    try { await updateDoc(doc(db,"members",id),{name,dob}); }
    catch { setMembers(p=>p.map(m=>m.id===id?prev:m)); showToast("Failed to update.","error"); }
  };

  const thisMonthBirths = useMemo(()=>members.filter(m=>new Date(m.dob).getMonth()===CM),[members,CM]);
  const nextMonthBirths = useMemo(()=>members.filter(m=>new Date(m.dob).getMonth()===NM),[members,NM]);
  const displayed = tab==="this" ? thisMonthBirths : nextMonthBirths;
  const daysLeft  = Math.max(0, Math.ceil((CELEBRATION_DATE - now) / 86400000));

  if (adminAuthenticated) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
          @keyframes spin{to{transform:rotate(360deg)}}
          input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(.5)}
          input::placeholder{color:#4b5563}
          input:focus{border-color:#7c3aed!important;outline:none}
          ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#07010f}::-webkit-scrollbar-thumb{background:#7c3aed;border-radius:99px}
        `}</style>
        <AdminDashboard
          members={members}
          onLogout={handleAdminLogout}
          onAdd={handleAdminAdd}
          onDelete={handleAdminDelete}
          onEdit={handleAdminEdit}
          showToast={showToast}
        />
        {toast && (
          <div style={{ position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:toast.type==="success"?"linear-gradient(135deg,#7c3aed,#0ea5e9)":toast.type==="info"?"rgba(56,189,248,0.92)":"rgba(248,113,113,0.92)",color:"#fff",padding:"14px 26px",borderRadius:18,fontSize:15,fontWeight:800,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 8px 40px #0009",maxWidth:"92vw",textAlign:"center",fontFamily:"'Nunito',sans-serif" }}>
            {toast.msg}
          </div>
        )}
      </>
    );
  }

  const validateReg = () => {
    const e = {};
    if (!reg.name.trim()) e.name = "Full name is required";
    else if (reg.name.trim().split(" ").length < 2) e.name = "Please enter your full name";
    if (!reg.dob) e.dob = "Birthdate is required";
    setRegErrors(e); return !Object.keys(e).length;
  };
  const handleRegister = async () => {
    if (submitted) { setDupError(true); return; }
    if (!validateReg()) return;
    setSubmitting(true);
    const optimistic = { id:`temp-${Date.now()}`, name:reg.name.trim(), dob:reg.dob };
    setMembers(p => [...p, optimistic]);
    setSubmitted(true); setSubmitting(false);
    showToast("🎉 You're locked in! Your birthday is registered forever.");
    try { await addDoc(collection(db,"members"), { name:optimistic.name, dob:optimistic.dob }); }
    catch { setMembers(p=>p.filter(m=>m.id!==optimistic.id)); setSubmitted(false); showToast("Failed to register.","error"); }
  };

  const inp = {
    width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(167,139,250,0.3)",
    borderRadius:12, padding:"12px 16px", fontSize:15, color:"#fff", outline:"none",
    boxSizing:"border-box", colorScheme:"dark", fontFamily:"'Nunito',sans-serif",
    transition:"border-color 0.2s",
  };
  const lbl = { display:"block", fontSize:12, fontWeight:700, color:"#c4b5fd", marginBottom:6, letterSpacing:"0.06em" };
  const btnPrimary = (dis) => ({
    width:"100%", padding:"14px", borderRadius:14, fontWeight:800, fontSize:16, border:"none",
    cursor:dis?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif",
    background:dis?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#0ea5e9)",
    color:dis?"#6b7280":"#fff", boxShadow:dis?"none":"0 8px 24px rgba(124,58,237,0.35)", transition:"all 0.2s",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#07010f", fontFamily:"'Nunito',sans-serif", color:"#f1f0fe", overflowX:"hidden", position:"relative" }}>
      {dbLoading && (
        <div style={{ position:"fixed", inset:0, zIndex:999, background:"#07010f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
          <div style={{ width:48, height:48, border:"4px solid rgba(124,58,237,0.2)", borderTop:"4px solid #7c3aed", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <div style={{ color:"#c4b5fd", fontWeight:700, fontSize:15, letterSpacing:"0.08em" }}>LOADING JEM YOUTHS…</div>
        </div>
      )}
      {/* Navbar */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background:"rgba(7,1,15,0.92)", backdropFilter:"blur(24px)",
        borderBottom:"1px solid rgba(167,139,250,0.15)",
        boxShadow:"0 2px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem", height:68, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          {/* Logo */}
          <a href="#" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:"linear-gradient(135deg,#7c3aed,#0ea5e9)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, boxShadow:"0 4px 14px rgba(124,58,237,0.5)",
              flexShrink:0,
            }}>✝️</div>
            <div style={{ lineHeight:1 }}>
              <div style={{ fontWeight:900, fontSize:18, color:"#fff", letterSpacing:"-0.02em" }}>JEM YOUTHS</div>
              <div style={{ fontSize:10, color:"#7c3aed", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>BIRTHDAY CELEBRATIONS</div>
            </div>
          </a>

          {/* Nav links */}
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:14, fontWeight:700 }}>
            {[
              { label:"Home", href:"#" },
              { label:"About", href:"#about" },
              { label:"Roster", href:"#roster" },
              { label:"Register", href:"#register" },
              { label:"Give", href:"#give" },
            ].map(l => (
              <a key={l.label} href={l.href} style={{
                padding:"8px 14px", borderRadius:10, color:"#cbd5e1",
                textDecoration:"none", transition:"all 0.2s",
                fontSize:13, letterSpacing:"0.06em",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.color="#fff"; e.currentTarget.style.background="rgba(255,255,255,0.07)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.color="#cbd5e1"; e.currentTarget.style.background="transparent"; }}>
                {l.label}
              </a>
            ))}

            {/* Admin button */}
            <button onClick={handleAdminButtonClick} style={{
              padding:"9px 18px", borderRadius:10, marginLeft:4,
              background:"linear-gradient(135deg,#7c3aed,#0ea5e9)",
              border:"none", color:"#fff", fontWeight:800, cursor:"pointer",
              fontSize:13, fontFamily:"'Nunito',sans-serif", letterSpacing:"0.06em",
              display:"flex", alignItems:"center", gap:6, textTransform:"uppercase", }}>
              <span style={{ fontSize:15 }}>🛡️</span> Admin
            </button>
          </div>
        </div>
      </nav>
      <div style={{ height:68 }} />
      <style>{`
        html { scroll-behavior: smooth; }
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
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          {particles.map(p => (
            <div key={p.id} style={{
              position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
              width:p.size, height:p.shape==="rect"?p.size*0.5:p.size,
              background:p.color, borderRadius:p.shape==="circle"?"50%":3,
              transform:`rotate(${p.rotation}deg)`, opacity:0.75,
            }} />
          ))}
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && <AdminLoginModal onSuccess={handleAdminLoginSuccess} onClose={()=>setShowAdminLogin(false)} />}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="hero" style={{
        position:"relative", minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"2rem 1.25rem 5rem", overflow:"hidden",
        background:"#07010f",
      }}>
        {/* crossfade image layers */}
        {heroImages.map((src, i) => (
          <div key={src} style={{
            position:"absolute", inset:0, zIndex:0,
            backgroundImage:`url('${src}')`,
            backgroundSize:"cover", backgroundPosition:"center",
            opacity: i === heroIndex ? (heroFade ? 1 : 0) : 0,
            transition:"opacity 1s ease-in-out",
          }} />
        ))}
        {/* dark overlay — centre-fade only, no edge darkening */}
        <div style={{ position:"absolute", inset:0, zIndex:0, background:"rgba(7,1,15,0.45)" }} />
        {/* 3-D canvas */}
        <Scene3D />

        <div style={{ position:"relative", zIndex:3, textAlign:"center", maxWidth:700, width:"100%" }}>
          {/* church name badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:10, marginBottom:"1.5rem",
            background:"rgba(124,58,237,0.18)", border:"1px solid rgba(167,139,250,0.45)",
            borderRadius:99, padding:"8px 22px", fontSize:14, color:"#c4b5fd",
            animation:"fadeSlideDown 0.6s ease both",
          }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#a855f7", animation:"pulse 1.5s infinite", display:"inline-block" }} />
            ✝️ JEM Youths · Birthday Celebrations
          </div>

          <h1 style={{
            fontSize:"clamp(2.1rem,8vw,3.8rem)", fontWeight:900, lineHeight:1.08, margin:"0 0 1rem",
            background:"linear-gradient(135deg,#fff 25%,#c4b5fd 55%,#38bdf8 90%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            animation:"fadeSlideDown 0.7s 0.1s ease both", letterSpacing:"-0.02em",
          }}>
            Celebrating Our<br />{MONTHS[CM]} Birthday Legends! 🙌
          </h1>

          <p style={{ fontSize:17, color:"#94a3b8", margin:"0 0 2rem", animation:"fadeSlideDown 0.75s 0.2s ease both" }}>
            Every birthday is a blessing. We celebrate <em>you</em>.
          </p>

          {/* celebration card — 3D */}
          <TiltCard style={{ animation:"fadeSlideUp 0.8s 0.3s ease both" }}>
            <div style={{
              background:"rgba(255,255,255,0.04)", backdropFilter:"blur(16px)",
              border:"1px solid rgba(167,139,250,0.3)", borderRadius:22,
              padding:"1.5rem 1.75rem", textAlign:"left",
              display:"flex", alignItems:"center", gap:18, flexWrap:"wrap",
              boxShadow:"0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset",
            }}>
              <span style={{ fontSize:44, lineHeight:1 }}>📅</span>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Big Celebration & Cake 🎂</div>
                <div style={{ fontSize:"clamp(0.95rem,3.5vw,1.15rem)", fontWeight:800, color:"#fff" }}>
                  Last Monday of {MONTHS[CM]}: {formatDate(CELEBRATION_DATE)}
                </div>
                <div style={{ fontSize:13, color:"#c4b5fd", marginTop:4 }}>
                  {daysLeft===0 ? "🎉 It's today! See you there!" : `${daysLeft} day${daysLeft!==1?"s":""} away. Save the date!`}
                </div>
              </div>
              <div style={{
                background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", borderRadius:16,
                padding:"14px 20px", textAlign:"center", minWidth:78,
                boxShadow:"0 8px 24px rgba(124,58,237,0.45)",
                animation:"glow 2.5s ease-in-out infinite",
              }}>
                <div style={{ fontSize:30, fontWeight:900, color:"#fff", lineHeight:1 }}>{daysLeft}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.75)", marginTop:2, letterSpacing:"0.05em" }}>DAYS</div>
              </div>
            </div>
          </TiltCard>

          {/* stats row */}
          <div style={{ display:"flex", gap:12, marginTop:"1.5rem", flexWrap:"wrap", justifyContent:"center", animation:"fadeSlideUp 0.9s 0.5s ease both" }}>
            {[
              { label:`${MONTHS[CM]} Birthdays`, val:thisMonthBirths.length, icon:"🎂", color:"#7c3aed" },
              { label:`${MONTHS[NM]} Birthdays`, val:nextMonthBirths.length, icon:"📆", color:"#0ea5e9" },
              { label:"Total Members",            val:members.length,         icon:"👥", color:"#f97316" },
            ].map(s => (
              <TiltCard key={s.label} style={{ flex:1, minWidth:90 }}>
                <div style={{
                  background:"rgba(255,255,255,0.05)", border:`1px solid ${s.color}30`,
                  borderRadius:18, padding:"14px 16px", textAlign:"center",
                  boxShadow:`0 0 24px ${s.color}15`,
                }}>
                  <div style={{ fontSize:24 }}>{s.icon}</div>
                  <div style={{ fontSize:24, fontWeight:900, color:"#fff" }}>{s.val}</div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{s.label}</div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>

        <div style={{ position:"absolute", bottom:32, left:"50%", zIndex:5, textAlign:"center", animation:"bounce 2s ease-in-out infinite" }}>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:6 }}>Scroll to explore</div>
          <div style={{ fontSize:22 }}>↓</div>
        </div>
      </section>

      {/* ── BIRTHDAY ROSTER ──────────────────────────────────── */}
      <section id="roster" style={{ background:"#0b0120", padding:"5rem 0 0", position:"relative", zIndex:2 }}>
        {/* section divider */}
        <div style={{ height:2, background:"linear-gradient(90deg,transparent,#7c3aed,#0ea5e9,transparent)", marginBottom:0 }} />
        <div style={{ maxWidth:820, margin:"0 auto", padding:"0 1.25rem 5rem" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
              <div style={{ fontSize:12, color:"#7c3aed", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>🎂 Monthly Roster</div>
              <h2 style={{ fontSize:"clamp(1.6rem,5vw,2.3rem)", fontWeight:900, color:"#fff", margin:"0 0 0.5rem" }}>Who's Celebrating?</h2>
              <p style={{ fontSize:15, color:"#94a3b8" }}>
                Birthday legends in <strong style={{color:"#c4b5fd"}}>{MONTHS[CM]}</strong> and <strong style={{color:"#38bdf8"}}>{MONTHS[NM]}</strong>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:18, padding:5, gap:4, marginBottom:"2rem", border:"1px solid rgba(255,255,255,0.09)" }}>
              {[{key:"this",label:`🎂 ${MONTHS[CM]}`,count:thisMonthBirths.length},{key:"next",label:`📆 ${MONTHS[NM]}`,count:nextMonthBirths.length}].map(t=>(
                <button key={t.key} onClick={()=>setTab(t.key)} style={{
                  flex:1, textAlign:"center", padding:"11px 0", borderRadius:13, fontSize:14, fontWeight:800,
                  cursor:"pointer", border:"none", fontFamily:"'Nunito',sans-serif", transition:"all 0.25s",
                  background:tab===t.key?"linear-gradient(135deg,#7c3aed,#0ea5e9)":"transparent",
                  color:tab===t.key?"#fff":"#94a3b8",
                }}>
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
          </Reveal>

          {displayed.length===0 ? (
            <Reveal delay={0.15}>
              <div style={{
                textAlign:"center", padding:"4rem 1rem",
                background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(167,139,250,0.25)",
                borderRadius:22,
              }}>
                <div style={{ fontSize:52, marginBottom:14 }}>🕊️</div>
                <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:8 }}>No birthdays yet!</div>
                <div style={{ fontSize:15, color:"#94a3b8" }}>
                  No birthdays registered for {tab==="this"?MONTHS[CM]:MONTHS[NM]} yet!<br />Be the first below 👇
                </div>
              </div>
            </Reveal>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:18 }}>
              {displayed.map((m,i) => {
                const d = new Date(m.dob), color = avatarColor(m.name);
                return (
                  <Reveal key={m.id} delay={i*0.07}>
                    <TiltCard>
                      <div className="bcard" style={{
                        background:`linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))`,
                        border:`1px solid ${color}30`, borderRadius:22,
                        padding:"1.75rem 1.25rem", textAlign:"center",
                        transition:"transform 0.25s, box-shadow 0.25s",
                        boxShadow:`0 4px 24px ${color}15`,
                      }}>
                        <div style={{
                          width:70, height:70, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}99)`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:24, fontWeight:900, color:"#fff", margin:"0 auto 1rem",
                          boxShadow:`0 0 0 4px ${color}25,0 0 0 8px ${color}12,0 8px 24px ${color}40`,
                        }}>{initials(m.name)}</div>
                        <div style={{ fontSize:17, fontWeight:800, color:"#fff", marginBottom:4 }}>{m.name}</div>
                        <div style={{ fontSize:13, color:"#c4b5fd" }}>🎂 {MONTHS[d.getMonth()]} {d.getDate()}</div>
                        <div style={{
                          marginTop:14, display:"inline-block",
                          background:`${color}20`, border:`1px solid ${color}40`,
                          borderRadius:99, padding:"5px 16px", fontSize:12, color,
                        }}>Birthday Legend ✨</div>
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
      <section id="register" style={{ background:"#0b0120", padding:"2rem 0 0", position:"relative", zIndex:2 }}>
        <div style={{ maxWidth:820, margin:"0 auto", padding:"0 1.25rem 6rem" }}>
          <Reveal>
            <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
              <div style={{ fontSize:12, color:"#0ea5e9", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>📝 Get Involved</div>
              <h2 style={{ fontSize:"clamp(1.6rem,5vw,2.3rem)", fontWeight:900, color:"#fff", margin:"0 0 0.5rem" }}>Register & Manage</h2>
              <p style={{ fontSize:15, color:"#94a3b8" }}>Register your birthday or contact an admin to manage the roster.</p>
            </div>
          </Reveal>

          {/* ─ Youth Registration ─ */}
          <Reveal delay={0.1}>
            <button className="acc-btn" onClick={()=>setSec(s=>s==="register"?null:"register")} style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              background:section==="register"?"rgba(124,58,237,0.18)":"rgba(255,255,255,0.04)",
              border:section==="register"?"1px solid rgba(167,139,250,0.45)":"1px solid rgba(255,255,255,0.09)",
              borderRadius:section==="register"?"18px 18px 0 0":18,
              padding:"1.25rem 1.5rem", cursor:"pointer", transition:"all 0.3s",
              color:"#fff", fontSize:17, fontWeight:700, marginBottom:section==="register"?0:14,
              fontFamily:"'Nunito',sans-serif",
            }}>
              <span>🎁 Youth Birthday Registration</span>
              <span style={{ fontSize:22, transition:"transform 0.3s", transform:section==="register"?"rotate(180deg)":"none" }}>⌄</span>
            </button>
            <div style={{
              background:"rgba(255,255,255,0.025)", border:"1px solid rgba(167,139,250,0.2)",
              borderTop:"none", borderRadius:"0 0 18px 18px",
              maxHeight:section==="register"?1200:0, overflow:"hidden",
              transition:"max-height 0.45s ease", marginBottom:14,
            }}>
              <div style={{ padding:"1.75rem 1.5rem" }}>
                {submitted && (
                  <div style={{ background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.4)", borderRadius:14, padding:"1rem 1.25rem", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:26 }}>🔒</span>
                    <div>
                      <div style={{ fontWeight:800, color:"#34d399", fontSize:15 }}>You're already registered!</div>
                      <div style={{ fontSize:13, color:"#6ee7b7" }}>Your birthday is locked in forever. See you at the celebration!</div>
                    </div>
                  </div>
                )}
                {dupError && (
                  <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.35)", borderRadius:14, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#f87171" }}>
                    ⚠️ You've already registered! One entry per person. 🎉
                  </div>
                )}
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>FULL NAME</label>
                  <input style={{ ...inp, ...(regErrors.name?{borderColor:"#f87171"}:{}) }}
                    type="text" placeholder="e.g. Amara Osei" value={reg.name} disabled={submitted}
                    onChange={e=>{setReg(r=>({...r,name:e.target.value}));setRegErrors(x=>({...x,name:""}));}} />
                  {regErrors.name && <div style={{ fontSize:12,color:"#f87171",marginTop:4 }}>{regErrors.name}</div>}
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={lbl}>BIRTHDATE</label>
                  <input style={{ ...inp, ...(regErrors.dob?{borderColor:"#f87171"}:{}) }}
                    type="date" value={reg.dob} disabled={submitted} max={new Date().toISOString().split("T")[0]}
                    onChange={e=>{setReg(r=>({...r,dob:e.target.value}));setRegErrors(x=>({...x,dob:""}));}} />
                  {regErrors.dob && <div style={{ fontSize:12,color:"#f87171",marginTop:4 }}>{regErrors.dob}</div>}
                </div>
                <button style={btnPrimary(submitting||submitted)} onClick={handleRegister} disabled={submitting||submitted}>
                  {submitting?"⏳ Registering…":submitted?"🔒 Already Registered":"🎉 Register My Birthday!"}
                </button>
              </div>
            </div>
          </Reveal>

          {/* Admin sign-in prompt */}
          <Reveal delay={0.15}>
            <div style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:18, padding:"2rem", textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🛡️</div>
              <div style={{ fontWeight:900, fontSize:18, color:"#fff", marginBottom:8 }}>Admin Dashboard</div>
              <div style={{ fontSize:14, color:"#94a3b8", marginBottom:"1.5rem" }}>Sign in to manage members, view stats, and more.</div>
              <button onClick={()=>setShowAdminLogin(true)} style={{
                padding:"12px 32px", borderRadius:12, fontWeight:800, fontSize:14,
                background:"linear-gradient(135deg,#7c3aed,#0ea5e9)", border:"none",
                color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                boxShadow:"0 6px 20px rgba(124,58,237,0.4)",
              }}>🔐 Admin Sign In</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── GIVE / DONATE ───────────────────────────────────── */}
      <section id="give" style={{ background:"#07010f", padding:"5rem 1.5rem", position:"relative", zIndex:2, borderTop:"1px solid rgba(124,58,237,0.15)" }}>
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
            JEM Youths is a vibrant faith-based community dedicated to celebrating life, nurturing young hearts, and building lasting friendships through meaningful events like our monthly birthday celebrations. We believe every young person deserves to feel seen, loved, and celebrated.
          </p>
          <div style={{ marginTop:"2rem", display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap", color:"#64748b", fontSize:14 }}>
            <div>✝️ Founded in Faith</div>
            <div>👥 200+ Youth Members</div>
            <div>🎉 24+ Celebrations Yearly</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        background:"#040009", paddingTop:"3rem", paddingBottom:"2rem",
        position:"relative", zIndex:2, borderTop:"1px solid rgba(124,58,237,0.2)",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem" }}>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",
            gap:"2.5rem",
            paddingBottom:"2.5rem"
          }}>
            {/* Brand */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span style={{ fontSize:28 }}>✝️</span>
                <span style={{ fontWeight:900, fontSize:21, color:"#fff", letterSpacing:"-0.02em" }}>JEM YOUTHS</span>
              </div>
              <p style={{ fontSize:13.5, color:"#64748b", lineHeight:1.55, maxWidth:260 }}>
                A vibrant faith community celebrating every young life with joy, worship, and meaningful connections.
              </p>
            </div>

            {/* Explore */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#c4b5fd", letterSpacing:"0.08em", marginBottom:14 }}>EXPLORE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:14.5 }}>
                <a href="#hero" style={{ color:"#94a3b8", textDecoration:"none" }}>Home</a>
                <a href="#about" style={{ color:"#94a3b8", textDecoration:"none" }}>Our Story</a>
                <a href="#roster" style={{ color:"#94a3b8", textDecoration:"none" }}>Birthday Roster</a>
                <a href="#register" style={{ color:"#94a3b8", textDecoration:"none" }}>Get Registered</a>
              </div>
            </div>

            {/* Get Involved */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#c4b5fd", letterSpacing:"0.08em", marginBottom:14 }}>GET INVOLVED</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:14.5 }}>
                <a href="#give" style={{ color:"#94a3b8", textDecoration:"none" }}>Support the Mission</a>
                <a href="#" style={{ color:"#94a3b8", textDecoration:"none" }}>Join Our WhatsApp</a>
                <a href="#" style={{ color:"#94a3b8", textDecoration:"none" }}>Volunteer With Us</a>
                <a href="#" style={{ color:"#94a3b8", textDecoration:"none" }}>Upcoming Events</a>
              </div>
            </div>

            {/* Connect */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#c4b5fd", letterSpacing:"0.08em", marginBottom:14 }}>CONNECT</div>
              <div style={{ display:"flex", gap:14, marginBottom:16, fontSize:18 }}>
                <span style={{ cursor:"pointer", opacity:0.85 }}>📘</span>
                <span style={{ cursor:"pointer", opacity:0.85 }}>📷</span>
                <span style={{ cursor:"pointer", opacity:0.85 }}>💬</span>
                <span style={{ cursor:"pointer", opacity:0.85 }}>▶️</span>
              </div>
              <div style={{ fontSize:13.5, color:"#64748b", lineHeight:1.6 }}>
                Nairobi, Kenya<br />
                <a href="tel:+254769137307" style={{ color:"#94a3b8", textDecoration:"none" }}>+254 769 137 307</a><br />
                <a href="https://jemkenya.org" target="_blank" style={{ color:"#a5b4fc", textDecoration:"none" }}>info@jemkenya.org</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop:"1px solid rgba(255,255,255,0.08)",
          marginTop:"1.5rem",
          paddingTop:"1.25rem",
          paddingLeft:"1.5rem",
          paddingRight:"1.5rem",
          maxWidth:1200,
          margin:"0 auto",
          display:"flex",
          flexWrap:"wrap",
          justifyContent:"space-between",
          alignItems:"center",
          gap:12,
          fontSize:12.5,
          color:"#475569"
        }}>
          <div>© {new Date().getFullYear()} JEM Youths Ministry. All rights reserved.</div>
          <div style={{ display:"flex", gap:18 }}>
            <span style={{ cursor:"pointer" }}>Privacy</span>
            <span style={{ cursor:"pointer" }}>Terms</span>
            <span style={{ cursor:"pointer" }}>Accessibility</span>
          </div>
          <div style={{ color:"#64748b" }}>Crafted with faith &amp; ❤️ for the next generation</div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
          background:toast.type==="success"?"linear-gradient(135deg,#7c3aed,#0ea5e9)":toast.type==="info"?"rgba(56,189,248,0.92)":"rgba(248,113,113,0.92)",
          color:"#fff", padding:"14px 26px", borderRadius:18, fontSize:15, fontWeight:800,
          zIndex:999, whiteSpace:"nowrap", boxShadow:"0 8px 40px #0009",
          animation:"toastIn 0.4s ease", maxWidth:"92vw", textAlign:"center",
          fontFamily:"'Nunito',sans-serif",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
