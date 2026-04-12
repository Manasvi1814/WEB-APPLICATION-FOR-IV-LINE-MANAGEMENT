// src/components/Layout.tsx
import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Star } from "lucide-react"; // ✅ added Star


const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
  { icon: Users,           label: "Patients",       href: "/patients"  },
  { icon: FileText,        label: "Reports",        href: "/reports"   },

  { icon: Star,            label: "Feedback Summary", href: "/feedback-summary" }, // ✅ added

  { icon: Settings,        label: "Admin",          href: "/admin"     },
];

const Layout: React.FC = () => {
  const { department, logout } = useAuth();
  const location = useLocation();

 

  

  if (!department) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f5f3ff" }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #ede9fe", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        body{margin:0;font-family:'DM Sans',sans-serif;background:#f0edff}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ddd6fe;border-radius:3px}

        .nl {
          display:flex; align-items:center; gap:9px;
          padding:0 22px; height:100%;
          font-size:14px; font-weight:500;
          color:rgba(255,255,255,0.6);
          text-decoration:none;
          border-bottom:3px solid transparent;
          border-top:3px solid transparent;
          transition:color .15s,background .15s,border-color .15s;
          white-space:nowrap; letter-spacing:0.015em;
        }
        .nl:hover{color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.08)}
        .nl.active{color:#fff;font-weight:700;border-bottom-color:#c4b5fd;background:rgba(255,255,255,0.13)}

        .lbtn{
          display:flex;align-items:center;gap:7px;
          padding:8px 16px;border-radius:9px;
          border:1px solid rgba(255,255,255,0.18);
          background:rgba(255,255,255,0.09);
          color:rgba(255,255,255,0.78);
          font-size:13px;font-weight:600;cursor:pointer;
          transition:background .15s,color .15s;
          font-family:'DM Sans',sans-serif;
        }
        .lbtn:hover{background:rgba(255,255,255,0.18);color:#fff}
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", position:"relative" }}>

        {/* Watermark */}
        <div aria-hidden style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="/assests/mgm_logo.png" alt="" style={{ width:520, opacity:0.04, userSelect:"none", display:"block" }} />
        </div>

        {/* ═══ NAVBAR ═══ */}
        <header style={{
          position:"sticky", top:0, zIndex:100,
          background:"rgba(46,10,95,0.88)",
          backdropFilter:"blur(20px) saturate(1.8)",
          WebkitBackdropFilter:"blur(20px) saturate(1.8)",
          borderBottom:"1px solid rgba(167,139,250,0.22)",
          boxShadow:"0 6px 32px rgba(76,29,149,0.32)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 36px", height:80 }}>

            {/* LEFT */}
            <div style={{ display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
              <div style={{ background:"rgba(255,255,255,0.13)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:12, padding:"7px 12px", display:"flex", alignItems:"center" }}>
                <img src="/assests/mgm_logo.png" alt="MGM" style={{ height:40 }} />
              </div>
              <div style={{ width:1, height:38, background:"rgba(167,139,250,0.3)" }} />
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:"#fff" }}>
                  IV Line Management
                </div>
                <div style={{ fontSize:11, color:"rgba(196,181,253,0.8)" }}>
                  MGM Hospital · {department.name}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display:"flex", alignItems:"center", height:"100%" }}>
              <nav style={{ display:"flex", alignItems:"center", height:"100%", gap:2 }}>
                {navItems.map(item => {
                  const active = location.pathname.startsWith(item.href);
                  return (
                    <NavLink key={item.href} to={item.href} className={`nl${active?" active":""}`}>
                      <item.icon size={16} strokeWidth={active ? 2.5 : 2} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>

              <div style={{ width:1, height:30, background:"rgba(167,139,250,0.3)", margin:"0 20px" }} />

              

              <button className="lbtn" onClick={logout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>

          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent 0%,rgba(167,139,250,0.55) 25%,rgba(139,92,246,0.85) 50%,rgba(167,139,250,0.55) 75%,transparent 100%)" }} />
        </header>

        <main style={{ flex:1, position:"relative", zIndex:1, overflowY:"auto" }}>
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;